package com.clubinfo.ist.user.service;

import com.clubinfo.ist.user.dto.ChangePasswordDto;
import com.clubinfo.ist.user.dto.UserCreateDto;
import com.clubinfo.ist.user.dto.UserDto;
import com.clubinfo.ist.user.dto.UserRoleUpdateDto;
import com.clubinfo.ist.user.dto.UserUpdateDto;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {

    UserDto getCurrentUserProfile(String email);

    UserDto updateCurrentUserProfile(String email, UserUpdateDto dto);

    void changePassword(String email, ChangePasswordDto dto);

    Page<UserDto> getAllUsers(Pageable pageable);

    UserDto getUserById(Long id);

    UserDto createUser(UserCreateDto dto);

    UserDto updateUser(Long id, UserUpdateDto dto);

    void deleteUser(Long id);

    UserDto updateUserRoles(Long id, UserRoleUpdateDto dto);

    UserDto updateUserStatus(Long id, StatutUtilisateur statut);
}
