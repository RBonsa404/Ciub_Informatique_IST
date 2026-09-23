package com.clubinfo.ist.auth;

import com.clubinfo.ist.auth.dto.LoginRequest;
import com.clubinfo.ist.auth.dto.RegisterRequest;
import com.clubinfo.ist.auth.dto.TokenResponse;
import com.clubinfo.ist.auth.repository.RefreshTokenRepository;
import com.clubinfo.ist.auth.service.AuthServiceImpl;
import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.exception.DuplicateResourceException;
import com.clubinfo.ist.common.security.JwtProvider;
import com.clubinfo.ist.user.entity.Role;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.RoleRepository;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtProvider jwtProvider;

    @InjectMocks
    private AuthServiceImpl authService;

    private Utilisateur mockUser;
    private Role mockRole;

    @BeforeEach
    void setUp() {
        mockRole = Role.builder().nom("ROLE_MEMBRE").build();
        mockUser = Utilisateur.builder()
                .nom("Doe")
                .prenom("John")
                .email("john.doe@test.ci")
                .motDePasse("encodedPassword")
                .statut(StatutUtilisateur.ACTIF)
                .roles(Set.of(mockRole))
                .tentativesConnexion(0)
                .build();
        mockUser.setId(1L);
    }

    @Test
    @DisplayName("Inscription nominale réussie (UC-05)")
    void testRegisterSuccess() {
        RegisterRequest request = RegisterRequest.builder()
                .nom("Doe")
                .prenom("John")
                .email("john.doe@test.ci")
                .motDePasse("Secret@123")
                .build();

        when(utilisateurRepository.existsByEmail(anyString())).thenReturn(false);
        when(roleRepository.findByNom("ROLE_MEMBRE")).thenReturn(Optional.of(mockRole));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(utilisateurRepository.save(any(Utilisateur.class))).thenReturn(mockUser);
        when(jwtProvider.generateAccessToken(any())).thenReturn("jwt-access-token");
        when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        TokenResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("jwt-access-token", response.getAccessToken());
        assertEquals("john.doe@test.ci", response.getEmail());
        verify(utilisateurRepository).save(any(Utilisateur.class));
    }

    @Test
    @DisplayName("Échec inscription si email déjà utilisé (UC-05)")
    void testRegisterDuplicateEmail() {
        RegisterRequest request = RegisterRequest.builder()
                .email("john.doe@test.ci")
                .build();

        when(utilisateurRepository.existsByEmail("john.doe@test.ci")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(request));
    }

    @Test
    @DisplayName("Connexion réussie avec bons identifiants (UC-06)")
    void testLoginSuccess() {
        LoginRequest request = LoginRequest.builder()
                .email("john.doe@test.ci")
                .motDePasse("Secret@123")
                .build();

        when(utilisateurRepository.findByEmail("john.doe@test.ci")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("Secret@123", "encodedPassword")).thenReturn(true);
        when(jwtProvider.generateAccessToken(any())).thenReturn("jwt-access-token");
        when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        TokenResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("jwt-access-token", response.getAccessToken());
        assertEquals(0, mockUser.getTentativesConnexion());
    }

    @Test
    @DisplayName("Échec connexion mauvais mot de passe incrémente tentatives (UC-06)")
    void testLoginWrongPassword() {
        LoginRequest request = LoginRequest.builder()
                .email("john.doe@test.ci")
                .motDePasse("WrongPassword")
                .build();

        when(utilisateurRepository.findByEmail("john.doe@test.ci")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("WrongPassword", "encodedPassword")).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
        assertEquals(1, mockUser.getTentativesConnexion());
        verify(utilisateurRepository).save(mockUser);
    }

    @Test
    @DisplayName("Verrouillage du compte après 5 tentatives échouées (UC-06)")
    void testAccountLockoutAfter5Failures() {
        mockUser.setTentativesConnexion(4);
        LoginRequest request = LoginRequest.builder()
                .email("john.doe@test.ci")
                .motDePasse("WrongPassword")
                .build();

        when(utilisateurRepository.findByEmail("john.doe@test.ci")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("WrongPassword", "encodedPassword")).thenReturn(false);

        assertThrows(BusinessException.class, () -> authService.login(request));
        assertEquals(5, mockUser.getTentativesConnexion());
        assertNotNull(mockUser.getVerrouilleJusqua());
    }

    @Test
    @DisplayName("Rejet de connexion si compte déjà verrouillé (UC-06)")
    void testLoginWhenAlreadyLocked() {
        mockUser.setVerrouilleJusqua(LocalDateTime.now().plusMinutes(10));
        LoginRequest request = LoginRequest.builder()
                .email("john.doe@test.ci")
                .motDePasse("Secret@123")
                .build();

        when(utilisateurRepository.findByEmail("john.doe@test.ci")).thenReturn(Optional.of(mockUser));

        assertThrows(BusinessException.class, () -> authService.login(request));
    }
}
