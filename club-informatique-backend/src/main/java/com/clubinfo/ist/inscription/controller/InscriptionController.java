package com.clubinfo.ist.inscription.controller;

import com.clubinfo.ist.inscription.dto.InscriptionDto;
import com.clubinfo.ist.inscription.dto.InscriptionStatutUpdateDto;
import com.clubinfo.ist.inscription.service.InscriptionService;
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

@RestController
@RequestMapping("/inscriptions")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Inscriptions", description = "Endpoints d'inscription aux événements et formations, et gestion de liste d'attente (UC-09, UC-12, UC-21)")
public class InscriptionController {

    private final InscriptionService inscriptionService;

    @PostMapping("/evenements/{evenementId}")
    @Operation(summary = "S'inscrire à un événement (gestion automatique de capacité et liste d'attente) (UC-09)")
    public ResponseEntity<InscriptionDto> inscrireEvenement(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long evenementId) {
        InscriptionDto inscription = inscriptionService.inscrireEvenement(userDetails.getUsername(), evenementId);
        return ResponseEntity.status(HttpStatus.CREATED).body(inscription);
    }

    @PostMapping("/formations/{sessionId}")
    @Operation(summary = "S'inscrire à une session de formation (UC-09)")
    public ResponseEntity<InscriptionDto> inscrireSessionFormation(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId) {
        InscriptionDto inscription = inscriptionService.inscrireSessionFormation(userDetails.getUsername(), sessionId);
        return ResponseEntity.status(HttpStatus.CREATED).body(inscription);
    }

    @GetMapping("/me")
    @Operation(summary = "Consulter l'historique de ses propres inscriptions (UC-12)")
    public ResponseEntity<Page<InscriptionDto>> getMyInscriptions(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<InscriptionDto> inscriptions = inscriptionService.getMyInscriptions(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(inscriptions);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Annuler une inscription (promut automatiquement le suivant sur liste d'attente) (UC-09)")
    public ResponseEntity<InscriptionDto> annulerInscription(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestParam(required = false) String motif) {
        InscriptionDto cancelled = inscriptionService.annulerInscription(userDetails.getUsername(), id, motif);
        return ResponseEntity.ok(cancelled);
    }

    @GetMapping("/evenements/{evenementId}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Lister les inscrits à un événement (UC-21)")
    public ResponseEntity<List<InscriptionDto>> getInscriptionsByEvenement(@PathVariable Long evenementId) {
        return ResponseEntity.ok(inscriptionService.getInscriptionsByEvenement(evenementId));
    }

    @GetMapping("/formations/{sessionId}")
    @PreAuthorize("hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Lister les inscrits à une session de formation (UC-21)")
    public ResponseEntity<List<InscriptionDto>> getInscriptionsBySession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(inscriptionService.getInscriptionsBySession(sessionId));
    }

    @PutMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Modifier le statut d'une inscription (ex: promouvoir liste d'attente manuellement) (UC-21)")
    public ResponseEntity<InscriptionDto> updateStatut(
            @PathVariable Long id,
            @Valid @RequestBody InscriptionStatutUpdateDto dto) {
        InscriptionDto updated = inscriptionService.updateStatutInscription(id, dto);
        return ResponseEntity.ok(updated);
    }
}
