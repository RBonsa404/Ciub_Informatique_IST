package com.example.api.service;

import com.example.api.dto.*;
import com.example.api.exception.EmailAlreadyUsedException;
import com.example.api.exception.InvalidOtpException;
import com.example.api.exception.ResourceNotFoundException;
import com.example.api.model.PasswordResetToken;
import com.example.api.model.ProfilMembre;
import com.example.api.model.Role;
import com.example.api.model.Utilisateur;
import com.example.api.repository.PasswordResetTokenRepository;
import com.example.api.repository.ProfilMembreRepository;
import com.example.api.repository.RoleRepository;
import com.example.api.repository.UtilisateurRepository;
import com.example.api.security.CustomUserDetails;
import com.example.api.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UtilisateurRepository utilisateurRepository;
    private final ProfilMembreRepository profilMembreRepository;
    private final RoleRepository roleRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final TwoFactorService twoFactorService;

    private static final Set<String> PRIVILEGED_ROLES = Set.of(
            "ROLE_ADMINISTRATEUR", "ROLE_SUPER_ADMIN", "ROLE_DSI", "ADMINISTRATEUR", "SUPER_ADMIN", "DSI"
    );

    @Transactional
    public LoginResponse.UserSummaryDTO register(RegisterRequest request) {
        if (utilisateurRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyUsedException("L'adresse email " + request.getEmail() + " est déjà utilisée.");
        }

        Role membreRole = roleRepository.findByNom("ROLE_MEMBRE")
                .orElseGet(() -> roleRepository.save(
                        Role.builder().nom("ROLE_MEMBRE").description("Membre adhérent standard du Club").build()
                ));

        Utilisateur utilisateur = Utilisateur.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail())
                .motDePasse(passwordEncoder.encode(request.getMotDePasse()))
                .dateCreation(LocalDateTime.now())
                .statut("ACTIF")
                .roles(new HashSet<>(Collections.singletonList(membreRole)))
                .build();

        String numMembre = "CI-" + LocalDate.now().getYear() + "-" + (1000 + new Random().nextInt(9000));
        ProfilMembre profil = ProfilMembre.builder()
                .numeroMembre(numMembre)
                .dateNaissance(request.getDateNaissance())
                .filiere(request.getFiliere())
                .anneeEtude(request.getAnneeEtude())
                .dateAdhesion(LocalDate.now())
                .biographie(request.getBiographie())
                .utilisateur(utilisateur)
                .build();

        utilisateur.setProfilMembre(profil);
        Utilisateur saved = utilisateurRepository.save(utilisateur);

        return LoginResponse.UserSummaryDTO.builder()
                .id(saved.getId())
                .nom(saved.getNom())
                .prenom(saved.getPrenom())
                .email(saved.getEmail())
                .photo(saved.getPhoto())
                .roles(saved.getRoles().stream().map(Role::getNom).collect(Collectors.toList()))
                .build();
    }

    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getMotDePasse())
        );

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Utilisateur user = userDetails.getUtilisateur();

        if (!"ACTIF".equalsIgnoreCase(user.getStatut())) {
            throw new BadCredentialsException("Compte inactif ou suspendu.");
        }

        boolean hasPrivilegedRole = user.getRoles().stream()
                .anyMatch(r -> PRIVILEGED_ROLES.contains(r.getNom()));

        // Double facteur (2FA) pour les comptes à privilèges
        if (hasPrivilegedRole) {
            String otp = twoFactorService.generateOtp(user.getEmail());
            String tempToken = jwtService.generateTempToken(user.getEmail(), 5 * 60 * 1000); // 5 min

            return LoginResponse.builder()
                    .requires2FA(true)
                    .tempToken(tempToken)
                    .expiresIn(300)
                    .build();
        }

        return generateFullLoginResponse(userDetails, user);
    }

    public LoginResponse verify2FA(TwoFactorVerifyRequest request) {
        if (!jwtService.isTempTokenValid(request.getTempToken())) {
            throw new InvalidOtpException("Session 2FA expirée ou invalide. Veuillez vous reconnecter.");
        }

        String email = jwtService.extractUsername(request.getTempToken());
        if (!twoFactorService.verifyOtp(email, request.getCode())) {
            throw new InvalidOtpException("Code OTP invalide ou expiré.");
        }

        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé."));

        CustomUserDetails userDetails = new CustomUserDetails(user);
        return generateFullLoginResponse(userDetails, user);
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        Utilisateur user = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Aucun compte associé à l'email : " + request.getEmail()));

        passwordResetTokenRepository.deleteByUtilisateur(user);

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .utilisateur(user)
                .dateExpiration(LocalDateTime.now().plusHours(1))
                .utilise(false)
                .build();

        passwordResetTokenRepository.save(resetToken);

        log.info("=================================================");
        log.info(" [PASSWORD RESET] Token généré pour {}: {}", user.getEmail(), token);
        log.info(" Lien de réinitialisation : /reinitialiser-mot-de-passe?token={}", token);
        log.info("=================================================");

        return MessageResponse.builder()
                .message("Un lien de réinitialisation a été généré avec succès.")
                .success(true)
                .build();
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new ResourceNotFoundException("Jeton de réinitialisation invalide."));

        if (resetToken.isExpired() || resetToken.isUtilise()) {
            throw new BadCredentialsException("Ce jeton de réinitialisation a expiré ou a déjà été utilisé.");
        }

        Utilisateur user = resetToken.getUtilisateur();
        user.setMotDePasse(passwordEncoder.encode(request.getNouveauMotDePasse()));
        utilisateurRepository.save(user);

        resetToken.setUtilise(true);
        passwordResetTokenRepository.save(resetToken);

        return MessageResponse.builder()
                .message("Votre mot de passe a été mis à jour avec succès.")
                .success(true)
                .build();
    }

    private LoginResponse generateFullLoginResponse(CustomUserDetails userDetails, Utilisateur user) {
        String token = jwtService.generateToken(userDetails);
        List<String> roleNames = user.getRoles().stream().map(Role::getNom).collect(Collectors.toList());

        return LoginResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(86400) // 24 heures
                .requires2FA(false)
                .user(LoginResponse.UserSummaryDTO.builder()
                        .id(user.getId())
                        .nom(user.getNom())
                        .prenom(user.getPrenom())
                        .email(user.getEmail())
                        .photo(user.getPhoto())
                        .roles(roleNames)
                        .build())
                .build();
    }
}
