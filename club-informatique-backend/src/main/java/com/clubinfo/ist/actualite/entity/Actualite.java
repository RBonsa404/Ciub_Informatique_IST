package com.clubinfo.ist.actualite.entity;

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
 * Entité représentant un article d'actualité publié sur la plateforme.
 */
@Entity
@Table(name = "actualite", indexes = {
        @Index(name = "idx_actualite_slug", columnList = "slug", unique = true),
        @Index(name = "idx_actualite_publie", columnList = "publie"),
        @Index(name = "idx_actualite_date_pub", columnList = "date_publication"),
        @Index(name = "idx_actualite_deleted_at", columnList = "deleted_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Actualite extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(nullable = false, unique = true, length = 250)
    private String slug;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenu;

    @Column(length = 500)
    private String resume;

    @Column(length = 500)
    private String image;

    @Column(nullable = false)
    @Builder.Default
    private Boolean publie = false;

    @Column(name = "date_publication")
    private LocalDateTime datePublication;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auteur_id")
    private Utilisateur auteur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categorie_id")
    private Categorie categorie;
}
