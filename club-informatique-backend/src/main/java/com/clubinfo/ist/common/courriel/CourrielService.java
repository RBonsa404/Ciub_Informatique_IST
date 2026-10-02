package com.clubinfo.ist.common.courriel;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.concurrent.CompletableFuture;

/**
 * Envoi des courriels par SMTP, hors du fil de la requête : une panne du serveur de messagerie
 * ne ralentit ni n'interrompt l'opération qui a demandé l'envoi. Le contenu n'est jamais journalisé.
 */
@Service
@Slf4j
public class CourrielService {

    /** Domaine réservé (RFC 2606) des comptes de test : rien ne doit lui être envoyé. */
    private static final String DOMAINE_SANS_ENVOI = ".invalid";

    private final ObjectProvider<JavaMailSender> expediteurSmtp;
    private final String adresseExpediteur;
    private final String nomExpediteur;
    private final String adresseDeContact;

    public CourrielService(ObjectProvider<JavaMailSender> expediteurSmtp,
                           @Value("${app.mail.from}") String adresseExpediteur,
                           @Value("${app.mail.from-name}") String nomExpediteur,
                           @Value("${app.mail.contact}") String adresseDeContact) {
        this.expediteurSmtp = expediteurSmtp;
        this.adresseExpediteur = adresseExpediteur;
        this.nomExpediteur = nomExpediteur;
        this.adresseDeContact = adresseDeContact;
    }

    /** @return vrai une fois le message remis au serveur SMTP ; faux s'il n'a pas été envoyé. */
    @Async
    public CompletableFuture<Boolean> envoyer(Courriel courriel) {
        if (courriel.destinataire().toLowerCase(Locale.ROOT).endsWith(DOMAINE_SANS_ENVOI)) {
            log.debug("Courriel non émis : destinataire sur un domaine réservé aux essais.");
            return CompletableFuture.completedFuture(false);
        }
        JavaMailSender smtp = expediteurSmtp.getIfAvailable();
        if (smtp == null) {
            log.warn("Courriel non émis : aucun serveur SMTP n'est configuré (MAIL_HOST).");
            return CompletableFuture.completedFuture(false);
        }
        try {
            MimeMessage message = smtp.createMimeMessage();
            MimeMessageHelper redaction = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            redaction.setFrom(new InternetAddress(adresseExpediteur, nomExpediteur, StandardCharsets.UTF_8.name()));
            redaction.setTo(courriel.destinataire());
            redaction.setSubject(courriel.objet());
            if (courriel.repondreA() != null) {
                redaction.setReplyTo(courriel.repondreA());
            }
            redaction.setText(courriel.texte().stripTrailing() + signature(), false);
            smtp.send(message);
            return CompletableFuture.completedFuture(true);
        } catch (Exception erreur) {
            log.error("Courriel non remis au serveur SMTP ({}) : {}", courriel.objet(), erreur.getMessage());
            return CompletableFuture.completedFuture(false);
        }
    }

    private String signature() {
        return "\n\n-- \n" + nomExpediteur + "\n" + adresseDeContact + "\n"
                + "Ce message est envoyé automatiquement, merci de ne pas y répondre.\n";
    }
}
