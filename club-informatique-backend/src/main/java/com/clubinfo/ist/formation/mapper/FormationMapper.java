package com.clubinfo.ist.formation.mapper;

import com.clubinfo.ist.formation.dto.DevoirDto;
import com.clubinfo.ist.formation.dto.FormationDto;
import com.clubinfo.ist.formation.dto.SessionFormationDto;
import com.clubinfo.ist.formation.entity.Devoir;
import com.clubinfo.ist.formation.entity.Formation;
import com.clubinfo.ist.formation.entity.SessionFormation;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class FormationMapper {

    public FormationDto toDto(Formation formation) {
        if (formation == null) return null;

        List<SessionFormationDto> sessionDtos = formation.getSessions() == null ? List.of() :
                formation.getSessions().stream()
                        .filter(s -> s.getDeletedAt() == null)
                        .map(this::toSessionDto)
                        .collect(Collectors.toList());

        List<DevoirDto> devoirDtos = formation.getDevoirs() == null ? List.of() :
                formation.getDevoirs().stream()
                        .filter(d -> d.getDeletedAt() == null)
                        .map(this::toDevoirDto)
                        .collect(Collectors.toList());

        return FormationDto.builder()
                .id(formation.getId())
                .titre(formation.getTitre())
                .slug(formation.getSlug())
                .description(formation.getDescription())
                .niveau(formation.getNiveau())
                .prerequis(formation.getPrerequis())
                .objectifs(formation.getObjectifs())
                .publie(formation.getPublie())
                .image(formation.getImage())
                .formateurId(formation.getFormateur() != null ? formation.getFormateur().getId() : null)
                .formateurNom(formation.getFormateur() != null ?
                        formation.getFormateur().getPrenom() + " " + formation.getFormateur().getNom() : null)
                .categorieId(formation.getCategorie() != null ? formation.getCategorie().getId() : null)
                .categorieNom(formation.getCategorie() != null ? formation.getCategorie().getNom() : null)
                .sessions(sessionDtos)
                .devoirs(devoirDtos)
                .createdAt(formation.getCreatedAt())
                .updatedAt(formation.getUpdatedAt())
                .build();
    }

    public SessionFormationDto toSessionDto(SessionFormation session) {
        if (session == null) return null;

        return SessionFormationDto.builder()
                .id(session.getId())
                .formationId(session.getFormation() != null ? session.getFormation().getId() : null)
                .formationTitre(session.getFormation() != null ? session.getFormation().getTitre() : null)
                .dateDebut(session.getDateDebut())
                .dateFin(session.getDateFin())
                .lieu(session.getLieu())
                .lienVisio(session.getLienVisio())
                .capaciteMax(session.getCapaciteMax())
                .nombreInscrits(0L)
                .placesRestantes(session.getCapaciteMax())
                .statut(session.getStatut())
                .createdAt(session.getCreatedAt())
                .build();
    }

    public DevoirDto toDevoirDto(Devoir devoir) {
        if (devoir == null) return null;

        return DevoirDto.builder()
                .id(devoir.getId())
                .formationId(devoir.getFormation() != null ? devoir.getFormation().getId() : null)
                .titre(devoir.getTitre())
                .description(devoir.getDescription())
                .dateLimite(devoir.getDateLimite())
                .fichierConsigne(devoir.getFichierConsigne())
                .createdAt(devoir.getCreatedAt())
                .build();
    }
}
