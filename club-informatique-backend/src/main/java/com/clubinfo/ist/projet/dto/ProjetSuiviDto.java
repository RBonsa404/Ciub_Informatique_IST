package com.clubinfo.ist.projet.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjetSuiviDto {

    private String suiviFormateur;

    @Min(value = 0, message = "L'avancement ne peut pas être inférieur à 0%")
    @Max(value = 100, message = "L'avancement ne peut pas dépasser 100%")
    private Integer avancementPourcentage;
}
