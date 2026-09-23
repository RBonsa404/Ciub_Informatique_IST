package com.clubinfo.ist.inscription.dto;

import com.clubinfo.ist.inscription.entity.StatutInscription;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InscriptionStatutUpdateDto {

    @NotNull(message = "Le statut est obligatoire")
    private StatutInscription statut;

    private String motif;
}
