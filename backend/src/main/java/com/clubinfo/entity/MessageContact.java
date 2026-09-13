package com.clubinfo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Message soumis via le formulaire de contact du site.
 */
@Getter
@Setter
@Entity
@Table(name = "messages_contact")
public class MessageContact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String nom;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false, length = 300)
    private String sujet;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "date_envoi", nullable = false)
    private LocalDateTime dateEnvoi = LocalDateTime.now();

    @Column(nullable = false)
    private boolean traite = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "traite_par")
    private Utilisateur traitePar;
}
