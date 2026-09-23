package com.clubinfo.ist.projet.entity;

import com.clubinfo.ist.common.audit.BaseEntity;
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

import java.time.LocalDateTime;

/**
 * Entité de liaison entre un projet et ses membres participants.
 */
@Entity
@Table(name = "projet_membre", indexes = {
        @Index(name = "idx_projet_membre_projet", columnList = "projet_id"),
        @Index(name = "idx_projet_membre_user", columnList = "utilisateur_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjetMembre extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "projet_id", nullable = false)
    private Projet projet;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private RoleProjetMembre role = RoleProjetMembre.CONTRIBUTEUR;

    @Column(name = "date_rejoint", nullable = false)
    @Builder.Default
    private LocalDateTime dateRejoint = LocalDateTime.now();
}
