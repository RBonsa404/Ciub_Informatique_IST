package com.clubinfo.ist.inscription.repository;

import com.clubinfo.ist.inscription.entity.Inscription;
import com.clubinfo.ist.inscription.entity.StatutInscription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InscriptionRepository extends JpaRepository<Inscription, Long> {

    Optional<Inscription> findByIdAndDeletedAtIsNull(Long id);

    boolean existsByUtilisateurIdAndEvenementIdAndStatutNot(Long utilisateurId, Long evenementId, StatutInscription statut);

    boolean existsByUtilisateurIdAndSessionFormationIdAndStatutNot(Long utilisateurId, Long sessionId, StatutInscription statut);

    List<Inscription> findAllBySessionFormationIdAndDeletedAtIsNull(Long sessionId);

    List<Inscription> findAllByEvenementIdAndDeletedAtIsNull(Long evenementId);

    Page<Inscription> findAllByUtilisateurIdAndDeletedAtIsNullOrderByDateInscriptionDesc(Long utilisateurId, Pageable pageable);

    @Query("SELECT COUNT(i) FROM Inscription i WHERE i.evenement.id = :evenementId AND i.statut = 'CONFIRMEE' AND i.deletedAt IS NULL")
    long countConfirmedByEvenementId(@Param("evenementId") Long evenementId);

    @Query("SELECT COUNT(i) FROM Inscription i WHERE i.sessionFormation.id = :sessionId AND i.statut = 'CONFIRMEE' AND i.deletedAt IS NULL")
    long countConfirmedBySessionId(@Param("sessionId") Long sessionId);

    @Query("SELECT i FROM Inscription i WHERE i.evenement.id = :evenementId AND i.statut = 'LISTE_ATTENTE' AND i.deletedAt IS NULL ORDER BY i.dateInscription ASC")
    List<Inscription> findWaitingListByEvenementId(@Param("evenementId") Long evenementId);

    @Query("SELECT i FROM Inscription i WHERE i.sessionFormation.id = :sessionId AND i.statut = 'LISTE_ATTENTE' AND i.deletedAt IS NULL ORDER BY i.dateInscription ASC")
    List<Inscription> findWaitingListBySessionId(@Param("sessionId") Long sessionId);
}
