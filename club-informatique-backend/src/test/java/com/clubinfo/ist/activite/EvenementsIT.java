package com.clubinfo.ist.activite;

import com.clubinfo.ist.user.entity.Utilisateur;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Événements : gestion par le Responsable, lecture publique des seuls événements publiés, compteurs exacts, iCalendar. */
class EvenementsIT extends ActivitesTestBase {

    @Test
    @DisplayName("B-08 : un événement non publié n'est visible que dans la gestion")
    void brouillonReserveALaGestion() throws Exception {
        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        JsonNode brouillon = creerEvenement(responsable, 30, false);
        String titre = brouillon.path("titre").asText();
        String slug = brouillon.path("slug").asText();
        long id = brouillon.path("id").asLong();

        mvc.perform(get("/evenements").param("search", titre)).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/evenements/slug/" + slug)).andExpect(status().isNotFound());
        mvc.perform(get("/evenements/" + id + "/calendrier")).andExpect(status().isNotFound());
        mvc.perform(get("/gestion/evenements")).andExpect(status().isUnauthorized());
        mvc.perform(en(get("/gestion/evenements"), compte("MEMBRE"))).andExpect(status().isForbidden());
        mvc.perform(en(get("/gestion/evenements").param("size", "200"), responsable))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[*].id", hasItem((int) id)));
        mvc.perform(get("/evenements/admin/all")).andExpect(status().is4xxClientError());

        Map<String, Object> publie = evenement(titre, 30, true);
        envoyer(put("/evenements/" + id), responsable, publie, 200);
        mvc.perform(get("/evenements/slug/" + slug))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titre").value(titre))
                .andExpect(jsonPath("$.nombreInscrits").value(0))
                .andExpect(jsonPath("$.placesRestantes").value(30))
                .andExpect(jsonPath("$.organisateurNom").isString())
                .andExpect(jsonPath("$.organisateurId").doesNotExist());
        mvc.perform(get("/evenements").param("search", titre).param("aVenir", "true")).andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("Saisie d'un événement : droits, dates cohérentes, capacité positive")
    void saisie() throws Exception {
        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        mvc.perform(corps(post("/evenements"), evenement(unique("Soirée"), 10, true))).andExpect(status().isUnauthorized());
        envoyer(post("/evenements"), compte("MEMBRE"), evenement(unique("Soirée"), 10, true), 403);
        envoyer(post("/evenements"), compte("FORMATEUR"), evenement(unique("Soirée"), 10, true), 403);

        Map<String, Object> finAvantDebut = evenement(unique("Soirée"), 10, true);
        finAvantDebut.put("dateFin", dans(200));
        assertThat(envoyer(post("/evenements"), responsable, finAvantDebut, 400).path("code").asText()).isEqualTo("DATES_INCOHERENTES");

        Map<String, Object> dejaPasse = evenement(unique("Soirée"), 10, true);
        dejaPasse.put("dateDebut", dans(-48));
        dejaPasse.put("dateFin", dans(-46));
        envoyer(post("/evenements"), responsable, dejaPasse, 400);

        envoyer(post("/evenements"), responsable, evenement(unique("Soirée"), 0, true), 400);
        Map<String, Object> sansLieu = evenement(unique("Soirée"), 10, true);
        sansLieu.remove("lieu");
        envoyer(post("/evenements"), responsable, sansLieu, 400);

        JsonNode sansLimite = envoyer(post("/evenements"), responsable, evenement(unique("Portes ouvertes"), null, true), 201);
        assertThat(sansLimite.has("placesRestantes")).isFalse();
        assertThat(sansLimite.path("nombreInscrits").asInt()).isZero();
    }

    @Test
    @DisplayName("B-35 : le nombre d'inscrits et les places restantes viennent des inscriptions confirmées")
    void compteursExacts() throws Exception {
        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        JsonNode evenement = creerEvenement(responsable, 2, true);
        long id = evenement.path("id").asLong();
        String slug = evenement.path("slug").asText();

        inscrireEvenement(compte("MEMBRE"), id, 201);
        inscrireEvenement(compte("MEMBRE"), id, 201);
        inscrireEvenement(compte("MEMBRE"), id, 201);

        mvc.perform(get("/evenements/slug/" + slug))
                .andExpect(jsonPath("$.nombreInscrits").value(2))
                .andExpect(jsonPath("$.placesRestantes").value(0));
        mvc.perform(get("/evenements").param("search", evenement.path("titre").asText()))
                .andExpect(jsonPath("$.content[0].nombreInscrits").value(2));
        mvc.perform(en(get("/gestion/evenements").param("size", "200"), responsable))
                .andExpect(jsonPath("$.content[?(@.id == " + id + ")].nombreInscrits", hasItem(2)));
    }

    @Test
    @DisplayName("Gestion : bornes de période sur la date de début")
    void bornesDePeriode() throws Exception {
        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        long id = creerEvenement(responsable, 10, true).path("id").asLong();
        String jour = LocalDate.now().plusDays(10).toString();

        mvc.perform(en(get("/gestion/evenements").param("du", jour).param("au", jour).param("size", "200"), responsable))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[*].id", hasItem((int) id)));
        mvc.perform(en(get("/gestion/evenements").param("du", LocalDate.now().plusDays(40).toString()).param("size", "200"), responsable))
                .andExpect(jsonPath("$.content[*].id", not(hasItem((int) id))));
        mvc.perform(en(get("/gestion/evenements").param("au", LocalDate.now().plusDays(2).toString()).param("size", "200"), responsable))
                .andExpect(jsonPath("$.content[*].id", not(hasItem((int) id))));
        mvc.perform(en(get("/gestion/evenements").param("du", "pas-une-date"), responsable)).andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Capacité : la réduire sous le nombre d'inscrits est refusé ; l'augmenter fait entrer la liste d'attente")
    void changementDeCapacite() throws Exception {
        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        JsonNode evenement = creerEvenement(responsable, 2, true);
        long id = evenement.path("id").asLong();
        inscrireEvenement(compte("MEMBRE"), id, 201);
        inscrireEvenement(compte("MEMBRE"), id, 201);
        Utilisateur enAttente = compte("MEMBRE");
        assertThat(inscrireEvenement(enAttente, id, 201).path("statut").asText()).isEqualTo("LISTE_ATTENTE");

        Map<String, Object> reduit = evenement(evenement.path("titre").asText(), 1, true);
        assertThat(envoyer(put("/evenements/" + id), responsable, reduit, 409).path("code").asText()).isEqualTo("CAPACITE_INSUFFISANTE");

        Map<String, Object> agrandi = evenement(evenement.path("titre").asText(), 3, true);
        assertThat(envoyer(put("/evenements/" + id), responsable, agrandi, 200).path("nombreInscrits").asInt()).isEqualTo(3);
        mvc.perform(en(get("/inscriptions/me"), enAttente)).andExpect(jsonPath("$.content[0].statut").value("CONFIRMEE"));
    }

    @Test
    @DisplayName("Suppression : l'événement disparaît et ses inscrits sont prévenus")
    void suppression() throws Exception {
        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        JsonNode evenement = creerEvenement(responsable, 5, true);
        long id = evenement.path("id").asLong();
        Utilisateur inscrit = compte("MEMBRE");
        inscrireEvenement(inscrit, id, 201);

        envoyer(delete("/evenements/" + id), compte("MEMBRE"), null, 403);
        envoyer(delete("/evenements/" + id), responsable, null, 204);
        envoyer(delete("/evenements/" + id), responsable, null, 404);

        mvc.perform(get("/evenements/slug/" + evenement.path("slug").asText())).andExpect(status().isNotFound());
        mvc.perform(en(get("/inscriptions/me"), inscrit)).andExpect(jsonPath("$.content[0].statut").value("ANNULEE"));
        mvc.perform(en(get("/notifications"), inscrit))
                .andExpect(jsonPath("$.content[0].titre").value("Événement annulé"))
                .andExpect(jsonPath("$.content[0].message", org.hamcrest.Matchers.containsString(evenement.path("titre").asText())));
    }

    @Test
    @DisplayName("iCalendar : fichier conforme, horaires en UTC, texte échappé")
    void calendrier() throws Exception {
        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        Map<String, Object> saisie = evenement(unique("Atelier réseau, niveau 1 ; salle B"), 20, true);
        saisie.put("description", "Première ligne\nSeconde ligne");
        JsonNode evenement = envoyer(post("/evenements"), responsable, saisie, 201);

        MvcResult resultat = mvc.perform(get("/evenements/" + evenement.path("id").asLong() + "/calendrier"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/calendar"))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString(".ics")))
                .andReturn();
        String ics = resultat.getResponse().getContentAsString();
        String deplie = ics.replace("\r\n ", "");

        assertThat(ics).startsWith("BEGIN:VCALENDAR\r\n").endsWith("END:VCALENDAR\r\n");
        assertThat(ics.replace("\r\n", "")).doesNotContain("\n");
        assertThat(ics.lines()).allSatisfy(ligne -> assertThat(ligne.getBytes(java.nio.charset.StandardCharsets.UTF_8).length).isLessThanOrEqualTo(75));
        assertThat(deplie).contains("VERSION:2.0", "BEGIN:VEVENT", "END:VEVENT", "UID:evenement-" + evenement.path("id").asLong() + "@")
                .contains("SUMMARY:" + evenement.path("titre").asText().replace(",", "\\,").replace(";", "\\;"))
                .contains("DESCRIPTION:Première ligne\\nSeconde ligne")
                .contains("LOCATION:Amphithéâtre A")
                .containsPattern("DTSTART:\\d{8}T\\d{6}Z")
                .containsPattern("DTEND:\\d{8}T\\d{6}Z")
                .containsPattern("DTSTAMP:\\d{8}T\\d{6}Z");
        String debut = evenement.path("dateDebut").asText().replaceAll("[-:]", "").replaceAll("\\.\\d+Z$", "Z");
        assertThat(deplie).contains("DTSTART:" + debut);

        mvc.perform(get("/evenements/999999999/calendrier")).andExpect(status().isNotFound());
    }
}
