package com.clubinfo.ist.common.security;

import com.clubinfo.ist.common.exception.Probleme;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/** Écrit une erreur RFC 9457 depuis un filtre, hors du traitement des contrôleurs. */
@Component
@RequiredArgsConstructor
public class ProblemeWriter {

    private final ObjectMapper objectMapper;

    public void ecrire(HttpServletRequest request, HttpServletResponse response, HttpStatus statut, String code, String detail) throws IOException {
        response.setStatus(statut.value());
        response.setContentType(Probleme.MEDIA_TYPE.toString());
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getOutputStream(), Probleme.de(statut, code, detail, request.getRequestURI()));
    }
}
