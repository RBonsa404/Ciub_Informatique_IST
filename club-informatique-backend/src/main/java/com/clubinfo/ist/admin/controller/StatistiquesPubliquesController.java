package com.clubinfo.ist.admin.controller;

import com.clubinfo.ist.admin.dto.StatistiquesPubliquesDto;
import com.clubinfo.ist.evenement.repository.EvenementRepository;
import com.clubinfo.ist.formation.repository.FormationRepository;
import com.clubinfo.ist.projet.repository.ProjetRepository;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/statistiques/publiques")
@RequiredArgsConstructor
@Tag(name = "Statistiques Publiques", description = "Endpoints de consultation des chiffres réels du club ouverts à tous")
public class StatistiquesPubliquesController {

    private final UtilisateurRepository utilisateurRepository;
    private final FormationRepository formationRepository;
    private final ProjetRepository projetRepository;
    private final EvenementRepository evenementRepository;

    @GetMapping
    @Transactional(readOnly = true)
    @Operation(summary = "Consulter les totaux réels publics (membres, formations, projets, événements)")
    public ResponseEntity<StatistiquesPubliquesDto> getStatistiquesPubliques() {
        return ResponseEntity.ok(StatistiquesPubliquesDto.builder()
                .totalMembres(utilisateurRepository.count())
                .totalFormations(formationRepository.count())
                .totalProjets(projetRepository.count())
                .totalEvenements(evenementRepository.count())
                .build());
    }
}
