package com.clubinfo.repository;

import com.clubinfo.entity.Inscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InscriptionRepository extends JpaRepository<Inscription, Long> {
    boolean existsByUtilisateurIdAndEvenementId(Long utilisateurId, Long evenementId);
    List<Inscription> findByEvenementId(Long evenementId);
    Optional<Inscription> findByUtilisateurIdAndEvenementId(Long utilisateurId, Long evenementId);
}