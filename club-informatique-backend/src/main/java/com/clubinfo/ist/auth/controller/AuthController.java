package com.clubinfo.ist.auth.controller;

import com.clubinfo.ist.auth.dto.ForgotPasswordRequest;
import com.clubinfo.ist.auth.dto.LoginRequest;
import com.clubinfo.ist.auth.dto.RefreshTokenRequest;
import com.clubinfo.ist.auth.dto.RegisterRequest;
import com.clubinfo.ist.auth.dto.ResetPasswordRequest;
import com.clubinfo.ist.auth.dto.TokenResponse;
import com.clubinfo.ist.auth.dto.TotpSetupResponse;
import com.clubinfo.ist.auth.dto.TotpVerifyRequest;
import com.clubinfo.ist.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification", description = "Endpoints d'inscription, connexion, 2FA et réinitialisation de mot de passe")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Inscription d'un nouvel utilisateur (UC-05)")
    public ResponseEntity<TokenResponse> register(@Valid @RequestBody RegisterRequest request) {
        TokenResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Connexion avec email et mot de passe (UC-06)")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        TokenResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renouvellement de l'access token via refresh token (UC-06)")
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        TokenResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Déconnexion et révocation des tokens (UC-06)", security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<Map<String, String>> logout(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails != null) {
            authService.logout(userDetails.getUsername());
        }
        return ResponseEntity.ok(Map.of("message", "Déconnexion réussie"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Demande de réinitialisation de mot de passe (UC-08)")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(Map.of("message", "Si l'adresse email existe, un lien de réinitialisation a été envoyé"));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Réinitialisation du mot de passe avec le jeton reçu (UC-08)")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Mot de passe réinitialisé avec succès"));
    }

    @PostMapping("/2fa/setup")
    @Operation(summary = "Initialisation de la double authentification TOTP (UC-27)", security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<TotpSetupResponse> setup2fa(@AuthenticationPrincipal UserDetails userDetails) {
        TotpSetupResponse response = authService.setup2fa(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/2fa/verify")
    @Operation(summary = "Validation et activation de la 2FA (UC-27)", security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<Map<String, String>> verify2fa(@AuthenticationPrincipal UserDetails userDetails,
                                                         @Valid @RequestBody TotpVerifyRequest request) {
        authService.verifyAndEnable2fa(userDetails.getUsername(), request);
        return ResponseEntity.ok(Map.of("message", "Authentification à deux facteurs activée avec succès"));
    }

    @PostMapping("/2fa/disable")
    @Operation(summary = "Désactivation de la 2FA (UC-27)", security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<Map<String, String>> disable2fa(@AuthenticationPrincipal UserDetails userDetails,
                                                          @Valid @RequestBody TotpVerifyRequest request) {
        authService.disable2fa(userDetails.getUsername(), request);
        return ResponseEntity.ok(Map.of("message", "Authentification à deux facteurs désactivée"));
    }
}
