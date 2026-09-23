package com.clubinfo.ist.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityAlertDto {

    private String typeAlerte;
    private String description;
    private String utilisateurCible;
    private String ipAddress;
    private LocalDateTime dateDetection;
    private String gravite; // FAIBLE, MOYENNE, CRITIQUE
}
