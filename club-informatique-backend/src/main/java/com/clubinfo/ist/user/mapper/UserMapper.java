package com.clubinfo.ist.user.mapper;

import com.clubinfo.ist.user.dto.PermissionDto;
import com.clubinfo.ist.user.dto.RoleDto;
import com.clubinfo.ist.user.dto.UserDto;
import com.clubinfo.ist.user.entity.Permission;
import com.clubinfo.ist.user.entity.Role;
import com.clubinfo.ist.user.entity.Utilisateur;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

@Component
public class UserMapper {

    public UserDto toDto(Utilisateur user) {
        if (user == null) return null;

        Set<String> roles = user.getRoles() == null ? Set.of() :
                user.getRoles().stream().map(Role::getNom).collect(Collectors.toSet());

        Set<String> permissions = user.getRoles() == null ? Set.of() :
                user.getRoles().stream()
                        .filter(r -> r.getPermissions() != null)
                        .flatMap(r -> r.getPermissions().stream())
                        .map(Permission::getNom)
                        .collect(Collectors.toSet());

        return UserDto.builder()
                .id(user.getId())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getEmail())
                .dateNaissance(user.getDateNaissance())
                .filiere(user.getFiliere())
                .anneeEtude(user.getAnneeEtude())
                .photo(user.getPhoto())
                .biographie(user.getBiographie())
                .specialite(user.getSpecialite())
                .fonction(user.getFonction())
                .numeroMembre(user.getNumeroMembre())
                .dateAdhesion(user.getDateAdhesion())
                .statut(user.getStatut())
                .totpActive(user.est2faActive())
                .roles(roles)
                .permissions(permissions)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    public RoleDto toRoleDto(Role role) {
        if (role == null) return null;
        Set<String> perms = role.getPermissions() == null ? Set.of() :
                role.getPermissions().stream().map(Permission::getNom).collect(Collectors.toSet());

        return RoleDto.builder()
                .id(role.getId())
                .nom(role.getNom())
                .description(role.getDescription())
                .permissions(perms)
                .build();
    }

    public PermissionDto toPermissionDto(Permission permission) {
        if (permission == null) return null;
        return PermissionDto.builder()
                .id(permission.getId())
                .nom(permission.getNom())
                .description(permission.getDescription())
                .build();
    }
}
