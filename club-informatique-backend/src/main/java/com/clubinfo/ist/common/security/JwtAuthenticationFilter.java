package com.clubinfo.ist.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Authentifie la requête à partir du jeton d'accès. Le compte est relu à chaque requête : un compte suspendu,
 * supprimé, ou dont les sessions ont été fermées (changement de mot de passe, par exemple) n'est plus reconnu,
 * même si son jeton n'a pas encore expiré.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final UserDetailsService userDetailsService;
    private final ProblemeWriter problemes;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        UserDetailsImpl compte = compteAuthentifie(request);
        if (compte != null) {
            if (compte.isChangementMotDePasseRequis() && !permisAvantChangement(request)) {
                problemes.ecrire(request, response, HttpStatus.FORBIDDEN, "CHANGEMENT_MOT_DE_PASSE_REQUIS",
                        "Vous devez d'abord choisir un nouveau mot de passe.");
                return;
            }
            UsernamePasswordAuthenticationToken authentification = new UsernamePasswordAuthenticationToken(compte, null, compte.getAuthorities());
            authentification.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentification);
        }
        filterChain.doFilter(request, response);
    }

    private UserDetailsImpl compteAuthentifie(HttpServletRequest request) {
        String jeton = jetonDe(request);
        if (jeton == null || !jwtProvider.isTokenValid(jeton)) {
            return null;
        }
        try {
            UserDetails charge = userDetailsService.loadUserByUsername(jwtProvider.extractUsername(jeton));
            if (charge instanceof UserDetailsImpl compte
                    && compte.isEnabled()
                    && jwtProvider.isTokenValid(jeton, compte)
                    && jwtProvider.versionDeSession(jeton) == compte.getVersionSession()) {
                return compte;
            }
        } catch (RuntimeException erreur) {
            log.debug("Jeton d'accès non reconnu : {}", erreur.getMessage());
        }
        return null;
    }

    /** Avant le changement d'un mot de passe imposé : consulter son profil, changer le mot de passe, gérer sa session. */
    private static boolean permisAvantChangement(HttpServletRequest request) {
        String chemin = request.getRequestURI().substring(request.getContextPath().length());
        return chemin.startsWith("/auth/")
                || chemin.equals("/users/me/password")
                || (chemin.equals("/users/me") && "GET".equalsIgnoreCase(request.getMethod()));
    }

    private static String jetonDe(HttpServletRequest request) {
        String entete = request.getHeader("Authorization");
        return StringUtils.hasText(entete) && entete.startsWith("Bearer ") ? entete.substring(7) : null;
    }
}
