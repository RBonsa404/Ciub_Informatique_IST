package com.clubinfo.ist.actualite.repository;

import com.clubinfo.ist.actualite.entity.Actualite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ActualiteRepository extends JpaRepository<Actualite, Long> {

    Optional<Actualite> findByIdAndDeletedAtIsNull(Long id);

    Optional<Actualite> findBySlugAndDeletedAtIsNull(String slug);

    Page<Actualite> findAllByPublieTrueAndDeletedAtIsNullOrderByDatePublicationDesc(Pageable pageable);

    Page<Actualite> findAllByDeletedAtIsNullOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT a FROM Actualite a WHERE a.deletedAt IS NULL AND a.publie = true " +
           "AND (:categorieId IS NULL OR a.categorie.id = :categorieId) " +
           "AND (:search IS NULL OR LOWER(a.titre) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.contenu) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Actualite> findPublishedWithFilters(
            @Param("categorieId") Long categorieId,
            @Param("search") String search,
            Pageable pageable);

    long countByPublieTrueAndDeletedAtIsNull();
}
