package com.clubinfo.ist.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TotpVerifyRequest {

    @NotBlank(message = "Le code à 6 chiffres est obligatoire")
    @Pattern(regexp = "^\\d{6}$", message = "Le code doit comporter exactement 6 chiffres")
    private String code;
}
