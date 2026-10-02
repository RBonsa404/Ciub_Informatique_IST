package com.clubinfo.ist.common.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Attribue un identifiant à chaque requête : il figure dans toutes les lignes de journal qu'elle produit et dans
 * l'en-tête « X-Request-Id » de la réponse, ce qui permet de retrouver le déroulement d'une requête signalée.
 * Une ligne d'accès est écrite par requête : méthode, chemin, statut, durée. Ni paramètres ni corps n'y figurent.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {

    public static final String EN_TETE = "X-Request-Id";
    private static final String CLE = "requete";
    private static final Pattern IDENTIFIANT_RECU = Pattern.compile("[A-Za-z0-9-]{8,64}");
    private static final Logger ACCES = LoggerFactory.getLogger("acces");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String recu = request.getHeader(EN_TETE);
        String identifiant = recu != null && IDENTIFIANT_RECU.matcher(recu).matches() ? recu : UUID.randomUUID().toString();
        long debut = System.nanoTime();
        MDC.put(CLE, identifiant);
        response.setHeader(EN_TETE, identifiant);
        try {
            filterChain.doFilter(request, response);
        } finally {
            if (!request.getRequestURI().contains("/actuator/health")) {
                ACCES.info("{} {} {} {} ms", request.getMethod(), request.getRequestURI(), response.getStatus(), (System.nanoTime() - debut) / 1_000_000);
            }
            MDC.remove(CLE);
        }
    }
}
