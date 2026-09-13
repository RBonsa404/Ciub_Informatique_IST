package com.clubinfo.dto;

import com.clubinfo.entity.StatutActualite;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ActualiteDTO {
    private Long id;

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    @NotBlank(message = "Le contenu est obligatoire")
    private String contenu;

    private String imageUrl;
    private LocalDateTime dateCreation;
    private LocalDateTime datePublication;
    private StatutActualite statut;
    private Long auteurId;
    private String auteurNomComplet;
    private Long categorieId;
    private String categorieNom;
}
