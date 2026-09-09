package com.example.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Corps de requête pour la création (POST) d'un employé.
 * Le mot de passe transite ici en clair (via HTTPS en prod) et est haché
 * dans EmployeeService avant d'être persisté.
 */
@Data
public class EmployeeRequestDTO {

    @NotBlank(message = "Le prénom est obligatoire")
    private String firstName;

    @NotBlank(message = "Le nom est obligatoire")
    private String lastName;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Email doit être valide")
    private String mail;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String password;

      private String role;

}