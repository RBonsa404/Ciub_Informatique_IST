package com.clubinfo.ist.common;

import com.clubinfo.ist.common.courriel.Courriel;
import com.clubinfo.ist.common.courriel.CourrielService;
import com.clubinfo.ist.support.IntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/** Envoi réel par SMTP vers le serveur de capture. */
class CourrielIT extends IntegrationTest {

    @Autowired
    private CourrielService courriels;

    @Test
    @DisplayName("8.7.4 : un courriel part réellement par SMTP, avec l'expéditeur configuré et un texte en UTF-8")
    void envoiReel() {
        String destinataire = adresseRecevable();
        courriels.envoyer(new Courriel(destinataire, "Vérification d'adresse", "Bonjour Aminata,\n\nVoici le lien demandé : https://exemple.test/verifier?jeton=abc\n"));

        JsonNode recu = courrielRecu(destinataire);
        assertThat(recu.path("Subject").asText()).isEqualTo("Vérification d'adresse");
        assertThat(recu.path("From").path("Address").asText()).isEqualTo("ne-pas-repondre@club.test");
        assertThat(recu.path("From").path("Name").asText()).isEqualTo("Club Informatique de l'IST");
        assertThat(recu.path("Text").asText())
                .contains("Bonjour Aminata,")
                .contains("https://exemple.test/verifier?jeton=abc")
                .contains("Club Informatique de l'IST");
    }

    @Test
    @DisplayName("8.7.4 : l'envoi se fait hors du fil de la requête")
    void envoiAsynchrone() throws Exception {
        String filDEnvoi = courriels.envoyer(new Courriel(adresseRecevable(), "Essai", "Texte"))
                .thenApply(envoye -> Thread.currentThread().getName())
                .get(15, TimeUnit.SECONDS);

        assertThat(filDEnvoi).isNotEqualTo(Thread.currentThread().getName());
    }

    @Test
    @DisplayName("8.9.2 : aucun courriel n'est émis vers le domaine « .invalid » des comptes de test")
    void domaineInvalideIgnore() {
        String compteDeTest = "aminata.sawadogo-" + System.nanoTime() + "@recette.invalid";
        String temoin = adresseRecevable();
        courriels.envoyer(new Courriel(compteDeTest, "Essai", "Texte"));
        courriels.envoyer(new Courriel(temoin, "Témoin", "Texte"));

        courrielRecu(temoin);
        assertThat(courrielsRecus(compteDeTest)).isEmpty();
    }

    @Test
    @DisplayName("Un saut de ligne dans l'objet ne permet pas d'injecter un en-tête")
    void objetSurUneLigne() {
        String destinataire = adresseRecevable();
        courriels.envoyer(new Courriel(destinataire, "Message de contact\r\nBcc: tiers@club.test", "Texte"));

        JsonNode recu = courrielRecu(destinataire);
        assertThat(recu.path("Subject").asText()).isEqualTo("Message de contact Bcc: tiers@club.test");
        assertThat(recu.path("Bcc")).isEmpty();
        assertThat(courrielsRecus("tiers@club.test")).isEmpty();
    }
}
