package com.clubinfo.ist.activite;

import com.clubinfo.ist.user.entity.Utilisateur;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Projets : proposition par un membre, décision motivée du Responsable, suivi par un formateur, publication des seuls projets validés. */
class ProjetsIT extends ActivitesTestBase {

    private Map<String, Object> projet(String titre) {
        Map<String, Object> corps = new HashMap<>();
        corps.put("titre", titre);
        corps.put("description", "Application de gestion des emprunts de la bibliothèque.");
        corps.put("technologies", "Angular, Spring Boot, PostgreSQL");
        corps.put("depotGit", "https://exemple.test/depots/bibliotheque");
        return corps;
    }

    private JsonNode proposer(Utilisateur membre) throws Exception {
        return envoyer(post("/projets"), membre, projet(unique("Bibliothèque")), 201);
    }

    private JsonNode decider(Utilisateur responsable, long id, String statut, String motif, int attendu) throws Exception {
        Map<String, Object> decision = new HashMap<>();
        decision.put("statut", statut);
        decision.put("motif", motif);
        return envoyer(put("/projets/" + id + "/validation"), responsable, decision, attendu);
    }

    @Test
    @DisplayName("B-08, B-36 : une proposition n'est lisible que par son porteur, les formateurs et la gestion")
    void propositionReservee() throws Exception {
        Utilisateur porteur = compte("MEMBRE");
        mvc.perform(corps(post("/projets"), projet(unique("Projet")))).andExpect(status().isUnauthorized());
        envoyer(post("/projets"), compte("ADMIN"), projet(unique("Projet")), 403);
        Map<String, Object> sansTechnologies = projet(unique("Projet"));
        sansTechnologies.remove("technologies");
        assertThat(envoyer(post("/projets"), porteur, sansTechnologies, 400).path("errors").get(0).path("field").asText()).isEqualTo("technologies");
        Map<String, Object> depotDangereux = projet(unique("Projet"));
        depotDangereux.put("depotGit", "javascript:alert(1)");
        envoyer(post("/projets"), porteur, depotDangereux, 400);

        JsonNode proposition = proposer(porteur);
        long id = proposition.path("id").asLong();
        assertThat(proposition.path("statut").asText()).isEqualTo("PROPOSE");
        assertThat(proposition.path("avancementPourcentage").asInt()).isZero();
        assertThat(proposition.path("porteurId").asLong()).isEqualTo(porteur.getId());
        assertThat(proposition.path("porteurNom").asText()).isEqualTo("Aminata Ouédraogo");
        assertThat(proposition.path("porteurFiliere").asText()).isEqualTo("Génie logiciel");
        assertThat(proposition.path("membres")).hasSize(1);
        assertThat(proposition.path("membres").get(0).path("role").asText()).isEqualTo("PORTEUR");

        mvc.perform(get("/projets").param("search", proposition.path("titre").asText())).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/projets/slug/" + proposition.path("slug").asText())).andExpect(status().isNotFound());
        mvc.perform(get("/projets/" + id)).andExpect(status().isUnauthorized());
        envoyer(get("/projets/" + id), compte("MEMBRE"), null, 403);
        envoyer(get("/projets/" + id), porteur, null, 200);
        envoyer(get("/projets/" + id), compte("FORMATEUR"), null, 200);
        envoyer(get("/projets/" + id), compte("RESPONSABLE_CLUB"), null, 200);
        envoyer(get("/projets/999999999"), porteur, null, 404);
    }

