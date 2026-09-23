package com.clubinfo.ist.actualite.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActualiteDto {

    private Long id;
    private String titre;
    private String slug;
    private String contenu;
    private String resume;
    private String image;
    private Boolean publie;
    private LocalDateTime datePublication;
    private Long auteurId;
    private String auteurNom;
    private Long categorieId;
    private String categorieNom;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
