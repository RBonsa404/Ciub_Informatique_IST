package com.clubinfo.ist.formation.repository;

import com.clubinfo.ist.formation.entity.Formation;
import com.clubinfo.ist.formation.entity.NiveauFormation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FormationRepository extends JpaRepository<Formation, Long> {

    @EntityGraph(attributePaths = {"formateur", "categorie"})
    Optional<Formation> findByIdAndDeletedAtIsNull(Long id);

    @EntityGraph(attributePaths = {"formateur", "categorie"})
    Optional<Formation> findBySlugAndPublieTrueAndDeletedAtIsNull(String slug);

    boolean existsBySlug(String slug);

    @EntityGraph(attributePaths = {"formateur", "categorie"})
    @Query("SELECT f FROM Formation f WHERE f.deletedAt IS NULL AND f.publie = true " +
           "AND (:categorieId IS NULL OR f.categorie.id = :categorieId) " +
           "AND (:niveau IS NULL OR f.niveau = :niveau) " +
           "AND (CAST(:search AS string) IS NULL OR LOWER(f.titre) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "OR LOWER(f.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<Formation> publiees(@Param("categorieId") Long categorieId, @Param("niveau") NiveauFormation niveau,
                             @Param("search") String search, Pageable pageable);

    /** Formations gérées : toutes si « formateurId » est absent, sinon celles de ce formateur. */
    @EntityGraph(attributePaths = {"formateur", "categorie"})
    @Query("SELECT f FROM Formation f WHERE f.deletedAt IS NULL " +
           "AND (:formateurId IS NULL OR f.formateur.id = :formateurId) AND (:publie IS NULL OR f.publie = :publie)")
    Page<Formation> gerees(@Param("formateurId") Long formateurId, @Param("publie") Boolean publie, Pageable pageable);

    long countByPublieTrueAndDeletedAtIsNull();
}
