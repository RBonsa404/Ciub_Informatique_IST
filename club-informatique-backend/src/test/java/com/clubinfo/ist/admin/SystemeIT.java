package com.clubinfo.ist.admin;

import com.clubinfo.ist.admin.service.ParametresService;
import com.clubinfo.ist.support.IntegrationTest;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Réglages persistants et effectifs, état des sauvegardes, contrôles de conformité calculés. */
class SystemeIT extends IntegrationTest {

    private static final AtomicInteger POSTES = new AtomicInteger();

    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private ParametresService parametres;

    /** Chaque test repart des réglages d'origine : aucun ne laisse le site en maintenance pour les suivants. */
    @AfterEach
    void reglagesDOrigine() {
        jdbc.update("delete from parametre_systeme");
        parametres.recharger();
    }

    private JsonNode envoyer(MockHttpServletRequestBuilder requete, Utilisateur compte, Object corps, int statutAttendu) throws Exception {
        MockHttpServletRequestBuilder complete = corps == null ? requete : corps(requete, corps);
        MvcResult resultat = mvc.perform(en(complete, compte)).andExpect(status().is(statutAttendu)).andReturn();
        String contenu = resultat.getResponse().getContentAsString();
        return contenu.isEmpty() ? json.nullNode() : json.readTree(contenu);
    }

    private MockHttpServletRequestBuilder publique(MockHttpServletRequestBuilder requete) {
        String poste = "10.50.0." + (POSTES.incrementAndGet() % 250 + 1);
        return requete.with(r -> {
            r.setRemoteAddr(poste);
            return r;
        });
    }

    private Map<String, Object> reglages(boolean maintenance, boolean inscriptions, int echecs, int minutes) {
        Map<String, Object> corps = new HashMap<>();
        corps.put("nomPlateforme", "Club Informatique de l'IST");
        corps.put("maintenanceMode", maintenance);
        corps.put("inscriptionsOuvertes", inscriptions);
        corps.put("maxLoginAttempts", echecs);
        corps.put("lockoutDurationMinutes", minutes);
        return corps;
    }

    @Test
    @DisplayName("Réglages : réservés au Super Admin, validés, conservés en base")
    void reglagesPersistants() throws Exception {
        Utilisateur superAdmin = compte("ADMIN", "SUPER_ADMIN");
        mvc.perform(get("/admin/system/config")).andExpect(status().isUnauthorized());
        envoyer(get("/admin/system/config"), compte("ADMIN"), null, 403);

        JsonNode origine = envoyer(get("/admin/system/config"), superAdmin, null, 200);
        assertThat(origine.path("nomPlateforme").asText()).isEqualTo("Club Informatique de l'IST");
        assertThat(origine.path("maintenanceMode").asBoolean()).isFalse();
        assertThat(origine.path("inscriptionsOuvertes").asBoolean()).isTrue();
        assertThat(origine.path("maxLoginAttempts").asInt()).isEqualTo(3);
        assertThat(origine.path("lockoutDurationMinutes").asInt()).isEqualTo(1);
        assertThat(origine.path("version").asText()).isNotBlank();
        assertThat(origine.has("parametresAdditionnels")).isFalse();

        envoyer(put("/admin/system/config"), superAdmin, reglages(false, true, 1, 15), 400);
        envoyer(put("/admin/system/config"), superAdmin, reglages(false, true, 5, 100_000), 400);
        envoyer(put("/admin/system/config"), compte("ADMIN"), reglages(false, true, 5, 15), 403);

        JsonNode modifies = envoyer(put("/admin/system/config"), superAdmin, reglages(false, true, 7, 20), 200);
        assertThat(modifies.path("maxLoginAttempts").asInt()).isEqualTo(7);
        assertThat(jdbc.queryForObject("select valeur from parametre_systeme where cle = 'maxLoginAttempts'", String.class)).isEqualTo("7");
        parametres.recharger();
        assertThat(envoyer(get("/admin/system/config"), superAdmin, null, 200).path("lockoutDurationMinutes").asInt()).isEqualTo(20);
        assertThat(jdbc.queryForObject("select count(*) from audit_log where action = 'REGLAGES_MODIFIES'", Integer.class)).isPositive();
    }

