package com.clubinfo.ist.admin.controller;

import com.clubinfo.ist.admin.dto.ConformiteDashboardDto;
import com.clubinfo.ist.common.journal.EntreeJournalDto;
import com.clubinfo.ist.common.journal.JournalService;
import com.clubinfo.ist.admin.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dsi/conformite")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
@PreAuthorize("hasRole('DSI')")
@Tag(name = "Espace DSI (Audit & Conformité)", description = "Endpoints de supervision technique et de conformité en lecture seule réservés au DSI (UC-29)")
public class ConformiteController {

    private final AdminService adminService;
    private final JournalService journal;

    @GetMapping
    @Operation(summary = "Consulter le tableau de bord de conformité technique et sécurité (lecture seule) (UC-29)")
    public ResponseEntity<ConformiteDashboardDto> getConformiteDashboard() {
        return ResponseEntity.ok(adminService.getConformiteDashboard());
    }

    @GetMapping("/logs")
    @Operation(summary = "Consulter les journaux d'audit de sécurité (lecture seule) (UC-29)")
    public ResponseEntity<Page<EntreeJournalDto>> getAuditLogs(
            @RequestParam(required = false) String utilisateur,
            @RequestParam(required = false) JournalService.Resultat statut,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(journal.consulter(utilisateur, statut == null ? null : statut.name(), pageable));
    }
}
