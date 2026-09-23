package com.clubinfo.ist.categorie.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategorieDto {

    private Long id;
    private String nom;
    private String slug;
    private String description;
    private String couleur;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
