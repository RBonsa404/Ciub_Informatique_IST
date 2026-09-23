package com.clubinfo.ist.categorie.mapper;

import com.clubinfo.ist.categorie.dto.CategorieDto;
import com.clubinfo.ist.categorie.entity.Categorie;
import org.springframework.stereotype.Component;

@Component
public class CategorieMapper {

    public CategorieDto toDto(Categorie categorie) {
        if (categorie == null) return null;
        return CategorieDto.builder()
                .id(categorie.getId())
                .nom(categorie.getNom())
                .slug(categorie.getSlug())
                .description(categorie.getDescription())
                .couleur(categorie.getCouleur())
                .createdAt(categorie.getCreatedAt())
                .updatedAt(categorie.getUpdatedAt())
                .build();
    }
}
