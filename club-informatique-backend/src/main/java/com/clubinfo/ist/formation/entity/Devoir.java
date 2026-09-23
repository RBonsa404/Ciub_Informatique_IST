package com.clubinfo.ist.formation.entity;

import com.clubinfo.ist.common.audit.BaseEntity;
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
 * Entité représentant un devoir ou projet pratique donné par un formateur.
 */
@Entity
@Table(name = "devoir", indexes = {
        @Index(name = "idx_devoir_formation_id", columnList = "formation_id"),
        @Index(name = "idx_devoir_date_limite", columnList = "date_limite"),
        @Index(name = "idx_devoir_deleted_at", columnList = "deleted_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Devoir extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "formation_id", nullable = false)
    private Formation formation;

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "date_limite", nullable = false)
    private LocalDateTime dateLimite;

    @Column(name = "fichier_consigne", length = 500)
    private String fichierConsigne;
}
