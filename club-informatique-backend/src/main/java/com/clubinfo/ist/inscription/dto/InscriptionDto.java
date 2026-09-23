package com.clubinfo.ist.inscription.dto;

import com.clubinfo.ist.inscription.entity.StatutInscription;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InscriptionDto {

    private Long id;
    private Long utilisateurId;
    private String utilisateurNom;
    private String utilisateurEmail;
    private Long evenementId;
    private String evenementTitre;
    private Long sessionFormationId;
    private String formationTitre;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private LocalDateTime dateInscription;
    private StatutInscription statut;
    private String motifAnnulation;
}
