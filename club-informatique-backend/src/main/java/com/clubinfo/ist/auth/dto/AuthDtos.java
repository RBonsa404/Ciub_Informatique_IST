package com.clubinfo.ist.auth.dto;

import com.clubinfo.ist.common.validation.MotDePasseConforme;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Corps des requêtes et des réponses de l'authentification, tels que le contrat les décrit. */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record InscriptionCompte(
            @NotBlank(message = "Le nom est obligatoire.") @Size(min = 2, max = 100, message = "Le nom doit compter de 2 à 100 caractères.") String nom,
            @NotBlank(message = "Le prénom est obligatoire.") @Size(min = 2, max = 100, message = "Le prénom doit compter de 2 à 100 caractères.") String prenom,
            @NotBlank(message = "L'adresse électronique est obligatoire.") @Email(message = "L'adresse électronique est mal formée.") @Size(max = 255) String email,
            @NotNull(message = "Le mot de passe est obligatoire.") @MotDePasseConforme String motDePasse,
            @NotBlank(message = "La filière est obligatoire.") @Size(max = 100, message = "La filière ne doit pas dépasser 100 caractères.") String filiere,
            @NotNull(message = "Le consentement est obligatoire.") @AssertTrue(message = "Le consentement est obligatoire.") Boolean consentement) {
    }

    public record Identifiants(
            @NotBlank(message = "L'adresse électronique est obligatoire.") @Email(message = "L'adresse électronique est mal formée.") String email,
            @NotBlank(message = "Le mot de passe est obligatoire.") String motDePasse,
            Boolean seSouvenir) {
    }

    public record JetonVerification(@NotBlank(message = "Le jeton est obligatoire.") String jeton) {
    }

    public record DemandeReinitialisation(
            @NotBlank(message = "L'adresse électronique est obligatoire.") @Email(message = "L'adresse électronique est mal formée.") String email) {
    }

    public record Reinitialisation(
            @NotBlank(message = "Le jeton est obligatoire.") String token,
            @NotNull(message = "Le mot de passe est obligatoire.") @MotDePasseConforme String nouveauMotDePasse) {
    }

    public record Message(String message) {
    }

    /** Le jeton de rafraîchissement n'apparaît jamais ici : il voyage dans un cookie HttpOnly. */
    public record Session(String accessToken, long expiresIn, UtilisateurCourant utilisateur) {
    }

    public record UtilisateurCourant(Long id, String email, String nom, String prenom, List<String> roles, boolean changementMotDePasseRequis) {
    }
}
