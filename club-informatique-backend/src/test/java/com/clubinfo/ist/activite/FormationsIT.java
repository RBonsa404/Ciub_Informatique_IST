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

/** Formations : propriété du formateur, séances sans conflit, supports et devoirs réservés aux inscrits. */
class FormationsIT extends ActivitesTestBase {

    @Test
    @DisplayName("B-10 : une formation appartient à son formateur ; un brouillon n'est visible que de l'équipe pédagogique")
    void proprieteEtVisibilite() throws Exception {
        Utilisateur formateur = compte("FORMATEUR");
        Utilisateur autreFormateur = compte("FORMATEUR");
        mvc.perform(corps(post("/formations"), formation(unique("Atelier"), true))).andExpect(status().isUnauthorized());
        envoyer(post("/formations"), compte("MEMBRE"), formation(unique("Atelier"), true), 403);
        envoyer(post("/formations"), formateur, formation("", true), 400);

        JsonNode brouillon = creerFormation(formateur, false);
        long id = brouillon.path("id").asLong();
        String slug = brouillon.path("slug").asText();
        assertThat(brouillon.path("formateurId").asLong()).isEqualTo(formateur.getId());
        assertThat(brouillon.path("formateurNom").asText()).isEqualTo("Aminata Ouédraogo");
        assertThat(brouillon.path("sessions")).isEmpty();
        assertThat(brouillon.has("devoirs")).isFalse();

        mvc.perform(get("/formations").param("search", brouillon.path("titre").asText())).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/formations/slug/" + slug)).andExpect(status().isNotFound());
        mvc.perform(get("/formations/" + id)).andExpect(status().isUnauthorized());
        envoyer(get("/formations/" + id), compte("MEMBRE"), null, 404);
        envoyer(get("/formations/" + id), autreFormateur, null, 404);
        envoyer(get("/formations/" + id), formateur, null, 200);
        envoyer(get("/formations/" + id), compte("RESPONSABLE_CLUB"), null, 200);

        Map<String, Object> modification = formation(brouillon.path("titre").asText(), true);
        modification.put("niveau", "AVANCE");
        envoyer(put("/formations/" + id), autreFormateur, modification, 403);
        envoyer(put("/formations/" + id), compte("MEMBRE"), modification, 403);
        assertThat(envoyer(put("/formations/" + id), formateur, modification, 200).path("niveau").asText()).isEqualTo("AVANCE");

        mvc.perform(get("/formations/slug/" + slug)).andExpect(status().isOk()).andExpect(jsonPath("$.devoirs").doesNotExist());
        mvc.perform(get("/formations").param("search", brouillon.path("titre").asText()).param("niveau", "AVANCE"))
                .andExpect(jsonPath("$.totalElements").value(1));
        envoyer(get("/formations/" + id), compte("MEMBRE"), null, 200);
    }

