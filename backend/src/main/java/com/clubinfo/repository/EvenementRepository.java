package com.clubinfo.repository;

import com.clubinfo.entity.Evenement;
import com.clubinfo.entity.StatutEvenement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EvenementRepository extends JpaRepository<Evenement, Long> {
    Page<Evenement> findByStatut(StatutEvenement statut, Pageable pageable);
    List<Evenement> findByDateDebutAfterAndStatutOrderByDateDebutAsc(LocalDateTime now, StatutEvenement statut);
}
