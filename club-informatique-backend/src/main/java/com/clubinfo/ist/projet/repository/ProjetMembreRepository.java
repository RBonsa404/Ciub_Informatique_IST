package com.clubinfo.ist.projet.repository;

import com.clubinfo.ist.projet.entity.ProjetMembre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjetMembreRepository extends JpaRepository<ProjetMembre, Long> {

    List<ProjetMembre> findAllByProjetId(Long projetId);

    Optional<ProjetMembre> findByProjetIdAndUtilisateurId(Long projetId, Long utilisateurId);

    boolean existsByProjetIdAndUtilisateurId(Long projetId, Long utilisateurId);
}
