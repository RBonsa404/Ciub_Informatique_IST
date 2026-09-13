package com.clubinfo.repository;

import com.clubinfo.entity.Projet;
import com.clubinfo.entity.StatutProjet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjetRepository extends JpaRepository<Projet, Long> {
    Page<Projet> findByStatut(StatutProjet statut, Pageable pageable);
    List<Projet> findBySoumetteurId(Long soumetteurId);
    List<Projet> findByEncadrantId(Long encadrantId);
}
