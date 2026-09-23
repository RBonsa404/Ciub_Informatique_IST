package com.clubinfo.ist.user.controller;

import com.clubinfo.ist.user.dto.UserCreateDto;
import com.clubinfo.ist.user.dto.UserDto;
import com.clubinfo.ist.user.dto.UserRoleUpdateDto;
import com.clubinfo.ist.user.dto.UserUpdateDto;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import com.clubinfo.ist.user.service.UserService;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@Tag(name = "Administration Utilisateurs", description = "Endpoints d'administration des utilisateurs et rôles (UC-23, UC-24)")
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "Lister les utilisateurs avec pagination (UC-23)")
    public ResponseEntity<Page<UserDto>> getAllUsers(@PageableDefault(size = 20) Pageable pageable) {
        Page<UserDto> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter les détails d'un utilisateur par ID (UC-23)")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        UserDto user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PostMapping
    @Operation(summary = "Créer manuellement un utilisateur par l'administrateur (UC-23)")
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody UserCreateDto dto) {
        UserDto created = userService.createUser(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour les informations d'un utilisateur (UC-23)")
    public ResponseEntity<UserDto> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateDto dto) {
        UserDto updated = userService.updateUser(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Désactiver / suspendre un utilisateur (soft-delete) (UC-23)")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "Utilisateur désactivé avec succès"));
    }

    @PutMapping("/{id}/roles")
    @Operation(summary = "Attribuer ou modifier les rôles d'un utilisateur (UC-24)")
    public ResponseEntity<UserDto> updateUserRoles(@PathVariable Long id, @Valid @RequestBody UserRoleUpdateDto dto) {
        UserDto updated = userService.updateUserRoles(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Changer le statut d'un compte (ACTIF, SUSPENDU, EN_ATTENTE) (UC-23)")
    public ResponseEntity<UserDto> updateUserStatus(
            @PathVariable Long id,
            @RequestParam StatutUtilisateur statut) {
        UserDto updated = userService.updateUserStatus(id, statut);
        return ResponseEntity.ok(updated);
    }
}
