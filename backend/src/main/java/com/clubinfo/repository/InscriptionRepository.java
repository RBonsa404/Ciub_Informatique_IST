package com.clubinfo.repository;

import com.clubinfo.entity.Inscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InscriptionRepository extends JpaRepository<Inscription, Long> {
    List<Inscription> findByUtilisateurId(Long utilisateurId);
    Optional<Inscription> findByUtilisateurIdAndEvenementId(Long utilisateurId, Long evenementId);
    Optional<Inscription> findByUtilisateurIdAndSessionId(Long utilisateurId, Long sessionId);
    List<Inscription> findByEvenementId(Long evenementId);
    List<Inscription> findBySessionId(Long sessionId);
    boolean existsByUtilisateurIdAndEvenementId(Long utilisateurId, Long evenementId);
    boolean existsByUtilisateurIdAndSessionId(Long utilisateurId, Long sessionId);
}