    @Test
    @DisplayName("Réglages effectifs : le nombre d'échecs avant verrouillage est celui qui est réglé")
    void verrouillageRegle() throws Exception {
        envoyer(put("/admin/system/config"), compte("ADMIN", "SUPER_ADMIN"), reglages(false, true, 4, 10), 200);
        Utilisateur membre = compte("MEMBRE");
        for (int i = 0; i < 3; i++) {
            mvc.perform(publique(corps(post("/auth/login"), Map.of("email", membre.getEmail(), "motDePasse", "Mauvais#2026-Passe"))))
                    .andExpect(status().isUnauthorized());
        }
        // Le profil de test verrouille au troisième échec : avec le réglage à quatre, le compte tient encore.
        assertThat(jdbc.queryForObject("select count(*) from utilisateur where id = ? and verrouille_jusqua is not null", Integer.class, membre.getId())).isZero();
        mvc.perform(publique(corps(post("/auth/login"), Map.of("email", membre.getEmail(), "motDePasse", "Mauvais#2026-Passe"))))
                .andExpect(status().isUnauthorized());
        mvc.perform(publique(corps(post("/auth/login"), Map.of("email", membre.getEmail(), "motDePasse", MOT_DE_PASSE))))
                .andExpect(status().isLocked());
    }

    @Test
    @DisplayName("Réglages effectifs : inscriptions fermées, l'inscription est refusée avec un code explicite")
    void inscriptionsFermees() throws Exception {
        Utilisateur superAdmin = compte("ADMIN", "SUPER_ADMIN");
        Map<String, Object> inscription = new HashMap<>(Map.of("nom", "Kaboré", "prenom", "Rasmata", "email", adresseRecevable(),
                "motDePasse", "Faso#2026-Nord", "filiere", "Génie logiciel", "consentement", true));

        envoyer(put("/admin/system/config"), superAdmin, reglages(false, false, 5, 15), 200);
        mvc.perform(publique(corps(post("/auth/register"), inscription)))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("INSCRIPTIONS_FERMEES"));
        assertThat(utilisateurs.findByEmail((String) inscription.get("email"))).isEmpty();

