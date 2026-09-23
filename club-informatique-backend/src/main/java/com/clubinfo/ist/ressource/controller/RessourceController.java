package com.clubinfo.ist.ressource.controller;

import com.clubinfo.ist.formation.service.FormationService;
import com.clubinfo.ist.ressource.dto.RessourceCreateDto;
import com.clubinfo.ist.ressource.dto.RessourceDto;
import com.clubinfo.ist.ressource.entity.TypeRessource;
import com.clubinfo.ist.ressource.service.RessourceService;
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
@RequestMapping("/ressources")
@RequiredArgsConstructor
@Tag(name = "Ressources Pédagogiques", description = "Endpoints de partage, téléchargement et gestion des supports de cours et documents (UC-03, UC-16)")
public class RessourceController {

    private final RessourceService ressourceService;

    @GetMapping("/publiques")
    @Operation(summary = "Lister les ressources pédagogiques publiques avec filtres (public) (UC-03)")
    public ResponseEntity<Page<RessourceDto>> getPublicRessources(
            @RequestParam(required = false) Long categorieId,
            @RequestParam(required = false) TypeRessource type,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<RessourceDto> ressources = ressourceService.getPublicRessources(categorieId, type, search, pageable);
        return ResponseEntity.ok(ressources);
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Lister toutes les ressources (publiques et privées) pour admin (UC-16)")
    public ResponseEntity<Page<RessourceDto>> getAllForAdmin(@PageableDefault(size = 10) Pageable pageable) {
        Page<RessourceDto> ressources = ressourceService.getAllRessourcesForAdmin(pageable);
        return ResponseEntity.ok(ressources);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter le détail d'une ressource par son ID (public si ressource publique, sinon requiert authentification) (UC-03)")
    public ResponseEntity<RessourceDto> getRessourceById(@PathVariable Long id) {
        return ResponseEntity.ok(ressourceService.getRessourceById(id));
    }

    @GetMapping("/formation/{formationId}")
    @Operation(summary = "Lister les ressources associées à une formation (UC-10, UC-16)")
    public ResponseEntity<List<RessourceDto>> getRessourcesByFormation(@PathVariable Long formationId) {
        return ResponseEntity.ok(ressourceService.getRessourcesByFormation(formationId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Publier une nouvelle ressource pédagogique (UC-16)")
    public ResponseEntity<RessourceDto> createRessource(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody RessourceCreateDto dto) {
        RessourceDto created = ressourceService.createRessource(userDetails.getUsername(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Modifier une ressource existante (UC-16)")
    public ResponseEntity<RessourceDto> updateRessource(
            @PathVariable Long id,
            @Valid @RequestBody RessourceCreateDto dto) {
        RessourceDto updated = ressourceService.updateRessource(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Supprimer logiquement une ressource (UC-16)")
    public ResponseEntity<Map<String, String>> deleteRessource(@PathVariable Long id) {
        ressourceService.deleteRessource(id);
        return ResponseEntity.ok(Map.of("message", "Ressource supprimée avec succès"));
    }
}
