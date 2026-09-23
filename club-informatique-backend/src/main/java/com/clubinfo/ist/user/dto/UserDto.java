package com.clubinfo.ist.user.dto;

import com.clubinfo.ist.user.entity.StatutUtilisateur;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private LocalDate dateNaissance;
    private String filiere;
    private Integer anneeEtude;
    private String photo;
    private String biographie;
    private String specialite;
    private String fonction;
    private String numeroMembre;
    private LocalDate dateAdhesion;
    private StatutUtilisateur statut;
    private Boolean totpActive;
    private Set<String> roles;
    private Set<String> permissions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
