package com.clubinfo.repository;

import com.clubinfo.entity.Formation;
import com.clubinfo.entity.StatutFormation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FormationRepository extends JpaRepository<Formation, Long> {
    Page<Formation> findByStatut(StatutFormation statut, Pageable pageable);
    List<Formation> findByFormateurId(Long formateurId);
}
