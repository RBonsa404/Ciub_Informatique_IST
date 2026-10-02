package com.clubinfo.ist.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Jetons d'accès : génération et validation.
 * Le secret de signature vient de l'environnement (JWT_SECRET). Il est obligatoire en production ;
 * hors production, un secret absent est remplacé par une clé aléatoire valable jusqu'au redémarrage.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtProvider {

    /** Longueur minimale d'un secret, en octets (HMAC-SHA-256). */
    static final int LONGUEUR_MINIMALE = 32;

    private final Environment environment;

    @Value("${app.jwt.secret:}")
    private String jwtSecret;

    @Value("${app.jwt.access-token-expiration-ms}")
    private long accessTokenExpirationMs;

    private SecretKey cle;

    @PostConstruct
    void initialiser() {
        this.cle = Keys.hmacShaKeyFor(octetsDuSecret(jwtSecret, environment.acceptsProfiles(Profiles.of("prod"))));
    }

    /**
     * Octets de la clé de signature. Un secret en base64 valide est décodé ; tout autre texte est pris tel quel.
     * Un secret absent ou trop court est refusé en production.
     */
    static byte[] octetsDuSecret(String secret, boolean production) {
        if (secret == null || secret.isBlank()) {
            if (production) {
                throw new IllegalStateException("JWT_SECRET est obligatoire en production.");
            }
            log.warn("JWT_SECRET absent : clé de signature aléatoire, les sessions seront invalidées au redémarrage.");
            byte[] aleatoire = new byte[64];
            new SecureRandom().nextBytes(aleatoire);
            return aleatoire;
        }
        byte[] octets;
        try {
            octets = Decoders.BASE64.decode(secret.trim());
        } catch (RuntimeException pasDuBase64) {
            octets = secret.getBytes(StandardCharsets.UTF_8);
        }
        if (octets.length < LONGUEUR_MINIMALE) {
            octets = secret.getBytes(StandardCharsets.UTF_8);
        }
        if (octets.length < LONGUEUR_MINIMALE) {
            throw new IllegalStateException("JWT_SECRET doit compter au moins " + LONGUEUR_MINIMALE + " octets.");
        }
        return octets;
    }

    /** Génère un jeton d'accès portant les rôles et les permissions de l'utilisateur. */
    public String generateAccessToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();
        claims.put("roles", authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .collect(Collectors.toList()));
        claims.put("permissions", authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> !a.startsWith("ROLE_"))
                .collect(Collectors.toList()));

        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpirationMs))
                .signWith(cle)
                .compact();
    }

    /** Durée de validité d'un jeton d'accès, en secondes. */
    public long accessTokenValiditySeconds() {
        return accessTokenExpirationMs / 1000;
    }

    /** Extrait le sujet (adresse électronique) du jeton. */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /** Vérifie la validité d'un jeton pour un utilisateur donné. */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Jeton d'accès invalide : {}", e.getMessage());
            return false;
        }
    }

    /** Vérifie la signature et l'expiration du jeton. */
    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser().verifyWith(cle).build().parseSignedClaims(token).getPayload();
    }
}
