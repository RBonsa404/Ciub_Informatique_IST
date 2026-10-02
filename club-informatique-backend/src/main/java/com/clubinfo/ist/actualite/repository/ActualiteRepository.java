package com.clubinfo.ist.actualite.repository;

import com.clubinfo.ist.actualite.entity.Actualite;
import com.clubinfo.ist.actualite.entity.Visibilite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ActualiteRepository extends JpaRepository<Actualite, Long> {

    @EntityGraph(attributePaths = {"auteur", "categorie"})
    Optional<Actualite> findByIdAndDeletedAtIsNull(Long id);

    boolean existsBySlug(String slug);

    /** Actualité publiée, pour la visibilité demandée seulement. */
    @EntityGraph(attributePaths = {"auteur", "categorie"})
    Optional<Actualite> findBySlugAndVisibiliteAndPublieTrueAndDeletedAtIsNull(String slug, Visibilite visibilite);

    @EntityGraph(attributePaths = {"auteur", "categorie"})
    @Query("SELECT a FROM Actualite a WHERE a.deletedAt IS NULL AND a.publie = true AND a.visibilite = :visibilite " +
           "AND (:categorieId IS NULL OR a.categorie.id = :categorieId) " +
           "AND (CAST(:search AS string) IS NULL OR LOWER(a.titre) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "OR LOWER(a.contenu) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<Actualite> publiees(@Param("visibilite") Visibilite visibilite, @Param("categorieId") Long categorieId,
                             @Param("search") String search, Pageable pageable);

    /** Toutes les actualités non supprimées, brouillons compris. */
    @EntityGraph(attributePaths = {"auteur", "categorie"})
    @Query("SELECT a FROM Actualite a WHERE a.deletedAt IS NULL AND (:publie IS NULL OR a.publie = :publie)")
    Page<Actualite> gerees(@Param("publie") Boolean publie, Pageable pageable);

    long countByPublieTrueAndDeletedAtIsNull();
}
