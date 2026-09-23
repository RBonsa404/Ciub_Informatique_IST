package com.clubinfo.ist.ressource.mapper;

import com.clubinfo.ist.ressource.dto.RessourceDto;
import com.clubinfo.ist.ressource.entity.Ressource;
import org.springframework.stereotype.Component;

@Component
public class RessourceMapper {

    public RessourceDto toDto(Ressource ressource) {
        if (ressource == null) return null;

        return RessourceDto.builder()
                .id(ressource.getId())
                .titre(ressource.getTitre())
                .description(ressource.getDescription())
                .type(ressource.getType())
                .urlFichier(ressource.getUrlFichier())
                .estPublique(ressource.getEstPublique())
                .formationId(ressource.getFormation() != null ? ressource.getFormation().getId() : null)
                .formationTitre(ressource.getFormation() != null ? ressource.getFormation().getTitre() : null)
                .categorieId(ressource.getCategorie() != null ? ressource.getCategorie().getId() : null)
                .categorieNom(ressource.getCategorie() != null ? ressource.getCategorie().getNom() : null)
                .auteurId(ressource.getAuteur() != null ? ressource.getAuteur().getId() : null)
                .auteurNom(ressource.getAuteur() != null ?
                        ressource.getAuteur().getPrenom() + " " + ressource.getAuteur().getNom() : null)
                .createdAt(ressource.getCreatedAt())
                .updatedAt(ressource.getUpdatedAt())
                .build();
    }
}
