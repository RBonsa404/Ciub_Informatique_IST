package com.clubinfo.ist.admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Journal d'audit des actions sensibles et événements de sécurité (UC-27, UC-29).
 */
@Entity
@Table(name = "audit_log", indexes = {
        @Index(name = "idx_audit_log_date", columnList = "date_action"),
        @Index(name = "idx_audit_log_user", columnList = "utilisateur_email"),
        @Index(name = "idx_audit_log_action", columnList = "action")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "utilisateur_email", length = 255)
    private String utilisateurEmail;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "entite_concernee", length = 100)
    private String entiteConcernee;

    @Column(name = "entite_id")
    private Long entiteId;

    @Column(name = "date_action", nullable = false)
    @Builder.Default
    private LocalDateTime dateAction = LocalDateTime.now();

    @Column(length = 20)
    @Builder.Default
    private String statut = "SUCCES";
}
