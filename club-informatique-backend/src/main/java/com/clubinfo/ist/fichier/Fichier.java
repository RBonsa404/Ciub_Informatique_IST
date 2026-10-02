package com.clubinfo.ist.fichier;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Métadonnées d'un fichier déposé ; le contenu est conservé par le service de stockage sous la clé. */
@Entity
@Table(name = "fichier")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Fichier {

    /** Qui peut lire le fichier. Un fichier qui n'est rattaché à aucun contenu reste privé. */
    public enum Acces { PRIVE, MEMBRES, PUBLIC }

    /** Identifiant aléatoire : il ne se devine pas et ne révèle aucun ordre de dépôt. */
    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, unique = true)
    private String cle;

    @Column(nullable = false)
    private String nom;

    @Column(name = "type_mime", nullable = false, length = 100)
    private String typeMime;

    @Column(name = "taille_octets", nullable = false)
    private Long tailleOctets;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Acces acces = Acces.PRIVE;

    @Column(name = "deposant_id")
    private Long deposantId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
