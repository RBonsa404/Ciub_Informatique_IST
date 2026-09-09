package com.example.api.controller;

import com.example.api.dto.*;
import com.example.api.service.UtilisateurService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/utilisateurs")
@RequiredArgsConstructor
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    // --- Espace Personnel Membre ---

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile(@AuthenticationPrincipal UserDetails userDetails) {
        UserProfileResponse profile = utilisateurService.getProfile(userDetails.getUsername());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserProfileResponse updated = utilisateurService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/me/password")
    public ResponseEntity<MessageResponse> changeMyPassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        MessageResponse response = utilisateurService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    // --- Conformité RGPD : Accès et Effacement ("Mes Données") ---

    @GetMapping("/me/donnees")
    public ResponseEntity<MesDonneesResponse> getMesDonnees(@AuthenticationPrincipal UserDetails userDetails) {
        MesDonneesResponse response = utilisateurService.getMesDonnees(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/me")
    public ResponseEntity<MessageResponse> demandeEffacement(@AuthenticationPrincipal UserDetails userDetails) {
        MessageResponse response = utilisateurService.demandeEffacement(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    // --- Administration & Super Admin (RBAC) ---

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'SUPER_ADMIN', 'DSI')")
    public ResponseEntity<Page<UserAdminResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Page<UserAdminResponse> users = utilisateurService.getAllUsers(PageRequest.of(page, size, sort));
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'SUPER_ADMIN', 'DSI')")
    public ResponseEntity<UserProfileResponse> getUserById(@PathVariable Long id) {
        UserProfileResponse user = utilisateurService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'SUPER_ADMIN')")
    public ResponseEntity<MessageResponse> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        MessageResponse response = utilisateurService.updateUserStatus(id, request.getStatut());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/roles")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<MessageResponse> assignRoles(
            @PathVariable Long id,
            @Valid @RequestBody AssignRolesRequest request) {
        MessageResponse response = utilisateurService.assignRoles(id, request.getRoles());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<MessageResponse> deleteUser(@PathVariable Long id) {
        MessageResponse response = utilisateurService.deleteUser(id);
        return ResponseEntity.ok(response);
    }
}
