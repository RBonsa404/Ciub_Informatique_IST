package com.clubinfo.ist.user.dto;

import com.clubinfo.ist.user.entity.StatutUtilisateur;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCreateDto {

    @NotBlank(message = "Le nom est obligatoire")
    @Size(min = 2, max = 100)
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    @Size(min = 2, max = 100)
    private String prenom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe temporaire est obligatoire")
    @Size(min = 8)
    private String motDePasse;

    @Past
    private LocalDate dateNaissance;

    private String filiere;
    private Integer anneeEtude;
    private String specialite;
    private String fonction;

    @Builder.Default
    private StatutUtilisateur statut = StatutUtilisateur.ACTIF;

    @NotEmpty(message = "Au moins un rôle doit être attribué")
    private Set<String> roles;
}
