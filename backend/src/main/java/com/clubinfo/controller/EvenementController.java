package com.clubinfo.controller;

import com.clubinfo.dto.EvenementDTO;
import com.clubinfo.entity.Utilisateur;
import com.clubinfo.service.EvenementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evenements")
@RequiredArgsConstructor
public class EvenementController {

    private final EvenementService evenementService;

    @GetMapping
    public ResponseEntity<Page<EvenementDTO>> getPublishedEvenements(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(evenementService.getPublishedEvenements(PageRequest.of(page, size)));
    }

    @GetMapping("/a-venir")
    public ResponseEntity<List<EvenementDTO>> getUpcomingEvenements() {
        return ResponseEntity.ok(evenementService.getUpcomingEvenements());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EvenementDTO> getEvenementById(@PathVariable Long id) {
        return ResponseEntity.ok(evenementService.getEvenementById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMINISTRATEUR', 'SUPERADMIN')")
    public ResponseEntity<EvenementDTO> createEvenement(
            @Valid @RequestBody EvenementDTO dto,
            @AuthenticationPrincipal Utilisateur user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(evenementService.createEvenement(dto, user.getId()));
    }

    @PostMapping("/{id}/inscription")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> inscrire(@PathVariable Long id, @AuthenticationPrincipal Utilisateur user) {
        evenementService.inscrireMembre(id, user.getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/inscription")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> desinscrire(@PathVariable Long id, @AuthenticationPrincipal Utilisateur user) {
        evenementService.desinscrireMembre(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
