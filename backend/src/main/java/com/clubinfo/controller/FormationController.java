package com.clubinfo.controller;

import com.clubinfo.dto.FormationDTO;
import com.clubinfo.entity.Utilisateur;
import com.clubinfo.service.FormationService;
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
@RequestMapping("/api/formations")
@RequiredArgsConstructor
public class FormationController {

    private final FormationService formationService;

    @GetMapping
    public ResponseEntity<Page<FormationDTO>> getPublishedFormations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(formationService.getPublishedFormations(PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FormationDTO> getFormationById(@PathVariable Long id) {
        return ResponseEntity.ok(formationService.getFormationById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FORMATEUR', 'ADMINISTRATEUR', 'SUPERADMIN')")
    public ResponseEntity<FormationDTO> createFormation(
            @Valid @RequestBody FormationDTO dto,
            @AuthenticationPrincipal Utilisateur user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(formationService.createFormation(dto, user.getId()));
    }
}
