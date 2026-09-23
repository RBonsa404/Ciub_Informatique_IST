package com.clubinfo.ist.inscription.entity;

import com.clubinfo.ist.common.audit.BaseEntity;
import com.clubinfo.ist.evenement.entity.Evenement;
import com.clubinfo.ist.formation.entity.SessionFormation;
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
 * Entité représentant une inscription polymorphe (soit à un événement, soit à une session de formation).
 */
@Entity
@Table(name = "inscription", indexes = {
        @Index(name = "idx_inscription_utilisateur", columnList = "utilisateur_id"),
        @Index(name = "idx_inscription_evenement", columnList = "evenement_id"),
        @Index(name = "idx_inscription_session", columnList = "session_formation_id"),
        @Index(name = "idx_inscription_statut", columnList = "statut"),
        @Index(name = "idx_inscription_deleted_at", columnList = "deleted_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inscription extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evenement_id")
    private Evenement evenement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_formation_id")
    private SessionFormation sessionFormation;

    @Column(name = "date_inscription", nullable = false)
    @Builder.Default
    private LocalDateTime dateInscription = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private StatutInscription statut = StatutInscription.CONFIRMEE;

    @Column(name = "motif_annulation", length = 500)
    private String motifAnnulation;
}
