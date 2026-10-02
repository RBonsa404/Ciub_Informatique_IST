package com.clubinfo.ist.auth.service;

import com.clubinfo.ist.auth.dto.AuthDtos.Session;
import com.clubinfo.ist.auth.dto.AuthDtos.UtilisateurCourant;
import com.clubinfo.ist.auth.entity.RefreshToken;
import com.clubinfo.ist.auth.repository.RefreshTokenRepository;
import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.security.Jetons;
import com.clubinfo.ist.common.security.JwtProvider;
import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Sessions : jeton d'accès court renvoyé dans la réponse, jeton de rafraîchissement dans un cookie HttpOnly,
 * remplacé à chaque renouvellement. La présentation d'un jeton déjà remplacé ferme toutes les sessions du compte.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    public static final String COOKIE = "club_session";

    /** Deux onglets peuvent renouveler en même temps avec le même cookie : le second n'est pas pris pour un vol. */
    private static final Duration TOLERANCE_DE_ROTATION = Duration.ofSeconds(10);

    private final RefreshTokenRepository sessions;
    private final UtilisateurRepository utilisateurs;
    private final JwtProvider jwtProvider;

    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long dureeMs;
    @Value("${app.cookie.secure:false}")
    private boolean cookieSecurise;
    @Value("${server.servlet.context-path:}")
    private String prefixe;

    /** Ouvre une session pour le compte et pose le cookie. */
    @Transactional
    public Session ouvrir(Utilisateur utilisateur, boolean persistant, HttpServletResponse reponse) {
        String jeton = Jetons.aleatoire();
        sessions.save(RefreshToken.builder()
                .empreinte(Jetons.empreinte(jeton))
                .utilisateur(utilisateur)
                .dateExpiration(LocalDateTime.now().plus(Duration.ofMillis(dureeMs)))
                .persistant(persistant)
                .build());
        poser(reponse, jeton, persistant ? Duration.ofMillis(dureeMs) : null);
        return description(utilisateur);
    }

    /** Renouvelle la session portée par le cookie : nouveau jeton d'accès, nouveau cookie. */
    @Transactional(noRollbackFor = BusinessException.class)
    public Session renouveler(String jeton, HttpServletResponse reponse) {
        RefreshToken session = jeton == null || jeton.isBlank() ? null : sessions.findByEmpreinte(Jetons.empreinte(jeton)).orElse(null);
        if (session == null) {
            throw expiree(reponse);
        }
        Utilisateur utilisateur = session.getUtilisateur();
        if (Boolean.TRUE.equals(session.getRevoque())) {
            boolean rotationRecente = session.getRevoqueLe() != null
                    && session.getRevoqueLe().isAfter(LocalDateTime.now().minus(TOLERANCE_DE_ROTATION));
            if (!rotationRecente) {
                log.warn("Jeton de session déjà remplacé présenté de nouveau : sessions du compte {} fermées", utilisateur.getId());
                fermerToutes(utilisateur);
            }
            throw expiree(reponse);
        }
        if (session.estExpire() || utilisateur.isDeleted() || utilisateur.getStatut() != StatutUtilisateur.ACTIF) {
            session.revoquer();
            throw expiree(reponse);
        }
        session.revoquer();
        return ouvrir(utilisateur, Boolean.TRUE.equals(session.getPersistant()), reponse);
    }

    /** Ferme la session portée par le cookie et efface celui-ci. */
    @Transactional
    public void fermer(String jeton, HttpServletResponse reponse) {
        if (jeton != null && !jeton.isBlank()) {
            sessions.findByEmpreinte(Jetons.empreinte(jeton)).ifPresent(RefreshToken::revoquer);
        }
        effacer(reponse);
    }

    /**
     * Ferme toutes les sessions du compte : les cookies ne renouvellent plus rien et les jetons d'accès
     * déjà émis sont refusés (leur version de session est dépassée).
     */
    @Transactional
    public void fermerToutes(Utilisateur utilisateur) {
        sessions.revoquerToutes(utilisateur.getId(), LocalDateTime.now());
        utilisateurs.incrementerVersionSession(utilisateur.getId());
    }

    /** Ferme toutes les sessions puis en rouvre une pour l'appareil courant. */
    @Transactional
    public Session reouvrirSeule(Utilisateur utilisateur, HttpServletResponse reponse) {
        boolean persistant = sessions.aUneSessionPersistante(utilisateur.getId());
        fermerToutes(utilisateur);
        Utilisateur aJour = utilisateurs.findById(utilisateur.getId()).orElseThrow();
        return ouvrir(aJour, persistant, reponse);
    }

    public Session description(Utilisateur utilisateur) {
        List<String> roles = utilisateur.getRoles().stream()
                .map(role -> role.getNom().replaceFirst("^ROLE_", ""))
                .sorted()
                .toList();
        return new Session(
                jwtProvider.generateAccessToken(new UserDetailsImpl(utilisateur)),
                jwtProvider.accessTokenValiditySeconds(),
                new UtilisateurCourant(utilisateur.getId(), utilisateur.getEmail(), utilisateur.getNom(), utilisateur.getPrenom(), roles,
                        Boolean.TRUE.equals(utilisateur.getChangementMotDePasseRequis())));
    }

    private BusinessException expiree(HttpServletResponse reponse) {
        effacer(reponse);
        return new BusinessException("Votre session a expiré. Veuillez vous reconnecter.", HttpStatus.UNAUTHORIZED, "SESSION_EXPIREE");
    }

    private void effacer(HttpServletResponse reponse) {
        poser(reponse, "", Duration.ZERO);
    }

    /** Cookie limité aux routes d'authentification, illisible par les scripts, jamais envoyé depuis un autre site. */
    private void poser(HttpServletResponse reponse, String valeur, Duration duree) {
        ResponseCookie.ResponseCookieBuilder cookie = ResponseCookie.from(COOKIE, valeur)
                .httpOnly(true)
                .secure(cookieSecurise)
                .sameSite("Strict")
                .path(prefixe + "/auth");
        if (duree != null) {
            cookie.maxAge(duree);
        }
        reponse.addHeader(HttpHeaders.SET_COOKIE, cookie.build().toString());
    }
}
