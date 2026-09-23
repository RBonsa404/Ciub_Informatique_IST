package com.clubinfo.ist.projet.entity;

import com.clubinfo.ist.categorie.entity.Categorie;
import com.clubinfo.ist.common.audit.BaseEntity;
import com.clubinfo.ist.user.entity.Utilisateur;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Entité représentant un projet collaboratif étudiant du club.
 */
@Entity
@Table(name = "projet", indexes = {
        @Index(name = "idx_projet_slug", columnList = "slug", unique = true),
        @Index(name = "idx_projet_statut", columnList = "statut"),
        @Index(name = "idx_projet_deleted_at", columnList = "deleted_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Projet extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(nullable = false, unique = true, length = 250)
    private String slug;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String objectifs;

    @Column(length = 500)
    private String technologies;

    @Column(name = "depot_git", length = 500)
    private String depotGit;

    @Column(name = "documentation_url", length = 500)
    private String documentationUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private StatutProjet statut = StatutProjet.PROPOSE;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "porteur_id", nullable = false)
    private Utilisateur porteur;

    @Column(name = "suivi_formateur", columnDefinition = "TEXT")
    private String suiviFormateur;

    @Column(name = "avancement_pourcentage")
    @Builder.Default
    private Integer avancementPourcentage = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categorie_id")
    private Categorie categorie;

    @OneToMany(mappedBy = "projet", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjetMembre> membres = new ArrayList<>();
}
