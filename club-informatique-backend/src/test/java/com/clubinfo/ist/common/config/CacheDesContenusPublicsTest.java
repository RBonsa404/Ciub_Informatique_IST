package com.clubinfo.ist.common.config;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class CacheDesContenusPublicsTest {

    private final AtomicInteger appels = new AtomicInteger();
    private final CacheDesContenusPublics cache = new CacheDesContenusPublics("/bureau", "/actualites");

    private final FilterChain controleur = (requete, reponse) -> {
        appels.incrementAndGet();
        reponse.setContentType("application/json");
        reponse.getOutputStream().write(("{\"n\":" + appels.get() + "}").getBytes(StandardCharsets.UTF_8));
    };

    private MockHttpServletResponse executer(String methode, String chemin, String autorisation) throws Exception {
        MockHttpServletRequest requete = new MockHttpServletRequest(methode, "/api/v1" + chemin);
        requete.setContextPath("/api/v1");
        if (autorisation != null) {
            requete.addHeader(HttpHeaders.AUTHORIZATION, autorisation);
        }
        MockHttpServletResponse reponse = new MockHttpServletResponse();
        cache.doFilter(requete, reponse, controleur);
        return reponse;
    }

    @Test
    @DisplayName("Une page publique demandée deux fois n'appelle le serveur qu'une fois, avec la même réponse")
    void reponseConservee() throws Exception {
        String premiere = executer("GET", "/bureau", null).getContentAsString();
        String seconde = executer("GET", "/bureau", null).getContentAsString();
        assertThat(appels).hasValue(1);
        assertThat(seconde).isEqualTo(premiere);
    }

    @Test
    @DisplayName("Toute modification réussie vide le cache : la page suivante est recalculée")
    void modificationVideLeCache() throws Exception {
        executer("GET", "/bureau", null);
        executer("PUT", "/bureau/1", "Bearer x");
        executer("GET", "/bureau", null);
        assertThat(appels).hasValue(3);
    }

    @Test
    @DisplayName("Les requêtes authentifiées et les adresses non publiques ne sont jamais mises en cache")
    void horsCache() throws Exception {
        executer("GET", "/bureau", "Bearer x");
        executer("GET", "/bureau", "Bearer x");
        executer("GET", "/users/me", null);
        executer("GET", "/users/me", null);
        assertThat(appels).hasValue(4);
        assertThat(cache.taille()).isZero();
    }
}
