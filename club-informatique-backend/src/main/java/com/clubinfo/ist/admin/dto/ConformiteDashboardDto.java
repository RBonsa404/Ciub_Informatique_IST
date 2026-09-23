package com.clubinfo.ist.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConformiteDashboardDto {

    private String statutSecurite;
    private String versionBackend;
    private String versionJava;
    private long totalComptesActifs;
    private long comptesAvec2fa;
    private double tauxAdoption2fa;
    private long totalTentativesEchouees;
    private Map<String, Boolean> verificationsConformite;
}
