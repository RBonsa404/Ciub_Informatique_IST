package com.clubinfo.ist.evenement.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvenementCreateDto {

    @NotBlank(message = "Le titre est obligatoire")
    @Size(min = 3, max = 200)
    private String titre;

    @NotBlank(message = "La description est obligatoire")
    private String description;

    @NotNull(message = "La date de début est obligatoire")
    @Future(message = "La date de début doit être dans le futur")
    private LocalDateTime dateDebut;

    @NotNull(message = "La date de fin est obligatoire")
    @Future(message = "La date de fin doit être dans le futur")
    private LocalDateTime dateFin;

    @NotBlank(message = "Le lieu est obligatoire")
    @Size(max = 200)
    private String lieu;

    @Positive(message = "La capacité doit être positive")
    private Integer capaciteMax;

    @Size(max = 500)
    private String image;

    private Long categorieId;

    @Builder.Default
    private Boolean publie = false;
}
