package com.clubinfo.ist.user.repository;

import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    Optional<Utilisateur> findByEmailAndDeletedAtIsNull(String email);

    boolean existsByEmailAndDeletedAtIsNull(String email);

    default Optional<Utilisateur> findByEmail(String email) {
        return findByEmailAndDeletedAtIsNull(email);
    }

    default boolean existsByEmail(String email) {
        return existsByEmailAndDeletedAtIsNull(email);
    }

    Optional<Utilisateur> findByIdAndDeletedAtIsNull(Long id);

    @Query("SELECT u FROM Utilisateur u WHERE u.deletedAt IS NULL " +
           "AND (:search IS NULL OR LOWER(u.nom) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.prenom) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Utilisateur> findAllActiveWithSearch(@Param("search") String search, Pageable pageable);

    @Query("SELECT u FROM Utilisateur u WHERE u.deletedAt IS NULL AND u.statut = :statut")
    Page<Utilisateur> findAllByStatut(@Param("statut") StatutUtilisateur statut, Pageable pageable);

    @Query("SELECT COUNT(u) FROM Utilisateur u WHERE u.deletedAt IS NULL AND u.statut = :statut")
    long countByStatut(@Param("statut") StatutUtilisateur statut);

    @Query("SELECT COUNT(u) FROM Utilisateur u WHERE u.deletedAt IS NULL")
    long countActive();

    Optional<Utilisateur> findByNumeroMembreAndDeletedAtIsNull(String numeroMembre);
}
