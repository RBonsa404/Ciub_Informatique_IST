package com.clubinfo.ist.support;

import com.clubinfo.ist.common.security.JwtProvider;
import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.user.entity.Role;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.RoleRepository;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * Base des tests d'intégration : contexte Spring complet, PostgreSQL réel (Testcontainers, profil « test »),
 * migrations Flyway appliquées. Chaque test crée ses propres données ; les adresses sont uniques.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class IntegrationTest {

    public static final String MOT_DE_PASSE = "Essai@2026x";
    private static final AtomicInteger SEQUENCE = new AtomicInteger();

    @Autowired
    protected MockMvc mvc;
    @Autowired
    protected ObjectMapper json;
    @Autowired
    protected UtilisateurRepository utilisateurs;
    @Autowired
    protected RoleRepository roles;
    @Autowired
    protected PasswordEncoder passwordEncoder;
    @Autowired
    protected JwtProvider jwtProvider;

    /** Crée un compte actif portant les rôles indiqués (« MEMBRE », « ADMIN »…). */
    protected Utilisateur compte(String... nomsDeRoles) {
        int numero = SEQUENCE.incrementAndGet();
        Set<Role> attribues = Arrays.stream(nomsDeRoles)
                .map(nom -> roles.findByNom("ROLE_" + nom).orElseThrow(() -> new IllegalStateException("rôle absent : " + nom)))
                .collect(Collectors.toSet());
        Utilisateur utilisateur = Utilisateur.builder()
                .nom("Ouédraogo")
                .prenom("Aminata")
                .email("compte" + numero + "-" + System.nanoTime() + "@essai.invalid")
                .motDePasse(passwordEncoder.encode(MOT_DE_PASSE))
                .filiere("Génie logiciel")
                .numeroMembre("T-" + numero + "-" + (System.nanoTime() % 1_000_000))
                .dateAdhesion(LocalDate.now())
                .statut(StatutUtilisateur.ACTIF)
                .roles(attribues)
                .build();
        return utilisateurs.save(utilisateur);
    }

    /** Jeton d'accès valide pour le compte. */
    protected String jeton(Utilisateur utilisateur) {
        return jwtProvider.generateAccessToken(new UserDetailsImpl(utilisateur));
    }

    /** Ajoute l'en-tête d'autorisation du compte à la requête. */
    protected MockHttpServletRequestBuilder en(MockHttpServletRequestBuilder requete, Utilisateur utilisateur) {
        return requete.header("Authorization", "Bearer " + jeton(utilisateur));
    }

    /** Corps JSON d'une requête. */
    protected MockHttpServletRequestBuilder corps(MockHttpServletRequestBuilder requete, Object valeur) throws Exception {
        return requete.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(valeur));
    }
}
