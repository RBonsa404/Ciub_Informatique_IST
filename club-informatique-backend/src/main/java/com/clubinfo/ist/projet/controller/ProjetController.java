package com.clubinfo.ist.projet.controller;

import com.clubinfo.ist.projet.dto.ProjetCreateDto;
import com.clubinfo.ist.projet.dto.ProjetDto;
import com.clubinfo.ist.projet.dto.ProjetMembreDto;
import com.clubinfo.ist.projet.dto.ProjetSuiviDto;
import com.clubinfo.ist.projet.dto.ProjetValidationDto;
import com.clubinfo.ist.projet.service.ProjetService;
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
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/projets")
@RequiredArgsConstructor
@Tag(name = "Projets Collaboratifs", description = "Endpoints de proposition, validation, collaboration et suivi de projets étudiants (UC-02, UC-11, UC-17, UC-20)")
public class ProjetController {

    private final ProjetService projetService;

    @GetMapping
    @Operation(summary = "Lister les projets validés et en cours (public) (UC-02)")
    public ResponseEntity<Page<ProjetDto>> getPublishedProjets(
            @RequestParam(required = false) Long categorieId,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<ProjetDto> projets = projetService.getPublishedProjets(categorieId, search, pageable);
        return ResponseEntity.ok(projets);
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Lister tous les projets sans distinction de statut pour admin (UC-20)")
    public ResponseEntity<Page<ProjetDto>> getAllForAdmin(@PageableDefault(size = 10) Pageable pageable) {
        Page<ProjetDto> projets = projetService.getAllProjetsForAdmin(pageable);
        return ResponseEntity.ok(projets);
    }

    @GetMapping("/en-attente")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Lister les propositions de projets en attente de validation (UC-20)")
    public ResponseEntity<List<ProjetDto>> getProjetsEnAttente() {
        return ResponseEntity.ok(projetService.getProjetsEnAttente());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter le détail d'un projet par son ID (public) (UC-02)")
    public ResponseEntity<ProjetDto> getProjetById(@PathVariable Long id) {
        return ResponseEntity.ok(projetService.getProjetById(id));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Consulter le détail d'un projet par son slug (public) (UC-02)")
    public ResponseEntity<ProjetDto> getProjetBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(projetService.getProjetBySlug(slug));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MEMBRE', 'FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Soumettre une proposition de projet étudiant (UC-11)")
    public ResponseEntity<ProjetDto> proposerProjet(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ProjetCreateDto dto) {
        ProjetDto created = projetService.proposerProjet(userDetails.getUsername(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}/validation")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Valider ou rejeter une proposition de projet (UC-20)")
    public ResponseEntity<ProjetDto> validerProjet(
            @PathVariable Long id,
            @Valid @RequestBody ProjetValidationDto dto) {
        ProjetDto validated = projetService.validerProjet(id, dto);
        return ResponseEntity.ok(validated);
    }

    @PostMapping("/{id}/membres")
    @PreAuthorize("hasAnyRole('MEMBRE', 'FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Rejoindre l'équipe d'un projet validé (UC-11 / extension CDC)")
    public ResponseEntity<ProjetMembreDto> rejoindreProjet(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        ProjetMembreDto joined = projetService.rejoindreProjet(userDetails.getUsername(), id);
        return ResponseEntity.status(HttpStatus.CREATED).body(joined);
    }

    @GetMapping("/{id}/membres")
    @Operation(summary = "Lister les membres participant à un projet (UC-17)")
    public ResponseEntity<List<ProjetMembreDto>> getMembres(@PathVariable Long id) {
        return ResponseEntity.ok(projetService.getMembres(id));
    }

    @PutMapping("/{id}/suivi")
    @PreAuthorize("hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Mettre à jour le suivi pédagogique et l'avancement d'un projet (UC-17)")
    public ResponseEntity<ProjetDto> updateSuiviFormateur(
            @PathVariable Long id,
            @Valid @RequestBody ProjetSuiviDto dto) {
        ProjetDto updated = projetService.updateSuiviFormateur(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Supprimer logiquement un projet (UC-20)")
    public ResponseEntity<Map<String, String>> deleteProjet(@PathVariable Long id) {
        projetService.deleteProjet(id);
        return ResponseEntity.ok(Map.of("message", "Projet supprimé avec succès"));
    }
}
