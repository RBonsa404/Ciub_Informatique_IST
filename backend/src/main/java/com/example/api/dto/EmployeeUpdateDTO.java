package com.example.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Corps de requête pour la mise à jour complète (PUT) d'un employé.
 * Le mot de passe est optionnel : s'il est absent, l'ancien mot de passe (haché) est conservé.
 */
@Data
public class EmployeeUpdateDTO {

    @NotBlank(message = "Le prénom est obligatoire")
    private String firstName;

    @NotBlank(message = "Le nom est obligatoire")
    private String lastName;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Email doit être valide")
    private String mail;

    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String password;

    private String role;
}