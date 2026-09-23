package com.clubinfo.ist.common.config;

import com.clubinfo.ist.common.security.JwtAuthenticationEntryPoint;
import com.clubinfo.ist.common.security.JwtAuthenticationFilter;
import com.clubinfo.ist.common.security.RateLimitFilter;
import lombok.RequiredArgsConstructor;
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
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Configuration Spring Security : stateless JWT, CORS, RBAC, rate limiting.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final RateLimitFilter rateLimitFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Désactivation CSRF (API REST stateless)
            .csrf(AbstractHttpConfigurer::disable)
            // CORS configuré via CorsConfig
            .cors(cors -> {})
            // Session stateless
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Point d'entrée d'authentification
            .exceptionHandling(ex ->
                    ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))
            // Autorisations
            .authorizeHttpRequests(auth -> auth
                    // Endpoints publics
                    .requestMatchers("/auth/**").permitAll()
                    .requestMatchers("/contact").permitAll()
                    .requestMatchers(HttpMethod.GET, "/pages/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/actualites/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/evenements/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/formations/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/projets/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/ressources/publiques/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/categories/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/statistiques/publiques").permitAll()
                    // Swagger
                    .requestMatchers(
                            "/swagger-ui/**",
                            "/swagger-ui.html",
                            "/v3/api-docs/**",
                            "/swagger-resources/**"
                    ).permitAll()
                    // Actuator (healthcheck Railway, monitoring)
                    .requestMatchers("/actuator/**").permitAll()
                    // H2 Console (profil h2 local uniquement)
                    .requestMatchers("/h2-console/**").permitAll()
                    // Tout le reste nécessite une authentification
                    .anyRequest().authenticated()
            )
            // Filtres
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

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

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }
}
