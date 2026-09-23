package com.clubinfo.ist.admin.controller;

import com.clubinfo.ist.admin.dto.SecurityAlertDto;
import com.clubinfo.ist.admin.entity.AuditLog;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/security")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@Tag(name = "Supervision Sécurité", description = "Endpoints d'alertes de sécurité, obligation 2FA et journaux d'audit (UC-27)")
public class SecurityController {

    private final AdminService adminService;

    @GetMapping("/alerts")
    @Operation(summary = "Consulter les alertes et événements de sécurité récents (UC-27)")
    public ResponseEntity<List<SecurityAlertDto>> getSecurityAlerts() {
        return ResponseEntity.ok(adminService.getSecurityAlerts());
    }

    @PutMapping("/2fa/{userId}")
    @Operation(summary = "Imposer ou révoquer l'obligation de la double authentification pour un compte (UC-27)")
    public ResponseEntity<Map<String, String>> imposer2fa(
            @PathVariable Long userId,
            @RequestParam boolean required) {
        adminService.imposer2fa(userId, required);
        return ResponseEntity.ok(Map.of("message", "Paramètre 2FA mis à jour pour l'utilisateur ID " + userId));
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Consulter l'historique complet du journal d'audit (UC-27)")
    public ResponseEntity<Page<AuditLog>> getAuditLogs(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminService.getAuditLogs(pageable));
    }
}