    @Test
    @DisplayName("B-37 : un membre retrouve ses propositions, quel que soit leur statut")
    void mesProjets() throws Exception {
        Utilisateur membre = compte("MEMBRE");
        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        long enAttente = proposer(membre).path("id").asLong();
        long rejete = proposer(membre).path("id").asLong();
        decider(responsable, rejete, "REJETE", "Sujet déjà traité l'an dernier.", 200);
        long dUnAutre = proposer(compte("MEMBRE")).path("id").asLong();

        mvc.perform(get("/projets/mes-projets")).andExpect(status().isUnauthorized());
        mvc.perform(en(get("/projets/mes-projets"), membre))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[*].id", hasItem((int) enAttente)))
                .andExpect(jsonPath("$.content[*].id", not(hasItem((int) dUnAutre))));
        mvc.perform(en(get("/projets/mes-projets").param("statut", "REJETE"), membre))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(rejete))
                .andExpect(jsonPath("$.content[0].motifDecision").value("Sujet déjà traité l'an dernier."));
        mvc.perform(en(get("/projets/mes-projets").param("statut", "TERMINE"), membre)).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(en(get("/projets/mes-projets").param("statut", "INCONNU"), membre)).andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("B-12, B-09 : décision motivée et unique ; le projet validé devient public, sans adresse ni note interne")
    void decision() throws Exception {
        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        Utilisateur porteur = compte("MEMBRE");
        JsonNode proposition = proposer(porteur);
        long id = proposition.path("id").asLong();

        decider(compte("MEMBRE"), id, "VALIDE", null, 403);
        decider(compte("FORMATEUR"), id, "VALIDE", null, 403);
        assertThat(decider(responsable, id, "REJETE", "  ", 400).path("code").asText()).isEqualTo("MOTIF_REQUIS");
        decider(responsable, id, "EN_COURS", null, 400);
        decider(responsable, 999_999_999L, "VALIDE", null, 404);

        JsonNode valide = decider(responsable, id, "VALIDE", "Bon sujet, périmètre réaliste.", 200);
        assertThat(valide.path("statut").asText()).isEqualTo("VALIDE");
        assertThat(valide.path("motifDecision").asText()).isEqualTo("Bon sujet, périmètre réaliste.");
        assertThat(decider(responsable, id, "REJETE", "Changement d'avis", 409).path("code").asText()).isEqualTo("DECISION_DEJA_PRISE");

        mvc.perform(en(get("/notifications").param("type", "VALIDATION_PROJET"), porteur))
                .andExpect(jsonPath("$.content[0].titre").value("Votre projet est validé"))
                .andExpect(jsonPath("$.content[0].lien").value("/espace/projets"));

        String publique = mvc.perform(get("/projets/slug/" + proposition.path("slug").asText()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("VALIDE"))
                .andExpect(jsonPath("$.membres[0].utilisateurNom").value("Aminata Ouédraogo"))
                .andExpect(jsonPath("$.membres[0].utilisateurEmail").doesNotExist())
                .andExpect(jsonPath("$.motifDecision").doesNotExist())
                .andExpect(jsonPath("$.suiviFormateur").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        assertThat(publique).doesNotContain(porteur.getEmail()).doesNotContain("@");
        mvc.perform(get("/projets").param("search", proposition.path("titre").asText())).andExpect(jsonPath("$.totalElements").value(1));
        envoyer(get("/projets/" + id), compte("MEMBRE"), null, 200);
    }

    @Test
    @DisplayName("Suivi : réservé aux formateurs, sur un projet validé ; l'avancement fait passer le projet en cours puis terminé")
    void suivi() throws Exception {
        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        Utilisateur formateur = compte("FORMATEUR");
        long id = proposer(compte("MEMBRE")).path("id").asLong();
        Map<String, Object> note = new HashMap<>(Map.of("suiviFormateur", "Maquette validée, modèle de données à revoir.", "avancementPourcentage", 40));

        assertThat(envoyer(put("/projets/" + id + "/suivi"), formateur, note, 409).path("code").asText()).isEqualTo("PROJET_NON_VALIDE");
        decider(responsable, id, "VALIDE", null, 200);
        envoyer(put("/projets/" + id + "/suivi"), compte("MEMBRE"), note, 403);
        envoyer(put("/projets/" + id + "/suivi"), formateur, Map.of("avancementPourcentage", 150), 400);
        envoyer(put("/projets/" + id + "/suivi"), formateur, Map.of("suiviFormateur", "Sans avancement"), 400);

        JsonNode suivi = envoyer(put("/projets/" + id + "/suivi"), formateur, note, 200);
        assertThat(suivi.path("statut").asText()).isEqualTo("EN_COURS");
        assertThat(suivi.path("avancementPourcentage").asInt()).isEqualTo(40);
        assertThat(suivi.path("suiviFormateur").asText()).startsWith("Maquette validée");

        note.put("avancementPourcentage", 100);
        assertThat(envoyer(put("/projets/" + id + "/suivi"), formateur, note, 200).path("statut").asText()).isEqualTo("TERMINE");
        assertThat(envoyer(get("/projets/" + id), formateur, null, 200).path("suiviFormateur").asText()).startsWith("Maquette validée");
    }

    @Test
    @DisplayName("Gestion : propositions en attente, liste par statut et compteurs exacts")
    void gestion() throws Exception {
        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        JsonNode avant = envoyer(get("/gestion/projets/compteurs"), responsable, null, 200);
        long enAttente = proposer(compte("MEMBRE")).path("id").asLong();
        long valide = proposer(compte("MEMBRE")).path("id").asLong();
        long rejete = proposer(compte("MEMBRE")).path("id").asLong();
        decider(responsable, valide, "VALIDE", null, 200);
        decider(responsable, rejete, "REJETE", "Hors du périmètre du club.", 200);

        JsonNode apres = envoyer(get("/gestion/projets/compteurs"), responsable, null, 200);
        assertThat(apres.path("enAttente").asInt() - avant.path("enAttente").asInt()).isEqualTo(1);
        assertThat(apres.path("valides").asInt() - avant.path("valides").asInt()).isEqualTo(1);
        assertThat(apres.path("rejetes").asInt() - avant.path("rejetes").asInt()).isEqualTo(1);

        envoyer(get("/projets/en-attente"), compte("MEMBRE"), null, 403);
        envoyer(get("/gestion/projets"), compte("FORMATEUR"), null, 403);
        mvc.perform(en(get("/projets/en-attente"), responsable))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", hasItem((int) enAttente)))
                .andExpect(jsonPath("$[*].id", not(hasItem((int) valide))))
                .andExpect(jsonPath("$[*].statut", everyItem(is("PROPOSE"))));
        mvc.perform(en(get("/gestion/projets").param("statut", "REJETE").param("size", "200"), responsable))
                .andExpect(jsonPath("$.content[*].id", hasItem((int) rejete)))
                .andExpect(jsonPath("$.content[*].statut", everyItem(is("REJETE"))));
        mvc.perform(en(get("/gestion/projets").param("size", "200"), responsable))
                .andExpect(jsonPath("$.content[*].id", hasItem((int) enAttente)))
                .andExpect(jsonPath("$.content[*].id", hasItem((int) valide)));

        mvc.perform(get("/projets/admin/all")).andExpect(status().is4xxClientError());
        envoyer(get("/projets/" + valide + "/membres"), responsable, null, 404);
        envoyer(delete("/projets/" + valide), responsable, null, 405);
    }
}
