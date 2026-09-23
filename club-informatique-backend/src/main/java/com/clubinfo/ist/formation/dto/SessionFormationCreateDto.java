package com.clubinfo.ist.formation.dto;

import com.clubinfo.ist.formation.entity.StatutSession;
import jakarta.validation.constraints.Future;
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
public class SessionFormationCreateDto {

    @NotNull(message = "La date de début est obligatoire")
    @Future(message = "La date de début doit être dans le futur")
    private LocalDateTime dateDebut;

    @NotNull(message = "La date de fin est obligatoire")
    @Future(message = "La date de fin doit être dans le futur")
    private LocalDateTime dateFin;

    @Size(max = 200)
    private String lieu;

    @Size(max = 500)
    private String lienVisio;

    @Positive(message = "La capacité doit être positive")
    private Integer capaciteMax;

    @Builder.Default
    private StatutSession statut = StatutSession.PLANIFIEE;
}
