package com.clubinfo.dto;

import com.clubinfo.entity.StatutProjet;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProjetDTO {
    private Long id;

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    private String description;
    private LocalDateTime dateSoumission;
    private StatutProjet statut;
    private String lienDepot;
    private Long soumetteurId;
    private String soumetteurNomComplet;
    private Long encadrantId;
    private String encadrantNomComplet;
    private String imageUrl;
    private List<Long> membreIds;
}
