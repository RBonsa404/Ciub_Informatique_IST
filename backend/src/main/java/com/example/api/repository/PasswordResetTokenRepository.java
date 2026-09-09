package com.example.api.repository;

import com.example.api.model.PasswordResetToken;
import com.example.api.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    void deleteByUtilisateur(Utilisateur utilisateur);
}
