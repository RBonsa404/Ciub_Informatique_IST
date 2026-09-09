package com.example.api.service;

import com.example.api.dto.PermissionResponse;
import com.example.api.dto.RoleResponse;
import com.example.api.repository.PermissionRepository;
import com.example.api.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(r -> RoleResponse.builder()
                        .id(r.getId())
                        .nom(r.getNom())
                        .description(r.getDescription())
                        .permissions(r.getPermissions().stream()
                                .map(p -> PermissionResponse.builder()
                                        .id(p.getId())
                                        .code(p.getCode())
                                        .libelle(p.getLibelle())
                                        .build())
                                .collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());
    }

    public List<PermissionResponse> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(p -> PermissionResponse.builder()
                        .id(p.getId())
                        .code(p.getCode())
                        .libelle(p.getLibelle())
                        .build())
                .collect(Collectors.toList());
    }
}
