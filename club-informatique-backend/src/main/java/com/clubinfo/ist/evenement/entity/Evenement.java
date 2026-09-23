package com.clubinfo.ist.evenement.entity;

import com.clubinfo.ist.categorie.entity.Categorie;
import com.clubinfo.ist.common.audit.BaseEntity;
import com.clubinfo.ist.user.entity.Utilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entité représentant un événement du club (conférence, hackathon, meetup, atelier).
 */
@Entity
@Table(name = "evenement", indexes = {
        @Index(name = "idx_evenement_slug", columnList = "slug", unique = true),
        @Index(name = "idx_evenement_date_debut", columnList = "date_debut"),
        @Index(name = "idx_evenement_publie", columnList = "publie"),
        @Index(name = "idx_evenement_deleted_at", columnList = "deleted_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Evenement extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(nullable = false, unique = true, length = 250)
    private String slug;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "date_debut", nullable = false)
    private LocalDateTime dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDateTime dateFin;

    @Column(nullable = false, length = 200)
    private String lieu;

    @Column(name = "capacite_max")
    private Integer capaciteMax;

    @Column(length = 500)
    private String image;

    @Column(nullable = false)
    @Builder.Default
    private Boolean publie = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categorie_id")
    private Categorie categorie;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organisateur_id")
    private Utilisateur organisateur;
}
