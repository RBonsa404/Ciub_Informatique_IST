package com.clubinfo.ist.user.entity;

import com.clubinfo.ist.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Permission granulaire attribuée aux rôles.
 * Exemples : FORMATION_CREATE, EVENEMENT_MANAGE, USER_MANAGE, STATS_READ.
 */
@Entity
@Table(name = "permission", indexes = {
        @Index(name = "idx_permission_code", columnList = "code", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String code;

    @Column(nullable = false, length = 255)
    private String libelle;

    public String getNom() {
        return this.code;
    }

    public String getDescription() {
        return this.libelle;
    }
}
