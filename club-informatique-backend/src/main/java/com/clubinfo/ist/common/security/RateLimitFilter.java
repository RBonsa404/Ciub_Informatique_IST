package com.clubinfo.ist.common.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Filtre de rate limiting sur les endpoints d'authentification et de réinitialisation de mot de passe.
 * Protège contre les attaques par force brute.
 */
@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Value("${app.rate-limit.auth.capacity:5}")
    private int authCapacity;

    @Value("${app.rate-limit.auth.refill-tokens:5}")
    private int authRefillTokens;

    @Value("${app.rate-limit.auth.refill-duration-minutes:15}")
    private int authRefillDurationMinutes;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();

        // Rate limiting uniquement sur les endpoints sensibles
        if (isRateLimitedPath(path)) {
            String clientIp = getClientIp(request);
            String bucketKey = clientIp + ":" + path;
            Bucket bucket = buckets.computeIfAbsent(bucketKey, k -> createBucket());

            if (bucket.tryConsume(1)) {
                filterChain.doFilter(request, response);
            } else {
                log.warn("Rate limit dépassé pour IP {} sur {}", clientIp, path);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write(
                        "{\"timestamp\":\"" + java.time.LocalDateTime.now() + "\"," +
                        "\"status\":429," +
                        "\"error\":\"Trop de requêtes\"," +
                        "\"message\":\"Vous avez dépassé le nombre de requêtes autorisées. Réessayez dans quelques minutes.\"," +
                        "\"errorCode\":\"RATE_LIMIT_EXCEEDED\"}"
                );
                return;
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }

    private boolean isRateLimitedPath(String path) {
        return path.contains("/auth/login")
                || path.contains("/auth/register")
                || path.contains("/auth/forgot-password")
                || path.contains("/auth/reset-password");
    }

    private Bucket createBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(authCapacity)
                .refillGreedy(authRefillTokens, Duration.ofMinutes(authRefillDurationMinutes))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
