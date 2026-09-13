package com.clubinfo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Inscription d'un utilisateur à un événement ou une session de formation.
 * Contrainte : exactement l'un des deux champs (evenement ou session) doit être renseigné.
 */
@Getter
@Setter
@Entity
@Table(name = "inscriptions")
public class Inscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evenement_id")
    private Evenement evenement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private SessionFormation session;

    @Column(name = "date_inscription", nullable = false, updatable = false)
    private LocalDateTime dateInscription = LocalDateTime.now();

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private StatutInscription statut = StatutInscription.ACCEPTE;

    @OneToMany(mappedBy = "inscription", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Presence> presences = new ArrayList<>();

    /** Confirme l'inscription. */
    public void confirmer() {
        this.statut = StatutInscription.ACCEPTE;
    }

    /** Annule l'inscription. */
    public void annuler() {
        this.statut = StatutInscription.ANNULE;
    }
}
