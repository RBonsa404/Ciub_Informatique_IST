package com.clubinfo.ist.admin.controller;

import com.clubinfo.ist.admin.dto.StatistiquesDashboardDto;
import com.clubinfo.ist.admin.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/statistiques")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
@PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
@Tag(name = "Tableau de Bord Statistiques", description = "Endpoints de métriques, analytiques et indicateurs de performance du club (UC-26)")
public class StatistiquesController {

    private final AdminService adminService;

    @GetMapping
    @Operation(summary = "Consulter les statistiques globales du club (membres, activités, projets, fréquentation) (UC-26)")
    public ResponseEntity<StatistiquesDashboardDto> getStatistiques() {
        return ResponseEntity.ok(adminService.getStatistiquesDashboard());
    }
}
