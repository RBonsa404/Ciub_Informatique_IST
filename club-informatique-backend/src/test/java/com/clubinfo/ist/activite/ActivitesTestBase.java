package com.clubinfo.ist.activite;

import com.clubinfo.ist.common.config.JacksonConfig;
import com.clubinfo.ist.support.IntegrationTest;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Fabrique d'événements, de formations et de séances pour les tests des activités. */
abstract class ActivitesTestBase extends IntegrationTest {

    @Autowired
    protected JdbcTemplate jdbc;

    protected static String unique(String base) {
        return base + " " + System.nanoTime();
    }

    /** Horodatage ISO 8601 UTC, à tant d'heures d'ici. */
    protected static String dans(long heures) {
        return JacksonConfig.enUtc(LocalDateTime.now().plusHours(heures).truncatedTo(ChronoUnit.SECONDS));
    }

    protected JsonNode corpsDe(MvcResult resultat) throws Exception {
        return json.readTree(resultat.getResponse().getContentAsString());
    }

    protected JsonNode envoyer(MockHttpServletRequestBuilder requete, Utilisateur compte, Object corps, int statutAttendu) throws Exception {
        MockHttpServletRequestBuilder complete = corps == null ? requete : corps(requete, corps);
        MvcResult resultat = mvc.perform(en(complete, compte)).andExpect(status().is(statutAttendu)).andReturn();
        String contenu = resultat.getResponse().getContentAsString();
        return contenu.isEmpty() ? json.nullNode() : json.readTree(contenu);
    }

    protected Map<String, Object> evenement(String titre, Integer capacite, boolean publie) {
        Map<String, Object> corps = new HashMap<>();
        corps.put("titre", titre);
        corps.put("description", "Rencontre ouverte aux étudiants de l'IST.");
        corps.put("dateDebut", dans(240));
        corps.put("dateFin", dans(243));
        corps.put("lieu", "Amphithéâtre A");
        corps.put("capaciteMax", capacite);
        corps.put("publie", publie);
        return corps;
    }

    protected JsonNode creerEvenement(Utilisateur responsable, Integer capacite, boolean publie) throws Exception {
        return envoyer(post("/evenements"), responsable, evenement(unique("Conférence"), capacite, publie), 201);
    }

    protected Map<String, Object> formation(String titre, boolean publie) {
        Map<String, Object> corps = new HashMap<>();
        corps.put("titre", titre);
        corps.put("description", "Prise en main de Git et du travail en équipe.");
        corps.put("niveau", "DEBUTANT");
        corps.put("publie", publie);
        return corps;
    }

    protected JsonNode creerFormation(Utilisateur formateur, boolean publie) throws Exception {
        return envoyer(post("/formations"), formateur, formation(unique("Atelier Git"), publie), 201);
    }

    protected Map<String, Object> seance(long debutDansHeures, Integer capacite) {
        Map<String, Object> corps = new HashMap<>();
        corps.put("dateDebut", dans(debutDansHeures));
        corps.put("dateFin", dans(debutDansHeures + 2));
        corps.put("lieu", "Salle informatique 2");
        corps.put("capaciteMax", capacite);
        corps.put("statut", "PLANIFIEE");
        return corps;
    }

    /** Les séances d'un même formateur ne doivent pas se chevaucher : chaque appel prend un créneau distinct. */
    private static long creneau = 500;

    protected static synchronized long prochainCreneau() {
        creneau += 10;
        return creneau;
    }

    protected JsonNode creerSeance(Utilisateur formateur, long formationId, Integer capacite) throws Exception {
        return envoyer(post("/formations/" + formationId + "/sessions"), formateur, seance(prochainCreneau(), capacite), 201);
    }

    protected JsonNode inscrireEvenement(Utilisateur membre, long evenementId, int statutAttendu) throws Exception {
        return envoyer(post("/inscriptions/evenements/" + evenementId), membre, null, statutAttendu);
    }

    protected JsonNode inscrireSeance(Utilisateur membre, long seanceId, int statutAttendu) throws Exception {
        return envoyer(post("/inscriptions/formations/" + seanceId), membre, null, statutAttendu);
    }
}
