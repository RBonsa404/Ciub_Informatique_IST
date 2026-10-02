package com.clubinfo.ist.activite;

import com.clubinfo.ist.user.entity.Utilisateur;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Inscriptions aux événements et aux séances : quota, liste d'attente, annulation, gestion, émargement. */
class InscriptionsIT extends ActivitesTestBase {

    @Test
    @DisplayName("Inscription à un événement : confirmée, décrite avec l'événement, refusée en double ou sans le rôle de membre")
    void inscriptionSimple() throws Exception {
        JsonNode evenement = creerEvenement(compte("RESPONSABLE_CLUB"), 10, true);
        long id = evenement.path("id").asLong();
        Utilisateur membre = compte("MEMBRE");

        mvc.perform(post("/inscriptions/evenements/" + id)).andExpect(status().isUnauthorized());
        inscrireEvenement(compte("ADMIN"), id, 403);

        JsonNode inscription = inscrireEvenement(membre, id, 201);
        assertThat(inscription.path("statut").asText()).isEqualTo("CONFIRMEE");
        assertThat(inscription.path("evenementId").asLong()).isEqualTo(id);
        assertThat(inscription.path("evenementTitre").asText()).isEqualTo(evenement.path("titre").asText());
        assertThat(inscription.path("evenementSlug").asText()).isEqualTo(evenement.path("slug").asText());
        assertThat(inscription.path("lieu").asText()).isEqualTo("Amphithéâtre A");
        assertThat(inscription.path("dateDebut").asText()).isEqualTo(evenement.path("dateDebut").asText());
        assertThat(inscription.path("dateInscription").asText()).endsWith("Z");
        assertThat(inscription.has("utilisateurEmail")).isFalse();

        assertThat(inscrireEvenement(membre, id, 409).path("code").asText()).isEqualTo("DEJA_INSCRIT");
        inscrireEvenement(membre, 999_999_999L, 404);

        long brouillon = creerEvenement(compte("RESPONSABLE_CLUB"), 10, false).path("id").asLong();
        inscrireEvenement(membre, brouillon, 404);

        jdbc.update("update evenement set date_debut = now() - interval '2 days', date_fin = now() - interval '1 day' where id = ?", id);
        assertThat(inscrireEvenement(compte("MEMBRE"), id, 409).path("code").asText()).isEqualTo("INSCRIPTIONS_CLOSES");
    }

    @Test
    @DisplayName("Liste d'attente : au désistement d'un inscrit, le premier en attente est confirmé et prévenu")
    void listeDAttenteEtPromotion() throws Exception {
        long id = creerEvenement(compte("RESPONSABLE_CLUB"), 1, true).path("id").asLong();
        Utilisateur premier = compte("MEMBRE");
        Utilisateur deuxieme = compte("MEMBRE");
        Utilisateur troisieme = compte("MEMBRE");

        long inscriptionDuPremier = inscrireEvenement(premier, id, 201).path("id").asLong();
        assertThat(inscrireEvenement(deuxieme, id, 201).path("statut").asText()).isEqualTo("LISTE_ATTENTE");
        assertThat(inscrireEvenement(troisieme, id, 201).path("statut").asText()).isEqualTo("LISTE_ATTENTE");

        envoyer(delete("/inscriptions/" + inscriptionDuPremier), deuxieme, null, 403);
        envoyer(delete("/inscriptions/999999999"), premier, null, 404);
        envoyer(delete("/inscriptions/" + inscriptionDuPremier), premier, null, 204);
        envoyer(delete("/inscriptions/" + inscriptionDuPremier), premier, null, 204);

        mvc.perform(en(get("/inscriptions/me"), premier)).andExpect(jsonPath("$.content[0].statut").value("ANNULEE"));
        mvc.perform(en(get("/inscriptions/me"), deuxieme)).andExpect(jsonPath("$.content[0].statut").value("CONFIRMEE"));
        mvc.perform(en(get("/inscriptions/me"), troisieme)).andExpect(jsonPath("$.content[0].statut").value("LISTE_ATTENTE"));
        mvc.perform(en(get("/notifications").param("type", "INSCRIPTION"), deuxieme))
                .andExpect(jsonPath("$.content[0].titre").value("Votre place est confirmée"));

        // Après son désistement, le premier peut se réinscrire : il prend place en fin de liste.
        assertThat(inscrireEvenement(premier, id, 201).path("statut").asText()).isEqualTo("LISTE_ATTENTE");
    }

