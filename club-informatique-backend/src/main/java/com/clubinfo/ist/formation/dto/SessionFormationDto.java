package com.clubinfo.ist.formation.dto;

import com.clubinfo.ist.formation.entity.StatutSession;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionFormationDto {

    private Long id;
    private Long formationId;
    private String formationTitre;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private String lieu;
    private String lienVisio;
    private Integer capaciteMax;
    private Long nombreInscrits;
    private Integer placesRestantes;
    private StatutSession statut;
    private LocalDateTime createdAt;
}