        envoyer(put("/admin/system/config"), superAdmin, reglages(false, true, 5, 15), 200);
        mvc.perform(publique(corps(post("/auth/register"), inscription))).andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Réglages effectifs : en maintenance, seuls la connexion, la santé et l'administration répondent")
    void maintenance() throws Exception {
        Utilisateur superAdmin = compte("ADMIN", "SUPER_ADMIN");
        Utilisateur membre = compte("MEMBRE");
        envoyer(put("/admin/system/config"), superAdmin, reglages(true, true, 5, 15), 200);

        mvc.perform(get("/actualites")).andExpect(status().isServiceUnavailable()).andExpect(jsonPath("$.code").value("MAINTENANCE"));
        mvc.perform(en(get("/users/me"), membre)).andExpect(status().isServiceUnavailable());
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
        mvc.perform(publique(corps(post("/auth/login"), Map.of("email", superAdmin.getEmail(), "motDePasse", MOT_DE_PASSE)))).andExpect(status().isOk());
        envoyer(get("/admin/system/config"), superAdmin, null, 200);
        envoyer(get("/admin/users"), compte("ADMIN"), null, 200);

        envoyer(put("/admin/system/config"), superAdmin, reglages(false, true, 5, 15), 200);
        mvc.perform(get("/actualites")).andExpect(status().isOk());
        mvc.perform(en(get("/users/me"), membre)).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Sauvegardes : l'écran lit ce que la tâche de sauvegarde a enregistré, rien d'autre")
    void sauvegardes() throws Exception {
        Utilisateur superAdmin = compte("ADMIN", "SUPER_ADMIN");
        jdbc.update("delete from sauvegarde");
        assertThat(envoyer(get("/admin/system/sauvegardes"), superAdmin, null, 200)).isEmpty();

        jdbc.update("insert into sauvegarde (effectuee_le, taille_octets, statut) values (now() - interval '2 days', 48213, 'REUSSIE')");
        jdbc.update("insert into sauvegarde (effectuee_le, taille_octets, statut, detail) values (now() - interval '1 day', null, 'ECHOUEE', 'espace disque insuffisant')");
        mvc.perform(en(get("/admin/system/sauvegardes"), superAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].statut").value("ECHOUEE"))
                .andExpect(jsonPath("$[0].tailleOctets").doesNotExist())
                .andExpect(jsonPath("$[1].statut").value("REUSSIE"))
                .andExpect(jsonPath("$[1].tailleOctets").value(48213))
                .andExpect(jsonPath("$[1].date").isString());
        envoyer(get("/admin/system/sauvegardes"), compte("ADMIN"), null, 403);
        mvc.perform(en(post("/admin/system/backup"), superAdmin)).andExpect(status().is4xxClientError());
        assertThat(jdbc.queryForObject("select count(*) from sauvegarde", Integer.class)).isEqualTo(2);
    }

    @Test
    @DisplayName("Conformité : chaque contrôle est calculé à partir de l'état réel de l'installation")
    void conformite() throws Exception {
        Utilisateur dsi = compte("DSI");
        envoyer(get("/dsi/conformite"), compte("ADMIN", "SUPER_ADMIN"), null, 403);
        mvc.perform(get("/dsi/conformite")).andExpect(status().isUnauthorized());

        jdbc.update("delete from sauvegarde");
        Utilisateur deTest = compte("MEMBRE");
        deTest.setTest(true);
        utilisateurs.save(deTest);

        JsonNode rapport = envoyer(get("/dsi/conformite"), dsi, null, 200);
        assertThat(rapport.path("statut").asText()).isEqualTo("A_EXAMINER");
        assertThat(rapport.path("versionJava").asText()).isEqualTo(System.getProperty("java.version"));
        assertThat(rapport.path("versionBackend").asText()).isNotBlank();
        assertThat(rapport.path("comptesActifs").isNumber()).isTrue();
        assertThat(rapport.path("tentativesEchouees").isNumber()).isTrue();
        Map<String, Boolean> controles = new HashMap<>();
        for (JsonNode controle : rapport.path("verifications")) {
            assertThat(controle.path("libelle").asText()).isNotBlank();
            controles.put(controle.path("code").asText(), controle.path("conforme").asBoolean());
        }
        assertThat(controles).containsEntry("AUCUN_COMPTE_DE_TEST", false)
                .containsEntry("SAUVEGARDE_RECENTE", false)
                .containsEntry("COOKIE_DE_SESSION_SECURISE", false)
                .containsEntry("ORIGINES_RESTREINTES", true)
                .containsKeys("HACHAGE_DES_MOTS_DE_PASSE", "SECRET_DE_SIGNATURE_FOURNI", "SUPER_ADMIN_REEL", "MOT_DE_PASSE_INITIAL_CHANGE", "COURRIEL_CONFIGURE");
        assertThat(controles.keySet()).noneMatch(code -> code.contains("DOUBLE_AUTHENTIFICATION"));

        jdbc.update("insert into sauvegarde (effectuee_le, taille_octets, statut) values (now() - interval '1 day', 1024, 'REUSSIE')");
        mvc.perform(en(get("/dsi/conformite"), dsi))
                .andExpect(jsonPath("$.verifications[?(@.code == 'SAUVEGARDE_RECENTE')].conforme", hasItem(true)))
                .andExpect(jsonPath("$.verifications[?(@.code == 'SAUVEGARDE_RECENTE')].conforme", not(hasItem(false))));
    }
}
