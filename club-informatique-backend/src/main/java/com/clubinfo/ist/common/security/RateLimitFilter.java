package com.clubinfo.ist.common.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limitation de débit des points d'accès sensibles, par adresse et par famille de requêtes.
 * Une connexion réussie ne consomme pas le quota : plusieurs personnes derrière une même adresse
 * (réseau de l'établissement) ne se bloquent pas mutuellement. Le verrouillage du compte lui-même
 * relève du service d'authentification.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    /** Au-delà, la table est vidée : elle ne peut pas croître sans borne. */
    private static final int TAILLE_MAXIMALE = 10_000;

    private final ProblemeWriter problemes;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Value("${app.rate-limit.auth.capacity:20}")
    private int capaciteConnexion;
    @Value("${app.rate-limit.auth.refill-duration-minutes:15}")
    private int periodeConnexionMinutes;
    @Value("${app.rate-limit.password-reset.capacity:5}")
    private int capaciteReinitialisation;
    @Value("${app.rate-limit.password-reset.refill-duration-minutes:60}")
    private int periodeReinitialisationMinutes;
    @Value("${app.rate-limit.contact.capacity:5}")
    private int capaciteContact;
    @Value("${app.rate-limit.contact.refill-duration-minutes:60}")
    private int periodeContactMinutes;

    private enum Famille { CONNEXION, INSCRIPTION, REINITIALISATION, CONTACT }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        Famille famille = familleDe(request);
        if (famille == null) {
            filterChain.doFilter(request, response);
            return;
        }
        if (buckets.size() > TAILLE_MAXIMALE) {
            buckets.clear();
        }
        String cle = request.getRemoteAddr() + ":" + famille;
        Bucket bucket = buckets.computeIfAbsent(cle, k -> creer(famille));
        if (!bucket.tryConsume(1)) {
            log.warn("Limitation de débit atteinte pour {} ({})", request.getRemoteAddr(), famille);
            problemes.ecrire(request, response, HttpStatus.TOO_MANY_REQUESTS, null, "Trop de tentatives. Réessayez dans quelques minutes.");
            return;
        }
        filterChain.doFilter(request, response);
        if (famille == Famille.CONNEXION && response.getStatus() < 400) {
            bucket.addTokens(1);
        }
    }

    private static Famille familleDe(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return null;
        }
        String chemin = request.getRequestURI();
        if (chemin.endsWith("/auth/login")) return Famille.CONNEXION;
        if (chemin.endsWith("/auth/register") || chemin.endsWith("/auth/verification")) return Famille.INSCRIPTION;
        if (chemin.endsWith("/auth/forgot-password") || chemin.endsWith("/auth/reset-password")) return Famille.REINITIALISATION;
        if (chemin.endsWith("/contact")) return Famille.CONTACT;
        return null;
    }

    private Bucket creer(Famille famille) {
        int capacite = switch (famille) {
            case CONNEXION, INSCRIPTION -> capaciteConnexion;
            case REINITIALISATION -> capaciteReinitialisation;
            case CONTACT -> capaciteContact;
        };
        int minutes = switch (famille) {
            case CONNEXION, INSCRIPTION -> periodeConnexionMinutes;
            case REINITIALISATION -> periodeReinitialisationMinutes;
            case CONTACT -> periodeContactMinutes;
        };
        Bandwidth limite = Bandwidth.builder().capacity(capacite).refillGreedy(capacite, Duration.ofMinutes(minutes)).build();
        return Bucket.builder().addLimit(limite).build();
    }
}
