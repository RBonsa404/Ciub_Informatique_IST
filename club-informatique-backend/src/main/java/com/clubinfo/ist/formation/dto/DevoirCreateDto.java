package com.clubinfo.ist.formation.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class DevoirCreateDto {

    @NotBlank(message = "Le titre du devoir est obligatoire")
    @Size(min = 3, max = 200)
    private String titre;

    @NotBlank(message = "La description/consigne est obligatoire")
    private String description;

    @NotNull(message = "La date limite de rendu est obligatoire")
    @Future(message = "La date limite doit être dans le futur")
    private LocalDateTime dateLimite;

    @Size(max = 500)
    private String fichierConsigne;
}
