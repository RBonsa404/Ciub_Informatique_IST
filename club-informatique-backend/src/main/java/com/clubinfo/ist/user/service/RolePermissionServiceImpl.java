package com.clubinfo.ist.user.service;

import com.clubinfo.ist.common.exception.DuplicateResourceException;
import com.clubinfo.ist.common.exception.ResourceNotFoundException;
import com.clubinfo.ist.user.dto.PermissionDto;
import com.clubinfo.ist.user.dto.RoleDto;
import com.clubinfo.ist.user.entity.Permission;
import com.clubinfo.ist.user.entity.Role;
import com.clubinfo.ist.user.mapper.UserMapper;
import com.clubinfo.ist.user.repository.PermissionRepository;
import com.clubinfo.ist.user.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RolePermissionServiceImpl implements RolePermissionService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public List<RoleDto> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(userMapper::toRoleDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RoleDto getRoleById(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));
        return userMapper.toRoleDto(role);
    }

    @Override
    @Transactional
    public RoleDto createRole(String nom, String description, Set<String> permissionNames) {
        if (roleRepository.findByNom(nom).isPresent()) {
            throw new DuplicateResourceException("Un rôle existe déjà avec le nom : " + nom);
        }

        Set<Permission> permissions = new HashSet<>();
        if (permissionNames != null) {
            for (String permName : permissionNames) {
                Permission p = permissionRepository.findByNom(permName)
                        .orElseThrow(() -> new ResourceNotFoundException("Permission", "nom", permName));
                permissions.add(p);
            }
        }

        Role role = Role.builder()
                .nom(nom.startsWith("ROLE_") ? nom : "ROLE_" + nom)
                .description(description)
                .permissions(permissions)
                .build();

        return userMapper.toRoleDto(roleRepository.save(role));
    }

    @Override
    @Transactional
    public RoleDto updateRolePermissions(Long roleId, Set<String> permissionNames) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", roleId));

        Set<Permission> permissions = new HashSet<>();
        if (permissionNames != null) {
            for (String permName : permissionNames) {
                Permission p = permissionRepository.findByNom(permName)
                        .orElseThrow(() -> new ResourceNotFoundException("Permission", "nom", permName));
                permissions.add(p);
            }
        }

        role.setPermissions(permissions);
        return userMapper.toRoleDto(roleRepository.save(role));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PermissionDto> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(userMapper::toPermissionDto)
                .collect(Collectors.toList());
    }
}
