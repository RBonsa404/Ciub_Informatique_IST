package com.clubinfo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/** Devoir associé à une formation. */
@Getter
@Setter
@Entity
@Table(name = "devoirs")
public class Devoir {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "formation_id", nullable = false)
    private Formation formation;

    @Column(nullable = false, length = 300)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "date_limite")
    private LocalDateTime dateLimite;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private StatutDevoir statut = StatutDevoir.PUBLIE;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
}
