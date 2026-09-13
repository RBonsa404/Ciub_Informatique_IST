package com.clubinfo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Session planifiée d'une formation (date/lieu spécifique).
 * Composant de Formation.
 */
@Getter
@Setter
@Entity
@Table(name = "sessions_formation")
public class SessionFormation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "formation_id", nullable = false)
    private Formation formation;

    @Column(name = "date_debut", nullable = false)
    private LocalDateTime dateDebut;

    @Column(name = "date_fin")
    private LocalDateTime dateFin;

    @Column(length = 300)
    private String lieu;

    @Column(name = "capacite_max")
    private Integer capaciteMax;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private StatutSession statut = StatutSession.PLANIFIEE;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL)
    private List<Inscription> inscriptions = new ArrayList<>();

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL)
    private List<Presence> presences = new ArrayList<>();
}
