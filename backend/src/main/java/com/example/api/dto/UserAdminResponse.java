package com.example.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAdminResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String statut;
    private LocalDateTime dateCreation;
    private List<String> roles;
    private String numeroMembre;
    private String filiere;
}
