package com.clubinfo.ist.inscription.dto;

import com.clubinfo.ist.inscription.entity.StatutPresence;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresenceDto {

    private Long id;
    private Long inscriptionId;
    private Long utilisateurId;
    private String utilisateurNom;
    private Long sessionId;
    private StatutPresence statut;
    private LocalDateTime datePointage;
    private String remarque;
}
