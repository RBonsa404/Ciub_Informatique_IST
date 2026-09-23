package com.clubinfo.ist.projet.dto;

import com.clubinfo.ist.projet.entity.RoleProjetMembre;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjetMembreDto {

    private Long id;
    private Long projetId;
    private Long utilisateurId;
    private String utilisateurNom;
    private String utilisateurEmail;
    private RoleProjetMembre role;
    private LocalDateTime dateRejoint;
}
