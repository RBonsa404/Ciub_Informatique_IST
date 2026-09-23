package com.clubinfo.ist.actualite.controller;

import com.clubinfo.ist.actualite.dto.ActualiteCreateDto;
import com.clubinfo.ist.actualite.dto.ActualiteDto;
import com.clubinfo.ist.actualite.dto.ActualiteUpdateDto;
import com.clubinfo.ist.actualite.service.ActualiteService;
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

import java.util.Map;

@RestController
@RequestMapping("/actualites")
@RequiredArgsConstructor
@Tag(name = "Actualités", description = "Endpoints de consultation et gestion des actualités et articles de blog (UC-02, UC-18)")
public class ActualiteController {

    private final ActualiteService actualiteService;

    @GetMapping
    @Operation(summary = "Lister les actualités publiées avec filtres (public) (UC-02)")
    public ResponseEntity<Page<ActualiteDto>> getPublishedActualites(
            @RequestParam(required = false) Long categorieId,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<ActualiteDto> actualites = actualiteService.getPublishedActualites(categorieId, search, pageable);
        return ResponseEntity.ok(actualites);
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Lister tous les articles y compris brouillons pour administration (UC-18)")
    public ResponseEntity<Page<ActualiteDto>> getAllForAdmin(@PageableDefault(size = 10) Pageable pageable) {
        Page<ActualiteDto> actualites = actualiteService.getAllActualitesForAdmin(pageable);
        return ResponseEntity.ok(actualites);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter le détail d'une actualité par son ID (public) (UC-02)")
    public ResponseEntity<ActualiteDto> getActualiteById(@PathVariable Long id) {
        return ResponseEntity.ok(actualiteService.getActualiteById(id));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Consulter le détail d'une actualité par son slug (public) (UC-02)")
    public ResponseEntity<ActualiteDto> getActualiteBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(actualiteService.getActualiteBySlug(slug));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Rédiger et créer un nouvel article d'actualité (UC-18)")
    public ResponseEntity<ActualiteDto> createActualite(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ActualiteCreateDto dto) {
        ActualiteDto created = actualiteService.createActualite(userDetails.getUsername(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Modifier un article d'actualité (UC-18)")
    public ResponseEntity<ActualiteDto> updateActualite(
            @PathVariable Long id,
            @Valid @RequestBody ActualiteUpdateDto dto) {
        ActualiteDto updated = actualiteService.updateActualite(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/publication")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Basculer l'état de publication d'une actualité (UC-18)")
    public ResponseEntity<ActualiteDto> togglePublication(@PathVariable Long id) {
        ActualiteDto updated = actualiteService.togglePublication(id);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Supprimer logiquement un article d'actualité (UC-18)")
    public ResponseEntity<Map<String, String>> deleteActualite(@PathVariable Long id) {
        actualiteService.deleteActualite(id);
        return ResponseEntity.ok(Map.of("message", "Actualité supprimée avec succès"));
    }
}
