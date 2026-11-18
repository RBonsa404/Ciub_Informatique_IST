package com.clubinfo.ist.common.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.time.Duration;
import java.util.Arrays;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Cache en mémoire des réponses publiques consultées sans être connecté : la même page demandée plusieurs fois est
 * servie sans requête à la base (hébergée à l'étranger) ni travail du serveur, dont le processeur est limité.
 * Toute modification réussie (POST, PUT, PATCH, DELETE) vide le cache : un contenu changé n'est jamais servi périmé.
 * Durée de vie courte en filet de sécurité (dates qui passent, compteurs de places).
 */
public class CacheDesContenusPublics extends OncePerRequestFilter {

    private static final Duration DUREE = Duration.ofSeconds(60);
    private static final int ENTREES_MAX = 300;
    private static final int TAILLE_MAX = 512 * 1024;

    private record Reponse(byte[] corps, String typeDeContenu, long expireA) {
    }

    private final Map<String, Reponse> reponses = new ConcurrentHashMap<>();
    private final String[] motifs;
    private final AntPathMatcher chemins = new AntPathMatcher();

    public CacheDesContenusPublics(String... motifs) {
        this.motifs = motifs;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest requete, HttpServletResponse reponse, FilterChain suite)
            throws ServletException, IOException {
        String methode = requete.getMethod();
        if (!"GET".equals(methode) && !"HEAD".equals(methode) && !"OPTIONS".equals(methode)) {
            try {
                suite.doFilter(requete, reponse);
            } finally {
                if (reponse.getStatus() < 400) {
                    reponses.clear();
                }
            }
            return;
        }
        if (!"GET".equals(methode) || requete.getHeader(HttpHeaders.AUTHORIZATION) != null || !public_(requete)) {
            suite.doFilter(requete, reponse);
            return;
        }

        String cle = chemin(requete) + (requete.getQueryString() == null ? "" : "?" + requete.getQueryString());
        long maintenant = System.currentTimeMillis();
        Reponse enCache = reponses.get(cle);
        if (enCache != null && enCache.expireA() > maintenant) {
            reponse.setStatus(HttpServletResponse.SC_OK);
            reponse.setHeader(HttpHeaders.CACHE_CONTROL, "no-cache");
            reponse.setContentType(enCache.typeDeContenu());
            reponse.setContentLength(enCache.corps().length);
            reponse.getOutputStream().write(enCache.corps());
            return;
        }

        ContentCachingResponseWrapper enveloppe = new ContentCachingResponseWrapper(reponse);
        suite.doFilter(requete, enveloppe);
        byte[] corps = enveloppe.getContentAsByteArray();
        if (enveloppe.getStatus() == HttpServletResponse.SC_OK && corps.length <= TAILLE_MAX && enveloppe.getContentType() != null) {
            if (reponses.size() >= ENTREES_MAX) {
                reponses.entrySet().removeIf(entree -> entree.getValue().expireA() <= maintenant);
                if (reponses.size() >= ENTREES_MAX) {
                    reponses.clear();
                }
            }
            reponses.put(cle, new Reponse(corps, enveloppe.getContentType(), maintenant + DUREE.toMillis()));
        }
        enveloppe.copyBodyToResponse();
    }

    private boolean public_(HttpServletRequest requete) {
        String chemin = chemin(requete);
        return Arrays.stream(motifs).anyMatch(motif -> chemins.match(motif, chemin));
    }

    /** Chemin sans le préfixe de contexte (/api/v1). */
    private static String chemin(HttpServletRequest requete) {
        String uri = requete.getRequestURI();
        String contexte = requete.getContextPath();
        return contexte != null && !contexte.isEmpty() && uri.startsWith(contexte) ? uri.substring(contexte.length()) : uri;
    }

    /** Pour les tests : nombre de réponses actuellement conservées. */
    int taille() {
        return reponses.size();
    }
}
