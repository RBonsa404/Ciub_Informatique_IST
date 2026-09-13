package com.clubinfo.service;

import com.clubinfo.dto.LoginRequest;
import com.clubinfo.dto.LoginResponse;
import com.clubinfo.dto.RegisterRequest;
import com.clubinfo.dto.UserDTO;
import com.clubinfo.entity.Membre;
import com.clubinfo.entity.Role;
import com.clubinfo.entity.StatutUtilisateur;
import com.clubinfo.entity.Utilisateur;
import com.clubinfo.exception.BadRequestException;
import com.clubinfo.exception.UnauthorizedException;
import com.clubinfo.repository.MembreRepository;
import com.clubinfo.repository.RoleRepository;
import com.clubinfo.repository.UtilisateurRepository;
import com.clubinfo.security.JwtTokenProvider;
import com.clubinfo.security.TotpService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UtilisateurRepository utilisateurRepository;
    private final MembreRepository membreRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final TotpService totpService;
    private final AuditService auditService;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        Utilisateur user = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Email ou mot de passe incorrect"));

        if (user.getStatut() != StatutUtilisateur.ACTIF) {
            throw new UnauthorizedException("Votre compte est " + user.getStatut().name().toLowerCase());
        }

        // Vérification 2FA TOTP si activée
        if (user.isTotpEnabled()) {
            if (request.getTotpCode() == null || request.getTotpCode().isBlank()) {
                return LoginResponse.builder()
                        .email(user.getEmail())
                        .requiresTotp(true)
                        .build();
            }
            if (!totpService.verifyCode(request.getTotpCode(), user.getTotpSecret())) {
                throw new UnauthorizedException("Code 2FA invalide");
            }
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        user.setDerniereConnexion(LocalDateTime.now());
        utilisateurRepository.save(user);

        auditService.logAction(user, "CONNEXION", "Connexion réussie");

        String token = tokenProvider.generateToken(authentication);

        List<String> roles = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return LoginResponse.builder()
                .token(token)
                .id(user.getId())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getEmail())
                .dtype(user.getClass().getSimpleName())
                .roles(roles)
                .requiresTotp(false)
                .build();
    }

    @Transactional
    public UserDTO register(RegisterRequest request) {
        if (utilisateurRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Un compte existe déjà avec cet email");
        }

        Membre membre = new Membre();
        membre.setNom(request.getNom());
        membre.setPrenom(request.getPrenom());
        membre.setEmail(request.getEmail());
        membre.setMotDePasse(passwordEncoder.encode(request.getPassword()));
        membre.setConsentementRgpd(request.getConsentementRgpd());
        membre.setStatut(StatutUtilisateur.ACTIF);
        membre.setFiliere(request.getFiliere());
        membre.setAnneeEtude(request.getAnneeEtude());
        membre.setBiographie(request.getBiographie());
        membre.setDateAdhesion(LocalDate.now());
        membre.setNumeroMembre("MEM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        Role membreRole = roleRepository.findByNom("ROLE_MEMBRE")
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setNom("ROLE_MEMBRE");
                    r.setDescription("Rôle membre par défaut");
                    return roleRepository.save(r);
                });

        membre.setRoles(new HashSet<>(List.of(membreRole)));

        Membre saved = membreRepository.save(membre);
        auditService.logAction(saved, "INSCRIPTION", "Inscription nouveau membre");

        return UtilisateurService.mapToDTO(saved);
    }
}
