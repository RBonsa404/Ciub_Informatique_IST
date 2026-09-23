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
public class SystemConfigDto {

    private String nomPlateforme;
    private String version;
    private Integer maxUploadSizeMb;
    private Integer maxLoginAttempts;
    private Integer lockoutDurationMinutes;
    private Boolean maintenanceMode;
    private Map<String, String> parametresAdditionnels;
}
