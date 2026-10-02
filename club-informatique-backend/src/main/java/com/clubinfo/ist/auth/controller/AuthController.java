package com.clubinfo.ist.auth.controller;

import com.clubinfo.ist.auth.dto.AuthDtos.DemandeReinitialisation;
import com.clubinfo.ist.auth.dto.AuthDtos.Identifiants;
import com.clubinfo.ist.auth.dto.AuthDtos.InscriptionCompte;
import com.clubinfo.ist.auth.dto.AuthDtos.JetonVerification;
import com.clubinfo.ist.auth.dto.AuthDtos.Message;
import com.clubinfo.ist.auth.dto.AuthDtos.Reinitialisation;
import com.clubinfo.ist.auth.dto.AuthDtos.Session;
import com.clubinfo.ist.auth.service.AuthService;
import com.clubinfo.ist.auth.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification", description = "Inscription, vérification d'adresse, session et réinitialisation du mot de passe")
public class AuthController {

    private static final Message INSCRIPTION_RECUE = new Message(
            "Si cette adresse peut recevoir un compte, un courriel vient de lui être envoyé. Ouvrez le lien qu'il contient pour continuer.");

    private final AuthService authentification;
    private final SessionService sessions;

    @PostMapping("/register")
    @Operation(summary = "Créer un compte et envoyer le courriel de vérification ; réponse identique que l'adresse existe ou non")
    public ResponseEntity<Message> inscrire(@Valid @RequestBody InscriptionCompte demande) {
        authentification.inscrire(demande);
        return ResponseEntity.status(HttpStatus.CREATED).body(INSCRIPTION_RECUE);
    }

    @PostMapping("/verification")
    @Operation(summary = "Activer le compte à partir du jeton reçu par courriel (usage unique)")
    public ResponseEntity<Void> verifier(@Valid @RequestBody JetonVerification demande) {
        authentification.verifier(demande.jeton());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/login")
    @Operation(summary = "Ouvrir une session ; pose le cookie de rafraîchissement HttpOnly")
    public ResponseEntity<Session> connecter(@Valid @RequestBody Identifiants identifiants, HttpServletResponse reponse) {
        return ResponseEntity.ok(authentification.connecter(identifiants, reponse));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renouveler la session à partir du cookie ; fait tourner le jeton et détecte sa réutilisation")
    public ResponseEntity<Session> renouveler(@CookieValue(name = SessionService.COOKIE, required = false) String jeton, HttpServletResponse reponse) {
        return ResponseEntity.ok(sessions.renouveler(jeton, reponse));
    }

    @PostMapping("/logout")
    @Operation(summary = "Fermer la session : révoque le jeton de rafraîchissement et efface le cookie")
    public ResponseEntity<Void> deconnecter(@CookieValue(name = SessionService.COOKIE, required = false) String jeton, HttpServletResponse reponse) {
        sessions.fermer(jeton, reponse);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Demander un lien de réinitialisation ; réponse identique que le compte existe ou non")
    public ResponseEntity<Void> demanderReinitialisation(@Valid @RequestBody DemandeReinitialisation demande) {
        authentification.demanderReinitialisation(demande.email());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Choisir un nouveau mot de passe ; ferme toutes les sessions")
    public ResponseEntity<Void> reinitialiser(@Valid @RequestBody Reinitialisation demande) {
        authentification.reinitialiser(demande);
        return ResponseEntity.noContent().build();
    }
}
