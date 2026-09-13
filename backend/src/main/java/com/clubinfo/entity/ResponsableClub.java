package com.clubinfo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Responsable du club — membre du bureau.
 * Peut créer/modifier/supprimer actualités, événements, projets.
 */
@Getter
@Setter
@Entity
@DiscriminatorValue("ResponsableClub")
public class ResponsableClub extends Utilisateur {

    @Column(length = 100)
    private String fonction;

    @Column(name = "numero_membre", length = 50)
    private String numeroMembre;

    @OneToMany(mappedBy = "auteur")
    private List<Actualite> actualites = new ArrayList<>();

    @OneToMany(mappedBy = "organisateur")
    private List<Evenement> evenements = new ArrayList<>();
}
