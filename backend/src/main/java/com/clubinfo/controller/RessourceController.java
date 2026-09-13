package com.clubinfo.controller;

import com.clubinfo.dto.RessourceDTO;
import com.clubinfo.entity.Utilisateur;
import com.clubinfo.service.RessourceService;
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
@RequestMapping("/api/ressources")
@RequiredArgsConstructor
public class RessourceController {

    private final RessourceService ressourceService;

    @GetMapping("/publiques")
    public ResponseEntity<Page<RessourceDTO>> getPublicRessources(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ressourceService.getPublicRessources(PageRequest.of(page, size)));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<RessourceDTO>> getAllRessources(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ressourceService.getAllRessources(PageRequest.of(page, size)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB', 'ADMINISTRATEUR', 'SUPERADMIN')")
    public ResponseEntity<RessourceDTO> createRessource(
            @Valid @RequestBody RessourceDTO dto,
            @AuthenticationPrincipal Utilisateur user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ressourceService.createRessource(dto, user.getId()));
    }
}
