package com.clubinfo.ist.formation.repository;

import com.clubinfo.ist.formation.entity.SessionFormation;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface SessionFormationRepository extends JpaRepository<SessionFormation, Long> {

    @EntityGraph(attributePaths = {"formation", "formation.formateur"})
    Optional<SessionFormation> findByIdAndDeletedAtIsNull(Long id);

    /** Verrouille la séance jusqu'à la fin de la transaction : le décompte de ses places ne peut pas être faussé. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SessionFormation s WHERE s.id = :id AND s.deletedAt IS NULL")
    Optional<SessionFormation> verrouiller(@Param("id") Long id);

    /** Séances non supprimées de plusieurs formations, en une seule requête. */
    @Query("SELECT s FROM SessionFormation s WHERE s.formation.id IN :formationIds AND s.deletedAt IS NULL ORDER BY s.dateDebut ASC, s.id ASC")
    List<SessionFormation> desFormations(@Param("formationIds") Collection<Long> formationIds);

    /** Vrai si le formateur anime déjà, sur ce créneau, une autre séance non annulée. */
    @Query("SELECT COUNT(s) > 0 FROM SessionFormation s WHERE s.deletedAt IS NULL AND s.formation.deletedAt IS NULL " +
           "AND s.statut <> com.clubinfo.ist.formation.entity.StatutSession.ANNULEE " +
           "AND s.formation.formateur.id = :formateurId AND s.id <> :saufSeance " +
           "AND s.dateDebut < :fin AND s.dateFin > :debut")
    boolean chevauche(@Param("formateurId") Long formateurId, @Param("saufSeance") Long saufSeance,
                      @Param("debut") LocalDateTime debut, @Param("fin") LocalDateTime fin);
}
