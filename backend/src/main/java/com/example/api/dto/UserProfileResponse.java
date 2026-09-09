package com.example.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {

    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String statut;
    private String photo;
    private LocalDateTime dateCreation;
    private List<String> roles;

    // Champs du profil membre
    private String numeroMembre;
    private LocalDate dateNaissance;
    private String filiere;
    private String anneeEtude;
    private LocalDate dateAdhesion;
    private String biographie;
}
