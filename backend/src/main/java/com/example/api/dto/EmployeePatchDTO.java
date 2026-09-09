package com.example.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Corps de requête pour la mise à jour partielle (PATCH) d'un employé.
 * Tous les champs sont optionnels : seuls les champs non-nuls sont appliqués.
 */
@Data
public class EmployeePatchDTO {

    private String firstName;

    private String lastName;

    @Email(message = "Email doit être valide")
    private String mail;

    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String password;

    private String role;
}