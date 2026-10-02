package com.clubinfo.ist.common.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/** Réponses 401 et 403 de la chaîne de sécurité, au format RFC 9457. */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final ProblemeWriter problemes;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException {
        problemes.ecrire(request, response, HttpStatus.UNAUTHORIZED, null, "Votre session est absente ou a expiré. Veuillez vous reconnecter.");
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) throws IOException {
        problemes.ecrire(request, response, HttpStatus.FORBIDDEN, null, "Vous n’avez pas les droits nécessaires pour cette opération.");
    }
}
