package com.clubinfo.ist.evenement.repository;

import com.clubinfo.ist.evenement.entity.Evenement;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EvenementRepository extends JpaRepository<Evenement, Long> {

    @EntityGraph(attributePaths = {"categorie", "organisateur"})
    Optional<Evenement> findByIdAndDeletedAtIsNull(Long id);

    @EntityGraph(attributePaths = {"categorie", "organisateur"})
    Optional<Evenement> findBySlugAndPublieTrueAndDeletedAtIsNull(String slug);

    boolean existsBySlug(String slug);

    /**
     * Verrouille l'événement jusqu'à la fin de la transaction : les inscriptions simultanées passent une à une,
     * le décompte des places ne peut pas être faussé.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Evenement e WHERE e.id = :id AND e.deletedAt IS NULL")
    Optional<Evenement> verrouiller(@Param("id") Long id);

    /** Événements publiés ; « nonTermines » ne retient que ceux dont la fin est à venir. */
    @EntityGraph(attributePaths = {"categorie", "organisateur"})
    @Query("SELECT e FROM Evenement e WHERE e.deletedAt IS NULL AND e.publie = true " +
           "AND (:nonTermines = false OR e.dateFin >= :maintenant) " +
           "AND (:categorieId IS NULL OR e.categorie.id = :categorieId) " +
           "AND (CAST(:search AS string) IS NULL OR LOWER(e.titre) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "OR LOWER(e.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "OR LOWER(e.lieu) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<Evenement> publies(@Param("nonTermines") boolean nonTermines, @Param("categorieId") Long categorieId,
                            @Param("search") String search, @Param("maintenant") LocalDateTime maintenant, Pageable pageable);

    /** Tous les événements non supprimés dont le début tombe dans la période (fin exclue). */
    @EntityGraph(attributePaths = {"categorie", "organisateur"})
    @Query("SELECT e FROM Evenement e WHERE e.deletedAt IS NULL AND e.dateDebut >= :du AND e.dateDebut < :avant")
    Page<Evenement> geres(@Param("du") LocalDateTime du, @Param("avant") LocalDateTime avant, Pageable pageable);

    long countByPublieTrueAndDeletedAtIsNull();
}
