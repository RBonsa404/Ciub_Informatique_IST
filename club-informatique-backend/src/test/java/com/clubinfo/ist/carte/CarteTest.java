package com.clubinfo.ist.carte;

import com.clubinfo.ist.user.entity.Utilisateur;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class CarteTest {

    @Test
    @DisplayName("La carte est une image PNG au format carte bancaire, même avec un nom très long et des accents")
    void dessin() throws IOException {
        byte[] png = DessinCarte.png(new DonneesCarte("Moses Wilfried Emmanuel", "Sawadogo-Ouédraogo de la Tour",
                "Réseaux et Systèmes Informatiques, 3e année", "IST-2026-0142", "Décembre 2026",
                "https://informatique.ist-club.bf/c/K7pQ2xWm9RtV4nZb"));
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(png));
        assertThat(image.getWidth()).isEqualTo(DessinCarte.LARGEUR);
        assertThat(image.getHeight()).isEqualTo(DessinCarte.HAUTEUR);
    }

    @Test
    @DisplayName("La filière affichée reprend l'année d'études sans la répéter")
    void filiere() {
        assertThat(CarteService.filiere(Utilisateur.builder().filiere("Génie logiciel").anneeEtude(1).build())).isEqualTo("Génie logiciel, 1re année");
        assertThat(CarteService.filiere(Utilisateur.builder().filiere("RSI, 3e année").anneeEtude(3).build())).isEqualTo("RSI, 3e année");
        assertThat(CarteService.filiere(Utilisateur.builder().filiere("Réseaux").build())).isEqualTo("Réseaux");
        assertThat(CarteService.filiere(Utilisateur.builder().build())).isEmpty();
    }

    @Test
    @DisplayName("« Membre depuis » : mois et année en français, avec une majuscule")
    void membreDepuis() {
        assertThat(CarteService.membreDepuis(LocalDate.of(2026, 11, 16))).isEqualTo("Novembre 2026");
        assertThat(CarteService.membreDepuis(LocalDate.of(2027, 8, 1))).isEqualTo("Août 2027");
    }
}
