package com.clubinfo.ist.user.entity;

import com.clubinfo.ist.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Entité unique pour tous les utilisateurs de la plateforme.
 * Les rôles (Membre, Formateur, ResponsableClub, Admin, SuperAdmin, DSI)
 * sont gérés via la relation ManyToMany avec Role.
 */
@Entity
@Table(name = "utilisateur", indexes = {
        @Index(name = "idx_utilisateur_email", columnList = "email", unique = true),
        @Index(name = "idx_utilisateur_statut", columnList = "statut"),
        @Index(name = "idx_utilisateur_deleted_at", columnList = "deleted_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Utilisateur extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 100)
    private String prenom;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "mot_de_passe", nullable = false)
    private String motDePasse;

    @Column(name = "date_naissance")
    private LocalDate dateNaissance;

    @Column(length = 100)
    private String filiere;

    @Column(name = "annee_etude")
    private Integer anneeEtude;

    @Column(length = 500)
    private String photo;

    @Column(length = 500)
    private String biographie;

    @Column(length = 200)
    private String specialite;

    @Column(length = 100)
    private String fonction;

    @Column(name = "numero_membre", unique = true, length = 20)
    private String numeroMembre;

    @Column(name = "date_adhesion")
    private LocalDate dateAdhesion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StatutUtilisateur statut = StatutUtilisateur.ACTIF;

    @Column(name = "tentatives_connexion")
    @Builder.Default
    private Integer tentativesConnexion = 0;

    @Column(name = "verrouille_jusqua")
    private LocalDateTime verrouilleJusqua;

    @Column(name = "totp_secret")
    private String totpSecret;

    @Column(name = "totp_active")
    @Builder.Default
    private Boolean totpActive = false;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "utilisateur_role",
            joinColumns = @JoinColumn(name = "utilisateur_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    /**
     * Incrémente le compteur de tentatives de connexion échouées.
     */
    public void incrementerTentativesConnexion() {
        this.tentativesConnexion = (this.tentativesConnexion == null ? 0 : this.tentativesConnexion) + 1;
    }

    /**
     * Réinitialise le compteur de tentatives de connexion.
     */
    public void reinitialiserTentativesConnexion() {
        this.tentativesConnexion = 0;
        this.verrouilleJusqua = null;
    }

    /**
     * Vérifie si le compte est actuellement verrouillé.
     */
    public boolean estVerrouille() {
        return this.verrouilleJusqua != null && LocalDateTime.now().isBefore(this.verrouilleJusqua);
    }

    /**
     * Vérifie si la 2FA est activée pour cet utilisateur.
     */
    public boolean est2faActive() {
        return Boolean.TRUE.equals(this.totpActive) && this.totpSecret != null;
    }
}
