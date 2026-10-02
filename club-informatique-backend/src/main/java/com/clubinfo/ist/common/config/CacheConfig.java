package com.clubinfo.ist.common.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.filter.ShallowEtagHeaderFilter;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Cache conditionnel des contenus publics : chaque réponse porte un ETag et doit être revalidée (« no-cache »).
 * Le navigateur redemande donc toujours, mais reçoit un 304 sans corps tant que rien n'a changé : un compteur de
 * places ou une actualité retirée ne restent jamais affichés à tort. Les réponses authentifiées ne sont pas concernées.
 */
@Configuration
public class CacheConfig implements WebMvcConfigurer {

    private static final String[] CONTENUS_PUBLICS = {
            "/pages/*", "/bureau", "/categories", "/categories/*",
            "/actualites", "/actualites/slug/*", "/evenements", "/evenements/slug/*",
            "/formations", "/formations/slug/*", "/projets", "/projets/slug/*", "/ressources/publiques"
    };

    @Bean
    public FilterRegistrationBean<ShallowEtagHeaderFilter> etagDesContenusPublics() {
        FilterRegistrationBean<ShallowEtagHeaderFilter> filtre = new FilterRegistrationBean<>(new ShallowEtagHeaderFilter());
        filtre.addUrlPatterns(CONTENUS_PUBLICS);
        filtre.setName("etagDesContenusPublics");
        return filtre;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registre) {
        registre.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest requete, HttpServletResponse reponse, Object gestionnaire) {
                if ("GET".equals(requete.getMethod()) && requete.getHeader(HttpHeaders.AUTHORIZATION) == null) {
                    reponse.setHeader(HttpHeaders.CACHE_CONTROL, "no-cache");
                }
                return true;
            }
        }).addPathPatterns(CONTENUS_PUBLICS);
    }
}
