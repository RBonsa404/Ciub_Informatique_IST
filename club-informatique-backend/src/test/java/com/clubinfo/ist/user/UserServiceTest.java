package com.clubinfo.ist.user;

import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.user.dto.ChangePasswordDto;
import com.clubinfo.ist.user.dto.UserDto;
import com.clubinfo.ist.user.dto.UserUpdateDto;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.mapper.UserMapper;
import com.clubinfo.ist.user.repository.RoleRepository;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import com.clubinfo.ist.user.service.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    private Utilisateur mockUser;

    @BeforeEach
    void setUp() {
        mockUser = Utilisateur.builder()
                .nom("Yao")
                .prenom("Alice")
                .email("alice@ist.ci")
                .motDePasse("hash123")
                .build();
        mockUser.setId(5L);
    }

    @Test
    @DisplayName("Consultation de profil personnel (UC-07)")
    void testGetCurrentUserProfile() {
        when(utilisateurRepository.findByEmail("alice@ist.ci")).thenReturn(Optional.of(mockUser));
        when(userMapper.toDto(mockUser)).thenReturn(UserDto.builder()
                .id(5L)
                .email("alice@ist.ci")
                .nom("Yao")
                .build());

        UserDto profile = userService.getCurrentUserProfile("alice@ist.ci");

        assertNotNull(profile);
        assertEquals("alice@ist.ci", profile.getEmail());
    }

    @Test
    @DisplayName("Modification des informations de profil (UC-07)")
    void testUpdateCurrentUserProfile() {
        UserUpdateDto updateDto = UserUpdateDto.builder()
                .nom("Yao-Koffi")
                .biographie("Passionnée de cybersécurité")
                .build();

        when(utilisateurRepository.findByEmail("alice@ist.ci")).thenReturn(Optional.of(mockUser));
        when(utilisateurRepository.save(any(Utilisateur.class))).thenReturn(mockUser);
        when(userMapper.toDto(mockUser)).thenReturn(UserDto.builder()
                .id(5L)
                .nom("Yao-Koffi")
                .biographie("Passionnée de cybersécurité")
                .build());

        UserDto updated = userService.updateCurrentUserProfile("alice@ist.ci", updateDto);

        assertNotNull(updated);
        assertEquals("Yao-Koffi", updated.getNom());
        verify(utilisateurRepository).save(mockUser);
    }

    @Test
    @DisplayName("Changement de mot de passe réussi (UC-07)")
    void testChangePasswordSuccess() {
        ChangePasswordDto dto = ChangePasswordDto.builder()
                .ancienMotDePasse("OldSecret@123")
                .nouveauMotDePasse("NewSecret@456")
                .build();

        when(utilisateurRepository.findByEmail("alice@ist.ci")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("OldSecret@123", "hash123")).thenReturn(true);
        when(passwordEncoder.encode("NewSecret@456")).thenReturn("newHash456");

        userService.changePassword("alice@ist.ci", dto);

        verify(utilisateurRepository).save(mockUser);
        assertEquals("newHash456", mockUser.getMotDePasse());
    }

    @Test
    @DisplayName("Échec changement mot de passe si ancien mot de passe erroné (UC-07)")
    void testChangePasswordWrongOldPassword() {
        ChangePasswordDto dto = ChangePasswordDto.builder()
                .ancienMotDePasse("WrongOldSecret")
                .nouveauMotDePasse("NewSecret@456")
                .build();

        when(utilisateurRepository.findByEmail("alice@ist.ci")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("WrongOldSecret", "hash123")).thenReturn(false);

        assertThrows(BusinessException.class, () -> userService.changePassword("alice@ist.ci", dto));
    }
}
