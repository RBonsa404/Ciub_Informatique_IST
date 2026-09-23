package com.clubinfo.ist.formation.entity;

import com.clubinfo.ist.common.audit.BaseEntity;
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
 * Entité représentant une session planifiée d'une formation.
 */
@Entity
@Table(name = "session_formation", indexes = {
        @Index(name = "idx_session_formation_id", columnList = "formation_id"),
        @Index(name = "idx_session_date_debut", columnList = "date_debut"),
        @Index(name = "idx_session_statut", columnList = "statut"),
        @Index(name = "idx_session_deleted_at", columnList = "deleted_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionFormation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "formation_id", nullable = false)
    private Formation formation;

    @Column(name = "date_debut", nullable = false)
    private LocalDateTime dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDateTime dateFin;

    @Column(length = 200)
    private String lieu;

    @Column(name = "lien_visio", length = 500)
    private String lienVisio;

    @Column(name = "capacite_max")
    private Integer capaciteMax;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private StatutSession statut = StatutSession.PLANIFIEE;
}
