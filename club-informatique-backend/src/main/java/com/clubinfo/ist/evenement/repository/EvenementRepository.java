package com.clubinfo.ist.evenement.repository;

import com.clubinfo.ist.evenement.entity.Evenement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EvenementRepository extends JpaRepository<Evenement, Long> {

    Optional<Evenement> findByIdAndDeletedAtIsNull(Long id);

    Optional<Evenement> findBySlugAndDeletedAtIsNull(String slug);

    Page<Evenement> findAllByPublieTrueAndDeletedAtIsNullOrderByDateDebutAsc(Pageable pageable);

    Page<Evenement> findAllByDeletedAtIsNullOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT e FROM Evenement e WHERE e.deletedAt IS NULL AND e.publie = true " +
           "AND (:aVenir IS NULL OR (:aVenir = true AND e.dateDebut >= :now) OR (:aVenir = false AND e.dateFin < :now)) " +
           "AND (:categorieId IS NULL OR e.categorie.id = :categorieId) " +
           "AND (:search IS NULL OR LOWER(e.titre) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(e.description) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(e.lieu) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Evenement> findPublishedWithFilters(
            @Param("aVenir") Boolean aVenir,
            @Param("categorieId") Long categorieId,
            @Param("search") String search,
            @Param("now") LocalDateTime now,
            Pageable pageable);

    long countByPublieTrueAndDeletedAtIsNull();
}
