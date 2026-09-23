package com.clubinfo.ist.user.controller;

import com.clubinfo.ist.user.dto.PermissionDto;
import com.clubinfo.ist.user.dto.RoleDto;
import com.clubinfo.ist.user.service.RolePermissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@Tag(name = "Administration Rôles & Permissions", description = "Endpoints de gestion des rôles et permissions du système (UC-24)")
public class RolePermissionController {

    private final RolePermissionService rolePermissionService;

    @GetMapping("/roles")
    @Operation(summary = "Lister tous les rôles du système (UC-24)")
    public ResponseEntity<List<RoleDto>> getAllRoles() {
        return ResponseEntity.ok(rolePermissionService.getAllRoles());
    }

    @GetMapping("/roles/{id}")
    @Operation(summary = "Consulter un rôle par son ID (UC-24)")
    public ResponseEntity<RoleDto> getRoleById(@PathVariable Long id) {
        return ResponseEntity.ok(rolePermissionService.getRoleById(id));
    }

    @PostMapping("/roles")
    @Operation(summary = "Créer un nouveau rôle personnalisé (UC-24)")
    public ResponseEntity<RoleDto> createRole(
            @RequestParam String nom,
            @RequestParam(required = false) String description,
            @RequestBody(required = false) Set<String> permissions) {
        RoleDto created = rolePermissionService.createRole(nom, description, permissions);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/roles/{id}/permissions")
    @Operation(summary = "Modifier les permissions associées à un rôle (UC-24)")
    public ResponseEntity<RoleDto> updateRolePermissions(
            @PathVariable Long id,
            @RequestBody Set<String> permissions) {
        RoleDto updated = rolePermissionService.updateRolePermissions(id, permissions);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/permissions")
    @Operation(summary = "Lister toutes les permissions disponibles dans le système (UC-24)")
    public ResponseEntity<List<PermissionDto>> getAllPermissions() {
        return ResponseEntity.ok(rolePermissionService.getAllPermissions());
    }
}
