package com.clubinfo.ist.projet.dto;

import com.clubinfo.ist.projet.entity.StatutProjet;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjetValidationDto {

    @NotNull(message = "Le statut est obligatoire (VALIDE ou REJETE)")
    private StatutProjet statut;

    private String motif;
}
