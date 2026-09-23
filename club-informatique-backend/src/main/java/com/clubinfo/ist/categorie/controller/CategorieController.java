package com.clubinfo.ist.categorie.controller;

import com.clubinfo.ist.categorie.dto.CategorieDto;
import com.clubinfo.ist.categorie.dto.CategorieRequestDto;
import com.clubinfo.ist.categorie.service.CategorieService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
@Tag(name = "Catégories", description = "Endpoints de consultation et gestion des catégories (UC-25, UC-02)")
public class CategorieController {

    private final CategorieService categorieService;

    @GetMapping
    @Operation(summary = "Lister toutes les catégories actives (public) (UC-02)")
    public ResponseEntity<List<CategorieDto>> getAllCategories() {
        return ResponseEntity.ok(categorieService.getAllCategories());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter une catégorie par ID (public)")
    public ResponseEntity<CategorieDto> getCategorieById(@PathVariable Long id) {
        return ResponseEntity.ok(categorieService.getCategorieById(id));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Consulter une catégorie par son slug (public)")
    public ResponseEntity<CategorieDto> getCategorieBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(categorieService.getCategorieBySlug(slug));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RESPONSABLE_CLUB')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Créer une nouvelle catégorie (UC-25)")
    public ResponseEntity<CategorieDto> createCategorie(@Valid @RequestBody CategorieRequestDto dto) {
        CategorieDto created = categorieService.createCategorie(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RESPONSABLE_CLUB')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Modifier une catégorie existante (UC-25)")
    public ResponseEntity<CategorieDto> updateCategorie(@PathVariable Long id, @Valid @RequestBody CategorieRequestDto dto) {
        CategorieDto updated = categorieService.updateCategorie(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Supprimer logiquement une catégorie (UC-25)")
    public ResponseEntity<Map<String, String>> deleteCategorie(@PathVariable Long id) {
        categorieService.deleteCategorie(id);
        return ResponseEntity.ok(Map.of("message", "Catégorie supprimée avec succès"));
    }
}
