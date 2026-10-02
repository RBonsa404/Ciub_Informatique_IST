package com.clubinfo.ist.ressource.controller;

import com.clubinfo.ist.common.security.UserDetailsImpl;
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

@RestController
@RequestMapping("/ressources")
@RequiredArgsConstructor
@Tag(name = "Ressources", description = "Ressources publiques et supports des formations")
public class RessourceController {

    private static final String AUTEURS = "hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB')";

    private final RessourceService ressources;

    @GetMapping("/publiques")
    @Operation(summary = "Ressources publiques")
    public Page<RessourceDto> publiques(@RequestParam(required = false) Long categorieId, @RequestParam(required = false) TypeRessource type,
                                        @RequestParam(required = false) String search, @PageableDefault(size = 10) Pageable pageable) {
        return ressources.publiques(categorieId, type, search, pageable);
    }

    @GetMapping("/formation/{formationId}")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Supports d'une formation, réservés aux inscrits confirmés et à l'équipe pédagogique")
    public List<RessourceDto> deLaFormation(@PathVariable Long formationId, @AuthenticationPrincipal UserDetailsImpl lecteur) {
        return ressources.deLaFormation(formationId, lecteur);
    }

    @GetMapping("/{id}")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Ressource ; une ressource non publique exige l'inscription à sa formation")
    public RessourceDto lire(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl lecteur) {
        return ressources.lire(id, lecteur);
    }

    @PostMapping
    @PreAuthorize("hasRole('FORMATEUR')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Publier une ressource")
    public ResponseEntity<RessourceDto> publier(@Valid @RequestBody RessourceCreateDto saisie, @AuthenticationPrincipal UserDetailsImpl auteur) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ressources.publier(saisie, auteur));
    }

    @PutMapping("/{id}")
    @PreAuthorize(AUTEURS)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Modifier une ressource dont on est l'auteur")
    public RessourceDto modifier(@PathVariable Long id, @Valid @RequestBody RessourceCreateDto saisie, @AuthenticationPrincipal UserDetailsImpl auteur) {
        return ressources.modifier(id, saisie, auteur);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(AUTEURS)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Supprimer une ressource dont on est l'auteur")
    public ResponseEntity<Void> supprimer(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl auteur) {
        ressources.supprimer(id, auteur);
        return ResponseEntity.noContent().build();
    }
}
