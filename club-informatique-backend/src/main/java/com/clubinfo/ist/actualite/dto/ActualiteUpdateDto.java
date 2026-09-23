package com.clubinfo.ist.actualite.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActualiteUpdateDto {

    @Size(min = 3, max = 200)
    private String titre;

    private String contenu;

    @Size(max = 500)
    private String resume;

    @Size(max = 500)
    private String image;

    private Long categorieId;

    private Boolean publie;
}
