package com.clubinfo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Membre inscrit du club.
 * Peut s'inscrire aux événements, formations, soumettre des projets.
 */
@Getter
@Setter
@Entity
@DiscriminatorValue("Membre")
public class Membre extends Utilisateur {

    @Column(name = "numero_membre", unique = true, length = 50)
    private String numeroMembre;

    @Column(columnDefinition = "TEXT")
    private String biographie;

    @Column(name = "date_adhesion")
    private LocalDate dateAdhesion;

    @Column(length = 100)
    private String filiere;

    @Column(name = "annee_etude", length = 20)
    private String anneeEtude;

    @OneToMany(mappedBy = "utilisateur", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Inscription> inscriptions = new ArrayList<>();

    @OneToMany(mappedBy = "destinataire", cascade = CascadeType.ALL)
    private List<Notification> notifications = new ArrayList<>();

    @ManyToMany(mappedBy = "membres")
    private Set<Projet> projets = new HashSet<>();
}
