package com.clubinfo.repository;

import com.clubinfo.entity.Actualite;
import com.clubinfo.entity.StatutActualite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActualiteRepository extends JpaRepository<Actualite, Long> {
    Page<Actualite> findByStatut(StatutActualite statut, Pageable pageable);
    List<Actualite> findTop5ByStatutOrderByDatePublicationDesc(StatutActualite statut);
    Page<Actualite> findByCategorieIdAndStatut(Long categorieId, StatutActualite statut, Pageable pageable);
}
