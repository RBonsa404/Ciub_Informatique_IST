package com.clubinfo.dto;

import com.clubinfo.entity.Visibilite;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RessourceDTO {
    private Long id;

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    private String type;

    @NotBlank(message = "L'URL est obligatoire")
    private String url;

    private LocalDateTime dateAjout;
    private Visibilite visibilite;
    private Long formationId;
    private String formationTitre;
    private Long auteurId;
    private String auteurNomComplet;
    private Long categorieId;
    private String categorieNom;
}
