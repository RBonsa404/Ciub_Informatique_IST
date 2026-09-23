package com.clubinfo.ist.formation.dto;

import com.clubinfo.ist.formation.entity.NiveauFormation;
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
public class FormationDto {

    private Long id;
    private String titre;
    private String slug;
    private String description;
    private NiveauFormation niveau;
    private String prerequis;
    private String objectifs;
    private Boolean publie;
    private String image;
    private Long formateurId;
    private String formateurNom;
    private Long categorieId;
    private String categorieNom;
    private List<SessionFormationDto> sessions;
    private List<DevoirDto> devoirs;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
