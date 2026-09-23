package com.clubinfo.ist.ressource.dto;

import com.clubinfo.ist.ressource.entity.TypeRessource;
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
public class RessourceCreateDto {

    @NotBlank(message = "Le titre est obligatoire")
    @Size(min = 3, max = 200)
    private String titre;

    private String description;

    @NotNull(message = "Le type de ressource est obligatoire")
    @Builder.Default
    private TypeRessource type = TypeRessource.DOCUMENT_PDF;

    @NotBlank(message = "L'URL ou le chemin du fichier est obligatoire")
    @Size(max = 500)
    private String urlFichier;

    @Builder.Default
    private Boolean estPublique = true;

    private Long formationId;
    private Long categorieId;
}
