package com.clubinfo.ist.auth;

import com.clubinfo.ist.support.IntegrationTest;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockCookie;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Year;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Inscription, vérification d'adresse, session par cookie, réinitialisation et gestion du compte. */
class AuthentificationIT extends IntegrationTest {

    private static final String COOKIE = "club_session";
    private static final String MOT_DE_PASSE_CHOISI = "Faso#2026-Nord";
    private static final Pattern JETON = Pattern.compile("jeton=([A-Za-z0-9_-]+)");
    private static final AtomicInteger POSTES = new AtomicInteger();

    @Autowired
    private JdbcTemplate jdbc;

    /** Chaque test parle depuis sa propre adresse : la limitation de débit d'un test ne touche pas les autres. */
    private String poste;

    @BeforeEach
    void nouveauPoste() {
        poste = "10.20." + (POSTES.incrementAndGet() / 250) + "." + (POSTES.get() % 250 + 1);
    }

    private MockHttpServletRequestBuilder de(MockHttpServletRequestBuilder requete) {
        return requete.with(r -> {
            r.setRemoteAddr(poste);
            return r;
        });
    }

    private Map<String, Object> inscription(String email, String motDePasse) {
        Map<String, Object> corps = new HashMap<>();
        corps.put("nom", "Kaboré");
        corps.put("prenom", "Rasmata");
        corps.put("email", email);
        corps.put("motDePasse", motDePasse);
        corps.put("filiere", "Génie logiciel");
        corps.put("consentement", true);
        return corps;
    }

    private String jetonDuCourriel(String adresse, String objet) {
        JsonNode courriel = courrielRecu(adresse, objet);
        Matcher lien = JETON.matcher(courriel.path("Text").asText());
        assertThat(lien.find()).as("lien avec jeton dans le courriel « %s »", objet).isTrue();
        return lien.group(1);
    }

    /** Compte inscrit et activé par le lien reçu. */
    private String compteVerifie() throws Exception {
        String email = adresseRecevable();
        mvc.perform(de(corps(post("/auth/register"), inscription(email, MOT_DE_PASSE_CHOISI)))).andExpect(status().isCreated());
        String jeton = jetonDuCourriel(email, "Confirmez");
        mvc.perform(de(corps(post("/auth/verification"), Map.of("jeton", jeton)))).andExpect(status().isNoContent());
        return email;
    }

    private MvcResult connexion(String email, String motDePasse) throws Exception {
        return mvc.perform(de(corps(post("/auth/login"), Map.of("email", email, "motDePasse", motDePasse)))).andReturn();
    }

    private static Cookie cookieDeSession(MvcResult resultat) {
        Cookie cookie = resultat.getResponse().getCookie(COOKIE);
        assertThat(cookie).as("cookie de session").isNotNull();
        return cookie;
    }

    private String jetonDAcces(MvcResult resultat) throws Exception {
        return json.readTree(resultat.getResponse().getContentAsString()).path("accessToken").asText();
    }

