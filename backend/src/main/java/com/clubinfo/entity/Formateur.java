package com.clubinfo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Formateur ou responsable d'activité.
 * Peut créer des formations, publier des ressources/devoirs, prendre les présences.
 */
@Getter
@Setter
@Entity
@DiscriminatorValue("Formateur")
public class Formateur extends Utilisateur {

    @Column(length = 200)
    private String specialite;

    @Column(name = "biographie_professionnelle", columnDefinition = "TEXT")
    private String biographieProfessionnelle;

    @Column(length = 100)
    private String filiere;

    @OneToMany(mappedBy = "formateur", cascade = CascadeType.ALL)
    private List<Formation> formations = new ArrayList<>();

    @OneToMany(mappedBy = "encadrant")
    private List<Projet> projetsEncadres = new ArrayList<>();
}
