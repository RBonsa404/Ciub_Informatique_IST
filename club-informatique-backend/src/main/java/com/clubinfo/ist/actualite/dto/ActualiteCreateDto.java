package com.clubinfo.ist.actualite.dto;

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
public class ActualiteCreateDto {

    @NotBlank(message = "Le titre est obligatoire")
    @Size(min = 3, max = 200, message = "Le titre doit comporter entre 3 et 200 caractères")
    private String titre;

    @NotBlank(message = "Le contenu est obligatoire")
    private String contenu;

    @Size(max = 500, message = "Le résumé ne peut pas dépasser 500 caractères")
    private String resume;

    @Size(max = 500)
    private String image;

    private Long categorieId;

    @Builder.Default
    private Boolean publie = false;
}
