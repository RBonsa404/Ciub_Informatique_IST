package com.clubinfo.ist.evenement.controller;

import com.clubinfo.ist.evenement.dto.EvenementCreateDto;
import com.clubinfo.ist.evenement.dto.EvenementDto;
import com.clubinfo.ist.evenement.dto.EvenementUpdateDto;
import com.clubinfo.ist.evenement.service.EvenementService;
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
@RequestMapping("/evenements")
@RequiredArgsConstructor
@Tag(name = "Événements", description = "Endpoints de consultation et gestion des événements et ateliers du club (UC-02, UC-19)")
public class EvenementController {

    private final EvenementService evenementService;

    @GetMapping
    @Operation(summary = "Lister les événements publiés avec filtres (public) (UC-02)")
    public ResponseEntity<Page<EvenementDto>> getPublishedEvenements(
            @RequestParam(required = false) Boolean aVenir,
            @RequestParam(required = false) Long categorieId,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<EvenementDto> events = evenementService.getPublishedEvenements(aVenir, categorieId, search, pageable);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Lister tous les événements pour administration (UC-19)")
    public ResponseEntity<Page<EvenementDto>> getAllForAdmin(@PageableDefault(size = 10) Pageable pageable) {
        Page<EvenementDto> events = evenementService.getAllEvenementsForAdmin(pageable);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter le détail d'un événement par ID (public) (UC-02)")
    public ResponseEntity<EvenementDto> getEvenementById(@PathVariable Long id) {
        return ResponseEntity.ok(evenementService.getEvenementById(id));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Consulter le détail d'un événement par son slug (public) (UC-02)")
    public ResponseEntity<EvenementDto> getEvenementBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(evenementService.getEvenementBySlug(slug));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Créer et planifier un nouvel événement (UC-19)")
    public ResponseEntity<EvenementDto> createEvenement(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody EvenementCreateDto dto) {
        EvenementDto created = evenementService.createEvenement(userDetails.getUsername(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Modifier un événement (UC-19)")
    public ResponseEntity<EvenementDto> updateEvenement(
            @PathVariable Long id,
            @Valid @RequestBody EvenementUpdateDto dto) {
        EvenementDto updated = evenementService.updateEvenement(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/publication")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Basculer la publication d'un événement (UC-19)")
    public ResponseEntity<EvenementDto> togglePublication(@PathVariable Long id) {
        EvenementDto updated = evenementService.togglePublication(id);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Supprimer logiquement un événement (UC-19)")
    public ResponseEntity<Map<String, String>> deleteEvenement(@PathVariable Long id) {
        evenementService.deleteEvenement(id);
        return ResponseEntity.ok(Map.of("message", "Événement supprimé avec succès"));
    }
}
