package com.clubinfo.ist.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatistiquesPubliquesDto {
    private long totalMembres;
    private long totalFormations;
    private long totalProjets;
    private long totalEvenements;
}
