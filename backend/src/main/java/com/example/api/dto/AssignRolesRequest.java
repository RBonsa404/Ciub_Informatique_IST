package com.example.api.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignRolesRequest {
    @NotEmpty(message = "Au moins un rôle doit être spécifié")
    private Set<String> roles;
}
