package com.clubinfo.ist.contact.dto;

import com.clubinfo.ist.contact.entity.MessageContact;
import com.clubinfo.ist.user.entity.Utilisateur;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/** Corps des requêtes et des réponses du formulaire de contact. */
public final class ContactDtos {

    private static final String SUR_UNE_LIGNE = "[^\\r\\n]*";

    private ContactDtos() {
    }

    /**
     * « siteWeb » est un champ piège, invisible pour un humain et donc toujours vide ; « dureeSaisieMs » est le temps
     * passé sur le formulaire. Les deux servent à écarter les envois automatiques.
     */
    public record MessageContactSaisie(
            @NotBlank(message = "Votre nom est obligatoire.") @Size(min = 2, max = 100, message = "Le nom doit compter de 2 à 100 caractères.")
            @Pattern(regexp = SUR_UNE_LIGNE, message = "Le nom doit tenir sur une ligne.") String nom,
            @NotBlank(message = "Votre adresse électronique est obligatoire.") @Email(message = "L'adresse électronique est mal formée.")
            @Size(max = 255) String email,
            @NotBlank(message = "Le sujet est obligatoire.") @Size(min = 3, max = 200, message = "Le sujet doit compter de 3 à 200 caractères.")
            @Pattern(regexp = SUR_UNE_LIGNE, message = "Le sujet doit tenir sur une ligne.") String sujet,
            @NotBlank(message = "Le message est obligatoire.") @Size(min = 10, max = 5000, message = "Le message doit compter de 10 à 5 000 caractères.") String message,
            @Size(max = 500) String siteWeb,
            @NotNull(message = "La durée de saisie est obligatoire.") @PositiveOrZero(message = "La durée de saisie est invalide.") Long dureeSaisieMs) {
    }

    public record MessageContactDto(Long id, String nom, String email, String sujet, String message, boolean traite,
                                    LocalDateTime dateReponse, String reponseParNom, LocalDateTime createdAt) {

        public static MessageContactDto de(MessageContact message) {
            Utilisateur auteur = message.getReponsePar();
            return new MessageContactDto(message.getId(), message.getNom(), message.getEmail(), message.getSujet(), message.getMessage(),
                    Boolean.TRUE.equals(message.getTraite()), message.getDateReponse(),
                    auteur == null || auteur.isDeleted() ? null : auteur.getPrenom() + " " + auteur.getNom(), message.getCreatedAt());
        }
    }
}
