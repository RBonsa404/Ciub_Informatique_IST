package com.clubinfo.ist.support;

import com.clubinfo.ist.common.security.JwtProvider;
import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.user.entity.Role;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.RoleRepository;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * Base des tests d'intégration : contexte Spring complet, PostgreSQL réel (Testcontainers, profil « test »),
 * migrations Flyway appliquées. Chaque test crée ses propres données ; les adresses sont uniques.
 * Les courriels partent vers un serveur SMTP de capture (Mailpit) : rien ne sort de la machine.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class IntegrationTest {

    public static final String MOT_DE_PASSE = "Essai@2026x";
    private static final AtomicInteger SEQUENCE = new AtomicInteger();

    /** Serveur de capture des courriels, partagé par toute la suite. */
    private static final GenericContainer<?> MAILPIT = new GenericContainer<>("axllent/mailpit:v1.21")
            .withExposedPorts(1025, 8025)
            .waitingFor(Wait.forHttp("/api/v1/info").forPort(8025));
    private static final HttpClient HTTP = HttpClient.newHttpClient();

    static {
        MAILPIT.start();
    }

    @DynamicPropertySource
    static void courrielDeCapture(DynamicPropertyRegistry proprietes) {
        proprietes.add("spring.mail.host", MAILPIT::getHost);
        proprietes.add("spring.mail.port", () -> MAILPIT.getMappedPort(1025));
    }

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

    /** Adresse unique que le serveur de capture reçoit (le domaine « .invalid » des comptes d'essai n'est jamais servi). */
    protected static String adresseRecevable() {
        return "destinataire" + SEQUENCE.incrementAndGet() + "-" + System.nanoTime() + "@club.test";
    }

    /** Courriels capturés pour l'adresse (résumés : identifiant, objet). */
    protected JsonNode courrielsRecus(String adresse) {
        return capture("/api/v1/search?query=" + URLEncoder.encode("to:" + adresse, StandardCharsets.UTF_8)).path("messages");
    }

    /** Attend le premier courriel envoyé à l'adresse et le renvoie en entier (objet, expéditeur, texte). */
    protected JsonNode courrielRecu(String adresse) {
        long limite = System.nanoTime() + Duration.ofSeconds(15).toNanos();
        while (System.nanoTime() < limite) {
            JsonNode recus = courrielsRecus(adresse);
            if (!recus.isEmpty()) {
                return capture("/api/v1/message/" + recus.get(0).path("ID").asText());
            }
            try {
                Thread.sleep(150);
            } catch (InterruptedException interruption) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException(interruption);
            }
        }
        throw new AssertionError("Aucun courriel reçu pour " + adresse);
    }

    private JsonNode capture(String chemin) {
        try {
            URI adresse = URI.create("http://" + MAILPIT.getHost() + ":" + MAILPIT.getMappedPort(8025) + chemin);
            HttpResponse<String> reponse = HTTP.send(HttpRequest.newBuilder(adresse).GET().build(), HttpResponse.BodyHandlers.ofString());
            return json.readTree(reponse.body());
        } catch (InterruptedException interruption) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(interruption);
        } catch (java.io.IOException erreur) {
            throw new IllegalStateException(erreur);
        }
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
