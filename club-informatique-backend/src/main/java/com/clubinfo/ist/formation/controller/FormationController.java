package com.clubinfo.ist.formation.controller;

import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.formation.dto.FormationDtos.DevoirDto;
import com.clubinfo.ist.formation.dto.FormationDtos.DevoirSaisie;
import com.clubinfo.ist.formation.dto.FormationDtos.FormationDto;
import com.clubinfo.ist.formation.dto.FormationDtos.FormationSaisie;
import com.clubinfo.ist.formation.dto.FormationDtos.SeanceDto;
import com.clubinfo.ist.formation.dto.FormationDtos.SeanceSaisie;
import com.clubinfo.ist.formation.entity.NiveauFormation;
import com.clubinfo.ist.formation.service.FormationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Formations", description = "Formations publiées, séances, devoirs et gestion par l'équipe pédagogique")
public class FormationController {

    private static final String CONNECTE = "isAuthenticated()";
    private static final String FORMATEUR = "hasRole('FORMATEUR')";
    private static final String EQUIPE = "hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB')";
    private static final String RESPONSABLE = "hasRole('RESPONSABLE_CLUB')";

    private final FormationService formations;

    // ---- Lecture

    @GetMapping("/formations")
    @Operation(summary = "Formations publiées")
    public Page<FormationDto> publiees(@RequestParam(required = false) Long categorieId, @RequestParam(required = false) NiveauFormation niveau,
                                       @RequestParam(required = false) String search, @PageableDefault(size = 10) Pageable pageable,
                                       @AuthenticationPrincipal UserDetailsImpl lecteur) {
        return formations.publiees(categorieId, niveau, search, pageable, lecteur);
    }

    @GetMapping("/formations/slug/{slug}")
    @Operation(summary = "Formation publiée, avec ses séances")
    public FormationDto publiee(@PathVariable String slug, @AuthenticationPrincipal UserDetailsImpl lecteur) {
        return formations.publiee(slug, lecteur);
    }

    @GetMapping("/formations/{id}")
    @PreAuthorize(CONNECTE)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Formation par identifiant")
    public FormationDto lire(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl lecteur) {
        return formations.lire(id, lecteur);
    }

    @GetMapping("/gestion/formations")
    @PreAuthorize(EQUIPE)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Formations gérées : celles du formateur connecté, toutes pour le Responsable")
    public Page<FormationDto> gerees(@RequestParam(required = false) Boolean publie, @PageableDefault(size = 10) Pageable pageable,
                                     @AuthenticationPrincipal UserDetailsImpl lecteur) {
        return formations.gerees(publie, pageable, lecteur);
    }

    // ---- Formation

    @PostMapping("/formations")
    @PreAuthorize(FORMATEUR)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Créer une formation")
    public ResponseEntity<FormationDto> creer(@Valid @RequestBody FormationSaisie saisie, @AuthenticationPrincipal UserDetailsImpl formateur) {
        return ResponseEntity.status(HttpStatus.CREATED).body(formations.creer(saisie, formateur));
    }

    @PutMapping("/formations/{id}")
    @PreAuthorize(EQUIPE)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Modifier une formation dont on est le formateur")
    public FormationDto modifier(@PathVariable Long id, @Valid @RequestBody FormationSaisie saisie, @AuthenticationPrincipal UserDetailsImpl auteur) {
        return formations.modifier(id, saisie, auteur);
    }

    @DeleteMapping("/formations/{id}")
    @PreAuthorize(RESPONSABLE)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Supprimer une formation")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        formations.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    // ---- Séances

    @PostMapping("/formations/{id}/sessions")
    @PreAuthorize(EQUIPE)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Planifier une séance ; refuse un conflit de planning")
    public ResponseEntity<SeanceDto> planifier(@PathVariable Long id, @Valid @RequestBody SeanceSaisie saisie,
                                               @AuthenticationPrincipal UserDetailsImpl formateur) {
        return ResponseEntity.status(HttpStatus.CREATED).body(formations.planifier(id, saisie, formateur));
    }

    @PutMapping("/formations/{id}/sessions/{sessionId}")
    @PreAuthorize(EQUIPE)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Modifier une séance")
    public SeanceDto modifierSeance(@PathVariable Long id, @PathVariable Long sessionId, @Valid @RequestBody SeanceSaisie saisie,
                                    @AuthenticationPrincipal UserDetailsImpl formateur) {
        return formations.modifierSeance(id, sessionId, saisie, formateur);
    }

    @DeleteMapping("/formations/{id}/sessions/{sessionId}")
    @PreAuthorize(EQUIPE)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Supprimer une séance")
    public ResponseEntity<Void> supprimerSeance(@PathVariable Long id, @PathVariable Long sessionId, @AuthenticationPrincipal UserDetailsImpl formateur) {
        formations.supprimerSeance(id, sessionId, formateur);
        return ResponseEntity.noContent().build();
    }

    // ---- Devoirs

    @GetMapping("/formations/{id}/devoirs")
    @PreAuthorize(CONNECTE)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Devoirs d'une formation, réservés aux inscrits confirmés et à l'équipe pédagogique")
    public List<DevoirDto> devoirs(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl lecteur) {
        return formations.devoirs(id, lecteur);
    }

    @PostMapping("/formations/{id}/devoirs")
    @PreAuthorize(EQUIPE)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Publier un devoir")
    public ResponseEntity<DevoirDto> publierDevoir(@PathVariable Long id, @Valid @RequestBody DevoirSaisie saisie,
                                                   @AuthenticationPrincipal UserDetailsImpl formateur) {
        return ResponseEntity.status(HttpStatus.CREATED).body(formations.publierDevoir(id, saisie, formateur));
    }

    @DeleteMapping("/formations/{id}/devoirs/{devoirId}")
    @PreAuthorize(EQUIPE)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Supprimer un devoir")
    public ResponseEntity<Void> supprimerDevoir(@PathVariable Long id, @PathVariable Long devoirId, @AuthenticationPrincipal UserDetailsImpl formateur) {
        formations.supprimerDevoir(id, devoirId, formateur);
        return ResponseEntity.noContent().build();
    }
}
