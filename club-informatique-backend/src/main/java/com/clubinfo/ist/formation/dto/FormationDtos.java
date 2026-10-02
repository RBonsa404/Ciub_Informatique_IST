package com.clubinfo.ist.formation.dto;

import com.clubinfo.ist.common.validation.AdresseWebSure;
import com.clubinfo.ist.formation.entity.Devoir;
import com.clubinfo.ist.formation.entity.Formation;
import com.clubinfo.ist.formation.entity.NiveauFormation;
import com.clubinfo.ist.formation.entity.SessionFormation;
import com.clubinfo.ist.formation.entity.StatutSession;
import com.clubinfo.ist.user.entity.Utilisateur;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

/** Corps des requêtes et des réponses des formations, de leurs séances et de leurs devoirs. */
public final class FormationDtos {

    private FormationDtos() {
    }

    /** Les devoirs n'en font pas partie : ils sont réservés aux inscrits et se lisent par leur propre point d'accès. */
    public record FormationDto(Long id, String titre, String slug, String description, NiveauFormation niveau, String prerequis,
                               String objectifs, boolean publie, Long formateurId, String formateurNom, Long categorieId,
                               String categorieNom, List<SeanceDto> sessions) {

        public static FormationDto de(Formation formation, List<SeanceDto> seances) {
            Utilisateur formateur = formation.getFormateur();
            boolean present = formateur != null && !formateur.isDeleted();
            return new FormationDto(formation.getId(), formation.getTitre(), formation.getSlug(), formation.getDescription(), formation.getNiveau(),
                    formation.getPrerequis(), formation.getObjectifs(), Boolean.TRUE.equals(formation.getPublie()),
                    present ? formateur.getId() : null, present ? formateur.getPrenom() + " " + formateur.getNom() : null,
                    formation.getCategorie() == null ? null : formation.getCategorie().getId(),
                    formation.getCategorie() == null ? null : formation.getCategorie().getNom(), seances);
        }
    }

    public record FormationSaisie(
            @NotBlank(message = "Le titre est obligatoire.") @Size(min = 3, max = 200, message = "Le titre doit compter de 3 à 200 caractères.") String titre,
            @NotBlank(message = "La description est obligatoire.") @Size(max = 20_000, message = "La description ne doit pas dépasser 20 000 caractères.") String description,
            @NotNull(message = "Le niveau est obligatoire.") NiveauFormation niveau,
            @Size(max = 500, message = "Les prérequis ne doivent pas dépasser 500 caractères.") String prerequis,
            @Size(max = 5000, message = "Les objectifs ne doivent pas dépasser 5 000 caractères.") String objectifs,
            Long categorieId,
            @NotNull(message = "L'état de publication est obligatoire.") Boolean publie) {
    }

    /** « lienVisio » n'est communiqué qu'aux comptes connectés. */
    public record SeanceDto(Long id, Long formationId, LocalDateTime dateDebut, LocalDateTime dateFin, String lieu, String lienVisio,
                            Integer capaciteMax, long nombreInscrits, Integer placesRestantes, StatutSession statut) {

        public static SeanceDto de(SessionFormation seance, long inscrits, boolean avecLien) {
            Integer capacite = seance.getCapaciteMax();
            return new SeanceDto(seance.getId(), seance.getFormation().getId(), seance.getDateDebut(), seance.getDateFin(), seance.getLieu(),
                    avecLien ? seance.getLienVisio() : null, capacite, inscrits,
                    capacite == null ? null : (int) Math.max(0, capacite - inscrits), seance.getStatut());
        }
    }

    public record SeanceSaisie(
            @NotNull(message = "La date de début est obligatoire.") LocalDateTime dateDebut,
            @NotNull(message = "La date de fin est obligatoire.") LocalDateTime dateFin,
            @NotBlank(message = "Le lieu est obligatoire.") @Size(max = 200, message = "Le lieu ne doit pas dépasser 200 caractères.") String lieu,
            @AdresseWebSure @Size(max = 500, message = "Le lien ne doit pas dépasser 500 caractères.") String lienVisio,
            @Positive(message = "La capacité doit être supérieure à zéro.") Integer capaciteMax,
            @NotNull(message = "Le statut est obligatoire.") StatutSession statut) {
    }

    public record DevoirDto(Long id, Long formationId, String formationTitre, String titre, String description, LocalDateTime dateLimite,
                            String fichierConsigne, LocalDateTime createdAt) {

        public static DevoirDto de(Devoir devoir) {
            return new DevoirDto(devoir.getId(), devoir.getFormation().getId(), devoir.getFormation().getTitre(), devoir.getTitre(),
                    devoir.getDescription(), devoir.getDateLimite(), devoir.getFichierConsigne(), devoir.getCreatedAt());
        }
    }

    public record DevoirSaisie(
            @NotBlank(message = "Le titre est obligatoire.") @Size(min = 3, max = 200, message = "Le titre doit compter de 3 à 200 caractères.") String titre,
            @NotBlank(message = "La consigne est obligatoire.") @Size(max = 20_000, message = "La consigne ne doit pas dépasser 20 000 caractères.") String description,
            @NotNull(message = "La date limite est obligatoire.") LocalDateTime dateLimite,
            @AdresseWebSure @Size(max = 500, message = "L'adresse du fichier ne doit pas dépasser 500 caractères.") String fichierConsigne) {
    }
}
