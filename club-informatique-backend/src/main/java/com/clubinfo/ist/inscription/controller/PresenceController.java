package com.clubinfo.ist.inscription.controller;

import com.clubinfo.ist.inscription.dto.PresenceBulkRequestDto;
import com.clubinfo.ist.inscription.dto.PresenceDto;
import com.clubinfo.ist.inscription.service.InscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/presences")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Feuilles de Présence", description = "Endpoints de pointage et suivi de l'émargement aux sessions de formation (UC-15)")
public class PresenceController {

    private final InscriptionService inscriptionService;

    @GetMapping("/sessions/{sessionId}")
    @PreAuthorize("hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Consulter la feuille d'émargement/présences d'une session (UC-15)")
    public ResponseEntity<List<PresenceDto>> getPresencesBySession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(inscriptionService.getPresencesBySession(sessionId));
    }

    @PostMapping("/sessions/{sessionId}")
    @PreAuthorize("hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Enregistrer la feuille de présence en masse (PRESENT, ABSENT, EXCUSE) (UC-15)")
    public ResponseEntity<List<PresenceDto>> enregistrerPresencesBulk(
            @PathVariable Long sessionId,
            @Valid @RequestBody PresenceBulkRequestDto dto) {
        List<PresenceDto> saved = inscriptionService.enregistrerPresencesBulk(sessionId, dto);
        return ResponseEntity.ok(saved);
    }
}
