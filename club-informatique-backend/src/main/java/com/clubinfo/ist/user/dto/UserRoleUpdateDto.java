package com.clubinfo.ist.user.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRoleUpdateDto {

    @NotEmpty(message = "La liste des rôles ne peut pas être vide")
    private Set<String> roles;
}
