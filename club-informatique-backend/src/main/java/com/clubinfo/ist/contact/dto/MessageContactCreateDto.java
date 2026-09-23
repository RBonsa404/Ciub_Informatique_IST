package com.clubinfo.ist.contact.dto;

import jakarta.validation.constraints.Email;
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
public class MessageContactCreateDto {

    @NotBlank(message = "Votre nom est obligatoire")
    @Size(min = 2, max = 100)
    private String nom;

    @NotBlank(message = "Votre email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le sujet est obligatoire")
    @Size(min = 3, max = 200)
    private String sujet;

    @NotBlank(message = "Le message est obligatoire")
    @Size(min = 10, message = "Le message doit comporter au moins 10 caractères")
    private String message;
}
