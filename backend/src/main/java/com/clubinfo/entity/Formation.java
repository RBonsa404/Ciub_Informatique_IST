package com.clubinfo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Formation ou atelier organisé par un Formateur.
 * Composition : contient des SessionFormation, Devoir, Ressource.
 */
@Getter
@Setter
@Entity
@Table(name = "formations")
public class Formation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 300)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String niveau;

    /** Durée en heures. */
    private Integer duree;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private StatutFormation statut = StatutFormation.BROUILLON;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "formateur_id", nullable = false)
    private Utilisateur formateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categorie_id")
    private Categorie categorie;

    /** Composition : les sessions appartiennent à la formation. */
    @OneToMany(mappedBy = "formation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SessionFormation> sessions = new ArrayList<>();

    /** Composition : les ressources liées à la formation. */
    @OneToMany(mappedBy = "formation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Ressource> ressources = new ArrayList<>();

    /** Composition : les devoirs de la formation. */
    @OneToMany(mappedBy = "formation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Devoir> devoirs = new ArrayList<>();
}
