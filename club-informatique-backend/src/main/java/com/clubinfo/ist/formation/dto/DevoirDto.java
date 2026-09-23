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
public class DevoirDto {

    private Long id;
    private Long formationId;
    private String titre;
    private String description;
    private LocalDateTime dateLimite;
    private String fichierConsigne;
    private LocalDateTime createdAt;
}
