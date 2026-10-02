package com.clubinfo.ist.user.dto;

import com.clubinfo.ist.common.validation.MotDePasseConforme;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import com.clubinfo.ist.user.entity.Utilisateur;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** Corps des requêtes et des réponses de l'espace « mon compte ». */
public final class CompteDtos {

    private CompteDtos() {
    }

    /** « photo » est l'adresse de téléchargement contrôlé de la photo de profil, ou null. */
    public record Profil(Long id, String nom, String prenom, String email, String filiere, String biographie,
                         String numeroMembre, LocalDate dateAdhesion, StatutUtilisateur statut, String photo) {

        public static Profil de(Utilisateur utilisateur) {
            return new Profil(utilisateur.getId(), utilisateur.getNom(), utilisateur.getPrenom(), utilisateur.getEmail(), utilisateur.getFiliere(),
                    utilisateur.getBiographie(), utilisateur.getNumeroMembre(), utilisateur.getDateAdhesion(), utilisateur.getStatut(),
                    utilisateur.getPhoto());
        }
    }

    /** Seuls ces champs sont modifiables par le titulaire ; la fonction au bureau relève du Responsable du Club. */
    public record ProfilMiseAJour(
            @NotBlank(message = "Le nom est obligatoire.") @Size(min = 2, max = 100, message = "Le nom doit compter de 2 à 100 caractères.") String nom,
            @NotBlank(message = "Le prénom est obligatoire.") @Size(min = 2, max = 100, message = "Le prénom doit compter de 2 à 100 caractères.") String prenom,
            @NotBlank(message = "La filière est obligatoire.") @Size(max = 100, message = "La filière ne doit pas dépasser 100 caractères.") String filiere,
            @Size(max = 500, message = "La biographie ne doit pas dépasser 500 caractères.") String biographie) {
    }

    public record ChangementMotDePasse(
            @NotBlank(message = "Le mot de passe actuel est obligatoire.") String ancienMotDePasse,
            @NotNull(message = "Le nouveau mot de passe est obligatoire.") @MotDePasseConforme String nouveauMotDePasse) {
    }

    public record Preferences(@NotNull(message = "La préférence est obligatoire.") Boolean notificationsCourriel) {
    }

    public record SuppressionCompte(@NotBlank(message = "Le mot de passe est obligatoire.") String motDePasse) {
    }
}
