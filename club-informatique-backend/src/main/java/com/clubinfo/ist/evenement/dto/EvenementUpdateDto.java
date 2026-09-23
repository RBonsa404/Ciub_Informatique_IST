package com.clubinfo.ist.evenement.dto;

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
public class EvenementUpdateDto {

    @Size(min = 3, max = 200)
    private String titre;

    private String description;

    private LocalDateTime dateDebut;

    private LocalDateTime dateFin;

    @Size(max = 200)
    private String lieu;

    private Integer capaciteMax;

    @Size(max = 500)
    private String image;

    private Long categorieId;

    private Boolean publie;
}
