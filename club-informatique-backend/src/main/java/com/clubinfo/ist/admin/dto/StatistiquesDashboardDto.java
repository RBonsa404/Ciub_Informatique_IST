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
public class StatistiquesDashboardDto {

    private long totalMembres;
    private long membresActifs;
    private long totalEvenements;
    private long totalFormations;
    private long totalProjets;
    private long totalRessources;
    private long totalMessagesNonTraites;
    private Map<String, Long> repartitionMembresParRole;
    private Map<String, Long> repartitionProjetsParStatut;
}
