package com.clubinfo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/** Projet du club soumis par un membre et encadré par un formateur. */
@Getter
@Setter
@Entity
@Table(name = "projets")
public class Projet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 300)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "date_soumission", nullable = false, updatable = false)
    private LocalDateTime dateSoumission = LocalDateTime.now();

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private StatutProjet statut = StatutProjet.EN_ATTENTE;

    @Column(name = "lien_depot", length = 500)
    private String lienDepot;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "soumetteur_id")
    private Utilisateur soumetteur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "encadrant_id")
    private Utilisateur encadrant;

    @ManyToMany
    @JoinTable(
        name = "projets_membres",
        joinColumns = @JoinColumn(name = "projet_id"),
        inverseJoinColumns = @JoinColumn(name = "utilisateur_id")
    )
    private Set<Utilisateur> membres = new HashSet<>();
}
