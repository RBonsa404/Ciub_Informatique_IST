package com.clubinfo.ist.ressource.repository;

import com.clubinfo.ist.ressource.entity.Ressource;
import com.clubinfo.ist.ressource.entity.TypeRessource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RessourceRepository extends JpaRepository<Ressource, Long> {

    Optional<Ressource> findByIdAndDeletedAtIsNull(Long id);

    Page<Ressource> findAllByEstPubliqueTrueAndDeletedAtIsNull(Pageable pageable);

    Page<Ressource> findAllByDeletedAtIsNull(Pageable pageable);

    List<Ressource> findAllByFormationIdAndDeletedAtIsNull(Long formationId);

    @Query("SELECT r FROM Ressource r WHERE r.deletedAt IS NULL AND r.estPublique = true " +
           "AND (:categorieId IS NULL OR r.categorie.id = :categorieId) " +
           "AND (:type IS NULL OR r.type = :type) " +
           "AND (:search IS NULL OR LOWER(r.titre) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(r.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Ressource> findPublicWithFilters(
            @Param("categorieId") Long categorieId,
            @Param("type") TypeRessource type,
            @Param("search") String search,
            Pageable pageable);
}
