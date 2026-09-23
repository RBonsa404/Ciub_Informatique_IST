package com.clubinfo.ist.user.service;

import com.clubinfo.ist.user.dto.PermissionDto;
import com.clubinfo.ist.user.dto.RoleDto;

import java.util.List;
import java.util.Set;

public interface RolePermissionService {

    List<RoleDto> getAllRoles();

    RoleDto getRoleById(Long id);

    RoleDto createRole(String nom, String description, Set<String> permissionNames);

    RoleDto updateRolePermissions(Long roleId, Set<String> permissionNames);

    List<PermissionDto> getAllPermissions();
}
