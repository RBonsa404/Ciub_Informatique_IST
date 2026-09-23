package com.clubinfo.ist.user.dto;

import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateDto {

    @Size(min = 2, max = 100, message = "Le nom doit comporter entre 2 et 100 caractères")
    private String nom;

    @Size(min = 2, max = 100, message = "Le prénom doit comporter entre 2 et 100 caractères")
    private String prenom;

    @Past(message = "La date de naissance doit être dans le passé")
    private LocalDate dateNaissance;

    @Size(max = 100)
    private String filiere;

    private Integer anneeEtude;

    @Size(max = 500)
    private String photo;

    @Size(max = 500)
    private String biographie;

    @Size(max = 200)
    private String specialite;

    @Size(max = 100)
    private String fonction;
}
