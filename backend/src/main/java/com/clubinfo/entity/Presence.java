package com.clubinfo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Registre de présence d'un membre à une session de formation.
 */
@Getter
@Setter
@Entity
@Table(name = "presences")
public class Presence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inscription_id", nullable = false)
    private Inscription inscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private SessionFormation session;

    @Column(name = "date_presence", nullable = false)
    private LocalDateTime datePresence = LocalDateTime.now();

    @Column(nullable = false)
    private boolean present = false;
}
