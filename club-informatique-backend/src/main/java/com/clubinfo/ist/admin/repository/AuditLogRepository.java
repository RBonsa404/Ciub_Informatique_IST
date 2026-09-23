package com.clubinfo.ist.admin.repository;

import com.clubinfo.ist.admin.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findAllByOrderByDateActionDesc(Pageable pageable);

    List<AuditLog> findTop20ByStatutOrderByDateActionDesc(String statut);

    long countByStatut(String statut);
}