    @Test
    @DisplayName("B-11 : douze inscriptions simultanées pour trois places : trois confirmées, neuf en attente, jamais plus")
    void quotaSousConcurrence() throws Exception {
        long id = creerEvenement(compte("RESPONSABLE_CLUB"), 3, true).path("id").asLong();
        List<Utilisateur> membres = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            membres.add(compte("MEMBRE"));
        }
        ExecutorService fils = Executors.newFixedThreadPool(12);
        CountDownLatch depart = new CountDownLatch(1);
        try {
            List<Future<String>> reponses = new ArrayList<>();
            for (Utilisateur membre : membres) {
                Callable<String> inscription = () -> {
                    depart.await();
                    return inscrireEvenement(membre, id, 201).path("statut").asText();
                };
                reponses.add(fils.submit(inscription));
            }
            depart.countDown();
            List<String> statuts = new ArrayList<>();
            for (Future<String> reponse : reponses) {
                statuts.add(reponse.get(60, TimeUnit.SECONDS));
            }
            assertThat(statuts).filteredOn("CONFIRMEE"::equals).hasSize(3);
            assertThat(statuts).filteredOn("LISTE_ATTENTE"::equals).hasSize(9);
        } finally {
            fils.shutdownNow();
        }
        assertThat(jdbc.queryForObject("select count(*) from inscription where evenement_id = ? and statut = 'CONFIRMEE'", Integer.class, id)).isEqualTo(3);
    }

    @Test
    @DisplayName("B-11 : la promotion manuelle respecte la capacité ; la gestion voit les inscrits avec leur filière")
    void gestionDesInscriptions() throws Exception {
        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        long id = creerEvenement(responsable, 1, true).path("id").asLong();
        Utilisateur confirme = compte("MEMBRE");
        long inscriptionConfirmee = inscrireEvenement(confirme, id, 201).path("id").asLong();
        long inscriptionEnAttente = inscrireEvenement(compte("MEMBRE"), id, 201).path("id").asLong();

        envoyer(get("/inscriptions/evenements/" + id), compte("MEMBRE"), null, 403);
        mvc.perform(en(get("/inscriptions/evenements/" + id), responsable))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[*].utilisateurEmail", hasItem(confirme.getEmail())))
                .andExpect(jsonPath("$[*].utilisateurNom", everyItem(is("Aminata Ouédraogo"))))
                .andExpect(jsonPath("$[*].utilisateurFiliere", everyItem(is("Génie logiciel"))));

        Map<String, Object> promotion = Map.of("statut", "CONFIRMEE");
        envoyer(put("/inscriptions/" + inscriptionEnAttente + "/statut"), compte("MEMBRE"), promotion, 403);
        assertThat(envoyer(put("/inscriptions/" + inscriptionEnAttente + "/statut"), responsable, promotion, 409).path("code").asText()).isEqualTo("COMPLET");

        envoyer(put("/inscriptions/" + inscriptionConfirmee + "/statut"), responsable, Map.of("statut", "ANNULEE", "motif", "Absence annoncée"), 200);
        mvc.perform(en(get("/inscriptions/evenements/" + id), responsable))
                .andExpect(jsonPath("$[?(@.id == " + inscriptionEnAttente + ")].statut", hasItem("CONFIRMEE")))
                .andExpect(jsonPath("$[?(@.id == " + inscriptionConfirmee + ")].motifAnnulation", hasItem("Absence annoncée")));
        envoyer(put("/inscriptions/999999999/statut"), responsable, promotion, 404);
    }

    @Test
    @DisplayName("Mes inscriptions : paginées, filtrées par type et par statut, limitées aux miennes")
    void mesInscriptions() throws Exception {
        Utilisateur membre = compte("MEMBRE");
        Utilisateur formateur = compte("FORMATEUR");
        long evenement = creerEvenement(compte("RESPONSABLE_CLUB"), 10, true).path("id").asLong();
        JsonNode formation = creerFormation(formateur, true);
        long seance = creerSeance(formateur, formation.path("id").asLong(), 10).path("id").asLong();

        long inscriptionEvenement = inscrireEvenement(membre, evenement, 201).path("id").asLong();
        JsonNode inscriptionSeance = inscrireSeance(membre, seance, 201);
        assertThat(inscriptionSeance.path("formationId").asLong()).isEqualTo(formation.path("id").asLong());
        assertThat(inscriptionSeance.path("formationSlug").asText()).isEqualTo(formation.path("slug").asText());
        assertThat(inscriptionSeance.path("formationTitre").asText()).isEqualTo(formation.path("titre").asText());
        assertThat(inscriptionSeance.path("lieu").asText()).isEqualTo("Salle informatique 2");
        inscrireEvenement(compte("MEMBRE"), evenement, 201);
        envoyer(delete("/inscriptions/" + inscriptionEvenement), membre, null, 204);

        mvc.perform(get("/inscriptions/me")).andExpect(status().isUnauthorized());
        mvc.perform(en(get("/inscriptions/me"), membre)).andExpect(jsonPath("$.totalElements").value(2));
        mvc.perform(en(get("/inscriptions/me").param("type", "FORMATION"), membre))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].sessionFormationId").value(seance));
        mvc.perform(en(get("/inscriptions/me").param("type", "EVENEMENT").param("statut", "ANNULEE"), membre))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].evenementId").value(evenement));
        mvc.perform(en(get("/inscriptions/me").param("statut", "LISTE_ATTENTE"), membre)).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(en(get("/inscriptions/me").param("type", "AUTRE"), membre)).andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Séances : inscription refusée si la formation n'est pas publiée ou si la séance est annulée")
    void inscriptionAUneSeance() throws Exception {
        Utilisateur formateur = compte("FORMATEUR");
        Utilisateur membre = compte("MEMBRE");
        long seanceCachee = creerSeance(formateur, creerFormation(formateur, false).path("id").asLong(), 5).path("id").asLong();
        inscrireSeance(membre, seanceCachee, 404);

        long formation = creerFormation(formateur, true).path("id").asLong();
        JsonNode seance = creerSeance(formateur, formation, 5);
        Map<String, Object> annulee = new java.util.HashMap<>(Map.of("dateDebut", seance.path("dateDebut").asText(), "dateFin", seance.path("dateFin").asText(),
                "lieu", "Salle informatique 2", "statut", "ANNULEE"));
        envoyer(put("/formations/" + formation + "/sessions/" + seance.path("id").asLong()), formateur, annulee, 200);
        assertThat(inscrireSeance(membre, seance.path("id").asLong(), 409).path("code").asText()).isEqualTo("INSCRIPTIONS_CLOSES");
    }

    @Test
    @DisplayName("B-18 : émargement réservé au formateur de la séance, pour les seuls inscrits confirmés de cette séance")
    void emargement() throws Exception {
        Utilisateur formateur = compte("FORMATEUR");
        long formation = creerFormation(formateur, true).path("id").asLong();
        long seance = creerSeance(formateur, formation, 1).path("id").asLong();
        long autreSeance = creerSeance(formateur, formation, 5).path("id").asLong();
        Utilisateur inscrit = compte("MEMBRE");
        long inscription = inscrireSeance(inscrit, seance, 201).path("id").asLong();
        long enAttente = inscrireSeance(compte("MEMBRE"), seance, 201).path("id").asLong();
        long ailleurs = inscrireSeance(compte("MEMBRE"), autreSeance, 201).path("id").asLong();

        Utilisateur autreFormateur = compte("FORMATEUR");
        envoyer(get("/inscriptions/formations/" + seance), autreFormateur, null, 403);
        envoyer(get("/inscriptions/formations/" + seance), inscrit, null, 403);
        mvc.perform(en(get("/inscriptions/formations/" + seance), formateur))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[*].utilisateurFiliere", everyItem(is("Génie logiciel"))));
        envoyer(get("/inscriptions/formations/" + seance), compte("RESPONSABLE_CLUB"), null, 200);

        Map<String, Object> pointage = Map.of("presences", List.of(Map.of("inscriptionId", inscription, "statut", "PRESENT")));
        envoyer(post("/presences/sessions/" + seance), autreFormateur, pointage, 403);
        JsonNode pointes = envoyer(post("/presences/sessions/" + seance), formateur, pointage, 200);
        assertThat(pointes).hasSize(1);
        assertThat(pointes.get(0).path("statut").asText()).isEqualTo("PRESENT");
        assertThat(pointes.get(0).path("utilisateurNom").asText()).isEqualTo("Aminata Ouédraogo");
        long idPointage = pointes.get(0).path("id").asLong();

        JsonNode corrige = envoyer(post("/presences/sessions/" + seance), formateur,
                Map.of("presences", List.of(Map.of("inscriptionId", inscription, "statut", "EXCUSE", "remarque", "Certificat fourni"))), 200);
        assertThat(corrige.get(0).path("id").asLong()).isEqualTo(idPointage);
        assertThat(corrige.get(0).path("statut").asText()).isEqualTo("EXCUSE");

        assertThat(envoyer(post("/presences/sessions/" + seance), formateur,
                Map.of("presences", List.of(Map.of("inscriptionId", ailleurs, "statut", "PRESENT"))), 400).path("code").asText()).isEqualTo("INSCRIPTION_HORS_SEANCE");
        envoyer(post("/presences/sessions/" + seance), formateur, Map.of("presences", List.of(Map.of("inscriptionId", enAttente, "statut", "PRESENT"))), 400);
        envoyer(post("/presences/sessions/" + seance), formateur, Map.of("presences", List.of()), 400);

        mvc.perform(en(get("/presences/sessions/" + seance), formateur))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].sessionId").value(seance))
                .andExpect(jsonPath("$[0].remarque").value("Certificat fourni"));
        envoyer(get("/presences/sessions/" + seance), autreFormateur, null, 403);
    }
}
