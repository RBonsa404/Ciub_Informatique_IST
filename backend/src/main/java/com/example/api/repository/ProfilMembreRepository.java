package com.example.api.repository;

import com.example.api.model.ProfilMembre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ProfilMembreRepository extends JpaRepository<ProfilMembre, Long> {
    Optional<ProfilMembre> findByNumeroMembre(String numeroMembre);
    Optional<ProfilMembre> findByUtilisateur_Email(String email);
    boolean existsByNumeroMembre(String numeroMembre);
}
