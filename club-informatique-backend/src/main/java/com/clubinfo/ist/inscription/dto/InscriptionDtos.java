package com.clubinfo.ist.inscription.dto;

import com.clubinfo.ist.evenement.entity.Evenement;
import com.clubinfo.ist.formation.entity.Formation;
import com.clubinfo.ist.formation.entity.SessionFormation;
import com.clubinfo.ist.inscription.entity.Inscription;
import com.clubinfo.ist.inscription.entity.Presence;
import com.clubinfo.ist.inscription.entity.StatutInscription;
import com.clubinfo.ist.inscription.entity.StatutPresence;
import com.clubinfo.ist.user.entity.Utilisateur;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

/** Corps des requêtes et des réponses des inscriptions et de l'émargement. */
public final class InscriptionDtos {

    private InscriptionDtos() {
    }

    /** Les champs « utilisateur… » ne sont renseignés que dans les listes de gestion. */
    public record InscriptionDto(Long id, Long evenementId, String evenementTitre, String evenementSlug, Long sessionFormationId,
                                 Long formationId, String formationSlug, String formationTitre, String lieu, LocalDateTime dateDebut,
                                 LocalDateTime dateFin, LocalDateTime dateInscription, StatutInscription statut, String motifAnnulation,
                                 Long utilisateurId, String utilisateurNom, String utilisateurEmail, String utilisateurFiliere) {

        /** Vue du membre sur sa propre inscription. */
        public static InscriptionDto pourLeMembre(Inscription inscription) {
            return de(inscription, false);
        }

        /** Vue de la gestion, avec l'identité de l'inscrit. */
        public static InscriptionDto pourLaGestion(Inscription inscription) {
            return de(inscription, true);
        }

        private static InscriptionDto de(Inscription inscription, boolean avecInscrit) {
            Evenement evenement = inscription.getEvenement();
            SessionFormation seance = inscription.getSessionFormation();
            Formation formation = seance == null ? null : seance.getFormation();
            Utilisateur inscrit = avecInscrit ? inscription.getUtilisateur() : null;
            return new InscriptionDto(inscription.getId(),
                    evenement == null ? null : evenement.getId(),
                    evenement == null ? null : evenement.getTitre(),
                    evenement == null ? null : evenement.getSlug(),
                    seance == null ? null : seance.getId(),
                    formation == null ? null : formation.getId(),
                    formation == null ? null : formation.getSlug(),
                    formation == null ? null : formation.getTitre(),
                    evenement != null ? evenement.getLieu() : seance == null ? null : seance.getLieu(),
                    evenement != null ? evenement.getDateDebut() : seance == null ? null : seance.getDateDebut(),
                    evenement != null ? evenement.getDateFin() : seance == null ? null : seance.getDateFin(),
                    inscription.getDateInscription(), inscription.getStatut(), inscription.getMotifAnnulation(),
                    inscrit == null ? null : inscrit.getId(),
                    inscrit == null ? null : inscrit.getPrenom() + " " + inscrit.getNom(),
                    inscrit == null ? null : inscrit.getEmail(),
                    inscrit == null ? null : inscrit.getFiliere());
        }
    }

    public record StatutInscriptionSaisie(
            @NotNull(message = "Le statut est obligatoire.") StatutInscription statut,
            @Size(max = 500, message = "Le motif ne doit pas dépasser 500 caractères.") String motif) {
    }

    public record PresenceDto(Long id, Long inscriptionId, String utilisateurNom, Long sessionId, StatutPresence statut,
                              LocalDateTime datePointage, String remarque) {

        public static PresenceDto de(Presence presence) {
            Utilisateur inscrit = presence.getInscription().getUtilisateur();
            return new PresenceDto(presence.getId(), presence.getInscription().getId(), inscrit.getPrenom() + " " + inscrit.getNom(),
                    presence.getSessionFormation().getId(), presence.getStatut(), presence.getDatePointage(), presence.getRemarque());
        }
    }

    public record Pointages(@NotEmpty(message = "La liste des pointages est vide.") @Valid List<Pointage> presences) {
    }

    public record Pointage(
            @NotNull(message = "L'inscription est obligatoire.") Long inscriptionId,
            @NotNull(message = "Le statut de présence est obligatoire.") StatutPresence statut,
            @Size(max = 500, message = "La remarque ne doit pas dépasser 500 caractères.") String remarque) {
    }
}
