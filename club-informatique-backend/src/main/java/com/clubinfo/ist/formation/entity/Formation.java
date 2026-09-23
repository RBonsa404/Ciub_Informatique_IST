package com.clubinfo.ist.formation.entity;

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
 * Entité représentant une formation ou atelier technique (Web, IA, Cyber, Réseau).
 */
@Entity
@Table(name = "formation", indexes = {
        @Index(name = "idx_formation_slug", columnList = "slug", unique = true),
        @Index(name = "idx_formation_publie", columnList = "publie"),
        @Index(name = "idx_formation_niveau", columnList = "niveau"),
        @Index(name = "idx_formation_deleted_at", columnList = "deleted_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Formation extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(nullable = false, unique = true, length = 250)
    private String slug;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private NiveauFormation niveau = NiveauFormation.DEBUTANT;

    @Column(length = 500)
    private String prerequis;

    @Column(columnDefinition = "TEXT")
    private String objectifs;

    @Column(nullable = false)
    @Builder.Default
    private Boolean publie = false;

    @Column(length = 500)
    private String image;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "formateur_id")
    private Utilisateur formateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categorie_id")
    private Categorie categorie;

    @OneToMany(mappedBy = "formation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SessionFormation> sessions = new ArrayList<>();

    @OneToMany(mappedBy = "formation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Devoir> devoirs = new ArrayList<>();
}
