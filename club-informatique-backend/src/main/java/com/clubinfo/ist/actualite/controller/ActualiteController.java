package com.clubinfo.ist.actualite.controller;

import com.clubinfo.ist.actualite.dto.ActualiteDtos.ActualiteDto;
import com.clubinfo.ist.actualite.dto.ActualiteDtos.ActualiteSaisie;
import com.clubinfo.ist.actualite.dto.ActualiteDtos.Publication;
import com.clubinfo.ist.actualite.entity.Visibilite;
import com.clubinfo.ist.actualite.service.ActualiteService;
import com.clubinfo.ist.common.security.UserDetailsImpl;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Tag(name = "Actualités", description = "Actualités publiques, annonces réservées aux membres et gestion par le Responsable du Club")
public class ActualiteController {

    private static final String GESTION = "hasRole('RESPONSABLE_CLUB')";
    private static final String MEMBRES = "hasAnyRole('MEMBRE', 'FORMATEUR', 'RESPONSABLE_CLUB')";

    private final ActualiteService actualites;

    // ---- Lecture publique

    @GetMapping("/actualites")
    @Operation(summary = "Actualités publiées et publiques")
    public Page<ActualiteDto> publiques(@RequestParam(required = false) Long categorieId, @RequestParam(required = false) String search,
                                        @PageableDefault(size = 10) Pageable pageable) {
        return actualites.publiees(Visibilite.PUBLIC, categorieId, search, pageable);
    }

    @GetMapping("/actualites/slug/{slug}")
    @Operation(summary = "Actualité publiée")
    public ActualiteDto publique(@PathVariable String slug) {
        return actualites.publiee(slug, Visibilite.PUBLIC);
    }

    // ---- Annonces réservées aux membres

    @GetMapping("/publications")
    @PreAuthorize(MEMBRES)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Annonces publiées réservées aux membres")
    public Page<ActualiteDto> annonces(@PageableDefault(size = 10) Pageable pageable) {
        return actualites.publiees(Visibilite.MEMBRES, null, null, pageable);
    }

    @GetMapping("/publications/slug/{slug}")
    @PreAuthorize(MEMBRES)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Annonce réservée aux membres")
    public ActualiteDto annonce(@PathVariable String slug) {
        return actualites.publiee(slug, Visibilite.MEMBRES);
    }

    // ---- Gestion

    @GetMapping("/gestion/actualites")
    @PreAuthorize(GESTION)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Toutes les actualités, publiées ou non")
    public Page<ActualiteDto> gerees(@RequestParam(required = false) Boolean publie, @PageableDefault(size = 10) Pageable pageable) {
        return actualites.gerees(publie, pageable);
    }

    @GetMapping("/actualites/{id}")
    @PreAuthorize(GESTION)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Actualité par identifiant, brouillon compris")
    public ActualiteDto geree(@PathVariable Long id) {
        return actualites.geree(id);
    }

    @PostMapping("/actualites")
    @PreAuthorize(GESTION)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Créer une actualité")
    public ResponseEntity<ActualiteDto> creer(@AuthenticationPrincipal UserDetailsImpl auteur, @Valid @RequestBody ActualiteSaisie saisie) {
        return ResponseEntity.status(HttpStatus.CREATED).body(actualites.creer(auteur.getId(), saisie));
    }

    @PutMapping("/actualites/{id}")
    @PreAuthorize(GESTION)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Modifier une actualité")
    public ActualiteDto modifier(@PathVariable Long id, @Valid @RequestBody ActualiteSaisie saisie) {
        return actualites.modifier(id, saisie);
    }

    @PatchMapping("/actualites/{id}/publication")
    @PreAuthorize(GESTION)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Publier ou retirer une actualité (état explicite)")
    public ActualiteDto publier(@PathVariable Long id, @Valid @RequestBody Publication publication) {
        return actualites.publier(id, publication.publie());
    }

    @DeleteMapping("/actualites/{id}")
    @PreAuthorize(GESTION)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Supprimer une actualité")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        actualites.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}
