package com.clubinfo.ist.formation.dto;

import com.clubinfo.ist.formation.entity.NiveauFormation;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormationUpdateDto {

    @Size(min = 3, max = 200)
    private String titre;

    private String description;

    private NiveauFormation niveau;

    @Size(max = 500)
    private String prerequis;

    private String objectifs;

    @Size(max = 500)
    private String image;

    private Long categorieId;

    private Boolean publie;
}
