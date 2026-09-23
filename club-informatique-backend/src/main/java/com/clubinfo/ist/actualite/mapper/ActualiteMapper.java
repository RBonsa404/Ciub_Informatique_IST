package com.clubinfo.ist.actualite.mapper;

import com.clubinfo.ist.actualite.dto.ActualiteDto;
import com.clubinfo.ist.actualite.entity.Actualite;
import org.springframework.stereotype.Component;

@Component
public class ActualiteMapper {

    public ActualiteDto toDto(Actualite actualite) {
        if (actualite == null) return null;

        return ActualiteDto.builder()
                .id(actualite.getId())
                .titre(actualite.getTitre())
                .slug(actualite.getSlug())
                .contenu(actualite.getContenu())
                .resume(actualite.getResume())
                .image(actualite.getImage())
                .publie(actualite.getPublie())
                .datePublication(actualite.getDatePublication())
                .auteurId(actualite.getAuteur() != null ? actualite.getAuteur().getId() : null)
                .auteurNom(actualite.getAuteur() != null ?
                        actualite.getAuteur().getPrenom() + " " + actualite.getAuteur().getNom() : null)
                .categorieId(actualite.getCategorie() != null ? actualite.getCategorie().getId() : null)
                .categorieNom(actualite.getCategorie() != null ? actualite.getCategorie().getNom() : null)
                .createdAt(actualite.getCreatedAt())
                .updatedAt(actualite.getUpdatedAt())
                .build();
    }
}
