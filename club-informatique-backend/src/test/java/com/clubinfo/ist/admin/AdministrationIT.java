package com.clubinfo.ist.admin;

import com.clubinfo.ist.support.IntegrationTest;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Administration : comptes, rôles, invitations, alertes, statistiques et indicateurs. */
class AdministrationIT extends IntegrationTest {

    private static final AtomicInteger POSTES = new AtomicInteger();

    @Autowired
    private JdbcTemplate jdbc;

    private JsonNode envoyer(MockHttpServletRequestBuilder requete, Utilisateur compte, Object corps, int statutAttendu) throws Exception {
        MockHttpServletRequestBuilder complete = corps == null ? requete : corps(requete, corps);
        MvcResult resultat = mvc.perform(en(complete, compte)).andExpect(status().is(statutAttendu)).andReturn();
        String contenu = resultat.getResponse().getContentAsString();
        return contenu.isEmpty() ? json.nullNode() : json.readTree(contenu);
    }

    /** Requête publique émise depuis une adresse propre : la limitation de débit d'un appel ne touche pas les autres. */
    private MockHttpServletRequestBuilder publique(MockHttpServletRequestBuilder requete) {
        String poste = "10.40.0." + (POSTES.incrementAndGet() % 250 + 1);
        return requete.with(r -> {
            r.setRemoteAddr(poste);
            return r;
        });
    }

    private Utilisateur compteDeTest(String... roles) {
        Utilisateur compte = compte(roles);
        compte.setTest(true);
        return utilisateurs.save(compte);
    }

    // ---------------------------------------------------------------- Comptes

