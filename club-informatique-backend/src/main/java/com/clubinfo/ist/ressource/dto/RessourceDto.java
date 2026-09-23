package com.clubinfo.ist.ressource.dto;

import com.clubinfo.ist.ressource.entity.TypeRessource;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RessourceDto {

    private Long id;
    private String titre;
    private String description;
    private TypeRessource type;
    private String urlFichier;
    private Boolean estPublique;
    private Long formationId;
    private String formationTitre;
    private Long categorieId;
    private String categorieNom;
    private Long auteurId;
    private String auteurNom;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
