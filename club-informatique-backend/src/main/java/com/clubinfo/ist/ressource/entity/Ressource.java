package com.clubinfo.ist.ressource.entity;

import com.clubinfo.ist.categorie.entity.Categorie;
import com.clubinfo.ist.common.audit.BaseEntity;
import com.clubinfo.ist.formation.entity.Formation;
import com.clubinfo.ist.user.entity.Utilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

/**
 * Entité représentant une ressource pédagogique (PDF, support de cours, lien externe, vidéo).
 */
@Entity
@Table(name = "ressource", indexes = {
        @Index(name = "idx_ressource_publique", columnList = "est_publique"),
        @Index(name = "idx_ressource_type", columnList = "type"),
        @Index(name = "idx_ressource_formation", columnList = "formation_id"),
        @Index(name = "idx_ressource_deleted_at", columnList = "deleted_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ressource extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private TypeRessource type = TypeRessource.DOCUMENT_PDF;

    @Column(name = "url_fichier", nullable = false, length = 500)
    private String urlFichier;

    @Column(name = "est_publique", nullable = false)
    @Builder.Default
    private Boolean estPublique = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "formation_id")
    private Formation formation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categorie_id")
    private Categorie categorie;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auteur_id")
    private Utilisateur auteur;
}