    @Test
    @DisplayName("Gestion : le formateur voit ses formations, le Responsable les voit toutes ; filtre par état de publication")
    void formationsGerees() throws Exception {
        Utilisateur formateur = compte("FORMATEUR");
        long publiee = creerFormation(formateur, true).path("id").asLong();
        long brouillon = creerFormation(formateur, false).path("id").asLong();
        long dUnAutre = creerFormation(compte("FORMATEUR"), true).path("id").asLong();

        envoyer(get("/gestion/formations"), compte("MEMBRE"), null, 403);
        mvc.perform(en(get("/gestion/formations"), formateur))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[*].id", hasItem((int) brouillon)))
                .andExpect(jsonPath("$.content[*].id", not(hasItem((int) dUnAutre))));
        mvc.perform(en(get("/gestion/formations").param("publie", "false"), formateur))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(brouillon));
        mvc.perform(en(get("/gestion/formations").param("size", "200").param("publie", "true"), compte("RESPONSABLE_CLUB")))
                .andExpect(jsonPath("$.content[*].id", hasItem((int) publiee)))
                .andExpect(jsonPath("$.content[*].id", hasItem((int) dUnAutre)))
                .andExpect(jsonPath("$.content[*].publie", everyItem(is(true))));
        mvc.perform(get("/formations/admin/all")).andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("B-35 : séances planifiées par le formateur, sans chevauchement, avec un effectif exact")
    void seances() throws Exception {
        Utilisateur formateur = compte("FORMATEUR");
        JsonNode formation = creerFormation(formateur, true);
        long id = formation.path("id").asLong();
        long creneau = prochainCreneau();

        envoyer(post("/formations/" + id + "/sessions"), compte("FORMATEUR"), seance(creneau, 2), 403);
        Map<String, Object> finAvantDebut = seance(creneau, 2);
        finAvantDebut.put("dateFin", dans(creneau - 1));
        assertThat(envoyer(post("/formations/" + id + "/sessions"), formateur, finAvantDebut, 400).path("code").asText()).isEqualTo("DATES_INCOHERENTES");
        envoyer(post("/formations/" + id + "/sessions"), formateur, seance(-30, 2), 400);

        JsonNode seance = envoyer(post("/formations/" + id + "/sessions"), formateur, seance(creneau, 2), 201);
        long idSeance = seance.path("id").asLong();
        assertThat(seance.path("formationId").asLong()).isEqualTo(id);
        assertThat(seance.path("nombreInscrits").asInt()).isZero();
        assertThat(seance.path("placesRestantes").asInt()).isEqualTo(2);

        // Même formateur, autre formation, créneau qui chevauche : refusé.
        long autreFormation = creerFormation(formateur, true).path("id").asLong();
        assertThat(envoyer(post("/formations/" + autreFormation + "/sessions"), formateur, seance(creneau + 1, 5), 409).path("code").asText())
                .isEqualTo("CONFLIT_PLANNING");
        envoyer(post("/formations/" + autreFormation + "/sessions"), formateur, seance(creneau + 2, 5), 201);
        // Modifier la séance sans changer d'horaire n'entre pas en conflit avec elle-même.
        envoyer(put("/formations/" + id + "/sessions/" + idSeance), formateur, seance(creneau, 3), 200);

        inscrireSeance(compte("MEMBRE"), idSeance, 201);
        inscrireSeance(compte("MEMBRE"), idSeance, 201);
        mvc.perform(get("/formations/slug/" + formation.path("slug").asText()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessions.length()").value(1))
                .andExpect(jsonPath("$.sessions[0].nombreInscrits").value(2))
                .andExpect(jsonPath("$.sessions[0].placesRestantes").value(1));
        mvc.perform(get("/formations").param("search", formation.path("titre").asText()))
                .andExpect(jsonPath("$.content[0].sessions[0].nombreInscrits").value(2));
    }

    @Test
    @DisplayName("Suppression d'une séance : ses inscrits sont désinscrits et prévenus ; elle disparaît de la formation")
    void suppressionDeSeance() throws Exception {
        Utilisateur formateur = compte("FORMATEUR");
        JsonNode formation = creerFormation(formateur, true);
        long id = formation.path("id").asLong();
        long seance = creerSeance(formateur, id, 5).path("id").asLong();
        Utilisateur inscrit = compte("MEMBRE");
        inscrireSeance(inscrit, seance, 201);

        envoyer(delete("/formations/" + id + "/sessions/" + seance), compte("FORMATEUR"), null, 403);
        envoyer(delete("/formations/" + id + "/sessions/" + seance), formateur, null, 204);
        envoyer(delete("/formations/" + id + "/sessions/" + seance), formateur, null, 404);

        mvc.perform(get("/formations/slug/" + formation.path("slug").asText())).andExpect(jsonPath("$.sessions").isEmpty());
        mvc.perform(en(get("/inscriptions/me"), inscrit)).andExpect(jsonPath("$.content[0].statut").value("ANNULEE"));
        mvc.perform(en(get("/notifications"), inscrit)).andExpect(jsonPath("$.content[0].titre").value("Séance annulée"));
    }

    @Test
    @DisplayName("B-02 : les devoirs d'une formation ne sont lisibles que par ses inscrits confirmés et son équipe pédagogique")
    void devoirsReserves() throws Exception {
        Utilisateur formateur = compte("FORMATEUR");
        long id = creerFormation(formateur, true).path("id").asLong();
        long seance = creerSeance(formateur, id, 1).path("id").asLong();
        Map<String, Object> devoir = new HashMap<>(Map.of("titre", "Premier dépôt", "description", "Créer un dépôt et y pousser un fichier.", "dateLimite", dans(900)));

        envoyer(post("/formations/" + id + "/devoirs"), compte("FORMATEUR"), devoir, 403);
        envoyer(post("/formations/" + id + "/devoirs"), compte("MEMBRE"), devoir, 403);
        Map<String, Object> lienDangereux = new HashMap<>(devoir);
        lienDangereux.put("fichierConsigne", "javascript:alert(1)");
        envoyer(post("/formations/" + id + "/devoirs"), formateur, lienDangereux, 400);
        JsonNode cree = envoyer(post("/formations/" + id + "/devoirs"), formateur, devoir, 201);
        assertThat(cree.path("formationId").asLong()).isEqualTo(id);
        assertThat(cree.path("formationTitre").asText()).isNotBlank();

        Utilisateur inscrit = compte("MEMBRE");
        Utilisateur enAttente = compte("MEMBRE");
        inscrireSeance(inscrit, seance, 201);
        inscrireSeance(enAttente, seance, 201);

        mvc.perform(get("/formations/" + id + "/devoirs")).andExpect(status().isUnauthorized());
        envoyer(get("/formations/" + id + "/devoirs"), compte("MEMBRE"), null, 403);
        envoyer(get("/formations/" + id + "/devoirs"), enAttente, null, 403);
        envoyer(get("/formations/" + id + "/devoirs"), compte("FORMATEUR"), null, 403);
        assertThat(envoyer(get("/formations/" + id + "/devoirs"), inscrit, null, 200)).hasSize(1);
        assertThat(envoyer(get("/formations/" + id + "/devoirs"), formateur, null, 200).get(0).path("titre").asText()).isEqualTo("Premier dépôt");
        envoyer(get("/formations/" + id + "/devoirs"), compte("RESPONSABLE_CLUB"), null, 200);
        mvc.perform(en(get("/notifications"), inscrit)).andExpect(jsonPath("$.content[*].titre", not(hasItem("Nouveau devoir"))));

        envoyer(delete("/formations/" + id + "/devoirs/" + cree.path("id").asLong()), compte("FORMATEUR"), null, 403);
        envoyer(delete("/formations/" + id + "/devoirs/" + cree.path("id").asLong()), formateur, null, 204);
        assertThat(envoyer(get("/formations/" + id + "/devoirs"), inscrit, null, 200)).isEmpty();
    }

    @Test
    @DisplayName("B-02, B-10 : les supports d'une formation suivent la même règle ; seul l'auteur les modifie")
    void supportsReserves() throws Exception {
        Utilisateur formateur = compte("FORMATEUR");
        Utilisateur autreFormateur = compte("FORMATEUR");
        long id = creerFormation(formateur, true).path("id").asLong();
        long seance = creerSeance(formateur, id, 5).path("id").asLong();
        Map<String, Object> support = new HashMap<>(Map.of("titre", unique("Diapositives"), "type", "SUPPORT_COURS",
                "urlFichier", "https://exemple.test/diapositives.pdf", "estPublique", false, "formationId", id));

        envoyer(post("/ressources"), autreFormateur, support, 403);
        envoyer(post("/ressources"), compte("MEMBRE"), support, 403);
        long idSupport = envoyer(post("/ressources"), formateur, support, 201).path("id").asLong();

        Utilisateur inscrit = compte("MEMBRE");
        inscrireSeance(inscrit, seance, 201);
        Utilisateur nonInscrit = compte("MEMBRE");

        mvc.perform(get("/ressources/formation/" + id)).andExpect(status().isUnauthorized());
        envoyer(get("/ressources/formation/" + id), nonInscrit, null, 403);
        assertThat(envoyer(get("/ressources/formation/" + id), inscrit, null, 200)).hasSize(1);
        envoyer(get("/ressources/formation/" + id), formateur, null, 200);
        envoyer(get("/ressources/formation/999999999"), formateur, null, 404);

        mvc.perform(get("/ressources/" + idSupport)).andExpect(status().isUnauthorized());
        envoyer(get("/ressources/" + idSupport), nonInscrit, null, 403);
        envoyer(get("/ressources/" + idSupport), inscrit, null, 200);
        mvc.perform(get("/ressources/publiques").param("search", (String) support.get("titre"))).andExpect(jsonPath("$.totalElements").value(0));

        Map<String, Object> modifie = new HashMap<>(support);
        modifie.put("estPublique", true);
        envoyer(put("/ressources/" + idSupport), autreFormateur, modifie, 403);
        envoyer(put("/ressources/" + idSupport), formateur, modifie, 200);
        envoyer(get("/ressources/" + idSupport), nonInscrit, null, 200);
        envoyer(delete("/ressources/" + idSupport), autreFormateur, null, 403);
        envoyer(delete("/ressources/" + idSupport), formateur, null, 204);
        envoyer(get("/ressources/" + idSupport), inscrit, null, 404);
        mvc.perform(get("/ressources/admin/all")).andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("Suppression d'une formation : réservée au Responsable, refusée tant que des membres y sont inscrits")
    void suppression() throws Exception {
        Utilisateur formateur = compte("FORMATEUR");
        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        JsonNode formation = creerFormation(formateur, true);
        long id = formation.path("id").asLong();
        long seance = creerSeance(formateur, id, 5).path("id").asLong();
        long inscription = inscrireSeance(compte("MEMBRE"), seance, 201).path("id").asLong();

        envoyer(delete("/formations/" + id), formateur, null, 403);
        assertThat(envoyer(delete("/formations/" + id), responsable, null, 409).path("code").asText()).isEqualTo("FORMATION_SUIVIE");

        envoyer(put("/inscriptions/" + inscription + "/statut"), responsable, Map.of("statut", "ANNULEE"), 200);
        envoyer(delete("/formations/" + id), responsable, null, 204);
        mvc.perform(get("/formations/slug/" + formation.path("slug").asText())).andExpect(status().isNotFound());
        envoyer(delete("/formations/" + id), responsable, null, 404);
    }
}