    private static String sha256(String valeur) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(valeur.getBytes(StandardCharsets.UTF_8)));
    }

    // ---------------------------------------------------------------- Inscription et vérification

    @Test
    @DisplayName("Inscription : compte en attente, lien de vérification à usage unique, puis session ouverte par cookie HttpOnly")
    void inscriptionVerificationConnexion() throws Exception {
        String email = adresseRecevable();
        mvc.perform(de(corps(post("/auth/register"), inscription(email.toUpperCase(), MOT_DE_PASSE_CHOISI))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").isString())
                .andExpect(jsonPath("$.accessToken").doesNotExist());

        Utilisateur cree = utilisateurs.findByEmail(email).orElseThrow();
        assertThat(cree.getStatut()).isEqualTo(StatutUtilisateur.EN_ATTENTE_ACTIVATION);
        assertThat(cree.getNumeroMembre()).matches("IST-" + Year.now().getValue() + "-\\d{4,}");
        assertThat(cree.getRoles()).extracting("nom").containsExactly("ROLE_MEMBRE");
        assertThat(connexion(email, MOT_DE_PASSE_CHOISI).getResponse().getStatus()).isEqualTo(403);

        JsonNode courriel = courrielRecu(email, "Confirmez");
        assertThat(courriel.path("Text").asText()).contains("http://localhost:4200/verification-adresse?jeton=");
        String jeton = jetonDuCourriel(email, "Confirmez");
        assertThat(jdbc.queryForObject("select count(*) from jeton_usage_unique where empreinte = ?", Integer.class, jeton)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from jeton_usage_unique where empreinte = ?", Integer.class, sha256(jeton))).isOne();

        mvc.perform(de(corps(post("/auth/verification"), Map.of("jeton", jeton)))).andExpect(status().isNoContent());
        mvc.perform(de(corps(post("/auth/verification"), Map.of("jeton", jeton))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("JETON_INVALIDE"));

        MvcResult session = connexion(email, MOT_DE_PASSE_CHOISI);
        assertThat(session.getResponse().getStatus()).isEqualTo(200);
        JsonNode corps = json.readTree(session.getResponse().getContentAsString());
        assertThat(corps.path("accessToken").asText()).isNotBlank();
        assertThat(corps.path("expiresIn").asLong()).isPositive();
        assertThat(corps.has("refreshToken")).isFalse();
        assertThat(corps.path("utilisateur").path("email").asText()).isEqualTo(email);
        assertThat(corps.path("utilisateur").path("prenom").asText()).isEqualTo("Rasmata");
        assertThat(corps.path("utilisateur").path("roles")).hasSize(1);
        assertThat(corps.path("utilisateur").path("roles").get(0).asText()).isEqualTo("MEMBRE");
        assertThat(corps.path("utilisateur").path("changementMotDePasseRequis").asBoolean()).isFalse();

        MockCookie cookie = (MockCookie) cookieDeSession(session);
        assertThat(cookie.isHttpOnly()).isTrue();
        assertThat(cookie.getSameSite()).isEqualTo("Strict");
        assertThat(cookie.getPath()).isEqualTo("/api/v1/auth");
        assertThat(jdbc.queryForObject("select count(*) from refresh_token where empreinte = ?", Integer.class, cookie.getValue())).isZero();
        assertThat(jdbc.queryForObject("select count(*) from refresh_token where empreinte = ?", Integer.class, sha256(cookie.getValue()))).isOne();
    }

    @Test
    @DisplayName("B-20 : la réponse est la même quand l'adresse appartient déjà à un compte, et aucun doublon n'est créé")
    void inscriptionSansEnumeration() throws Exception {
        String email = compteVerifie();
        String premiere = mvc.perform(de(corps(post("/auth/register"), inscription(adresseRecevable(), MOT_DE_PASSE_CHOISI))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String seconde = mvc.perform(de(corps(post("/auth/register"), inscription(email, "Autre#2026-Passe"))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();

        assertThat(seconde).isEqualTo(premiere);
        assertThat(jdbc.queryForObject("select count(*) from utilisateur where email = ?", Integer.class, email)).isOne();
        assertThat(connexion(email, "Autre#2026-Passe").getResponse().getStatus()).isEqualTo(401);
        assertThat(courrielRecu(email, "déjà").path("Text").asText()).contains("mot de passe oublié");
    }

    @Test
    @DisplayName("B-27, B-07 : tout symbole est accepté ; un mot de passe faible est refusé sans être renvoyé")
    void politiqueDeMotDePasse() throws Exception {
        for (String accepte : new String[] {"Passe#2026", "Ouaga-2026 été", "Zongo_2026+", "Motdepasse1€"}) {
            mvc.perform(de(corps(post("/auth/register"), inscription(adresseRecevable(), accepte)))).andExpect(status().isCreated());
        }
        for (String refuse : new String[] {"Ab1#", "sansmajuscule1#", "SANSMINUSCULE1#", "SansChiffre##", "SansSymbole2026"}) {
            String reponse = mvc.perform(de(corps(post("/auth/register"), inscription(adresseRecevable(), refuse))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION"))
                    .andExpect(jsonPath("$.errors[*].field", hasItem("motDePasse")))
                    .andReturn().getResponse().getContentAsString();
            assertThat(reponse).doesNotContain(refuse);
        }
    }

    @Test
    @DisplayName("Inscription refusée sans consentement, sans filière ou avec une adresse mal formée")
    void inscriptionIncomplete() throws Exception {
        Map<String, Object> sansConsentement = inscription(adresseRecevable(), MOT_DE_PASSE_CHOISI);
        sansConsentement.put("consentement", false);
        mvc.perform(de(corps(post("/auth/register"), sansConsentement)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[*].field", hasItem("consentement")));

        Map<String, Object> sansFiliere = inscription(adresseRecevable(), MOT_DE_PASSE_CHOISI);
        sansFiliere.remove("filiere");
        mvc.perform(de(corps(post("/auth/register"), sansFiliere)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[*].field", hasItem("filiere")));

        mvc.perform(de(corps(post("/auth/register"), inscription("pas-une-adresse", MOT_DE_PASSE_CHOISI))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[*].field", hasItem("email")));
    }

    @Test
    @DisplayName("B-14 : les numéros de membre se suivent, sans collision possible")
    void numerosDeMembre() throws Exception {
        String premier = adresseRecevable();
        String second = adresseRecevable();
        mvc.perform(de(corps(post("/auth/register"), inscription(premier, MOT_DE_PASSE_CHOISI)))).andExpect(status().isCreated());
        mvc.perform(de(corps(post("/auth/register"), inscription(second, MOT_DE_PASSE_CHOISI)))).andExpect(status().isCreated());

        long a = Long.parseLong(utilisateurs.findByEmail(premier).orElseThrow().getNumeroMembre().replaceAll(".*-", ""));
        long b = Long.parseLong(utilisateurs.findByEmail(second).orElseThrow().getNumeroMembre().replaceAll(".*-", ""));
        assertThat(b).isGreaterThan(a);
    }

    // ---------------------------------------------------------------- Connexion

    @Test
    @DisplayName("Connexion : compte inconnu et mot de passe faux reçoivent exactement le même refus")
    void refusIdentiques() throws Exception {
        String email = compteVerifie();
        MvcResult inconnu = connexion("personne-" + System.nanoTime() + "@club.test", MOT_DE_PASSE_CHOISI);
        MvcResult faux = connexion(email, "Mauvais#2026-Passe");

        assertThat(inconnu.getResponse().getStatus()).isEqualTo(401);
        assertThat(faux.getResponse().getStatus()).isEqualTo(401);
        JsonNode a = json.readTree(inconnu.getResponse().getContentAsString());
        JsonNode b = json.readTree(faux.getResponse().getContentAsString());
        assertThat(a.path("code").asText()).isEqualTo("IDENTIFIANTS_REFUSES");
        assertThat(b).isEqualTo(a);
        assertThat(faux.getResponse().getCookie(COOKIE)).isNull();
    }

    @Test
    @DisplayName("B-15 : verrouillage après les échecs configurés ; une fois le verrou expiré, un seul échec ne reverrouille pas")
    void verrouillage() throws Exception {
        String email = compteVerifie();
        for (int i = 0; i < 3; i++) {
            assertThat(connexion(email, "Mauvais#2026-Passe").getResponse().getStatus()).isEqualTo(401);
        }
        MvcResult verrouille = connexion(email, MOT_DE_PASSE_CHOISI);
        assertThat(verrouille.getResponse().getStatus()).isEqualTo(423);
        assertThat(json.readTree(verrouille.getResponse().getContentAsString()).path("code").asText()).isEqualTo("COMPTE_VERROUILLE");

        jdbc.update("update utilisateur set verrouille_jusqua = now() - interval '1 minute' where email = ?", email);
        assertThat(connexion(email, "Mauvais#2026-Passe").getResponse().getStatus()).isEqualTo(401);
        assertThat(connexion(email, MOT_DE_PASSE_CHOISI).getResponse().getStatus()).isEqualTo(200);
        assertThat(utilisateurs.findByEmail(email).orElseThrow().getTentativesConnexion()).isZero();
    }

    @Test
    @DisplayName("Un compte suspendu est signalé par un code, et son jeton d'accès encore valide n'ouvre plus rien")
    void compteSuspendu() throws Exception {
        String email = compteVerifie();
        String acces = jetonDAcces(connexion(email, MOT_DE_PASSE_CHOISI));
        mvc.perform(get("/users/me").header("Authorization", "Bearer " + acces)).andExpect(status().isOk());

        jdbc.update("update utilisateur set statut = 'SUSPENDU' where email = ?", email);

        MvcResult refus = connexion(email, MOT_DE_PASSE_CHOISI);
        assertThat(refus.getResponse().getStatus()).isEqualTo(403);
        assertThat(json.readTree(refus.getResponse().getContentAsString()).path("code").asText()).isEqualTo("COMPTE_SUSPENDU");
        mvc.perform(get("/users/me").header("Authorization", "Bearer " + acces)).andExpect(status().isUnauthorized());
    }

    // ---------------------------------------------------------------- Session

    @Test
    @DisplayName("Renouvellement : sans cookie 401 ; avec cookie, nouveau jeton et rotation du cookie")
    void renouvellement() throws Exception {
        mvc.perform(de(post("/auth/refresh"))).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("SESSION_EXPIREE"));

        String email = compteVerifie();
        Cookie initial = cookieDeSession(connexion(email, MOT_DE_PASSE_CHOISI));
        MvcResult renouvele = mvc.perform(de(post("/auth/refresh").cookie(initial)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(jsonPath("$.utilisateur.email").value(email))
                .andReturn();
        Cookie suivant = cookieDeSession(renouvele);
        assertThat(suivant.getValue()).isNotEqualTo(initial.getValue());
        mvc.perform(get("/users/me").header("Authorization", "Bearer " + jetonDAcces(renouvele))).andExpect(status().isOk());
        mvc.perform(de(post("/auth/refresh").cookie(suivant))).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Réutilisation d'un cookie déjà remplacé : toutes les sessions du compte sont fermées")
    void reutilisationDetectee() throws Exception {
        String email = compteVerifie();
        Cookie vole = cookieDeSession(connexion(email, MOT_DE_PASSE_CHOISI));
        Cookie legitime = cookieDeSession(mvc.perform(de(post("/auth/refresh").cookie(vole))).andExpect(status().isOk()).andReturn());
        // Hors de la fenêtre de tolérance accordée à deux onglets qui renouvellent en même temps.
        jdbc.update("update refresh_token set revoque_le = now() - interval '5 minutes' where empreinte = ?", sha256(vole.getValue()));

        mvc.perform(de(post("/auth/refresh").cookie(vole))).andExpect(status().isUnauthorized());
        mvc.perform(de(post("/auth/refresh").cookie(legitime))).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Déconnexion : le cookie est effacé et ne permet plus de renouveler la session")
    void deconnexion() throws Exception {
        String email = compteVerifie();
        MvcResult session = connexion(email, MOT_DE_PASSE_CHOISI);
        Cookie cookie = cookieDeSession(session);

        MvcResult sortie = mvc.perform(de(post("/auth/logout").cookie(cookie).header("Authorization", "Bearer " + jetonDAcces(session))))
                .andExpect(status().isNoContent()).andReturn();
        assertThat(cookieDeSession(sortie).getMaxAge()).isZero();
        mvc.perform(de(post("/auth/refresh").cookie(cookie))).andExpect(status().isUnauthorized());
        mvc.perform(de(post("/auth/logout"))).andExpect(status().isNoContent());
    }

    // ---------------------------------------------------------------- Mot de passe

    @Test
    @DisplayName("B-06 : réinitialisation par lien à usage unique, jeton haché en base, sessions fermées, réponse identique pour une adresse inconnue")
    void reinitialisation() throws Exception {
        String inconnue = adresseRecevable();
        mvc.perform(de(corps(post("/auth/forgot-password"), Map.of("email", inconnue)))).andExpect(status().isNoContent());

        String email = compteVerifie();
        Cookie ancienneSession = cookieDeSession(connexion(email, MOT_DE_PASSE_CHOISI));
        mvc.perform(de(corps(post("/auth/forgot-password"), Map.of("email", email)))).andExpect(status().isNoContent());

        JsonNode courriel = courrielRecu(email, "Réinitialisation");
        assertThat(courriel.path("Text").asText()).contains("http://localhost:4200/reinitialisation?jeton=");
        String jeton = jetonDuCourriel(email, "Réinitialisation");
        assertThat(jdbc.queryForObject("select count(*) from jeton_usage_unique where empreinte = ?", Integer.class, jeton)).isZero();
        assertThat(courrielsRecus(inconnue)).isEmpty();

        mvc.perform(de(corps(post("/auth/reset-password"), Map.of("token", jeton, "nouveauMotDePasse", "faible"))))
                .andExpect(status().isBadRequest());
        mvc.perform(de(corps(post("/auth/reset-password"), Map.of("token", jeton, "nouveauMotDePasse", "Nouveau#2026-Passe"))))
                .andExpect(status().isNoContent());
        mvc.perform(de(corps(post("/auth/reset-password"), Map.of("token", jeton, "nouveauMotDePasse", "Encore#2026-Passe"))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("JETON_INVALIDE"));

        assertThat(connexion(email, MOT_DE_PASSE_CHOISI).getResponse().getStatus()).isEqualTo(401);
        assertThat(connexion(email, "Nouveau#2026-Passe").getResponse().getStatus()).isEqualTo(200);
        mvc.perform(de(post("/auth/refresh").cookie(ancienneSession))).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("B-28 : le changement de mot de passe ferme les autres sessions et invalide les jetons d'accès déjà émis")
    void changementDeMotDePasse() throws Exception {
        String email = compteVerifie();
        MvcResult autreAppareil = connexion(email, MOT_DE_PASSE_CHOISI);
        MvcResult session = connexion(email, MOT_DE_PASSE_CHOISI);
        String acces = jetonDAcces(session);

        mvc.perform(corps(put("/users/me/password"), Map.of("ancienMotDePasse", "Mauvais#2026-Passe", "nouveauMotDePasse", "Nouveau#2026-Passe"))
                        .header("Authorization", "Bearer " + acces))
                .andExpect(status().isBadRequest());
        MvcResult change = mvc.perform(corps(put("/users/me/password"), Map.of("ancienMotDePasse", MOT_DE_PASSE_CHOISI, "nouveauMotDePasse", "Nouveau#2026-Passe"))
                        .cookie(cookieDeSession(session)).header("Authorization", "Bearer " + acces))
                .andExpect(status().isNoContent())
                .andReturn();

        mvc.perform(de(post("/auth/refresh").cookie(cookieDeSession(autreAppareil)))).andExpect(status().isUnauthorized());
        mvc.perform(get("/users/me").header("Authorization", "Bearer " + jetonDAcces(autreAppareil))).andExpect(status().isUnauthorized());
        mvc.perform(get("/users/me").header("Authorization", "Bearer " + acces)).andExpect(status().isUnauthorized());
        // La session qui a fait le changement continue : son cookie a été remplacé dans la réponse.
        MvcResult suite = mvc.perform(de(post("/auth/refresh").cookie(cookieDeSession(change)))).andExpect(status().isOk()).andReturn();
        mvc.perform(get("/users/me").header("Authorization", "Bearer " + jetonDAcces(suite))).andExpect(status().isOk());
        assertThat(connexion(email, "Nouveau#2026-Passe").getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    @DisplayName("8.7.9 : tant que le mot de passe imposé n'est pas changé, seul le changement de mot de passe est permis")
    void changementImpose() throws Exception {
        Utilisateur administrateur = compte("ADMIN");
        administrateur.setChangementMotDePasseRequis(true);
        utilisateurs.save(administrateur);

        MvcResult session = connexion(administrateur.getEmail(), MOT_DE_PASSE);
        assertThat(json.readTree(session.getResponse().getContentAsString()).path("utilisateur").path("changementMotDePasseRequis").asBoolean()).isTrue();
        String acces = jetonDAcces(session);

        mvc.perform(get("/users/me").header("Authorization", "Bearer " + acces)).andExpect(status().isOk());
        mvc.perform(get("/admin/security/audit-logs").header("Authorization", "Bearer " + acces))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CHANGEMENT_MOT_DE_PASSE_REQUIS"));

        MvcResult change = mvc.perform(corps(put("/users/me/password"), Map.of("ancienMotDePasse", MOT_DE_PASSE, "nouveauMotDePasse", "Nouveau#2026-Passe"))
                        .header("Authorization", "Bearer " + acces))
                .andExpect(status().isNoContent())
                .andReturn();
        MvcResult suite = mvc.perform(de(post("/auth/refresh").cookie(cookieDeSession(change))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.utilisateur.changementMotDePasseRequis").value(false))
                .andReturn();
        mvc.perform(get("/admin/security/audit-logs").header("Authorization", "Bearer " + jetonDAcces(suite))).andExpect(status().isOk());
    }

    // ---------------------------------------------------------------- Compte

    @Test
    @DisplayName("B-17 : le profil ne livre aucune donnée sensible ; un membre ne peut pas s'attribuer une fonction")
    void profil() throws Exception {
        String email = compteVerifie();
        String acces = jetonDAcces(connexion(email, MOT_DE_PASSE_CHOISI));

        mvc.perform(get("/users/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/users/me").header("Authorization", "Bearer " + acces))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.statut").value("ACTIF"))
                .andExpect(jsonPath("$.numeroMembre").isString())
                .andExpect(jsonPath("$.motDePasse").doesNotExist())
                .andExpect(jsonPath("$.totpActive").doesNotExist())
                .andExpect(jsonPath("$.permissions").doesNotExist());

        Map<String, Object> modification = new HashMap<>();
        modification.put("nom", "Kaboré");
        modification.put("prenom", "Rasmata");
        modification.put("filiere", "Réseaux et télécommunications");
        modification.put("biographie", "Passionnée de réseaux.");
        modification.put("fonction", "Présidente");
        mvc.perform(corps(put("/users/me"), modification).header("Authorization", "Bearer " + acces))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.filiere").value("Réseaux et télécommunications"))
                .andExpect(jsonPath("$.biographie").value("Passionnée de réseaux."));
        assertThat(utilisateurs.findByEmail(email).orElseThrow().getFonction()).isNull();

        modification.put("nom", "");
        mvc.perform(corps(put("/users/me"), modification).header("Authorization", "Bearer " + acces)).andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Préférences de notification : lues, modifiées, conservées")
    void preferences() throws Exception {
        String acces = jetonDAcces(connexion(compteVerifie(), MOT_DE_PASSE_CHOISI));
        mvc.perform(get("/users/me/preferences").header("Authorization", "Bearer " + acces))
                .andExpect(status().isOk()).andExpect(jsonPath("$.notificationsCourriel").value(true));
        mvc.perform(corps(put("/users/me/preferences"), Map.of("notificationsCourriel", false)).header("Authorization", "Bearer " + acces))
                .andExpect(status().isOk()).andExpect(jsonPath("$.notificationsCourriel").value(false));
        mvc.perform(get("/users/me/preferences").header("Authorization", "Bearer " + acces))
                .andExpect(jsonPath("$.notificationsCourriel").value(false));
    }

    @Test
    @DisplayName("Droit d'accès : l'export réunit les données du compte, sans le mot de passe")
    void export() throws Exception {
        String email = compteVerifie();
        String acces = jetonDAcces(connexion(email, MOT_DE_PASSE_CHOISI));
        String contenu = mvc.perform(get("/users/me/export").header("Authorization", "Bearer " + acces))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profil.email").value(email))
                .andExpect(jsonPath("$.profil.consentementLe").isString())
                .andExpect(jsonPath("$.preferences.notificationsCourriel").value(true))
                .andExpect(jsonPath("$.inscriptions").isArray())
                .andExpect(jsonPath("$.projets").isArray())
                .andExpect(jsonPath("$.notifications").isArray())
                .andReturn().getResponse().getContentAsString();
        assertThat(contenu).doesNotContain("motDePasse").doesNotContain("mot_de_passe").doesNotContain("$2a$");
    }

    @Test
    @DisplayName("B-13 : suppression du compte confirmée par le mot de passe ; l'adresse redevient disponible")
    void suppressionDuCompte() throws Exception {
        String email = compteVerifie();
        MvcResult session = connexion(email, MOT_DE_PASSE_CHOISI);
        String acces = jetonDAcces(session);

        mvc.perform(corps(post("/users/me/suppression"), Map.of("motDePasse", "Mauvais#2026-Passe")).header("Authorization", "Bearer " + acces))
                .andExpect(status().isBadRequest());
        mvc.perform(corps(post("/users/me/suppression"), Map.of("motDePasse", MOT_DE_PASSE_CHOISI)).header("Authorization", "Bearer " + acces))
                .andExpect(status().isNoContent());

        assertThat(connexion(email, MOT_DE_PASSE_CHOISI).getResponse().getStatus()).isEqualTo(401);
        mvc.perform(get("/users/me").header("Authorization", "Bearer " + acces)).andExpect(status().isUnauthorized());
        mvc.perform(de(post("/auth/refresh").cookie(cookieDeSession(session)))).andExpect(status().isUnauthorized());
        // Le compte supprimé ne conserve ni l'adresse ni le nom.
        assertThat(jdbc.queryForObject("select count(*) from utilisateur where email = ?", Integer.class, email)).isZero();

        mvc.perform(de(corps(post("/auth/register"), inscription(email, MOT_DE_PASSE_CHOISI)))).andExpect(status().isCreated());
        assertThat(utilisateurs.findByEmail(email)).isPresent();
    }

    @Test
    @DisplayName("6.6 : aucune route de double authentification n'existe")
    void pasDeDoubleAuthentification() throws Exception {
        String acces = jetonDAcces(connexion(compteVerifie(), MOT_DE_PASSE_CHOISI));
        mvc.perform(post("/auth/2fa/setup").header("Authorization", "Bearer " + acces)).andExpect(status().isNotFound());
    }
}
