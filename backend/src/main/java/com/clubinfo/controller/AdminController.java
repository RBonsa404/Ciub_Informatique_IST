package com.clubinfo.controller;

import com.clubinfo.dto.MessageContactDTO;
import com.clubinfo.dto.UserDTO;
import com.clubinfo.entity.AuditLog;
import com.clubinfo.entity.StatutUtilisateur;
import com.clubinfo.entity.Utilisateur;
import com.clubinfo.service.AuditService;
import com.clubinfo.service.MessageContactService;
import com.clubinfo.service.UtilisateurService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'SUPERADMIN', 'DSI')")
@RequiredArgsConstructor
public class AdminController {

    private final UtilisateurService utilisateurService;
    private final MessageContactService messageContactService;
    private final AuditService auditService;

    @GetMapping("/users")
    public ResponseEntity<Page<UserDTO>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(utilisateurService.getAllUsers(PageRequest.of(page, size)));
    }

    @PatchMapping("/users/{id}/statut")
    public ResponseEntity<UserDTO> updateUserStatus(
            @PathVariable Long id,
            @RequestParam StatutUtilisateur statut) {
        return ResponseEntity.ok(utilisateurService.updateStatut(id, statut));
    }

    @GetMapping("/messages")
    public ResponseEntity<Page<MessageContactDTO>> getMessages(
            @RequestParam(defaultValue = "false") boolean seulementNonTraites,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(messageContactService.getMessages(seulementNonTraites, PageRequest.of(page, size)));
    }

    @PatchMapping("/messages/{id}/traite")
    public ResponseEntity<MessageContactDTO> markMessageAsTraite(
            @PathVariable Long id,
            @AuthenticationPrincipal Utilisateur user) {
        return ResponseEntity.ok(messageContactService.marquerTraite(id, user.getId()));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<Page<AuditLog>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditService.getAuditLogs(PageRequest.of(page, size)));
    }
}
