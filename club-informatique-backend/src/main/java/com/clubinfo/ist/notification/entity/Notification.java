package com.clubinfo.ist.notification.entity;

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
 * Entité représentant une notification in-app envoyée à un utilisateur ou diffusée globalement.
 */
@Entity
@Table(name = "notification", indexes = {
        @Index(name = "idx_notification_destinataire", columnList = "destinataire_id"),
        @Index(name = "idx_notification_lue", columnList = "lue"),
        @Index(name = "idx_notification_type", columnList = "type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinataire_id")
    private Utilisateur destinataire;

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private TypeNotification type = TypeNotification.SYSTEME;

    @Column(length = 500)
    private String lien;

    @Column(nullable = false)
    @Builder.Default
    private Boolean lue = false;

    @Column(name = "date_lecture")
    private LocalDateTime dateLecture;
}
