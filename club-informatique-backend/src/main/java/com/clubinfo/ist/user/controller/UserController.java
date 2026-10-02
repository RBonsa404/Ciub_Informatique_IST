package com.clubinfo.ist.user.controller;

import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.user.dto.CompteDtos.ChangementMotDePasse;
import com.clubinfo.ist.user.dto.CompteDtos.Preferences;
import com.clubinfo.ist.user.dto.CompteDtos.Profil;
import com.clubinfo.ist.user.dto.CompteDtos.ProfilMiseAJour;
import com.clubinfo.ist.user.dto.CompteDtos.SuppressionCompte;
import com.clubinfo.ist.user.service.CompteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/users/me")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Compte", description = "Profil, mot de passe, préférences, export et suppression du compte connecté")
public class UserController {

    private final CompteService comptes;

    @GetMapping
    @Operation(summary = "Profil de l'utilisateur connecté")
    public ResponseEntity<Profil> profil(@AuthenticationPrincipal UserDetailsImpl connecte) {
        return ResponseEntity.ok(comptes.profil(connecte.getId()));
    }

    @PutMapping
    @Operation(summary = "Modifier son profil")
    public ResponseEntity<Profil> modifier(@AuthenticationPrincipal UserDetailsImpl connecte, @Valid @RequestBody ProfilMiseAJour modification) {
        return ResponseEntity.ok(comptes.modifier(connecte.getId(), modification));
    }

    @PutMapping("/password")
    @Operation(summary = "Changer son mot de passe ; lève l'indicateur de changement obligatoire")
    public ResponseEntity<Void> changerMotDePasse(@AuthenticationPrincipal UserDetailsImpl connecte,
                                                  @Valid @RequestBody ChangementMotDePasse demande, HttpServletResponse reponse) {
        comptes.changerMotDePasse(connecte.getId(), demande, reponse);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/preferences")
    @Operation(summary = "Préférences de notification")
    public ResponseEntity<Preferences> preferences(@AuthenticationPrincipal UserDetailsImpl connecte) {
        return ResponseEntity.ok(comptes.preferences(connecte.getId()));
    }

    @PutMapping("/preferences")
    @Operation(summary = "Modifier ses préférences de notification")
    public ResponseEntity<Preferences> modifierPreferences(@AuthenticationPrincipal UserDetailsImpl connecte, @Valid @RequestBody Preferences preferences) {
        return ResponseEntity.ok(comptes.modifierPreferences(connecte.getId(), preferences));
    }

    @GetMapping("/export")
    @Operation(summary = "Copie des données personnelles du compte (droit d'accès)")
    public ResponseEntity<Map<String, Object>> exporter(@AuthenticationPrincipal UserDetailsImpl connecte) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename("mes-donnees.json").build().toString())
                .body(comptes.exporter(connecte.getId()));
    }

    @PostMapping("/suppression")
    @Operation(summary = "Supprimer son compte, après confirmation par le mot de passe")
    public ResponseEntity<Void> supprimer(@AuthenticationPrincipal UserDetailsImpl connecte, @Valid @RequestBody SuppressionCompte demande) {
        comptes.supprimer(connecte.getId(), demande.motDePasse());
        return ResponseEntity.noContent().build();
    }
}
