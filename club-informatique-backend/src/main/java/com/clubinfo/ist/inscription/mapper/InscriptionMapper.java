package com.clubinfo.ist.inscription.mapper;

import com.clubinfo.ist.inscription.dto.InscriptionDto;
import com.clubinfo.ist.inscription.dto.PresenceDto;
import com.clubinfo.ist.inscription.entity.Inscription;
import com.clubinfo.ist.inscription.entity.Presence;
import org.springframework.stereotype.Component;

@Component
public class InscriptionMapper {

    public InscriptionDto toDto(Inscription inscription) {
        if (inscription == null) return null;

        String formationTitre = null;
        java.time.LocalDateTime dateDebut = null;
        java.time.LocalDateTime dateFin = null;

        if (inscription.getSessionFormation() != null) {
            if (inscription.getSessionFormation().getFormation() != null) {
                formationTitre = inscription.getSessionFormation().getFormation().getTitre();
            }
            dateDebut = inscription.getSessionFormation().getDateDebut();
            dateFin = inscription.getSessionFormation().getDateFin();
        } else if (inscription.getEvenement() != null) {
            dateDebut = inscription.getEvenement().getDateDebut();
            dateFin = inscription.getEvenement().getDateFin();
        }

        return InscriptionDto.builder()
                .id(inscription.getId())
                .utilisateurId(inscription.getUtilisateur() != null ? inscription.getUtilisateur().getId() : null)
                .utilisateurNom(inscription.getUtilisateur() != null ?
                        inscription.getUtilisateur().getPrenom() + " " + inscription.getUtilisateur().getNom() : null)
                .utilisateurEmail(inscription.getUtilisateur() != null ? inscription.getUtilisateur().getEmail() : null)
                .evenementId(inscription.getEvenement() != null ? inscription.getEvenement().getId() : null)
                .evenementTitre(inscription.getEvenement() != null ? inscription.getEvenement().getTitre() : null)
                .sessionFormationId(inscription.getSessionFormation() != null ? inscription.getSessionFormation().getId() : null)
                .formationTitre(formationTitre)
                .dateDebut(dateDebut)
                .dateFin(dateFin)
                .dateInscription(inscription.getDateInscription())
                .statut(inscription.getStatut())
                .motifAnnulation(inscription.getMotifAnnulation())
                .build();
    }

    public PresenceDto toPresenceDto(Presence presence) {
        if (presence == null) return null;

        String nom = null;
        Long userId = null;
        if (presence.getInscription() != null && presence.getInscription().getUtilisateur() != null) {
            userId = presence.getInscription().getUtilisateur().getId();
            nom = presence.getInscription().getUtilisateur().getPrenom() + " " + presence.getInscription().getUtilisateur().getNom();
        }

        return PresenceDto.builder()
                .id(presence.getId())
                .inscriptionId(presence.getInscription() != null ? presence.getInscription().getId() : null)
                .utilisateurId(userId)
                .utilisateurNom(nom)
                .sessionId(presence.getSessionFormation() != null ? presence.getSessionFormation().getId() : null)
                .statut(presence.getStatut())
                .datePointage(presence.getDatePointage())
                .remarque(presence.getRemarque())
                .build();
    }
}
