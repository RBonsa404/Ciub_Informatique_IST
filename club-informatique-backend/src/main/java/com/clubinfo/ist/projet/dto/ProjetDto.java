package com.clubinfo.ist.projet.dto;

import com.clubinfo.ist.projet.entity.StatutProjet;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjetDto {

    private Long id;
    private String titre;
    private String slug;
    private String description;
    private String objectifs;
    private String technologies;
    private String depotGit;
    private String documentationUrl;
    private StatutProjet statut;
    private Long porteurId;
    private String porteurNom;
    private String suiviFormateur;
    private Integer avancementPourcentage;
    private Long categorieId;
    private String categorieNom;
    private List<ProjetMembreDto> membres;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
