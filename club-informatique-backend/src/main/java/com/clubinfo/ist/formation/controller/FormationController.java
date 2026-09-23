package com.clubinfo.ist.formation.controller;

import com.clubinfo.ist.formation.dto.DevoirCreateDto;
import com.clubinfo.ist.formation.dto.DevoirDto;
import com.clubinfo.ist.formation.dto.FormationCreateDto;
import com.clubinfo.ist.formation.dto.FormationDto;
import com.clubinfo.ist.formation.dto.FormationUpdateDto;
import com.clubinfo.ist.formation.dto.SessionFormationCreateDto;
import com.clubinfo.ist.formation.dto.SessionFormationDto;
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
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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
@RequestMapping("/formations")
@RequiredArgsConstructor
@Tag(name = "Formations & Ateliers", description = "Endpoints pour les formations, sessions planifiées et devoirs pratiques (UC-02, UC-10, UC-14, UC-16)")
public class FormationController {

    private final FormationService formationService;

    @GetMapping
    @Operation(summary = "Lister les formations publiées avec filtres (public) (UC-02)")
    public ResponseEntity<Page<FormationDto>> getPublishedFormations(
            @RequestParam(required = false) Long categorieId,
            @RequestParam(required = false) NiveauFormation niveau,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<FormationDto> formations = formationService.getPublishedFormations(categorieId, niveau, search, pageable);
        return ResponseEntity.ok(formations);
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Lister toutes les formations pour formateurs et admins (UC-14)")
    public ResponseEntity<Page<FormationDto>> getAllForAdmin(@PageableDefault(size = 10) Pageable pageable) {
        Page<FormationDto> formations = formationService.getAllFormationsForAdmin(pageable);
        return ResponseEntity.ok(formations);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter le détail d'une formation par ID (public) (UC-02)")
    public ResponseEntity<FormationDto> getFormationById(@PathVariable Long id) {
        return ResponseEntity.ok(formationService.getFormationById(id));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Consulter le détail d'une formation par slug (public) (UC-02)")
    public ResponseEntity<FormationDto> getFormationBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(formationService.getFormationBySlug(slug));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Créer une nouvelle formation (UC-14)")
    public ResponseEntity<FormationDto> createFormation(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody FormationCreateDto dto) {
        FormationDto created = formationService.createFormation(userDetails.getUsername(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Modifier une formation existante (UC-14)")
    public ResponseEntity<FormationDto> updateFormation(
            @PathVariable Long id,
            @Valid @RequestBody FormationUpdateDto dto) {
        FormationDto updated = formationService.updateFormation(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/publication")
    @PreAuthorize("hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Basculer la publication d'une formation (UC-14)")
    public ResponseEntity<FormationDto> togglePublication(@PathVariable Long id) {
        FormationDto updated = formationService.togglePublication(id);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Supprimer logiquement une formation (UC-14)")
    public ResponseEntity<Map<String, String>> deleteFormation(@PathVariable Long id) {
        formationService.deleteFormation(id);
        return ResponseEntity.ok(Map.of("message", "Formation supprimée avec succès"));
    }

    // Sessions
    @GetMapping("/{id}/sessions")
    @Operation(summary = "Lister les sessions planifiées d'une formation (UC-14)")
    public ResponseEntity<List<SessionFormationDto>> getSessions(@PathVariable Long id) {
        return ResponseEntity.ok(formationService.getSessions(id));
    }

    @PostMapping("/{id}/sessions")
    @PreAuthorize("hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Ajouter une session planifiée à une formation (UC-14)")
    public ResponseEntity<SessionFormationDto> addSession(
            @PathVariable Long id,
            @Valid @RequestBody SessionFormationCreateDto dto) {
        SessionFormationDto created = formationService.addSession(id, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{formationId}/sessions/{sessionId}")
    @PreAuthorize("hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Modifier une session planifiée (UC-14)")
    public ResponseEntity<SessionFormationDto> updateSession(
            @PathVariable Long formationId,
            @PathVariable Long sessionId,
            @Valid @RequestBody SessionFormationCreateDto dto) {
        SessionFormationDto updated = formationService.updateSession(formationId, sessionId, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{formationId}/sessions/{sessionId}")
    @PreAuthorize("hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Supprimer une session planifiée (UC-14)")
    public ResponseEntity<Map<String, String>> deleteSession(
            @PathVariable Long formationId,
            @PathVariable Long sessionId) {
        formationService.deleteSession(formationId, sessionId);
        return ResponseEntity.ok(Map.of("message", "Session supprimée avec succès"));
    }

    // Devoirs
    @GetMapping("/{id}/devoirs")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Consulter les devoirs pratiques d'une formation (UC-10)")
    public ResponseEntity<List<DevoirDto>> getDevoirs(@PathVariable Long id) {
        return ResponseEntity.ok(formationService.getDevoirs(id));
    }

    @PostMapping("/{id}/devoirs")
    @PreAuthorize("hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Publier un nouveau devoir/consigne pour les inscrits (UC-16)")
    public ResponseEntity<DevoirDto> addDevoir(
            @PathVariable Long id,
            @Valid @RequestBody DevoirCreateDto dto) {
        DevoirDto created = formationService.addDevoir(id, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{formationId}/devoirs/{devoirId}")
    @PreAuthorize("hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Supprimer un devoir (UC-16)")
    public ResponseEntity<Map<String, String>> deleteDevoir(
            @PathVariable Long formationId,
            @PathVariable Long devoirId) {
        formationService.deleteDevoir(formationId, devoirId);
        return ResponseEntity.ok(Map.of("message", "Devoir supprimé avec succès"));
    }
}
