package com.clubinfo.service;

import com.clubinfo.entity.AuditLog;
import com.clubinfo.entity.Utilisateur;
import com.clubinfo.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void logAction(Utilisateur user, String action, String details) {
        AuditLog log = new AuditLog();
        log.setUtilisateur(user);
        log.setAction(action);
        log.setDetails(details);
        log.setIpMasquee("127.0.0.xxx");
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }
}
