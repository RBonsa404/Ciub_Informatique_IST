package com.clubinfo.dto;

import com.clubinfo.entity.StatutFormation;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FormationDTO {
    private Long id;

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    private String description;
    private String niveau;
    private Integer duree;
    private StatutFormation statut;
    private String imageUrl;
    private Long formateurId;
    private String formateurNomComplet;
    private Long categorieId;
    private String categorieNom;
    private LocalDateTime dateCreation;
}
