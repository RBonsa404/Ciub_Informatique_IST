package com.clubinfo.ist.inscription.repository;

import com.clubinfo.ist.inscription.entity.Presence;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PresenceRepository extends JpaRepository<Presence, Long> {

    @EntityGraph(attributePaths = {"inscription", "inscription.utilisateur"})
    @Query("SELECT p FROM Presence p WHERE p.sessionFormation.id = :seanceId ORDER BY p.id")
    List<Presence> deLaSeance(@Param("seanceId") Long seanceId);

    Optional<Presence> findByInscriptionIdAndSessionFormationId(Long inscriptionId, Long sessionId);

    /** Séances de formation auxquelles le membre a été pointé présent (les événements ne comptent pas). */
    @Query("SELECT COUNT(p) FROM Presence p WHERE p.inscription.utilisateur.id = :utilisateurId " +
           "AND p.statut = com.clubinfo.ist.inscription.entity.StatutPresence.PRESENT " +
           "AND p.inscription.deletedAt IS NULL AND p.sessionFormation.deletedAt IS NULL")
    long seancesSuivies(@Param("utilisateurId") Long utilisateurId);
}
