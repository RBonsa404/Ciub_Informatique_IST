package com.example.api.service;

import com.example.api.dto.LoginRequest;
import com.example.api.dto.LoginResponse;
import com.example.api.dto.RegisterRequest;
import com.example.api.exception.EmailAlreadyUsedException;
import com.example.api.model.Role;
import com.example.api.model.Utilisateur;
import com.example.api.repository.PasswordResetTokenRepository;
import com.example.api.repository.ProfilMembreRepository;
import com.example.api.repository.RoleRepository;
import com.example.api.repository.UtilisateurRepository;
import com.example.api.security.CustomUserDetails;
import com.example.api.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UtilisateurRepository utilisateurRepository;
    @Mock
    private ProfilMembreRepository profilMembreRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtService jwtService;
    @Mock
    private TwoFactorService twoFactorService;

    @InjectMocks
    private AuthService authService;

    private Role roleMembre;
    private Role roleAdmin;

    @BeforeEach
    void setUp() {
        roleMembre = Role.builder().id(1L).nom("ROLE_MEMBRE").description("Membre").build();
        roleAdmin = Role.builder().id(2L).nom("ROLE_SUPER_ADMIN").description("Super Admin").build();
    }

    @Test
    void register_Success() {
        RegisterRequest request = RegisterRequest.builder()
                .nom("PAMOUSSO")
                .prenom("Prince")
                .email("prince@clubinfo.com")
                .motDePasse("Password123!")
                .filiere("Informatique")
                .anneeEtude("L3")
                .build();

        when(utilisateurRepository.existsByEmail("prince@clubinfo.com")).thenReturn(false);
        when(roleRepository.findByNom("ROLE_MEMBRE")).thenReturn(Optional.of(roleMembre));
        when(passwordEncoder.encode("Password123!")).thenReturn("hashedPassword");
        when(utilisateurRepository.save(any(Utilisateur.class))).thenAnswer(invocation -> {
            Utilisateur u = invocation.getArgument(0);
            u.setId(10L);
            return u;
        });

        LoginResponse.UserSummaryDTO result = authService.register(request);

        assertNotNull(result);
        assertEquals("PAMOUSSO", result.getNom());
        assertEquals("prince@clubinfo.com", result.getEmail());
        assertTrue(result.getRoles().contains("ROLE_MEMBRE"));
        verify(utilisateurRepository).save(any(Utilisateur.class));
    }

    @Test
    void register_ThrowsEmailAlreadyUsedException() {
        RegisterRequest request = RegisterRequest.builder()
                .email("existant@clubinfo.com")
                .build();

        when(utilisateurRepository.existsByEmail("existant@clubinfo.com")).thenReturn(true);

        assertThrows(EmailAlreadyUsedException.class, () -> authService.register(request));
        verify(utilisateurRepository, never()).save(any(Utilisateur.class));
    }

    @Test
    void login_StandardMember_GeneratesDirectJwt() {
        LoginRequest request = LoginRequest.builder()
                .email("membre@clubinfo.com")
                .motDePasse("Secret123!")
                .build();

        Utilisateur membre = Utilisateur.builder()
                .id(1L)
                .email("membre@clubinfo.com")
                .statut("ACTIF")
                .roles(new HashSet<>(Collections.singletonList(roleMembre)))
                .build();

        CustomUserDetails userDetails = new CustomUserDetails(membre);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(jwtService.generateToken(any(CustomUserDetails.class))).thenReturn("fake-jwt-token");

        LoginResponse response = authService.login(request);

        assertNotNull(response);
        assertFalse(response.isRequires2FA());
        assertEquals("fake-jwt-token", response.getAccessToken());
    }

    @Test
    void login_SuperAdmin_Triggers2FA() {
        LoginRequest request = LoginRequest.builder()
                .email("admin@clubinfo.com")
                .motDePasse("Admin123!")
                .build();

        Utilisateur admin = Utilisateur.builder()
                .id(2L)
                .email("admin@clubinfo.com")
                .statut("ACTIF")
                .roles(new HashSet<>(Collections.singletonList(roleAdmin)))
                .build();

        CustomUserDetails userDetails = new CustomUserDetails(admin);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(twoFactorService.generateOtp("admin@clubinfo.com")).thenReturn("123456");
        when(jwtService.generateTempToken(eq("admin@clubinfo.com"), anyLong())).thenReturn("temp-2fa-token");

        LoginResponse response = authService.login(request);

        assertNotNull(response);
        assertTrue(response.isRequires2FA());
        assertEquals("temp-2fa-token", response.getTempToken());
        assertNull(response.getAccessToken());
    }
}