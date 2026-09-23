package com.clubinfo.ist.user.controller;

import com.clubinfo.ist.user.dto.ChangePasswordDto;
import com.clubinfo.ist.user.dto.UserDto;
import com.clubinfo.ist.user.dto.UserUpdateDto;
import com.clubinfo.ist.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Profil Utilisateur", description = "Endpoints de consultation et modification du profil personnel (UC-07)")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Consulter son propre profil (UC-07)")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        UserDto profile = userService.getCurrentUserProfile(userDetails.getUsername());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/me")
    @Operation(summary = "Mettre à jour ses informations de profil (UC-07)")
    public ResponseEntity<UserDto> updateCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UserUpdateDto dto) {
        UserDto updated = userService.updateCurrentUserProfile(userDetails.getUsername(), dto);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/me/password")
    @Operation(summary = "Changer son mot de passe (UC-07)")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordDto dto) {
        userService.changePassword(userDetails.getUsername(), dto);
        return ResponseEntity.ok(Map.of("message", "Mot de passe modifié avec succès"));
    }
}
