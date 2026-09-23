package com.clubinfo.ist.auth.service;

import com.clubinfo.ist.auth.dto.ForgotPasswordRequest;
import com.clubinfo.ist.auth.dto.LoginRequest;
import com.clubinfo.ist.auth.dto.RefreshTokenRequest;
import com.clubinfo.ist.auth.dto.RegisterRequest;
import com.clubinfo.ist.auth.dto.ResetPasswordRequest;
import com.clubinfo.ist.auth.dto.TokenResponse;
import com.clubinfo.ist.auth.dto.TotpSetupResponse;
import com.clubinfo.ist.auth.dto.TotpVerifyRequest;
import com.clubinfo.ist.auth.entity.RefreshToken;
import com.clubinfo.ist.auth.repository.RefreshTokenRepository;
import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.exception.DuplicateResourceException;
import com.clubinfo.ist.common.exception.ResourceNotFoundException;
import com.clubinfo.ist.common.security.JwtProvider;
import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.user.entity.Role;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.RoleRepository;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    @Value("${app.jwt.access-token-expiration-ms:900000}")
    private long accessTokenExpirationMs;

    @Value("${app.jwt.refresh-token-expiration-ms:604800000}")
    private long refreshTokenExpirationMs;

    // Cache temporaire pour les tokens de réinitialisation de mot de passe (token -> email)
    private final ConcurrentHashMap<String, ResetTokenInfo> resetTokens = new ConcurrentHashMap<>();

    private record ResetTokenInfo(String email, LocalDateTime expiresAt) {}

    @Override
    @Transactional
    public TokenResponse register(RegisterRequest request) {
        if (utilisateurRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Un compte existe déjà avec l'adresse email : " + request.getEmail());
        }

        // Rôle par défaut : ROLE_MEMBRE
        Role roleMembre = roleRepository.findByNom("ROLE_MEMBRE")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .nom("ROLE_MEMBRE")
                        .description("Membre actif du club")
                        .build()));

        Set<Role> roles = new HashSet<>();
        roles.add(roleMembre);

        String numMembre = "IST-" + LocalDate.now().getYear() + "-" + String.format("%04d", (int) (Math.random() * 9000) + 1000);

        Utilisateur utilisateur = Utilisateur.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail().toLowerCase().trim())
                .motDePasse(passwordEncoder.encode(request.getMotDePasse()))
                .dateNaissance(request.getDateNaissance())
                .filiere(request.getFiliere())
                .anneeEtude(request.getAnneeEtude())
                .statut(StatutUtilisateur.ACTIF)
                .numeroMembre(numMembre)
                .dateAdhesion(LocalDate.now())
                .roles(roles)
                .build();

        utilisateur = utilisateurRepository.save(utilisateur);
        log.info("Nouvel utilisateur inscrit avec succès : {}", utilisateur.getEmail());

        return generateAuthResponse(utilisateur);
    }

    @Override
    @Transactional
    public TokenResponse login(LoginRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new BadCredentialsException("Identifiants invalides"));

        if (utilisateur.getStatut() == StatutUtilisateur.SUSPENDU) {
            throw new BusinessException("Votre compte a été suspendu. Veuillez contacter l'administration.", HttpStatus.FORBIDDEN);
        }

        if (utilisateur.estVerrouille()) {
            throw new BusinessException("Compte temporairement verrouillé suite à 5 tentatives infructueuses. Réessayez plus tard.", HttpStatus.LOCKED);
        }

        if (!passwordEncoder.matches(request.getMotDePasse(), utilisateur.getMotDePasse())) {
            utilisateur.incrementerTentativesConnexion();
            if (utilisateur.getTentativesConnexion() >= 5) {
                utilisateur.setVerrouilleJusqua(LocalDateTime.now().plusMinutes(15));
                utilisateurRepository.save(utilisateur);
                log.warn("Compte {} verrouillé pour 15 minutes suite à 5 tentatives échouées", utilisateur.getEmail());
                throw new BusinessException("Compte verrouillé pour 15 minutes suite à 5 tentatives échouées", HttpStatus.LOCKED);
            }
            utilisateurRepository.save(utilisateur);
            throw new BadCredentialsException("Identifiants invalides");
        }

        // Si 2FA est activée pour cet utilisateur
        if (utilisateur.est2faActive()) {
            if (request.getTotpCode() == null || request.getTotpCode().isBlank()) {
                return TokenResponse.builder()
                        .require2fa(true)
                        .email(utilisateur.getEmail())
                        .build();
            }

            if (!verifyTotp(utilisateur.getTotpSecret(), request.getTotpCode())) {
                throw new BadCredentialsException("Code 2FA incorrect");
            }
        }

        // Succès : réinitialisation des tentatives
        utilisateur.reinitialiserTentativesConnexion();
        utilisateurRepository.save(utilisateur);

        return generateAuthResponse(utilisateur);
    }

    @Override
    @Transactional
    public TokenResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken token = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new BusinessException("Refresh token invalide", HttpStatus.UNAUTHORIZED));

        if (!token.estValide()) {
            // Détection possible de vol de jeton : révoquer tous les jetons de l'utilisateur
            refreshTokenRepository.revokeAllByUser(token.getUtilisateur());
            throw new BusinessException("Refresh token révoqué ou expiré", HttpStatus.UNAUTHORIZED);
        }

        Utilisateur utilisateur = token.getUtilisateur();
        // Invalider l'ancien token (rotation)
        token.setRevoque(true);
        String nouveauRefreshToken = UUID.randomUUID().toString();
        token.setRemplacePar(nouveauRefreshToken);
        refreshTokenRepository.save(token);

        // Sauvegarder le nouveau refresh token
        RefreshToken nouveauToken = RefreshToken.builder()
                .token(nouveauRefreshToken)
                .utilisateur(utilisateur)
                .dateExpiration(LocalDateTime.now().plusSeconds(refreshTokenExpirationMs / 1000))
                .revoque(false)
                .build();
        refreshTokenRepository.save(nouveauToken);

        UserDetailsImpl userDetails = new UserDetailsImpl(utilisateur);
        String accessToken = jwtProvider.generateAccessToken(userDetails);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(nouveauRefreshToken)
                .tokenType("Bearer")
                .expiresIn(accessTokenExpirationMs / 1000)
                .userId(utilisateur.getId())
                .email(utilisateur.getEmail())
                .nom(utilisateur.getNom())
                .prenom(utilisateur.getPrenom())
                .roles(extractRoleNames(utilisateur))
                .permissions(extractPermissionNames(utilisateur))
                .require2fa(false)
                .build();
    }

    @Override
    @Transactional
    public void logout(String email) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", email));
        refreshTokenRepository.revokeAllByUser(utilisateur);
        log.info("Déconnexion réussie pour {}", email);
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElse(null);

        // Protection contre l'énumération des utilisateurs : ne pas lever d'erreur si l'email n'existe pas
        if (utilisateur != null) {
            String token = UUID.randomUUID().toString();
            resetTokens.put(token, new ResetTokenInfo(utilisateur.getEmail(), LocalDateTime.now().plusHours(1)));
            log.info("Token de réinitialisation de mot de passe généré pour {} : {}", utilisateur.getEmail(), token);
            // En production, envoyer l'email ici
        }
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        ResetTokenInfo info = resetTokens.get(request.getToken());
        if (info == null || LocalDateTime.now().isAfter(info.expiresAt())) {
            throw new BusinessException("Le lien de réinitialisation est invalide ou a expiré", HttpStatus.BAD_REQUEST);
        }

        Utilisateur utilisateur = utilisateurRepository.findByEmail(info.email())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", info.email()));

        utilisateur.setMotDePasse(passwordEncoder.encode(request.getNouveauMotDePasse()));
        utilisateur.reinitialiserTentativesConnexion();
        utilisateurRepository.save(utilisateur);

        resetTokens.remove(request.getToken());
        // Révoquer toutes les sessions existantes après réinitialisation
        refreshTokenRepository.revokeAllByUser(utilisateur);
        log.info("Mot de passe réinitialisé avec succès pour {}", utilisateur.getEmail());
    }

    @Override
    @Transactional
    public TotpSetupResponse setup2fa(String email) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", email));

        SecretGenerator secretGenerator = new DefaultSecretGenerator();
        String secret = secretGenerator.generate();

        utilisateur.setTotpSecret(secret);
        utilisateurRepository.save(utilisateur);

        String appName = "Club Informatique IST";
        String otpUri = String.format("otpauth://totp/%s:%s?secret=%s&issuer=%s",
                URLEncoder.encode(appName, StandardCharsets.UTF_8),
                URLEncoder.encode(email, StandardCharsets.UTF_8),
                secret,
                URLEncoder.encode(appName, StandardCharsets.UTF_8));

        return TotpSetupResponse.builder()
                .secret(secret)
                .manualKey(secret)
                .qrCodeDataUri(otpUri)
                .build();
    }

    @Override
    @Transactional
    public void verifyAndEnable2fa(String email, TotpVerifyRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", email));

        if (utilisateur.getTotpSecret() == null) {
            throw new BusinessException("Veuillez d'abord initialiser la configuration 2FA", HttpStatus.BAD_REQUEST);
        }

        if (!verifyTotp(utilisateur.getTotpSecret(), request.getCode())) {
            throw new BusinessException("Code de vérification 2FA invalide", HttpStatus.BAD_REQUEST);
        }

        utilisateur.setTotpActive(true);
        utilisateurRepository.save(utilisateur);
        log.info("2FA activée pour l'utilisateur {}", email);
    }

    @Override
    @Transactional
    public void disable2fa(String email, TotpVerifyRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", email));

        if (!verifyTotp(utilisateur.getTotpSecret(), request.getCode())) {
            throw new BusinessException("Code de vérification 2FA invalide", HttpStatus.BAD_REQUEST);
        }

        utilisateur.setTotpActive(false);
        utilisateur.setTotpSecret(null);
        utilisateurRepository.save(utilisateur);
        log.info("2FA désactivée pour l'utilisateur {}", email);
    }

    private boolean verifyTotp(String secret, String code) {
        TimeProvider timeProvider = new SystemTimeProvider();
        CodeGenerator codeGenerator = new DefaultCodeGenerator(HashingAlgorithm.SHA1, 6);
        DefaultCodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
        verifier.setTimePeriod(30);
        verifier.setAllowedTimePeriodDiscrepancy(1);
        return verifier.isValidCode(secret, code);
    }

    private TokenResponse generateAuthResponse(Utilisateur utilisateur) {
        UserDetailsImpl userDetails = new UserDetailsImpl(utilisateur);
        String accessToken = jwtProvider.generateAccessToken(userDetails);

        String refreshTokenStr = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .token(refreshTokenStr)
                .utilisateur(utilisateur)
                .dateExpiration(LocalDateTime.now().plusSeconds(refreshTokenExpirationMs / 1000))
                .revoque(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .expiresIn(accessTokenExpirationMs / 1000)
                .userId(utilisateur.getId())
                .email(utilisateur.getEmail())
                .nom(utilisateur.getNom())
                .prenom(utilisateur.getPrenom())
                .roles(extractRoleNames(utilisateur))
                .permissions(extractPermissionNames(utilisateur))
                .require2fa(false)
                .build();
    }

    private Set<String> extractRoleNames(Utilisateur utilisateur) {
        if (utilisateur.getRoles() == null) return Set.of();
        return utilisateur.getRoles().stream()
                .map(Role::getNom)
                .collect(Collectors.toSet());
    }

    private Set<String> extractPermissionNames(Utilisateur utilisateur) {
        if (utilisateur.getRoles() == null) return Set.of();
        return utilisateur.getRoles().stream()
                .filter(r -> r.getPermissions() != null)
                .flatMap(r -> r.getPermissions().stream())
                .map(com.clubinfo.ist.user.entity.Permission::getNom)
                .collect(Collectors.toSet());
    }
}
