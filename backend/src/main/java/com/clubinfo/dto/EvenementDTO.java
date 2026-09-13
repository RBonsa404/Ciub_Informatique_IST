package com.clubinfo.dto;

import com.clubinfo.entity.StatutEvenement;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EvenementDTO {
    private Long id;

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    private String description;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDateTime dateDebut;

    private LocalDateTime dateFin;
    private String lieu;
    private Integer capaciteMax;
    private StatutEvenement statut;
    private String imageUrl;
    private Long organisateurId;
    private String organisateurNomComplet;
    private Long categorieId;
    private String categorieNom;
    private LocalDateTime dateCreation;
    private int nombreInscrits;
}
