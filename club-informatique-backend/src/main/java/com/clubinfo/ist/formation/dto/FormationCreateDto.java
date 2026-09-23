package com.clubinfo.ist.formation.dto;

import com.clubinfo.ist.formation.entity.NiveauFormation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormationCreateDto {

    @NotBlank(message = "Le titre est obligatoire")
    @Size(min = 3, max = 200)
    private String titre;

    @NotBlank(message = "La description est obligatoire")
    private String description;

    @NotNull(message = "Le niveau est obligatoire")
    @Builder.Default
    private NiveauFormation niveau = NiveauFormation.DEBUTANT;

    @Size(max = 500)
    private String prerequis;

    private String objectifs;

    @Size(max = 500)
    private String image;

    private Long categorieId;

    @Builder.Default
    private Boolean publie = false;
}
