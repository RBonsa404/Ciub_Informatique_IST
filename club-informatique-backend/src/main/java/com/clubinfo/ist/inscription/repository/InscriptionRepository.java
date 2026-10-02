package com.clubinfo.ist.inscription.repository;

import com.clubinfo.ist.inscription.entity.Inscription;
import com.clubinfo.ist.inscription.entity.StatutInscription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface InscriptionRepository extends JpaRepository<Inscription, Long> {

    @EntityGraph(attributePaths = {"utilisateur", "evenement", "sessionFormation", "sessionFormation.formation"})
    Optional<Inscription> findByIdAndDeletedAtIsNull(Long id);

    @Query("SELECT COUNT(i) > 0 FROM Inscription i WHERE i.utilisateur.id = :utilisateurId AND i.evenement.id = :evenementId " +
           "AND i.statut <> com.clubinfo.ist.inscription.entity.StatutInscription.ANNULEE AND i.deletedAt IS NULL")
    boolean inscritAEvenement(@Param("utilisateurId") Long utilisateurId, @Param("evenementId") Long evenementId);

    @Query("SELECT COUNT(i) > 0 FROM Inscription i WHERE i.utilisateur.id = :utilisateurId AND i.sessionFormation.id = :seanceId " +
           "AND i.statut <> com.clubinfo.ist.inscription.entity.StatutInscription.ANNULEE AND i.deletedAt IS NULL")
    boolean inscritASeance(@Param("utilisateurId") Long utilisateurId, @Param("seanceId") Long seanceId);

    /** Vrai si le membre a une inscription confirmée à l'une des séances de la formation. */
    @Query("SELECT COUNT(i) > 0 FROM Inscription i WHERE i.utilisateur.id = :utilisateurId AND i.sessionFormation.formation.id = :formationId " +
           "AND i.statut = com.clubinfo.ist.inscription.entity.StatutInscription.CONFIRMEE AND i.deletedAt IS NULL " +
           "AND i.sessionFormation.deletedAt IS NULL")
    boolean suitLaFormation(@Param("utilisateurId") Long utilisateurId, @Param("formationId") Long formationId);

    /** Inscriptions non annulées aux séances, encore à venir ou en cours, d'une formation. */
    @Query("SELECT COUNT(i) FROM Inscription i WHERE i.sessionFormation.formation.id = :formationId AND i.deletedAt IS NULL " +
           "AND i.statut <> com.clubinfo.ist.inscription.entity.StatutInscription.ANNULEE " +
           "AND i.sessionFormation.deletedAt IS NULL AND i.sessionFormation.dateFin > :maintenant")
    long inscriptionsActivesDeLaFormation(@Param("formationId") Long formationId, @Param("maintenant") LocalDateTime maintenant);

    @Query("SELECT COUNT(i) FROM Inscription i WHERE i.evenement.id = :evenementId AND i.deletedAt IS NULL " +
           "AND i.statut = com.clubinfo.ist.inscription.entity.StatutInscription.CONFIRMEE")
    long confirmeesDeLEvenement(@Param("evenementId") Long evenementId);

    @Query("SELECT COUNT(i) FROM Inscription i WHERE i.sessionFormation.id = :seanceId AND i.deletedAt IS NULL " +
           "AND i.statut = com.clubinfo.ist.inscription.entity.StatutInscription.CONFIRMEE")
    long confirmeesDeLaSeance(@Param("seanceId") Long seanceId);

    @Query("SELECT i.evenement.id, COUNT(i) FROM Inscription i WHERE i.evenement.id IN :ids AND i.deletedAt IS NULL " +
           "AND i.statut = com.clubinfo.ist.inscription.entity.StatutInscription.CONFIRMEE GROUP BY i.evenement.id")
    List<Object[]> confirmeesParEvenement(@Param("ids") Collection<Long> ids);

    @Query("SELECT i.sessionFormation.id, COUNT(i) FROM Inscription i WHERE i.sessionFormation.id IN :ids AND i.deletedAt IS NULL " +
           "AND i.statut = com.clubinfo.ist.inscription.entity.StatutInscription.CONFIRMEE GROUP BY i.sessionFormation.id")
    List<Object[]> confirmeesParSeance(@Param("ids") Collection<Long> ids);

    /** Inscriptions d'un événement dans un statut, de la plus ancienne à la plus récente. */
    @EntityGraph(attributePaths = {"utilisateur", "evenement"})
    @Query("SELECT i FROM Inscription i WHERE i.evenement.id = :evenementId AND i.statut = :statut AND i.deletedAt IS NULL " +
           "ORDER BY i.dateInscription ASC, i.id ASC")
    List<Inscription> deLEvenement(@Param("evenementId") Long evenementId, @Param("statut") StatutInscription statut);

    @EntityGraph(attributePaths = {"utilisateur", "sessionFormation", "sessionFormation.formation"})
    @Query("SELECT i FROM Inscription i WHERE i.sessionFormation.id = :seanceId AND i.statut = :statut AND i.deletedAt IS NULL " +
           "ORDER BY i.dateInscription ASC, i.id ASC")
    List<Inscription> deLaSeance(@Param("seanceId") Long seanceId, @Param("statut") StatutInscription statut);

    @EntityGraph(attributePaths = {"utilisateur", "evenement"})
    @Query("SELECT i FROM Inscription i WHERE i.evenement.id = :evenementId AND i.deletedAt IS NULL ORDER BY i.dateInscription ASC, i.id ASC")
    List<Inscription> toutesDeLEvenement(@Param("evenementId") Long evenementId);

    @EntityGraph(attributePaths = {"utilisateur", "sessionFormation", "sessionFormation.formation"})
    @Query("SELECT i FROM Inscription i WHERE i.sessionFormation.id = :seanceId AND i.deletedAt IS NULL ORDER BY i.dateInscription ASC, i.id ASC")
    List<Inscription> toutesDeLaSeance(@Param("seanceId") Long seanceId);

    /** Inscriptions d'un membre ; « type » vaut EVENEMENT, FORMATION ou rien. */
    @EntityGraph(attributePaths = {"evenement", "sessionFormation", "sessionFormation.formation"})
    @Query("SELECT i FROM Inscription i WHERE i.utilisateur.id = :utilisateurId AND i.deletedAt IS NULL " +
           "AND (:statut IS NULL OR i.statut = :statut) " +
           "AND (CAST(:type AS string) IS NULL OR (CAST(:type AS string) = 'EVENEMENT' AND i.evenement IS NOT NULL) " +
           "OR (CAST(:type AS string) = 'FORMATION' AND i.sessionFormation IS NOT NULL))")
    Page<Inscription> duMembre(@Param("utilisateurId") Long utilisateurId, @Param("type") String type,
                               @Param("statut") StatutInscription statut, Pageable pageable);

    /** Inscriptions confirmées, non encore rappelées, dont l'activité commence dans la fenêtre. */
    @EntityGraph(attributePaths = {"utilisateur", "evenement", "sessionFormation", "sessionFormation.formation"})
    @Query("SELECT i FROM Inscription i LEFT JOIN i.evenement e LEFT JOIN i.sessionFormation s " +
           "WHERE i.deletedAt IS NULL AND i.rappelEnvoyeLe IS NULL " +
           "AND i.statut = com.clubinfo.ist.inscription.entity.StatutInscription.CONFIRMEE " +
           "AND ((e IS NOT NULL AND e.deletedAt IS NULL AND e.publie = true AND e.dateDebut > :maintenant AND e.dateDebut <= :limite) " +
           "OR (s IS NOT NULL AND s.deletedAt IS NULL AND s.statut = com.clubinfo.ist.formation.entity.StatutSession.PLANIFIEE " +
           "AND s.dateDebut > :maintenant AND s.dateDebut <= :limite))")
    List<Inscription> aRappeler(@Param("maintenant") LocalDateTime maintenant, @Param("limite") LocalDateTime limite);
}
