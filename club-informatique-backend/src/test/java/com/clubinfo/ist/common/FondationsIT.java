package com.clubinfo.ist.common;

import com.clubinfo.ist.support.IntegrationTest;
import com.clubinfo.ist.user.entity.Utilisateur;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Fondations transversales : routes, format d'erreur, pagination, dates, session. */
class FondationsIT extends IntegrationTest {

    private static final String PROBLEME = "application/problem+json";

    @Value("${server.servlet.context-path}")
    private String contextPath;

    @Test
    @DisplayName("L'API est servie sous /api/v1")
    void apiVersionnee() {
        assertThat(contextPath).isEqualTo("/api/v1");
    }

    @Test
    @DisplayName("B-30 : une liste publique répond sans paramètre de recherche")
    void listePubliqueSansRecherche() throws Exception {
        for (String liste : new String[] {"/actualites", "/evenements", "/formations", "/projets", "/ressources/publiques"}) {
            mvc.perform(get(liste)).andExpect(status().isOk());
        }
    }

    @Test
    @DisplayName("La pagination suit l'enveloppe uniforme du contrat")
    void paginationUniforme() throws Exception {
        mvc.perform(get("/actualites").param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(5))
                .andExpect(jsonPath("$.totalElements").isNumber())
                .andExpect(jsonPath("$.totalPages").isNumber())
                .andExpect(jsonPath("$.pageable").doesNotExist())
                .andExpect(jsonPath("$.number").doesNotExist());
    }

    @Test
    @DisplayName("Une taille de page excessive est bornée")
    void tailleDePageBornee() throws Exception {
        mvc.perform(get("/actualites").param("size", "5000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(200));
    }

    @Test
    @DisplayName("B-33 : une route inconnue répond 404 au format RFC 9457")
    void routeInconnue() throws Exception {
        mvc.perform(en(get("/route-qui-n-existe-pas"), compte("MEMBRE")))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(PROBLEME))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.code").value("INTROUVABLE"));
    }

    @Test
    @DisplayName("B-21, B-07 : une erreur de validation suit la RFC 9457 et ne renvoie jamais la valeur refusée")
    void erreurDeValidation() throws Exception {
        String reponse = mvc.perform(corps(post("/auth/login"), Map.of("email", "adresse-invalide", "motDePasse", "")))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(PROBLEME))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("VALIDATION"))
                .andExpect(jsonPath("$.title").isString())
                .andExpect(jsonPath("$.detail").isString())
                .andExpect(jsonPath("$.errors[*].field", hasItem("email")))
                .andExpect(jsonPath("$.errors[0].message").isString())
                .andReturn().getResponse().getContentAsString();
        assertThat(reponse).doesNotContain("rejectedValue").doesNotContain("adresse-invalide");
    }

    @Test
    @DisplayName("Un corps illisible répond 400, non 500")
    void corpsIllisible() throws Exception {
        mvc.perform(post("/auth/login").contentType("application/json").content("{ceci n'est pas du JSON"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(PROBLEME))
                .andExpect(jsonPath("$.code").value("REQUETE_ILLISIBLE"));
    }

    @Test
    @DisplayName("Une page protégée sans session répond 401 au format RFC 9457")
    void sansSession() throws Exception {
        mvc.perform(get("/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(PROBLEME))
                .andExpect(jsonPath("$.code").value("NON_AUTHENTIFIE"));
    }

    @Test
    @DisplayName("Un rôle insuffisant répond 403 au format RFC 9457")
    void roleInsuffisant() throws Exception {
        mvc.perform(en(get("/admin/users"), compte("MEMBRE")))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(PROBLEME))
                .andExpect(jsonPath("$.code").value("ACCES_REFUSE"));
    }

    @Test
    @DisplayName("B-32 : la connexion fonctionne avec un secret de signature qui n'est pas du base64")
    void connexionAvecSecretQuelconque() throws Exception {
        Utilisateur membre = compte("MEMBRE");
        mvc.perform(corps(post("/auth/login"), Map.of("email", membre.getEmail(), "motDePasse", MOT_DE_PASSE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString());
    }

    @Test
    @DisplayName("B-22 : les dates sont sérialisées en ISO 8601 UTC")
    void datesEnUtc() throws Exception {
        Utilisateur admin = compte("ADMIN");
        mvc.perform(en(get("/admin/users/" + admin.getId()), admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.createdAt", endsWith("Z")))
                .andExpect(jsonPath("$.createdAt", matchesPattern("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z")));
    }

    @Test
    @DisplayName("Les réponses portent les en-têtes de sécurité")
    void enTetesDeSecurite() throws Exception {
        mvc.perform(get("/categories"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Referrer-Policy", "no-referrer"))
                .andExpect(header().string("Content-Security-Policy", startsWith("default-src 'none'")))
                .andExpect(header().exists("Permissions-Policy"));
    }

    @Test
    @DisplayName("Les routes techniques ne sont pas ouvertes au public")
    void routesTechniquesFermees() throws Exception {
        mvc.perform(get("/h2-console/")).andExpect(status().isUnauthorized());
        mvc.perform(get("/actuator/env")).andExpect(status().isUnauthorized());
        mvc.perform(get("/actuator/health")).andExpect(status().isOk()).andExpect(jsonPath("$.components").doesNotExist());
    }
}
