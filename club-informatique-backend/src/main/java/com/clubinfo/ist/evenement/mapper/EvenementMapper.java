package com.clubinfo.ist.evenement.mapper;

import com.clubinfo.ist.evenement.dto.EvenementDto;
import com.clubinfo.ist.evenement.entity.Evenement;
import org.springframework.stereotype.Component;

@Component
public class EvenementMapper {

    public EvenementDto toDto(Evenement evenement, Long nombreInscrits) {
        if (evenement == null) return null;

        Integer placesRestantes = null;
        if (evenement.getCapaciteMax() != null) {
            long inscrits = nombreInscrits != null ? nombreInscrits : 0L;
            placesRestantes = Math.max(0, evenement.getCapaciteMax() - (int) inscrits);
        }

        return EvenementDto.builder()
                .id(evenement.getId())
                .titre(evenement.getTitre())
                .slug(evenement.getSlug())
                .description(evenement.getDescription())
                .dateDebut(evenement.getDateDebut())
                .dateFin(evenement.getDateFin())
                .lieu(evenement.getLieu())
                .capaciteMax(evenement.getCapaciteMax())
                .nombreInscrits(nombreInscrits != null ? nombreInscrits : 0L)
                .placesRestantes(placesRestantes)
                .image(evenement.getImage())
                .publie(evenement.getPublie())
                .categorieId(evenement.getCategorie() != null ? evenement.getCategorie().getId() : null)
                .categorieNom(evenement.getCategorie() != null ? evenement.getCategorie().getNom() : null)
                .organisateurId(evenement.getOrganisateur() != null ? evenement.getOrganisateur().getId() : null)
                .organisateurNom(evenement.getOrganisateur() != null ?
                        evenement.getOrganisateur().getPrenom() + " " + evenement.getOrganisateur().getNom() : null)
                .createdAt(evenement.getCreatedAt())
                .updatedAt(evenement.getUpdatedAt())
                .build();
    }
}
