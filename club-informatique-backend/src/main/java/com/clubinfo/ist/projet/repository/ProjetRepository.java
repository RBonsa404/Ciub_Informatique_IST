package com.clubinfo.ist.projet.repository;

import com.clubinfo.ist.projet.entity.Projet;
import com.clubinfo.ist.projet.entity.StatutProjet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjetRepository extends JpaRepository<Projet, Long> {

    @EntityGraph(attributePaths = {"porteur", "categorie"})
    Optional<Projet> findByIdAndDeletedAtIsNull(Long id);

    @EntityGraph(attributePaths = {"porteur", "categorie"})
    Optional<Projet> findBySlugAndDeletedAtIsNull(String slug);

    boolean existsBySlug(String slug);

    /** Projets dans l'un des statuts, avec recherche et catégorie facultatives. */
    @EntityGraph(attributePaths = {"porteur", "categorie"})
    @Query("SELECT p FROM Projet p WHERE p.deletedAt IS NULL AND p.statut IN :statuts " +
           "AND (:categorieId IS NULL OR p.categorie.id = :categorieId) " +
           "AND (CAST(:search AS string) IS NULL OR LOWER(p.titre) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "OR LOWER(p.technologies) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<Projet> parStatuts(@Param("statuts") Collection<StatutProjet> statuts, @Param("categorieId") Long categorieId,
                            @Param("search") String search, Pageable pageable);

    /** Projets d'un porteur, tous statuts ou un seul. */
    @EntityGraph(attributePaths = {"porteur", "categorie"})
    @Query("SELECT p FROM Projet p WHERE p.deletedAt IS NULL AND p.porteur.id = :porteurId " +
           "AND (:statut IS NULL OR p.statut = :statut) AND (:categorieId IS NULL OR p.categorie.id = :categorieId)")
    Page<Projet> duPorteur(@Param("porteurId") Long porteurId, @Param("statut") StatutProjet statut,
                           @Param("categorieId") Long categorieId, Pageable pageable);

    @EntityGraph(attributePaths = {"porteur", "categorie"})
    @Query("SELECT p FROM Projet p WHERE p.deletedAt IS NULL AND (:statut IS NULL OR p.statut = :statut)")
    Page<Projet> geres(@Param("statut") StatutProjet statut, Pageable pageable);

    @EntityGraph(attributePaths = {"porteur", "categorie"})
    List<Projet> findAllByStatutAndDeletedAtIsNullOrderByCreatedAtAscIdAsc(StatutProjet statut);

    long countByStatutAndDeletedAtIsNull(StatutProjet statut);

    long countByStatutInAndDeletedAtIsNull(Collection<StatutProjet> statuts);
}
