package com.clubinfo.ist.auth.entity;

import com.clubinfo.ist.common.audit.BaseEntity;
import com.clubinfo.ist.user.entity.Utilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entité représentant un Refresh Token pour le renouvellement sécurisé de session.
 * Prend en charge la rotation automatique de token et la détection d'usurpation.
 */
@Entity
@Table(name = "refresh_token", indexes = {
        @Index(name = "idx_refresh_token_token", columnList = "token", unique = true),
        @Index(name = "idx_refresh_token_user_id", columnList = "utilisateur_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken extends BaseEntity {

    @Column(nullable = false, unique = true, length = 255)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Column(name = "date_expiration", nullable = false)
    private LocalDateTime dateExpiration;

    @Column(nullable = false)
    @Builder.Default
    private Boolean revoque = false;

    @Column(name = "remplace_par", length = 255)
    private String remplacePar;

    public boolean estExpire() {
        return LocalDateTime.now().isAfter(this.dateExpiration);
    }

    public boolean estValide() {
        return !Boolean.TRUE.equals(this.revoque) && !estExpire();
    }
}
