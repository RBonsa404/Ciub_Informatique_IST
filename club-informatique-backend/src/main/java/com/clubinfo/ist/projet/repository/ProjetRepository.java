package com.clubinfo.ist.projet.repository;

import com.clubinfo.ist.projet.entity.Projet;
import com.clubinfo.ist.projet.entity.StatutProjet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjetRepository extends JpaRepository<Projet, Long> {

    Optional<Projet> findByIdAndDeletedAtIsNull(Long id);

    Optional<Projet> findBySlugAndDeletedAtIsNull(String slug);

    Page<Projet> findAllByStatutInAndDeletedAtIsNull(List<StatutProjet> statuts, Pageable pageable);

    Page<Projet> findAllByDeletedAtIsNull(Pageable pageable);

    @Query("SELECT p FROM Projet p WHERE p.deletedAt IS NULL AND p.statut IN (:statuts) " +
           "AND (:categorieId IS NULL OR p.categorie.id = :categorieId) " +
           "AND (:search IS NULL OR LOWER(p.titre) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.technologies) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Projet> findByStatutInWithFilters(
            @Param("statuts") List<StatutProjet> statuts,
            @Param("categorieId") Long categorieId,
            @Param("search") String search,
            Pageable pageable);

    List<Projet> findAllByStatutAndDeletedAtIsNull(StatutProjet statut);

    long countByStatutAndDeletedAtIsNull(StatutProjet statut);
}
