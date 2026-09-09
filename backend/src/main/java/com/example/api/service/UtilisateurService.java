package com.example.api.service;

import com.example.api.dto.*;
import com.example.api.exception.ResourceNotFoundException;
import com.example.api.model.ProfilMembre;
import com.example.api.model.Role;
import com.example.api.model.Utilisateur;
import com.example.api.repository.ProfilMembreRepository;
import com.example.api.repository.RoleRepository;
import com.example.api.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final ProfilMembreRepository profilMembreRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileResponse getProfile(String email) {
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));

        return mapToProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));

        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());
        if (request.getPhoto() != null) {
            user.setPhoto(request.getPhoto());
        }

        ProfilMembre profil = user.getProfilMembre();
        if (profil == null) {
            profil = new ProfilMembre();
            profil.setUtilisateur(user);
            user.setProfilMembre(profil);
        }

        if (request.getDateNaissance() != null) profil.setDateNaissance(request.getDateNaissance());
        if (request.getFiliere() != null) profil.setFiliere(request.getFiliere());
        if (request.getAnneeEtude() != null) profil.setAnneeEtude(request.getAnneeEtude());
        if (request.getBiographie() != null) profil.setBiographie(request.getBiographie());

        Utilisateur saved = utilisateurRepository.save(user);
        return mapToProfileResponse(saved);
    }

    @Transactional
    public MessageResponse changePassword(String email, ChangePasswordRequest request) {
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));

        if (!passwordEncoder.matches(request.getAncienMotDePasse(), user.getMotDePasse())) {
            throw new BadCredentialsException("L'ancien mot de passe est incorrect.");
        }

        user.setMotDePasse(passwordEncoder.encode(request.getNouveauMotDePasse()));
        utilisateurRepository.save(user);

        return MessageResponse.builder()
                .message("Mot de passe modifié avec succès.")
                .success(true)
                .build();
    }

    public MesDonneesResponse getMesDonnees(String email) {
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));

        ProfilMembre p = user.getProfilMembre();
        return MesDonneesResponse.builder()
                .notice("Conformité RGPD / Protection des Données Personnelles : Ceci est l'export complet de vos données enregistrées sur la plateforme du Club Informatique.")
                .id(user.getId())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getEmail())
                .statut(user.getStatut())
                .dateCreation(user.getDateCreation())
                .roles(user.getRoles().stream().map(Role::getNom).collect(Collectors.toList()))
                .numeroMembre(p != null ? p.getNumeroMembre() : null)
                .dateNaissance(p != null ? p.getDateNaissance() : null)
                .filiere(p != null ? p.getFiliere() : null)
                .anneeEtude(p != null ? p.getAnneeEtude() : null)
                .dateAdhesion(p != null ? p.getDateAdhesion() : null)
                .biographie(p != null ? p.getBiographie() : null)
                .build();
    }

    @Transactional
    public MessageResponse demandeEffacement(String email) {
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));

        user.setStatut("INACTIF");
        user.setNom("Anonymisé");
        user.setPrenom("Membre");
        user.setEmail("anonyme_" + user.getId() + "@clubinfo.local");
        user.setPhoto(null);

        if (user.getProfilMembre() != null) {
            user.getProfilMembre().setBiographie(null);
            user.getProfilMembre().setDateNaissance(null);
        }

        utilisateurRepository.save(user);

        return MessageResponse.builder()
                .message("Votre compte a été désactivé et vos données personnelles ont été anonymisées conformément au RGPD.")
                .success(true)
                .build();
    }

    // Administration
    public Page<UserAdminResponse> getAllUsers(Pageable pageable) {
        return utilisateurRepository.findAll(pageable).map(this::mapToAdminResponse);
    }

    public UserProfileResponse getUserById(Long id) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur avec l'ID " + id + " introuvable."));
        return mapToProfileResponse(user);
    }

    @Transactional
    public MessageResponse updateUserStatus(Long id, String statut) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur avec l'ID " + id + " introuvable."));

        user.setStatut(statut.toUpperCase());
        utilisateurRepository.save(user);

        return MessageResponse.builder()
                .message("Statut de l'utilisateur mis à jour vers " + statut)
                .success(true)
                .build();
    }

    @Transactional
    public MessageResponse assignRoles(Long id, Set<String> roleNames) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur avec l'ID " + id + " introuvable."));

        Set<Role> roles = new HashSet<>();
        for (String rName : roleNames) {
            String formatted = rName.startsWith("ROLE_") ? rName : "ROLE_" + rName;
            Role role = roleRepository.findByNom(formatted)
                    .orElseThrow(() -> new ResourceNotFoundException("Le rôle " + rName + " n'existe pas."));
            roles.add(role);
        }

        user.setRoles(roles);
        utilisateurRepository.save(user);

        return MessageResponse.builder()
                .message("Rôles de l'utilisateur mis à jour avec succès.")
                .success(true)
                .build();
    }

    @Transactional
    public MessageResponse deleteUser(Long id) {
        if (!utilisateurRepository.existsById(id)) {
            throw new ResourceNotFoundException("Utilisateur avec l'ID " + id + " introuvable.");
        }
        utilisateurRepository.deleteById(id);
        return MessageResponse.builder()
                .message("Utilisateur supprimé avec succès.")
                .success(true)
                .build();
    }

    private UserProfileResponse mapToProfileResponse(Utilisateur u) {
        ProfilMembre p = u.getProfilMembre();
        return UserProfileResponse.builder()
                .id(u.getId())
                .nom(u.getNom())
                .prenom(u.getPrenom())
                .email(u.getEmail())
                .statut(u.getStatut())
                .photo(u.getPhoto())
                .dateCreation(u.getDateCreation())
                .roles(u.getRoles().stream().map(Role::getNom).collect(Collectors.toList()))
                .numeroMembre(p != null ? p.getNumeroMembre() : null)
                .dateNaissance(p != null ? p.getDateNaissance() : null)
                .filiere(p != null ? p.getFiliere() : null)
                .anneeEtude(p != null ? p.getAnneeEtude() : null)
                .dateAdhesion(p != null ? p.getDateAdhesion() : null)
                .biographie(p != null ? p.getBiographie() : null)
                .build();
    }

    private UserAdminResponse mapToAdminResponse(Utilisateur u) {
        ProfilMembre p = u.getProfilMembre();
        return UserAdminResponse.builder()
                .id(u.getId())
                .nom(u.getNom())
                .prenom(u.getPrenom())
                .email(u.getEmail())
                .statut(u.getStatut())
                .dateCreation(u.getDateCreation())
                .roles(u.getRoles().stream().map(Role::getNom).collect(Collectors.toList()))
                .numeroMembre(p != null ? p.getNumeroMembre() : null)
                .filiere(p != null ? p.getFiliere() : null)
                .build();
    }
}
