package com.clubinfo.dto;

import com.clubinfo.entity.StatutUtilisateur;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class UserDTO {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String dtype;
    private StatutUtilisateur statut;
    private String photo;
    private boolean consentementRgpd;
    private boolean totpEnabled;
    private LocalDateTime dateCreation;
    private LocalDateTime derniereConnexion;

    // Membre specific fields
    private String numeroMembre;
    private String biographie;
    private LocalDate dateAdhesion;
    private String filiere;
    private String anneeEtude;

    // Formateur specific fields
    private String specialite;
    private String biographieProfessionnelle;

    // ResponsableClub specific fields
    private String fonction;

    // Admin specific fields
    private String niveauAcces;

    private List<String> roles;
}
