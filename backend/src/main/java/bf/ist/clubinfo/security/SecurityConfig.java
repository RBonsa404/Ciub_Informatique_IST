package bf.ist.clubinfo.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Squelette de sécurité transverse (OUARE) : stateless, CSRF désactivé pour
 * une API REST pure, endpoints techniques ouverts (actuator/health, swagger).
 *
 * L'authentification (login/register), le RBAC endpoint-par-endpoint et le
 * 2FA des comptes à privilèges sont du ressort de PAMOUSSO (module
 * utilisateur/role/permission, cf. section 2.1 du document de dispatch) et
 * viennent compléter cette configuration, pas la remplacer.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String[] PUBLIC_ENDPOINTS = {
            "/actuator/health",
            "/actuator/info",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/v3/api-docs/**"
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        // TODO (PAMOUSSO) : ouvrir les endpoints publics de consultation
                        // (actualités, événements, formations, projets en lecture) et
                        // brancher le RBAC détaillé (matrice section 2.2 du cahier des charges).
                        .anyRequest().authenticated()
                );
        // TODO (PAMOUSSO) : brancher le filtre JWT et le provider d'authentification.
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
