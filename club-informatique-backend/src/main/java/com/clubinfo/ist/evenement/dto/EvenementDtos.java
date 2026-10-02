package com.clubinfo.ist.evenement.dto;

import com.clubinfo.ist.evenement.entity.Evenement;
import com.clubinfo.ist.user.entity.Utilisateur;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/** Corps des requêtes et des réponses des événements. */
public final class EvenementDtos {

    private EvenementDtos() {
    }

    /** « nombreInscrits » compte les inscriptions confirmées ; « placesRestantes » est absent si la capacité est illimitée. */
    public record EvenementDto(Long id, String titre, String slug, String description, LocalDateTime dateDebut, LocalDateTime dateFin,
                               String lieu, Integer capaciteMax, long nombreInscrits, Integer placesRestantes, boolean publie,
                               Long categorieId, String categorieNom, String organisateurNom) {

        public static EvenementDto de(Evenement evenement, long inscrits) {
            Utilisateur organisateur = evenement.getOrganisateur();
            Integer capacite = evenement.getCapaciteMax();
            return new EvenementDto(evenement.getId(), evenement.getTitre(), evenement.getSlug(), evenement.getDescription(),
                    evenement.getDateDebut(), evenement.getDateFin(), evenement.getLieu(), capacite, inscrits,
                    capacite == null ? null : (int) Math.max(0, capacite - inscrits), Boolean.TRUE.equals(evenement.getPublie()),
                    evenement.getCategorie() == null ? null : evenement.getCategorie().getId(),
                    evenement.getCategorie() == null ? null : evenement.getCategorie().getNom(),
                    organisateur == null || organisateur.isDeleted() ? null : organisateur.getPrenom() + " " + organisateur.getNom());
        }
    }

    public record EvenementSaisie(
            @NotBlank(message = "Le titre est obligatoire.") @Size(min = 3, max = 200, message = "Le titre doit compter de 3 à 200 caractères.") String titre,
            @NotBlank(message = "La description est obligatoire.") @Size(max = 20_000, message = "La description ne doit pas dépasser 20 000 caractères.") String description,
            @NotNull(message = "La date de début est obligatoire.") LocalDateTime dateDebut,
            @NotNull(message = "La date de fin est obligatoire.") LocalDateTime dateFin,
            @NotBlank(message = "Le lieu est obligatoire.") @Size(max = 200, message = "Le lieu ne doit pas dépasser 200 caractères.") String lieu,
            @Positive(message = "La capacité doit être supérieure à zéro.") Integer capaciteMax,
            Long categorieId,
            @NotNull(message = "L'état de publication est obligatoire.") Boolean publie) {
    }
}
