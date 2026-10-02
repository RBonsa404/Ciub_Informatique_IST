package com.clubinfo.ist.user.repository;

import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
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
           "AND (CAST(:search AS string) IS NULL OR LOWER(u.nom) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "OR LOWER(u.prenom) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<Utilisateur> findAllActiveWithSearch(@Param("search") String search, Pageable pageable);

    @Query("SELECT u FROM Utilisateur u WHERE u.deletedAt IS NULL AND u.statut = :statut")
    Page<Utilisateur> findAllByStatut(@Param("statut") StatutUtilisateur statut, Pageable pageable);

    @Query("SELECT COUNT(u) FROM Utilisateur u WHERE u.deletedAt IS NULL AND u.statut = :statut")
    long countByStatut(@Param("statut") StatutUtilisateur statut);

    @Query("SELECT COUNT(u) FROM Utilisateur u WHERE u.deletedAt IS NULL")
    long countActive();

    Optional<Utilisateur> findByNumeroMembreAndDeletedAtIsNull(String numeroMembre);

    List<Utilisateur> findAllByStatutAndDeletedAtIsNull(StatutUtilisateur statut);

    @Query("SELECT COUNT(u) FROM Utilisateur u JOIN u.roles r WHERE u.deletedAt IS NULL AND u.test = false AND r.nom = :role")
    long compterReelsAvecRole(@Param("role") String role);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Utilisateur u SET u.versionSession = u.versionSession + 1 WHERE u.id = :id")
    void incrementerVersionSession(@Param("id") Long id);

    @Query(value = "SELECT nextval('numero_membre_seq')", nativeQuery = true)
    long prochainNumeroDeMembre();

    /** Comptes actifs portant le rôle. */
    @Query("SELECT DISTINCT u FROM Utilisateur u JOIN u.roles r WHERE u.deletedAt IS NULL " +
           "AND u.statut = com.clubinfo.ist.user.entity.StatutUtilisateur.ACTIF AND r.nom = :role")
    List<Utilisateur> actifsAvecRole(@Param("role") String role);

    /** Vrai si un compte réel (ni supprimé, ni de test) porte le rôle. */
    @Query("SELECT COUNT(u) > 0 FROM Utilisateur u JOIN u.roles r WHERE u.deletedAt IS NULL AND u.test = false AND r.nom = :role")
    boolean existeReelAvecRole(@Param("role") String role);
}
