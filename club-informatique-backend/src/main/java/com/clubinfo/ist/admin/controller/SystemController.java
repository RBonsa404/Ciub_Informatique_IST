package com.clubinfo.ist.admin.controller;

import com.clubinfo.ist.admin.dto.SystemConfigDto;
import com.clubinfo.ist.admin.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/admin/system")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Configuration Système", description = "Endpoints de paramétrage global et maintenance réservés au Super Admin (UC-28)")
public class SystemController {

    private final AdminService adminService;

    @GetMapping("/config")
    @Operation(summary = "Consulter les paramètres globaux du système (UC-28)")
    public ResponseEntity<SystemConfigDto> getSystemConfig() {
        return ResponseEntity.ok(adminService.getSystemConfig());
    }

    @PutMapping("/config")
    @Operation(summary = "Mettre à jour les paramètres globaux du système (UC-28)")
    public ResponseEntity<SystemConfigDto> updateSystemConfig(@Valid @RequestBody SystemConfigDto dto) {
        return ResponseEntity.ok(adminService.updateSystemConfig(dto));
    }

    @PostMapping("/backup")
    @Operation(summary = "Déclencher une sauvegarde manuelle de la base de données (UC-28)")
    public ResponseEntity<Map<String, String>> triggerBackup() {
        return ResponseEntity.ok(adminService.triggerBackup());
    }
}
