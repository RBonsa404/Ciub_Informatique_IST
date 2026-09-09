package com.example.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserStatusRequest {
    @NotBlank(message = "Le statut est obligatoire (ACTIF, INACTIF, SUSPENDU)")
    private String statut;
}
