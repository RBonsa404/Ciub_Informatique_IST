package com.clubinfo.ist.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleDto {

    private Long id;
    private String nom;
    private String description;
    private Set<String> permissions;
}
