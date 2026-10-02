package com.clubinfo.ist.common.security;

import com.clubinfo.ist.admin.service.ParametresService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Mode maintenance : quand le Super Admin l'active, le site ne répond plus qu'à l'administration.
 * La connexion et la sonde de santé restent ouvertes, sans quoi personne ne pourrait le désactiver.
 */
@Component
@RequiredArgsConstructor
public class MaintenanceFilter extends OncePerRequestFilter {

    private static final Set<String> ADMINISTRATION = Set.of("ROLE_ADMIN", "ROLE_SUPER_ADMIN");

    private final ParametresService parametres;
    private final ProblemeWriter problemes;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (parametres.reglages().maintenanceMode() && !toujoursOuvert(request) && !administrateur()) {
            problemes.ecrire(request, response, HttpStatus.SERVICE_UNAVAILABLE, "MAINTENANCE",
                    "Le site est en maintenance. Merci de revenir un peu plus tard.");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private static boolean toujoursOuvert(HttpServletRequest request) {
        String chemin = request.getRequestURI().substring(request.getContextPath().length());
        return chemin.startsWith("/auth/") || chemin.startsWith("/actuator/health");
    }

    private static boolean administrateur() {
        Authentication authentification = SecurityContextHolder.getContext().getAuthentication();
        return authentification != null && authentification.getAuthorities().stream().anyMatch(droit -> ADMINISTRATION.contains(droit.getAuthority()));
    }
}
