package com.clubinfo.ist.user.service;

import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.exception.DuplicateResourceException;
import com.clubinfo.ist.common.exception.ResourceNotFoundException;
import com.clubinfo.ist.user.dto.ChangePasswordDto;
import com.clubinfo.ist.user.dto.UserCreateDto;
import com.clubinfo.ist.user.dto.UserDto;
import com.clubinfo.ist.user.dto.UserRoleUpdateDto;
import com.clubinfo.ist.user.dto.UserUpdateDto;
import com.clubinfo.ist.user.entity.Role;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.mapper.UserMapper;
import com.clubinfo.ist.user.repository.RoleRepository;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public UserDto getCurrentUserProfile(String email) {
        Utilisateur user = findUserByEmail(email);
        return userMapper.toDto(user);
    }

    @Override
    @Transactional
    public UserDto updateCurrentUserProfile(String email, UserUpdateDto dto) {
        Utilisateur user = findUserByEmail(email);

        if (dto.getNom() != null) user.setNom(dto.getNom());
        if (dto.getPrenom() != null) user.setPrenom(dto.getPrenom());
        if (dto.getDateNaissance() != null) user.setDateNaissance(dto.getDateNaissance());
        if (dto.getFiliere() != null) user.setFiliere(dto.getFiliere());
        if (dto.getAnneeEtude() != null) user.setAnneeEtude(dto.getAnneeEtude());
        if (dto.getPhoto() != null) user.setPhoto(dto.getPhoto());
        if (dto.getBiographie() != null) user.setBiographie(dto.getBiographie());
        if (dto.getSpecialite() != null) user.setSpecialite(dto.getSpecialite());
        if (dto.getFonction() != null) user.setFonction(dto.getFonction());

        user = utilisateurRepository.save(user);
        log.info("Profil mis à jour pour {}", email);
        return userMapper.toDto(user);
    }

    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordDto dto) {
        Utilisateur user = findUserByEmail(email);

        if (!passwordEncoder.matches(dto.getAncienMotDePasse(), user.getMotDePasse())) {
            throw new BusinessException("L'ancien mot de passe est incorrect", HttpStatus.BAD_REQUEST);
        }

        user.setMotDePasse(passwordEncoder.encode(dto.getNouveauMotDePasse()));
        utilisateurRepository.save(user);
        log.info("Mot de passe modifié pour {}", email);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserDto> getAllUsers(Pageable pageable) {
        return utilisateurRepository.findAll(pageable)
                .map(userMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        Utilisateur user = findUserById(id);
        return userMapper.toDto(user);
    }

    @Override
    @Transactional
    public UserDto createUser(UserCreateDto dto) {
        if (utilisateurRepository.existsByEmail(dto.getEmail())) {
            throw new DuplicateResourceException("Un utilisateur avec cet email existe déjà : " + dto.getEmail());
        }

        Set<Role> roles = new HashSet<>();
        if (dto.getRoles() != null && !dto.getRoles().isEmpty()) {
            for (String roleName : dto.getRoles()) {
                Role role = roleRepository.findByNom(roleName)
                        .orElseThrow(() -> new ResourceNotFoundException("Role", "nom", roleName));
                roles.add(role);
            }
        } else {
            Role roleMembre = roleRepository.findByNom("ROLE_MEMBRE")
                    .orElseThrow(() -> new ResourceNotFoundException("Role", "nom", "ROLE_MEMBRE"));
            roles.add(roleMembre);
        }

        String numMembre = "IST-" + LocalDate.now().getYear() + "-" + String.format("%04d", (int) (Math.random() * 9000) + 1000);

        Utilisateur user = Utilisateur.builder()
                .nom(dto.getNom())
                .prenom(dto.getPrenom())
                .email(dto.getEmail().toLowerCase().trim())
                .motDePasse(passwordEncoder.encode(dto.getMotDePasse()))
                .dateNaissance(dto.getDateNaissance())
                .filiere(dto.getFiliere())
                .anneeEtude(dto.getAnneeEtude())
                .specialite(dto.getSpecialite())
                .fonction(dto.getFonction())
                .statut(dto.getStatut() != null ? dto.getStatut() : StatutUtilisateur.ACTIF)
                .numeroMembre(numMembre)
                .dateAdhesion(LocalDate.now())
                .roles(roles)
                .build();

        user = utilisateurRepository.save(user);
        log.info("Utilisateur créé par admin : {}", user.getEmail());
        return userMapper.toDto(user);
    }

    @Override
    @Transactional
    public UserDto updateUser(Long id, UserUpdateDto dto) {
        Utilisateur user = findUserById(id);

        if (dto.getNom() != null) user.setNom(dto.getNom());
        if (dto.getPrenom() != null) user.setPrenom(dto.getPrenom());
        if (dto.getDateNaissance() != null) user.setDateNaissance(dto.getDateNaissance());
        if (dto.getFiliere() != null) user.setFiliere(dto.getFiliere());
        if (dto.getAnneeEtude() != null) user.setAnneeEtude(dto.getAnneeEtude());
        if (dto.getPhoto() != null) user.setPhoto(dto.getPhoto());
        if (dto.getBiographie() != null) user.setBiographie(dto.getBiographie());
        if (dto.getSpecialite() != null) user.setSpecialite(dto.getSpecialite());
        if (dto.getFonction() != null) user.setFonction(dto.getFonction());

        user = utilisateurRepository.save(user);
        log.info("Utilisateur ID {} mis à jour par admin", id);
        return userMapper.toDto(user);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        Utilisateur user = findUserById(id);
        // Soft delete
        user.setDeletedAt(LocalDateTime.now());
        user.setStatut(StatutUtilisateur.SUSPENDU);
        utilisateurRepository.save(user);
        log.info("Utilisateur ID {} supprimé logiquement (soft-deleted)", id);
    }

    @Override
    @Transactional
    public UserDto updateUserRoles(Long id, UserRoleUpdateDto dto) {
        Utilisateur user = findUserById(id);

        Set<Role> roles = new HashSet<>();
        for (String roleName : dto.getRoles()) {
            Role role = roleRepository.findByNom(roleName)
                    .orElseThrow(() -> new ResourceNotFoundException("Role", "nom", roleName));
            roles.add(role);
        }

        user.setRoles(roles);
        user = utilisateurRepository.save(user);
        log.info("Rôles mis à jour pour l'utilisateur ID {}", id);
        return userMapper.toDto(user);
    }

    @Override
    @Transactional
    public UserDto updateUserStatus(Long id, StatutUtilisateur statut) {
        Utilisateur user = findUserById(id);
        user.setStatut(statut);
        user = utilisateurRepository.save(user);
        log.info("Statut mis à jour ({}) pour l'utilisateur ID {}", statut, id);
        return userMapper.toDto(user);
    }

    private Utilisateur findUserByEmail(String email) {
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", email));
    }

    private Utilisateur findUserById(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", id));
    }
}
