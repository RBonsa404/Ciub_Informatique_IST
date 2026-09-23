package com.clubinfo.ist.admin.service;

import com.clubinfo.ist.admin.dto.ConformiteDashboardDto;
import com.clubinfo.ist.admin.dto.SecurityAlertDto;
import com.clubinfo.ist.admin.dto.StatistiquesDashboardDto;
import com.clubinfo.ist.admin.dto.SystemConfigDto;
import com.clubinfo.ist.admin.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface AdminService {

    StatistiquesDashboardDto getStatistiquesDashboard();

    List<SecurityAlertDto> getSecurityAlerts();

    void imposer2fa(Long userId, boolean required);

    Page<AuditLog> getAuditLogs(Pageable pageable);

    SystemConfigDto getSystemConfig();

    SystemConfigDto updateSystemConfig(SystemConfigDto dto);

    Map<String, String> triggerBackup();

    ConformiteDashboardDto getConformiteDashboard();
}
