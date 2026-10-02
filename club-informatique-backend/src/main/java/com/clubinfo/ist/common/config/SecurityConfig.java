package com.clubinfo.ist.common.config;

import com.clubinfo.ist.common.security.JwtAuthenticationEntryPoint;
import com.clubinfo.ist.common.security.JwtAuthenticationFilter;
import com.clubinfo.ist.common.security.MaintenanceFilter;
import com.clubinfo.ist.common.security.RateLimitFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

/**
 * Sécurité de l'API : sessions sans état, jeton d'accès, règles par rôle, en-têtes de sécurité, limitation de débit.
 * Les règles de propriété des ressources sont appliquées dans les services.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    /** L'API ne renvoie que des données : aucune ressource active n'est autorisée par la politique de contenu. */
    private static final String POLITIQUE_DE_CONTENU = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";
    private static final String POLITIQUE_DE_PERMISSIONS = "camera=(), microphone=(), geolocation=(), payment=()";

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final MaintenanceFilter maintenanceFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final RateLimitFilter rateLimitFilter;
    private final UserDetailsService userDetailsService;

    @Value("${app.security.bcrypt-strength:12}")
    private int coutDuHachage;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> {})
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                    .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                    .accessDeniedHandler(jwtAuthenticationEntryPoint))
            .headers(headers -> headers
                    .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
                    .referrerPolicy(policy -> policy.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                    .contentSecurityPolicy(csp -> csp.policyDirectives(POLITIQUE_DE_CONTENU))
                    .permissionsPolicyHeader(permissions -> permissions.policy(POLITIQUE_DE_PERMISSIONS))
                    .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31_536_000)))
            .authorizeHttpRequests(auth -> auth
                    // Points d'accès publics
                    .requestMatchers("/auth/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/contact").permitAll()
                    .requestMatchers(HttpMethod.GET, "/pages/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/bureau").permitAll()
                    // Lecture d'un fichier : les droits sont vérifiés fichier par fichier
                    .requestMatchers(HttpMethod.GET, "/fichiers/*").permitAll()
                    .requestMatchers(HttpMethod.GET, "/actualites/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/evenements/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/formations/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/projets/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/ressources/publiques/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/categories/**").permitAll()
                    // Documentation de l'API : désactivée en production par configuration
                    .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                    // Sondes de santé pour l'hébergeur ; le reste de l'outillage est réservé au Super Admin
                    .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                    .requestMatchers("/actuator/**").hasRole("SUPER_ADMIN")
                    .anyRequest().authenticated()
            )
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(maintenanceFilter, JwtAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /** Le coût du hachage est un réglage mesuré (app.security.bcrypt-strength), jamais une constante du code. */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(coutDuHachage);
    }
}
