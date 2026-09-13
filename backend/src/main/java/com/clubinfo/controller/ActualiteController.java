package com.clubinfo.controller;

import com.clubinfo.dto.ActualiteDTO;
import com.clubinfo.entity.Utilisateur;
import com.clubinfo.service.ActualiteService;
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
@RequestMapping("/api/actualites")
@RequiredArgsConstructor
public class ActualiteController {

    private final ActualiteService actualiteService;

    @GetMapping
    public ResponseEntity<Page<ActualiteDTO>> getPublishedActualites(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(actualiteService.getPublishedActualites(PageRequest.of(page, size)));
    }

    @GetMapping("/top")
    public ResponseEntity<List<ActualiteDTO>> getTopActualites() {
        return ResponseEntity.ok(actualiteService.getTopPublishedActualites());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActualiteDTO> getActualiteById(@PathVariable Long id) {
        return ResponseEntity.ok(actualiteService.getActualiteById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMINISTRATEUR', 'SUPERADMIN')")
    public ResponseEntity<ActualiteDTO> createActualite(
            @Valid @RequestBody ActualiteDTO dto,
            @AuthenticationPrincipal Utilisateur user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(actualiteService.createActualite(dto, user.getId()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMINISTRATEUR', 'SUPERADMIN')")
    public ResponseEntity<ActualiteDTO> updateActualite(
            @PathVariable Long id,
            @Valid @RequestBody ActualiteDTO dto) {
        return ResponseEntity.ok(actualiteService.updateActualite(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMINISTRATEUR', 'SUPERADMIN')")
    public ResponseEntity<Void> deleteActualite(@PathVariable Long id) {
        actualiteService.deleteActualite(id);
        return ResponseEntity.noContent().build();
    }
}
