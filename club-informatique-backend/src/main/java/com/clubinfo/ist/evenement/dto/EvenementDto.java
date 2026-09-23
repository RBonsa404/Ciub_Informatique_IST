package com.clubinfo.ist.evenement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvenementDto {

    private Long id;
    private String titre;
    private String slug;
    private String description;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private String lieu;
    private Integer capaciteMax;
    private Long nombreInscrits;
    private Integer placesRestantes;
    private String image;
    private Boolean publie;
    private Long categorieId;
    private String categorieNom;
    private Long organisateurId;
    private String organisateurNom;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
