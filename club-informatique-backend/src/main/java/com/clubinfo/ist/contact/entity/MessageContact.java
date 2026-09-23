package com.clubinfo.ist.contact.entity;

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

import java.time.LocalDateTime;

/**
 * Entité représentant un message envoyé via le formulaire public de contact.
 */
@Entity
@Table(name = "message_contact", indexes = {
        @Index(name = "idx_contact_traite", columnList = "traite"),
        @Index(name = "idx_contact_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageContact extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(nullable = false, length = 200)
    private String sujet;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    @Builder.Default
    private Boolean traite = false;

    @Column(name = "date_reponse")
    private LocalDateTime dateReponse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reponse_par_id")
    private Utilisateur reponsePar;
}
