package com.clubinfo.ist.common;

import com.clubinfo.ist.common.config.JacksonConfig;
import com.clubinfo.ist.common.courriel.Courriel;
import com.clubinfo.ist.common.security.Jetons;
import com.clubinfo.ist.common.validation.AdresseWebSure;
import com.clubinfo.ist.common.validation.MotDePasseConforme;
import com.clubinfo.ist.common.web.Slugs;
import com.clubinfo.ist.fichier.TypeDeFichier;
import com.clubinfo.ist.user.dto.GestionDesComptesDtos.RoleDuCompte;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Règles pures, vérifiées sans base ni serveur. */
class ReglesTest {

    // ---------------------------------------------------------------- Mots de passe

    @ParameterizedTest
    @ValueSource(strings = {"Passe#2026", "Ouaga-2026 été", "Zongo_2026+", "Motdepasse1€", "Été2026!bien"})
    @DisplayName("Mot de passe conforme : huit caractères, minuscule, majuscule, chiffre et un symbole quelconque")
    void motDePasseAccepte(String motDePasse) {
        assertThat(MotDePasseConforme.Validateur.conforme(motDePasse)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"Ab1#", "sansmajuscule1#", "SANSMINUSCULE1#", "SansChiffre##", "SansSymbole2026", "Espace seule 2026"})
    @DisplayName("Mot de passe refusé dès qu'un critère manque (une espace n'est pas un symbole)")
    void motDePasseRefuse(String motDePasse) {
        assertThat(MotDePasseConforme.Validateur.conforme(motDePasse)).isFalse();
    }

    @Test
    @DisplayName("Mot de passe refusé au-delà de 72 octets, que l'algorithme de hachage ignorerait")
    void motDePasseTropLong() {
        assertThat(MotDePasseConforme.Validateur.conforme("Aa1#" + "x".repeat(68))).isTrue();
        assertThat(MotDePasseConforme.Validateur.conforme("Aa1#" + "x".repeat(69))).isFalse();
        assertThat(MotDePasseConforme.Validateur.conforme("Aa1#" + "é".repeat(35))).isFalse();
    }

    // ---------------------------------------------------------------- Identifiants d'adresse

    @ParameterizedTest
    @CsvSource({
            "Atelier Git : les bases, atelier-git-les-bases",
            "Réseaux & systèmes, reseaux-systemes",
            "  Été   2026 !  , ete-2026",
            "L'événement « phare », l-evenement-phare",
            "###, contenu",
    })
    @DisplayName("Identifiant d'adresse : minuscules sans accent, mots séparés par des tirets")
    void slug(String titre, String attendu) {
        assertThat(Slugs.de(titre)).isEqualTo(attendu);
    }

    @Test
    @DisplayName("Identifiant d'adresse libre : suffixe numérique croissant, borné à 200 caractères")
    void slugLibre() {
        Set<String> pris = new HashSet<>(Set.of("hackathon", "hackathon-2"));
        assertThat(Slugs.libre("Hackathon", pris::contains)).isEqualTo("hackathon-3");
        assertThat(Slugs.libre("Conférence", pris::contains)).isEqualTo("conference");
        assertThat(Slugs.de("a".repeat(400))).hasSize(200);
    }

    // ---------------------------------------------------------------- Adresses web

    @ParameterizedTest
    @ValueSource(strings = {"https://exemple.test/support.pdf", "http://exemple.test", "/api/v1/fichiers/0f8fad5b-d9cb-469f-a165-70867728950e",
            "/fichiers/0f8fad5b-d9cb-469f-a165-70867728950e", ""})
    @DisplayName("Adresse sûre : lien http(s) ou fichier déposé sur la plateforme")
    void adresseAcceptee(String adresse) {
        assertThat(new AdresseWebSure.Validateur().isValid(adresse, null)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"javascript:alert(1)", "data:text/html;base64,PHNjcmlwdD4=", "ftp://exemple.test/fichier", "//exemple.test/chemin",
            "/api/v1/fichiers/../../etc/passwd", "https://", "pas une adresse"})
    @DisplayName("Adresse refusée : tout autre schéma, tout chemin interne qui n'est pas un fichier déposé")
    void adresseRefusee(String adresse) {
        assertThat(new AdresseWebSure.Validateur().isValid(adresse, null)).isFalse();
    }

    @Test
    @DisplayName("L'identifiant du fichier déposé est extrait de son adresse")
    void fichierDepose() {
        assertThat(AdresseWebSure.Validateur.fichierDepose("/api/v1/fichiers/0f8fad5b-d9cb-469f-a165-70867728950e"))
                .contains("0f8fad5b-d9cb-469f-a165-70867728950e");
        assertThat(AdresseWebSure.Validateur.fichierDepose("https://exemple.test/fichiers/0f8fad5b-d9cb-469f-a165-70867728950e")).isEmpty();
        assertThat(AdresseWebSure.Validateur.fichierDepose(null)).isEmpty();
    }

    // ---------------------------------------------------------------- Fichiers

    @Test
    @DisplayName("Type de fichier : établi par la signature, confirmé par l'extension")
    void typeDeFichier() {
        byte[] pdf = "%PDF-1.7 suite".getBytes();
        byte[] zip = {'P', 'K', 3, 4, 20, 0, 0, 0, 8, 0, 0, 0};
        byte[] webp = {'R', 'I', 'F', 'F', 1, 2, 3, 4, 'W', 'E', 'B', 'P'};
        byte[] jpeg = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16, 'J', 'F', 'I', 'F', 0, 1};