    @Test
    @DisplayName("B-16 : la liste des comptes ignore les comptes supprimés, se filtre et ne livre aucun secret")
    void listeDesComptes() throws Exception {
        Utilisateur admin = compte("ADMIN");
        Utilisateur membre = compte("MEMBRE");
        Utilisateur supprime = compte("MEMBRE");
        jdbc.update("update utilisateur set deleted_at = now() where id = ?", supprime.getId());

        mvc.perform(get("/admin/users")).andExpect(status().isUnauthorized());
        envoyer(get("/admin/users"), membre, null, 403);
        envoyer(get("/admin/users"), compte("RESPONSABLE_CLUB"), null, 403);

        String reponse = mvc.perform(en(get("/admin/users").param("search", membre.getEmail()), admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(membre.getId()))
                .andExpect(jsonPath("$.content[0].email").value(membre.getEmail()))
                .andExpect(jsonPath("$.content[0].roles[0]").value("MEMBRE"))
                .andExpect(jsonPath("$.content[0].statut").value("ACTIF"))
                .andExpect(jsonPath("$.content[0].verrouille").value(false))
                .andExpect(jsonPath("$.content[0].filiere").value("Génie logiciel"))
                .andExpect(jsonPath("$.content[0].createdAt").isString())
                .andReturn().getResponse().getContentAsString();
        assertThat(reponse).doesNotContain("motDePasse").doesNotContain("$2a$").doesNotContain("permissions");

        mvc.perform(en(get("/admin/users").param("search", supprime.getEmail()), admin)).andExpect(jsonPath("$.totalElements").value(0));
        envoyer(get("/admin/users/" + supprime.getId()), admin, null, 404);
        mvc.perform(en(get("/admin/users").param("role", "DSI").param("size", "200"), admin))
                .andExpect(jsonPath("$.content[*].id", not(hasItem(membre.getId().intValue()))));
        mvc.perform(en(get("/admin/users").param("statut", "SUSPENDU").param("size", "200"), admin))
                .andExpect(jsonPath("$.content[*].statut", everyItem(is("SUSPENDU"))));
        mvc.perform(en(get("/admin/users").param("role", "INCONNU"), admin)).andExpect(status().isBadRequest());

        Map<String, Object> identite = new HashMap<>(Map.of("nom", "Compaoré", "prenom", "Salimata", "filiere", "Réseaux"));
        assertThat(envoyer(put("/admin/users/" + membre.getId()), admin, identite, 200).path("nom").asText()).isEqualTo("Compaoré");
        assertThat(envoyer(get("/admin/users/" + membre.getId()), admin, null, 200).path("filiere").asText()).isEqualTo("Réseaux");
        identite.put("nom", "");
        envoyer(put("/admin/users/" + membre.getId()), admin, identite, 400);
        envoyer(put("/admin/users/999999999"), admin, Map.of("nom", "Zongo", "prenom", "Boukary"), 404);
    }

    @Test
    @DisplayName("B-03 : un administrateur n'élève personne au-dessus de lui, ne touche ni à ses rôles ni à ceux d'un Super Admin")
    void attributionDesRoles() throws Exception {
        Utilisateur admin = compte("ADMIN");
        Utilisateur superAdmin = compte("ADMIN", "SUPER_ADMIN");
        Utilisateur membre = compte("MEMBRE");
        String ancienJeton = jeton(membre);

        assertThat(envoyer(put("/admin/users/" + membre.getId() + "/roles"), admin, Map.of("roles", List.of("MEMBRE", "SUPER_ADMIN")), 403)
                .path("code").asText()).isEqualTo("ELEVATION_REFUSEE");
        assertThat(envoyer(put("/admin/users/" + admin.getId() + "/roles"), admin, Map.of("roles", List.of("ADMIN", "MEMBRE")), 403)
                .path("code").asText()).isEqualTo("PROPRES_ROLES");
        envoyer(put("/admin/users/" + superAdmin.getId() + "/roles"), admin, Map.of("roles", List.of("MEMBRE")), 403);
        envoyer(put("/admin/users/" + membre.getId() + "/roles"), admin, Map.of("roles", List.of()), 400);
        envoyer(put("/admin/users/" + membre.getId() + "/roles"), admin, Map.of("roles", List.of("PRESIDENT")), 400);
        envoyer(put("/admin/users/" + membre.getId() + "/roles"), membre, Map.of("roles", List.of("ADMIN")), 403);
        assertThat(utilisateurs.findById(membre.getId()).orElseThrow().getRoles()).extracting("nom").containsExactly("ROLE_MEMBRE");

        JsonNode promu = envoyer(put("/admin/users/" + membre.getId() + "/roles"), admin, Map.of("roles", List.of("MEMBRE", "FORMATEUR")), 200);
        assertThat(promu.path("roles")).extracting(JsonNode::asText).containsExactlyInAnyOrder("MEMBRE", "FORMATEUR");
        // Les droits changent : les jetons déjà émis ne valent plus, le compte doit rouvrir une session.
        mvc.perform(get("/users/me").header("Authorization", "Bearer " + ancienJeton)).andExpect(status().isUnauthorized());

        JsonNode admis = envoyer(put("/admin/users/" + membre.getId() + "/roles"), superAdmin, Map.of("roles", List.of("ADMIN")), 200);
        assertThat(admis.path("roles")).extracting(JsonNode::asText).containsExactly("ADMIN");
        assertThat(jdbc.queryForObject("select count(*) from audit_log where action = 'ROLES_MODIFIES' and description like ?", Integer.class,
                "%" + membre.getEmail() + "%")).isEqualTo(2);
    }

    @Test
    @DisplayName("Le dernier Super Admin réel ne peut être ni rétrogradé ni suspendu, même par un compte de test")
    void dernierSuperAdmin() throws Exception {
        jdbc.update("delete from utilisateur_role where role_id = (select id from role where nom = 'ROLE_SUPER_ADMIN')");
        Utilisateur reel = compte("ADMIN", "SUPER_ADMIN");
        Utilisateur deTest = compteDeTest("ADMIN", "SUPER_ADMIN");

        assertThat(envoyer(put("/admin/users/" + reel.getId() + "/roles"), deTest, Map.of("roles", List.of("ADMIN")), 409)
                .path("code").asText()).isEqualTo("DERNIER_SUPER_ADMIN");
        assertThat(envoyer(patch("/admin/users/" + reel.getId() + "/status"), deTest, Map.of("statut", "SUSPENDU"), 409)
                .path("code").asText()).isEqualTo("DERNIER_SUPER_ADMIN");

        Utilisateur second = compte("ADMIN", "SUPER_ADMIN");
        envoyer(put("/admin/users/" + reel.getId() + "/roles"), second, Map.of("roles", List.of("ADMIN")), 200);
    }

    @Test
    @DisplayName("Suspension : refusée sur soi-même et sur plus haut que soi ; elle ferme aussitôt les sessions du compte")
    void suspension() throws Exception {
        Utilisateur admin = compte("ADMIN");
        Utilisateur membre = compte("MEMBRE");
        String jetonDuMembre = jeton(membre);

        assertThat(envoyer(patch("/admin/users/" + admin.getId() + "/status"), admin, Map.of("statut", "SUSPENDU"), 403)
                .path("code").asText()).isEqualTo("PROPRE_COMPTE");
        envoyer(patch("/admin/users/" + compte("ADMIN", "SUPER_ADMIN").getId() + "/status"), admin, Map.of("statut", "SUSPENDU"), 403);
        envoyer(patch("/admin/users/" + membre.getId() + "/status"), admin, Map.of("statut", "EN_ATTENTE_ACTIVATION"), 400);
        envoyer(patch("/admin/users/" + membre.getId() + "/status"), admin, Map.of(), 400);

        assertThat(envoyer(patch("/admin/users/" + membre.getId() + "/status"), admin, Map.of("statut", "SUSPENDU"), 200)
                .path("statut").asText()).isEqualTo("SUSPENDU");
        mvc.perform(get("/users/me").header("Authorization", "Bearer " + jetonDuMembre)).andExpect(status().isUnauthorized());
        mvc.perform(en(get("/admin/security/alerts"), admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.utilisateurId == " + membre.getId() + ")].typeAlerte", hasItem("COMPTE_SUSPENDU")));

        assertThat(envoyer(patch("/admin/users/" + membre.getId() + "/status"), admin, Map.of("statut", "ACTIF"), 200)
                .path("statut").asText()).isEqualTo("ACTIF");
        mvc.perform(en(get("/users/me"), utilisateurs.findById(membre.getId()).orElseThrow())).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Verrouillage : signalé dans les alertes, levé par l'administrateur")
    void deverrouillage() throws Exception {
        Utilisateur admin = compte("ADMIN");
        Utilisateur membre = compte("MEMBRE");
        jdbc.update("update utilisateur set tentatives_connexion = 5, verrouille_jusqua = now() + interval '10 minutes' where id = ?", membre.getId());

        assertThat(envoyer(get("/admin/users/" + membre.getId()), admin, null, 200).path("verrouille").asBoolean()).isTrue();
        mvc.perform(en(get("/admin/security/alerts"), admin))
                .andExpect(jsonPath("$[?(@.utilisateurId == " + membre.getId() + ")].typeAlerte", hasItem("COMPTE_VERROUILLE")))
                .andExpect(jsonPath("$[?(@.utilisateurId == " + membre.getId() + ")].utilisateurCible", hasItem(membre.getEmail())))
                .andExpect(jsonPath("$[*].gravite", everyItem(org.hamcrest.Matchers.oneOf("FAIBLE", "MOYENNE", "CRITIQUE"))));
        envoyer(get("/admin/security/alerts"), membre, null, 403);

        envoyer(post("/admin/users/" + membre.getId() + "/deverrouillage"), membre, null, 403);
        envoyer(post("/admin/users/" + membre.getId() + "/deverrouillage"), admin, null, 204);
        assertThat(envoyer(get("/admin/users/" + membre.getId()), admin, null, 200).path("verrouille").asBoolean()).isFalse();
        assertThat(utilisateurs.findById(membre.getId()).orElseThrow().getTentativesConnexion()).isZero();
        envoyer(post("/admin/users/999999999/deverrouillage"), admin, null, 404);
    }

    @Test
    @DisplayName("Invitation : la personne invitée choisit son mot de passe par un lien à usage unique, puis se connecte avec son rôle")
    void invitation() throws Exception {
        Utilisateur admin = compte("ADMIN");
        String adresse = adresseRecevable();
        Map<String, Object> invitation = new HashMap<>(Map.of("nom", "Traoré", "prenom", "Adama", "email", adresse, "role", "FORMATEUR"));

        envoyer(post("/admin/users/invitations"), compte("RESPONSABLE_CLUB"), invitation, 403);
        Map<String, Object> tropHaut = new HashMap<>(invitation);
        tropHaut.put("role", "SUPER_ADMIN");
        envoyer(post("/admin/users/invitations"), admin, tropHaut, 403);
        Map<String, Object> malFormee = new HashMap<>(invitation);
        malFormee.put("email", "pas-une-adresse");
        envoyer(post("/admin/users/invitations"), admin, malFormee, 400);

        envoyer(post("/admin/users/invitations"), admin, invitation, 204);
        assertThat(envoyer(post("/admin/users/invitations"), admin, invitation, 409).path("code").asText()).isEqualTo("ADRESSE_DEJA_UTILISEE");

        Utilisateur invite = utilisateurs.findByEmail(adresse).orElseThrow();
        assertThat(invite.getStatut().name()).isEqualTo("EN_ATTENTE_ACTIVATION");
        assertThat(invite.getRoles()).extracting("nom").containsExactlyInAnyOrder("ROLE_FORMATEUR", "ROLE_MEMBRE");
        mvc.perform(publique(corps(post("/auth/login"), Map.of("email", adresse, "motDePasse", "!")))).andExpect(status().isUnauthorized());

        JsonNode courriel = courrielRecu(adresse, "Invitation");
        assertThat(courriel.path("Text").asText()).contains("Adama").contains("http://localhost:4200/reinitialisation?jeton=");
        Matcher lien = Pattern.compile("jeton=([A-Za-z0-9_-]+)").matcher(courriel.path("Text").asText());
        assertThat(lien.find()).isTrue();

        mvc.perform(publique(corps(post("/auth/reset-password"), Map.of("token", lien.group(1), "nouveauMotDePasse", "Choisi#2026-Passe"))))
                .andExpect(status().isNoContent());
        mvc.perform(publique(corps(post("/auth/reset-password"), Map.of("token", lien.group(1), "nouveauMotDePasse", "Autre#2026-Passe"))))
                .andExpect(status().isBadRequest());
        mvc.perform(publique(corps(post("/auth/login"), Map.of("email", adresse, "motDePasse", "Choisi#2026-Passe"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.utilisateur.prenom").value("Adama"))
                .andExpect(jsonPath("$.utilisateur.roles", hasItem("FORMATEUR")));
    }

    // ---------------------------------------------------------------- Rôles

    @Test
    @DisplayName("Rôles et permissions : lus tels qu'ils sont en base, sans préfixe technique, non modifiables par l'API")
    void rolesEtPermissions() throws Exception {
        Utilisateur admin = compte("ADMIN");
        envoyer(get("/admin/roles"), compte("MEMBRE"), null, 403);
        mvc.perform(en(get("/admin/roles"), admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(6))
                .andExpect(jsonPath("$[*].nom", hasItem("RESPONSABLE_CLUB")))
                .andExpect(jsonPath("$[*].nom", not(hasItem("ROLE_ADMIN"))))
                .andExpect(jsonPath("$[?(@.nom == 'MEMBRE')].permissions[*]", hasItem("INSCRIPTION_CREATE")))
                .andExpect(jsonPath("$[?(@.nom == 'MEMBRE')].permissions[*]", not(hasItem("USER_MANAGE"))))
                .andExpect(jsonPath("$[0].id").doesNotExist());
        mvc.perform(en(get("/admin/permissions"), admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.nom == 'FORMATION_CREATE')].description", hasItem("Créer une formation")));
        mvc.perform(en(post("/admin/roles").param("nom", "TEMPORAIRE"), admin)).andExpect(status().is4xxClientError());
        assertThat(jdbc.queryForObject("select count(*) from role where nom like '%TEMPORAIRE%'", Integer.class)).isZero();
    }

    // ---------------------------------------------------------------- Chiffres

    @Test
    @DisplayName("B-39 : les statistiques comptent en base, sans les comptes de test ni ce qu'ils ont créé")
    void statistiques() throws Exception {
        Utilisateur admin = compte("ADMIN");
        JsonNode avant = envoyer(get("/admin/statistiques"), admin, null, 200);

        Utilisateur reel = compte("MEMBRE");
        Utilisateur deTest = compteDeTest("MEMBRE");
        Map<String, Object> projet = Map.of("titre", "Projet " + System.nanoTime(), "description", "Description du projet.", "technologies", "Java");
        envoyer(post("/projets"), reel, projet, 201);
        envoyer(post("/projets"), deTest, Map.of("titre", "Essai " + System.nanoTime(), "description", "Description.", "technologies", "Java"), 201);
        jdbc.update("update utilisateur set deleted_at = now() where id = ?", compte("MEMBRE").getId());

        JsonNode apres = envoyer(get("/admin/statistiques"), admin, null, 200);
        assertThat(apres.path("totalMembres").asInt() - avant.path("totalMembres").asInt()).isEqualTo(1);
        assertThat(apres.path("membresActifs").asInt() - avant.path("membresActifs").asInt()).isEqualTo(1);
        assertThat(apres.path("totalProjets").asInt() - avant.path("totalProjets").asInt()).isEqualTo(1);
        assertThat(apres.path("repartitionMembresParRole").path("MEMBRE").asInt() - avant.path("repartitionMembresParRole").path("MEMBRE").asInt()).isEqualTo(1);
        assertThat(apres.path("repartitionProjetsParStatut").path("PROPOSE").asInt() - avant.path("repartitionProjetsParStatut").path("PROPOSE").asInt()).isEqualTo(1);
        assertThat(apres.path("repartitionMembresParRole").has("ROLE_MEMBRE")).isFalse();
        for (String champ : List.of("totalEvenements", "totalFormations", "totalRessources", "totalMessagesNonTraites")) {
            assertThat(apres.path(champ).isNumber()).as(champ).isTrue();
        }

        envoyer(get("/admin/statistiques"), compte("RESPONSABLE_CLUB"), null, 403);
        mvc.perform(get("/admin/statistiques")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Indicateurs du Responsable : membres actifs et inscriptions confirmées par mois, hors comptes de test")
    void indicateurs() throws Exception {
        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        JsonNode avant = envoyer(get("/gestion/indicateurs"), responsable, null, 200);
        assertThat(avant.path("frequentation")).hasSize(6);
        String moisCourant = YearMonth.now().toString();
        assertThat(avant.path("frequentation").get(5).path("mois").asText()).isEqualTo(moisCourant);

        Map<String, Object> evenement = new HashMap<>(Map.of("titre", "Rencontre " + System.nanoTime(), "description", "Rencontre mensuelle.",
                "dateDebut", com.clubinfo.ist.common.config.JacksonConfig.enUtc(java.time.LocalDateTime.now().plusDays(5).withNano(0)),
                "dateFin", com.clubinfo.ist.common.config.JacksonConfig.enUtc(java.time.LocalDateTime.now().plusDays(5).plusHours(2).withNano(0)),
                "lieu", "Salle 3", "publie", true));
        long id = envoyer(post("/evenements"), responsable, evenement, 201).path("id").asLong();
        envoyer(post("/inscriptions/evenements/" + id), compte("MEMBRE"), null, 201);
        envoyer(post("/inscriptions/evenements/" + id), compteDeTest("MEMBRE"), null, 201);

        JsonNode apres = envoyer(get("/gestion/indicateurs"), responsable, null, 200);
        assertThat(apres.path("membresActifs").asInt() - avant.path("membresActifs").asInt()).isEqualTo(1);
        assertThat(apres.path("frequentation").get(5).path("inscriptions").asInt() - avant.path("frequentation").get(5).path("inscriptions").asInt()).isEqualTo(1);

        envoyer(get("/gestion/indicateurs"), compte("ADMIN"), null, 403);
        envoyer(get("/gestion/indicateurs"), compte("MEMBRE"), null, 403);
    }
}
