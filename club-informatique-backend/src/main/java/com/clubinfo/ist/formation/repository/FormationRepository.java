package com.clubinfo.ist.formation.repository;

import com.clubinfo.ist.formation.entity.Formation;
import com.clubinfo.ist.formation.entity.NiveauFormation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FormationRepository extends JpaRepository<Formation, Long> {

    Optional<Formation> findByIdAndDeletedAtIsNull(Long id);

    Optional<Formation> findBySlugAndDeletedAtIsNull(String slug);

    Page<Formation> findAllByPublieTrueAndDeletedAtIsNull(Pageable pageable);

    Page<Formation> findAllByDeletedAtIsNull(Pageable pageable);

    @Query("SELECT f FROM Formation f WHERE f.deletedAt IS NULL AND f.publie = true " +
           "AND (:categorieId IS NULL OR f.categorie.id = :categorieId) " +
           "AND (:niveau IS NULL OR f.niveau = :niveau) " +
           "AND (:search IS NULL OR LOWER(f.titre) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(f.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Formation> findPublishedWithFilters(
            @Param("categorieId") Long categorieId,
            @Param("niveau") NiveauFormation niveau,
            @Param("search") String search,
            Pageable pageable);

    long countByPublieTrueAndDeletedAtIsNull();
}
