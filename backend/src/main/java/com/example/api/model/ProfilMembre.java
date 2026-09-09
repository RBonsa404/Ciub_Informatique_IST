package com.example.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "profil_membres")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "utilisateur")
@EqualsAndHashCode(exclude = "utilisateur")
public class ProfilMembre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 50)
    private String numeroMembre;

    private LocalDate dateNaissance;

    @Column(length = 100)
    private String filiere;

    @Column(length = 20)
    private String anneeEtude;

    private LocalDate dateAdhesion;

    @Column(columnDefinition = "TEXT")
    private String biographie;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", unique = true)
    private Utilisateur utilisateur;
}
