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
 * Session ouverte sur un appareil. Le jeton de rafraîchissement voyage dans un cookie HttpOnly ;
 * la base n'en garde que l'empreinte. Chaque renouvellement remplace le jeton (rotation).
 */
@Entity
@Table(name = "refresh_token", indexes = {
        @Index(name = "idx_refresh_token_empreinte", columnList = "empreinte", unique = true),
        @Index(name = "idx_refresh_token_user_id", columnList = "utilisateur_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken extends BaseEntity {

    @Column(nullable = false, unique = true, length = 255)
    private String empreinte;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Column(name = "date_expiration", nullable = false)
    private LocalDateTime dateExpiration;

    @Column(nullable = false)
    @Builder.Default
    private Boolean revoque = false;

    @Column(name = "revoque_le")
    private LocalDateTime revoqueLe;

    /** Vrai si l'utilisateur a demandé à rester connecté : le cookie survit à la fermeture du navigateur. */
    @Column(nullable = false)
    @Builder.Default
    private Boolean persistant = false;

    public boolean estExpire() {
        return LocalDateTime.now().isAfter(this.dateExpiration);
    }

    public void revoquer() {
        this.revoque = true;
        this.revoqueLe = LocalDateTime.now();
    }
}
