package com.example.api.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setCharacterEncoding("UTF-8");

        String json = String.format(
                "{\"timestamp\":\"%s\",\"status\":401,\"code\":\"UNAUTHORIZED\",\"message\":\"Authentification requise pour accéder à cette ressource\",\"path\":\"%s\"}",
                LocalDateTime.now(), request.getRequestURI()
        );

        response.getWriter().write(json);
    }
}