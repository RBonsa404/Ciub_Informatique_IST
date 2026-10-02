package com.clubinfo.ist.user.dto;

import com.clubinfo.ist.user.entity.Role;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import com.clubinfo.ist.user.entity.Utilisateur;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/** Corps des requêtes et des réponses de la gestion des comptes par l'administration. */
public final class GestionDesComptesDtos {

    private GestionDesComptesDtos() {
    }

    /**
     * Rôles de la plateforme, du moins au plus élevé. Le rang sert à la règle d'attribution :
     * nul n'accorde un rôle, ni ne touche à un compte, d'un rang supérieur au sien.
     */
    public enum RoleDuCompte {
        MEMBRE(1), FORMATEUR(2), RESPONSABLE_CLUB(3), DSI(3), ADMIN(4), SUPER_ADMIN(5);

        private final int rang;

        RoleDuCompte(int rang) {
            this.rang = rang;
        }

        public int rang() {
            return rang;
        }

        /** Nom du rôle tel qu'il est conservé en base. */
        public String nomTechnique() {
            return "ROLE_" + name();
        }

        public static Optional<RoleDuCompte> de(String nomTechnique) {
            return Arrays.stream(values()).filter(role -> role.nomTechnique().equals(nomTechnique)).findFirst();
        }

        /** Rang le plus élevé parmi des rôles ; zéro pour un compte sans rôle. */
        public static int rangLePlusEleve(Set<Role> roles) {
            return roles.stream().map(role -> de(role.getNom())).flatMap(Optional::stream).mapToInt(RoleDuCompte::rang).max().orElse(0);
        }
    }

    public record Compte(Long id, String nom, String prenom, String email, String filiere, StatutUtilisateur statut, List<String> roles,
                         boolean verrouille, LocalDateTime createdAt) {

        public static Compte de(Utilisateur utilisateur) {
            return new Compte(utilisateur.getId(), utilisateur.getNom(), utilisateur.getPrenom(), utilisateur.getEmail(), utilisateur.getFiliere(),
                    utilisateur.getStatut(), utilisateur.getRoles().stream().map(role -> role.getNom().replaceFirst("^ROLE_", "")).sorted().toList(),
                    utilisateur.estVerrouille(), utilisateur.getCreatedAt());
        }
    }

    public record CompteMiseAJour(
            @NotBlank(message = "Le nom est obligatoire.") @Size(min = 2, max = 100, message = "Le nom doit compter de 2 à 100 caractères.") String nom,
            @NotBlank(message = "Le prénom est obligatoire.") @Size(min = 2, max = 100, message = "Le prénom doit compter de 2 à 100 caractères.") String prenom,
            @Size(max = 100, message = "La filière ne doit pas dépasser 100 caractères.") String filiere) {
    }

    public record RolesSaisie(@NotEmpty(message = "Un compte porte au moins un rôle.") Set<RoleDuCompte> roles) {
    }

    public record StatutCompteSaisie(@NotNull(message = "Le statut est obligatoire.") StatutUtilisateur statut) {
    }

    public record Invitation(
            @NotBlank(message = "Le nom est obligatoire.") @Size(min = 2, max = 100, message = "Le nom doit compter de 2 à 100 caractères.") String nom,
            @NotBlank(message = "Le prénom est obligatoire.") @Size(min = 2, max = 100, message = "Le prénom doit compter de 2 à 100 caractères.") String prenom,
            @NotBlank(message = "L'adresse électronique est obligatoire.") @Email(message = "L'adresse électronique est mal formée.") @Size(max = 255) String email,
            @NotNull(message = "Le rôle est obligatoire.") RoleDuCompte role) {
    }

    public record DefinitionRole(String nom, String description, List<String> permissions) {
    }

    public record Permission(String nom, String description) {
    }
}
