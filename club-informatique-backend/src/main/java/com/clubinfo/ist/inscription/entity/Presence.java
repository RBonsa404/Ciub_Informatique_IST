package com.clubinfo.ist.inscription.entity;

import com.clubinfo.ist.common.audit.BaseEntity;
import com.clubinfo.ist.formation.entity.SessionFormation;
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
 * Entité représentant le pointage de présence d'un inscrit à une session de formation.
 */
@Entity
@Table(name = "presence", indexes = {
        @Index(name = "idx_presence_inscription", columnList = "inscription_id"),
        @Index(name = "idx_presence_session", columnList = "session_formation_id"),
        @Index(name = "idx_presence_statut", columnList = "statut")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Presence extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inscription_id", nullable = false)
    private Inscription inscription;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_formation_id", nullable = false)
    private SessionFormation sessionFormation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StatutPresence statut = StatutPresence.PRESENT;

    @Column(name = "date_pointage")
    @Builder.Default
    private LocalDateTime datePointage = LocalDateTime.now();

    @Column(length = 500)
    private String remarque;
}
