package com.clubinfo.controller;

import com.clubinfo.dto.ProjetDTO;
import com.clubinfo.entity.StatutProjet;
import com.clubinfo.entity.Utilisateur;
import com.clubinfo.service.ProjetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projets")
@RequiredArgsConstructor
public class ProjetController {

    private final ProjetService projetService;

    @GetMapping
    public ResponseEntity<Page<ProjetDTO>> getProjets(
            @RequestParam(required = false) StatutProjet statut,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(projetService.getProjetsByStatut(statut, PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjetDTO> getProjetById(@PathVariable Long id) {
        return ResponseEntity.ok(projetService.getProjetById(id));
    }

    @PostMapping("/soumettre")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProjetDTO> soumettreProjet(
            @Valid @RequestBody ProjetDTO dto,
            @AuthenticationPrincipal Utilisateur user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projetService.soumettreProjet(dto, user.getId()));
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'FORMATEUR', 'ADMINISTRATEUR', 'SUPERADMIN')")
    public ResponseEntity<ProjetDTO> changerStatut(
            @PathVariable Long id,
            @RequestParam StatutProjet statut,
            @AuthenticationPrincipal Utilisateur user) {
        return ResponseEntity.ok(projetService.changerStatut(id, statut, user.getId()));
    }
}
