package com.clubinfo.ist.projet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjetCreateDto {

    @NotBlank(message = "Le titre du projet est obligatoire")
    @Size(min = 3, max = 200)
    private String titre;

    @NotBlank(message = "La description du projet est obligatoire")
    private String description;

    private String objectifs;

    @Size(max = 500)
    private String technologies;

    @Size(max = 500)
    private String depotGit;

    @Size(max = 500)
    private String documentationUrl;

    private Long categorieId;
}
