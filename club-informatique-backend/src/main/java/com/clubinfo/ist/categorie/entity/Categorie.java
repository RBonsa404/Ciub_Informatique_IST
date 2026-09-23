package com.clubinfo.ist.categorie.entity;

import com.clubinfo.ist.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entité représentant une catégorie pour les actualités, événements, formations et ressources.
 */
@Entity
@Table(name = "categorie", indexes = {
        @Index(name = "idx_categorie_nom", columnList = "nom", unique = true),
        @Index(name = "idx_categorie_slug", columnList = "slug", unique = true),
        @Index(name = "idx_categorie_deleted_at", columnList = "deleted_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Categorie extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String nom;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(length = 500)
    private String description;

    @Column(length = 20)
    private String couleur;
}
