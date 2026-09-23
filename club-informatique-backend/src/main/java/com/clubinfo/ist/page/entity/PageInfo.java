package com.clubinfo.ist.page.entity;

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

/**
 * Entité représentant le contenu dynamique des pages informatives du club (accueil, présentation, bureau).
 */
@Entity
@Table(name = "page_info", indexes = {
        @Index(name = "idx_page_slug", columnList = "slug", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageInfo extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modifie_par_id")
    private Utilisateur modifiePar;
}
