package com.clubinfo.ist.bureau;

import com.clubinfo.ist.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Membre du bureau tel que le club le présente : identité, fonction, filière. Aucune photo. */
@Entity
@Table(name = "membre_bureau")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MembreBureau extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 100)
    private String prenom;

    @Column(nullable = false, length = 100)
    private String fonction;

    @Column(length = 100)
    private String filiere;

    @Column(nullable = false)
    private Integer ordre;
}
