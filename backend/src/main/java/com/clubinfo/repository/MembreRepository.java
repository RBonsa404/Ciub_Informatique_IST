package com.clubinfo.repository;

import com.clubinfo.entity.Membre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MembreRepository extends JpaRepository<Membre, Long> {
    Optional<Membre> findByNumeroMembre(String numeroMembre);
    boolean existsByNumeroMembre(String numeroMembre);
}