        assertThat(TypeDeFichier.reconnaitre(pdf, "cours.PDF")).contains(TypeDeFichier.PDF);
        assertThat(TypeDeFichier.reconnaitre(zip, "archive.zip")).contains(TypeDeFichier.ZIP);
        assertThat(TypeDeFichier.reconnaitre(zip, "rapport.docx")).contains(TypeDeFichier.DOCX);
        assertThat(TypeDeFichier.reconnaitre(webp, "image.webp")).contains(TypeDeFichier.WEBP);
        assertThat(TypeDeFichier.reconnaitre(jpeg, "photo.jpeg")).contains(TypeDeFichier.JPEG);
        assertThat(TypeDeFichier.JPEG.estImage()).isTrue();
        assertThat(TypeDeFichier.PDF.estImage()).isFalse();

        assertThat(TypeDeFichier.reconnaitre(pdf, "cours.docx")).isEmpty();
        assertThat(TypeDeFichier.reconnaitre(zip, "cours.pdf")).isEmpty();
        assertThat(TypeDeFichier.reconnaitre(pdf, "sans-extension")).isEmpty();
        assertThat(TypeDeFichier.reconnaitre(new byte[] {'%', 'P'}, "court.pdf")).isEmpty();
        assertThat(TypeDeFichier.reconnaitre("<html>".getBytes(), "page.html")).isEmpty();
        assertThat(TypeDeFichier.deTypeMime("application/pdf")).contains(TypeDeFichier.PDF);
        assertThat(TypeDeFichier.deTypeMime("text/html")).isEmpty();
    }

    // ---------------------------------------------------------------- Jetons, courriels, dates, rôles

    @Test
    @DisplayName("Jetons : aléatoires, utilisables dans une adresse ; l'empreinte est stable et ne révèle pas le jeton")
    void jetons() {
        String jeton = Jetons.aleatoire();
        assertThat(jeton).hasSize(43).matches("[A-Za-z0-9_-]+").isNotEqualTo(Jetons.aleatoire());
        assertThat(Jetons.empreinte(jeton)).hasSize(64).matches("[0-9a-f]+").isEqualTo(Jetons.empreinte(jeton)).doesNotContain(jeton);
        assertThat(Jetons.empreinte("abc")).isEqualTo("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    }

    @Test
    @DisplayName("Courriel : objet et adresse de réponse sur une ligne, destinataire obligatoire")
    void courriel() {
        Courriel courriel = new Courriel(" awa@club.test ", "Objet\r\nBcc: tiers@club.test", null, "retour@club.test\r\nBcc: x@club.test");
        assertThat(courriel.destinataire()).isEqualTo("awa@club.test");
        assertThat(courriel.objet()).isEqualTo("Objet Bcc: tiers@club.test");
        assertThat(courriel.repondreA()).doesNotContain("\r").doesNotContain("\n");
        assertThat(courriel.texte()).isEmpty();
        assertThat(new Courriel("awa@club.test", "Objet", "Texte").repondreA()).isNull();
        assertThatThrownBy(() -> new Courriel(" ", "Objet", "Texte")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Dates : écrites en UTC avec « Z », lues avec ou sans décalage et ramenées en UTC")
    void dates() {
        LocalDateTime instant = LocalDateTime.of(2026, 10, 2, 14, 30, 15);
        assertThat(JacksonConfig.enUtc(instant)).isEqualTo("2026-10-02T14:30:15.000Z");
        assertThat(JacksonConfig.depuisIso("2026-10-02T14:30:15Z")).isEqualTo(instant);
        assertThat(JacksonConfig.depuisIso("2026-10-02T16:30:15+02:00")).isEqualTo(instant);
        assertThat(JacksonConfig.depuisIso("2026-10-02T14:30:15")).isEqualTo(instant);
    }

    @Test
    @DisplayName("Hiérarchie des rôles : du membre au Super Admin")
    void rangsDesRoles() {
        assertThat(RoleDuCompte.SUPER_ADMIN.rang()).isGreaterThan(RoleDuCompte.ADMIN.rang());
        assertThat(RoleDuCompte.ADMIN.rang()).isGreaterThan(RoleDuCompte.RESPONSABLE_CLUB.rang());
        assertThat(RoleDuCompte.ADMIN.rang()).isGreaterThan(RoleDuCompte.DSI.rang());
        assertThat(RoleDuCompte.RESPONSABLE_CLUB.rang()).isGreaterThan(RoleDuCompte.FORMATEUR.rang());
        assertThat(RoleDuCompte.FORMATEUR.rang()).isGreaterThan(RoleDuCompte.MEMBRE.rang());
        assertThat(RoleDuCompte.de("ROLE_DSI")).contains(RoleDuCompte.DSI);
        assertThat(RoleDuCompte.de("ROLE_INCONNU")).isEmpty();
        assertThat(RoleDuCompte.FORMATEUR.nomTechnique()).isEqualTo("ROLE_FORMATEUR");
        assertThat(RoleDuCompte.rangLePlusEleve(Set.of())).isZero();
    }
}
