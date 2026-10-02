package com.clubinfo.ist.contenu;

import com.clubinfo.ist.support.IntegrationTest;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Formulaire de contact : enregistrement, courriels, protection contre les envois automatiques, traitement par le club. */
class ContactIT extends IntegrationTest {

    /** Adresse du club dans le profil de test (app.contact.destinataire). */
    private static final String CLUB = "club@club.test";
    private static final AtomicInteger POSTES = new AtomicInteger();

    @Autowired
    private JdbcTemplate jdbc;

    private String poste;

    @BeforeEach
    void nouveauPoste() {
        poste = "10.30.0." + (POSTES.incrementAndGet() % 250 + 1);
    }

    private MockHttpServletRequestBuilder de(MockHttpServletRequestBuilder requete) {
        return requete.with(r -> {
            r.setRemoteAddr(poste);
            return r;
        });
    }

    private Map<String, Object> message(String email, String sujet) {
        Map<String, Object> corps = new HashMap<>();
        corps.put("nom", "Boukary Zongo");
        corps.put("email", email);
        corps.put("sujet", sujet);
        corps.put("message", "Bonjour, je souhaite rejoindre le club à la rentrée. Comment procéder ?");
        corps.put("siteWeb", "");
        corps.put("dureeSaisieMs", 12_000);
        return corps;
    }

    private int enregistres(String sujet) {
        return jdbc.queryForObject("select count(*) from message_contact where sujet = ?", Integer.class, sujet);
    }

    @Test
    @DisplayName("8.8.1 : le message est enregistré, le club est prévenu (réponse dirigée vers l'expéditeur) et l'expéditeur reçoit un accusé")
    void messageRecu() throws Exception {
        String expediteur = adresseRecevable();
        String sujet = "Adhésion " + System.nanoTime();
        mvc.perform(de(corps(post("/contact"), message(expediteur, sujet))))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        assertThat(enregistres(sujet)).isOne();
        JsonNode pourLeClub = courrielRecu(CLUB, sujet);
        assertThat(pourLeClub.path("ReplyTo").get(0).path("Address").asText()).isEqualTo(expediteur);
        assertThat(pourLeClub.path("Text").asText()).contains("Boukary Zongo").contains(expediteur).contains("rejoindre le club");
        JsonNode accuse = courrielRecu(expediteur, "bien reçu");
        assertThat(accuse.path("Text").asText()).contains(sujet).contains("rejoindre le club");
    }

    @Test
    @DisplayName("8.8.1 : champ piège rempli ou saisie trop rapide : réponse identique, rien d'enregistré, aucun courriel")
    void envoisAutomatiquesEcartes() throws Exception {
        String robot = adresseRecevable();
        String sujetPiege = "Piège " + System.nanoTime();
        Map<String, Object> piege = message(robot, sujetPiege);
        piege.put("siteWeb", "https://exemple.test/publicite");
        mvc.perform(de(corps(post("/contact"), piege))).andExpect(status().isNoContent());

        String sujetRapide = "Rapide " + System.nanoTime();
        Map<String, Object> rapide = message(robot, sujetRapide);
        rapide.put("dureeSaisieMs", 400);
        mvc.perform(de(corps(post("/contact"), rapide))).andExpect(status().isNoContent());

        String temoin = adresseRecevable();
        String sujetTemoin = "Témoin " + System.nanoTime();
        mvc.perform(de(corps(post("/contact"), message(temoin, sujetTemoin)))).andExpect(status().isNoContent());
        courrielRecu(temoin, "bien reçu");

        assertThat(enregistres(sujetPiege)).isZero();
        assertThat(enregistres(sujetRapide)).isZero();
        assertThat(enregistres(sujetTemoin)).isOne();
        assertThat(courrielsRecus(robot)).isEmpty();
    }

    @Test
    @DisplayName("Message incomplet ou mal formé : 400 avec le champ en cause")
    void validation() throws Exception {
        Map<String, Object> sansMessage = message(adresseRecevable(), "Sujet");
        sansMessage.put("message", "Trop");
        mvc.perform(de(corps(post("/contact"), sansMessage)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[*].field", hasItem("message")));
        mvc.perform(de(corps(post("/contact"), message("pas-une-adresse", "Sujet"))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[*].field", hasItem("email")));
        Map<String, Object> sansDuree = message(adresseRecevable(), "Sujet");
        sansDuree.remove("dureeSaisieMs");
        mvc.perform(de(corps(post("/contact"), sansDuree)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[*].field", hasItem("dureeSaisieMs")));
    }

    @Test
    @DisplayName("Un saut de ligne dans le sujet ne permet pas d'ajouter un destinataire")
    void sujetSansInjection() throws Exception {
        String expediteur = adresseRecevable();
        String marque = "Injection " + System.nanoTime();
        mvc.perform(de(corps(post("/contact"), message(expediteur, marque + "\r\nBcc: tiers@club.test")))).andExpect(status().isBadRequest());
        assertThat(courrielsRecus("tiers@club.test")).isEmpty();
    }

    @Test
    @DisplayName("Limitation de débit : au-delà de cinq messages par heure depuis une même adresse, 429")
    void limitationDeDebit() throws Exception {
        for (int i = 0; i < 5; i++) {
            mvc.perform(de(corps(post("/contact"), message(adresseRecevable(), "Série " + System.nanoTime())))).andExpect(status().isNoContent());
        }
        mvc.perform(de(corps(post("/contact"), message(adresseRecevable(), "De trop"))))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("DEBIT_DEPASSE"));
    }

    @Test
    @DisplayName("Traitement par le club : liste réservée, filtre par état, message marqué traité avec son auteur")
    void traitement() throws Exception {
        String sujet = "À traiter " + System.nanoTime();
        mvc.perform(de(corps(post("/contact"), message(adresseRecevable(), sujet)))).andExpect(status().isNoContent());
        long id = jdbc.queryForObject("select id from message_contact where sujet = ?", Long.class, sujet);

        mvc.perform(get("/gestion/messages")).andExpect(status().isUnauthorized());
        mvc.perform(en(get("/gestion/messages"), compte("MEMBRE"))).andExpect(status().isForbidden());
        mvc.perform(en(get("/gestion/messages"), compte("FORMATEUR"))).andExpect(status().isForbidden());
        mvc.perform(get("/contact/admin")).andExpect(status().is4xxClientError());

        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        mvc.perform(en(get("/gestion/messages").param("traite", "false").param("size", "200"), responsable))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].sujet", hasItem(sujet)))
                .andExpect(jsonPath("$.content[*].traite", everyItem(is(false))))
                .andExpect(jsonPath("$.totalElements").isNumber());

        mvc.perform(en(put("/gestion/messages/" + id + "/traite"), responsable))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.traite").value(true))
                .andExpect(jsonPath("$.dateReponse").isString())
                .andExpect(jsonPath("$.reponseParNom").value("Aminata Ouédraogo"))
                .andExpect(jsonPath("$.reponseParId").doesNotExist());
        mvc.perform(en(get("/gestion/messages").param("traite", "true").param("size", "200"), compte("ADMIN")))
                .andExpect(jsonPath("$.content[*].sujet", hasItem(sujet)));
        mvc.perform(en(put("/gestion/messages/999999999/traite"), responsable)).andExpect(status().isNotFound());
    }
}
