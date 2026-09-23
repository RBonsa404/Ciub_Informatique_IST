package com.clubinfo.ist.projet.mapper;

import com.clubinfo.ist.projet.dto.ProjetDto;
import com.clubinfo.ist.projet.dto.ProjetMembreDto;
import com.clubinfo.ist.projet.entity.Projet;
import com.clubinfo.ist.projet.entity.ProjetMembre;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ProjetMapper {

    public ProjetDto toDto(Projet projet) {
        if (projet == null) return null;

        List<ProjetMembreDto> membreDtos = projet.getMembres() == null ? List.of() :
                projet.getMembres().stream()
                        .map(this::toMembreDto)
                        .collect(Collectors.toList());

        return ProjetDto.builder()
                .id(projet.getId())
                .titre(projet.getTitre())
                .slug(projet.getSlug())
                .description(projet.getDescription())
                .objectifs(projet.getObjectifs())
                .technologies(projet.getTechnologies())
                .depotGit(projet.getDepotGit())
                .documentationUrl(projet.getDocumentationUrl())
                .statut(projet.getStatut())
                .porteurId(projet.getPorteur() != null ? projet.getPorteur().getId() : null)
                .porteurNom(projet.getPorteur() != null ?
                        projet.getPorteur().getPrenom() + " " + projet.getPorteur().getNom() : null)
                .suiviFormateur(projet.getSuiviFormateur())
                .avancementPourcentage(projet.getAvancementPourcentage())
                .categorieId(projet.getCategorie() != null ? projet.getCategorie().getId() : null)
                .categorieNom(projet.getCategorie() != null ? projet.getCategorie().getNom() : null)
                .membres(membreDtos)
                .createdAt(projet.getCreatedAt())
                .updatedAt(projet.getUpdatedAt())
                .build();
    }

    public ProjetMembreDto toMembreDto(ProjetMembre membre) {
        if (membre == null) return null;

        return ProjetMembreDto.builder()
                .id(membre.getId())
                .projetId(membre.getProjet() != null ? membre.getProjet().getId() : null)
                .utilisateurId(membre.getUtilisateur() != null ? membre.getUtilisateur().getId() : null)
                .utilisateurNom(membre.getUtilisateur() != null ?
                        membre.getUtilisateur().getPrenom() + " " + membre.getUtilisateur().getNom() : null)
                .utilisateurEmail(membre.getUtilisateur() != null ? membre.getUtilisateur().getEmail() : null)
                .role(membre.getRole())
                .dateRejoint(membre.getDateRejoint())
                .build();
    }
}
