package com.clubinfo.ist.auth.repository;

import com.clubinfo.ist.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByEmpreinte(String empreinte);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE RefreshToken r SET r.revoque = true, r.revoqueLe = :maintenant WHERE r.utilisateur.id = :utilisateurId AND r.revoque = false")
    void revoquerToutes(@Param("utilisateurId") Long utilisateurId, @Param("maintenant") LocalDateTime maintenant);

    @Query("SELECT COUNT(r) > 0 FROM RefreshToken r WHERE r.utilisateur.id = :utilisateurId AND r.revoque = false AND r.persistant = true")
    boolean aUneSessionPersistante(@Param("utilisateurId") Long utilisateurId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM RefreshToken r WHERE r.dateExpiration < :limite")
    int purgerExpirees(@Param("limite") LocalDateTime limite);
}
