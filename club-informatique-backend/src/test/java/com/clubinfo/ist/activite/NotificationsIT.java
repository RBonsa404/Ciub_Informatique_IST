package com.clubinfo.ist.activite;

import com.clubinfo.ist.notification.service.RappelService;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Notifications : créées par les événements du club, filtrées, marquées lues, doublées d'un courriel selon la préférence. */
class NotificationsIT extends ActivitesTestBase {

    @Autowired
    private RappelService rappels;

    private Utilisateur membreJoignable() {
        Utilisateur membre = compte("MEMBRE");
        membre.setEmail(adresseRecevable());
        return utilisateurs.save(membre);
    }

    @Test
    @DisplayName("Une inscription crée une notification ; la liste se filtre et se marque comme lue")
    void cycleDeVie() throws Exception {
        Utilisateur membre = compte("MEMBRE");
        JsonNode evenement = creerEvenement(compte("RESPONSABLE_CLUB"), 10, true);
        inscrireEvenement(membre, evenement.path("id").asLong(), 201);

        mvc.perform(get("/notifications")).andExpect(status().isUnauthorized());
        JsonNode liste = envoyer(get("/notifications"), membre, null, 200);
        assertThat(liste.path("totalElements").asInt()).isEqualTo(1);
        JsonNode notification = liste.path("content").get(0);
        assertThat(notification.path("type").asText()).isEqualTo("INSCRIPTION");
        assertThat(notification.path("titre").asText()).isEqualTo("Inscription confirmée");
        assertThat(notification.path("message").asText()).contains(evenement.path("titre").asText());
        assertThat(notification.path("lien").asText()).isEqualTo("/evenements/" + evenement.path("slug").asText());
        assertThat(notification.path("lue").asBoolean()).isFalse();
        assertThat(notification.path("createdAt").asText()).endsWith("Z");
        assertThat(notification.has("destinataireId")).isFalse();
        long id = notification.path("id").asLong();

        mvc.perform(en(get("/notifications/non-lues/count"), membre)).andExpect(jsonPath("$.nonLues").value(1));
        mvc.perform(en(get("/notifications").param("type", "RAPPEL_SESSION"), membre)).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(en(get("/notifications").param("lue", "false"), membre)).andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(en(get("/notifications").param("type", "INCONNU"), membre)).andExpect(status().isBadRequest());

        envoyer(put("/notifications/" + id + "/lue"), compte("MEMBRE"), null, 404);
        envoyer(put("/notifications/" + id + "/lue"), membre, null, 204);
        mvc.perform(en(get("/notifications/non-lues/count"), membre)).andExpect(jsonPath("$.nonLues").value(0));
        mvc.perform(en(get("/notifications").param("lue", "true"), membre)).andExpect(jsonPath("$.totalElements").value(1));

        inscrireEvenement(membre, creerEvenement(compte("RESPONSABLE_CLUB"), 10, true).path("id").asLong(), 201);
        envoyer(put("/notifications/lire-toutes"), membre, null, 204);
        mvc.perform(en(get("/notifications").param("lue", "false"), membre)).andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @DisplayName("Diffusion : réservée au Responsable, reçue par les membres actifs, lien interne seulement")
    void diffusionGlobale() throws Exception {
        Utilisateur membre = compte("MEMBRE");
        Utilisateur suspendu = compte("MEMBRE");
        jdbc.update("update utilisateur set statut = 'SUSPENDU' where id = ?", suspendu.getId());
        String titre = unique("Assemblée générale");
        Map<String, Object> annonce = new HashMap<>(Map.of("titre", titre, "message", "Rendez-vous samedi à 9 h.", "lien", "/evenements"));

        envoyer(post("/notifications/globales"), membre, annonce, 403);
        envoyer(post("/notifications/globales"), compte("ADMIN"), annonce, 403);
        Map<String, Object> lienExterne = new HashMap<>(annonce);
        lienExterne.put("lien", "https://exemple.test/hameconnage");
        envoyer(post("/notifications/globales"), compte("RESPONSABLE_CLUB"), lienExterne, 400);
        lienExterne.put("lien", "//exemple.test");
        envoyer(post("/notifications/globales"), compte("RESPONSABLE_CLUB"), lienExterne, 400);
        envoyer(post("/notifications/globales"), compte("RESPONSABLE_CLUB"), annonce, 204);

        mvc.perform(en(get("/notifications").param("type", "MESSAGE_GLOBAL"), membre))
                .andExpect(jsonPath("$.content[0].titre").value(titre))
                .andExpect(jsonPath("$.content[0].lien").value("/evenements"))
                .andExpect(jsonPath("$.content[*].type", everyItem(is("MESSAGE_GLOBAL"))));
        assertThat(jdbc.queryForObject("select count(*) from notification where titre = ? and destinataire_id = ?", Integer.class, titre, suspendu.getId())).isZero();
        assertThat(jdbc.queryForObject("select count(*) from notification where titre = ?", Integer.class, titre)).isGreaterThan(1);
    }

    @Test
    @DisplayName("Préférence : la notification est doublée d'un courriel seulement si le membre l'accepte")
    void courrielSelonLaPreference() throws Exception {
        Utilisateur accepte = membreJoignable();
        Utilisateur refuse = membreJoignable();
        envoyer(put("/users/me/preferences"), refuse, Map.of("notificationsCourriel", false), 200);
        JsonNode evenement = creerEvenement(compte("RESPONSABLE_CLUB"), 10, true);

        inscrireEvenement(refuse, evenement.path("id").asLong(), 201);
        inscrireEvenement(accepte, evenement.path("id").asLong(), 201);

        JsonNode courriel = courrielRecu(accepte.getEmail(), "Inscription confirmée");
        assertThat(courriel.path("Text").asText())
                .contains(evenement.path("titre").asText())
                .contains("http://localhost:4200/evenements/" + evenement.path("slug").asText());
        assertThat(courrielsRecus(refuse.getEmail())).isEmpty();
        mvc.perform(en(get("/notifications"), refuse)).andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("Rappel : la veille d'une séance, chaque inscrit confirmé est prévenu une seule fois")
    void rappelDeSeance() throws Exception {
        Utilisateur formateur = compte("FORMATEUR");
        JsonNode formation = creerFormation(formateur, true);
        long seance = creerSeance(formateur, formation.path("id").asLong(), 1).path("id").asLong();
        Utilisateur inscrit = compte("MEMBRE");
        Utilisateur enAttente = compte("MEMBRE");
        inscrireSeance(inscrit, seance, 201);
        inscrireSeance(enAttente, seance, 201);
        envoyer(put("/notifications/lire-toutes"), inscrit, null, 204);

        rappels.envoyerLesRappels();
        mvc.perform(en(get("/notifications").param("type", "RAPPEL_SESSION"), inscrit)).andExpect(jsonPath("$.totalElements").value(0));

        jdbc.update("update session_formation set date_debut = now() + interval '20 hours', date_fin = now() + interval '22 hours' where id = ?", seance);
        rappels.envoyerLesRappels();
        rappels.envoyerLesRappels();

        mvc.perform(en(get("/notifications").param("type", "RAPPEL_SESSION"), inscrit))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].message", org.hamcrest.Matchers.containsString(formation.path("titre").asText())));
        mvc.perform(en(get("/notifications").param("type", "RAPPEL_SESSION"), enAttente)).andExpect(jsonPath("$.totalElements").value(0));
    }
}
