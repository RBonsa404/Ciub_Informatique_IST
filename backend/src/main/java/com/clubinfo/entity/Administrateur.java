package com.clubinfo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Administrateur du système.
 * Accès complet + 2FA obligatoire.
 */
@Getter
@Setter
@Entity
@DiscriminatorValue("Administrateur")
public class Administrateur extends Utilisateur {

    @Column(name = "niveau_acces", length = 50)
    private String niveauAcces;
}
