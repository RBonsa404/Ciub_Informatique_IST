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
public class TwoFactorVerifyRequest {

    @NotBlank(message = "Le jeton temporaire ou email est obligatoire")
    private String tempToken;

    @NotBlank(message = "Le code OTP à 6 chiffres est obligatoire")
    private String code;
}
