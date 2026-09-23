package com.clubinfo.ist.categorie.dto;

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
public class CategorieRequestDto {

    @NotBlank(message = "Le nom de la catégorie est obligatoire")
    @Size(min = 2, max = 100, message = "Le nom doit comporter entre 2 et 100 caractères")
    private String nom;

    @Size(max = 500, message = "La description ne peut pas dépasser 500 caractères")
    private String description;

    @Size(max = 20, message = "La couleur ne peut pas dépasser 20 caractères")
    private String couleur;
}
