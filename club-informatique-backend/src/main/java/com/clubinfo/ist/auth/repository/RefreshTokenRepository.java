package com.clubinfo.ist.auth.repository;

import com.clubinfo.ist.auth.entity.RefreshToken;
import com.clubinfo.ist.user.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    @Modifying
    @Query("UPDATE RefreshToken r SET r.revoque = true WHERE r.utilisateur = :user")
    void revokeAllByUser(@Param("user") Utilisateur user);

    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.utilisateur = :user")
    void deleteAllByUser(@Param("user") Utilisateur user);
}
