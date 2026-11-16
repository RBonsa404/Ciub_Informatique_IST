package com.clubinfo.ist.common;

import com.clubinfo.ist.common.stockage.LocalStorageService;
import com.clubinfo.ist.common.stockage.RelaisStorageService;
import com.clubinfo.ist.common.stockage.S3StorageService;
import com.clubinfo.ist.common.stockage.StockageConfig;
import com.clubinfo.ist.common.stockage.StorageService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import software.amazon.awssdk.services.s3.S3Client;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.ServerSocket;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/** Les trois stockages rendent le même service : enregistrer, relire à l'identique, supprimer. */
class StockageIT {

    private static final byte[] CONTENU = "Support de la séance 1 : introduction à Git".getBytes(StandardCharsets.UTF_8);

    private static void cycleComplet(StorageService stockage) throws IOException {
        stockage.enregistrer("2026/10/essai", new ByteArrayInputStream(CONTENU), CONTENU.length, "application/pdf");
        try (InputStream relu = stockage.lire("2026/10/essai")) {
            assertThat(relu.readAllBytes()).isEqualTo(CONTENU);
        }
        stockage.supprimer("2026/10/essai");
        assertThatThrownBy(() -> stockage.lire("2026/10/essai").close()).isInstanceOf(IOException.class);
        stockage.supprimer("2026/10/essai");
    }

    @Test
    @DisplayName("Stockage local : cycle complet dans le dossier configuré")
    void stockageLocal(@TempDir Path dossier) throws IOException {
        cycleComplet(new LocalStorageService(dossier.toString()));
    }

    @Test
    @DisplayName("Stockage local : une clé ne sort jamais du dossier")
    void cleHorsDuDossier(@TempDir Path dossier) {
        StorageService stockage = new LocalStorageService(dossier.resolve("depots").toString());
        assertThatThrownBy(() -> stockage.enregistrer("../ailleurs", new ByteArrayInputStream(CONTENU), CONTENU.length, "application/pdf"))
                .isInstanceOf(IOException.class);
        assertThatThrownBy(() -> stockage.lire("../../application.yml")).isInstanceOf(IOException.class);
        assertThat(dossier.resolve("ailleurs")).doesNotExist();
    }

    @Test
    @DisplayName("Coffre à fichiers : cycle complet avec le script de l'hébergement web, clé exigée, chemins refusés")
    void coffreAFichiers(@TempDir Path dossier) throws Exception {
        assumeTrue(phpDisponible(), "PHP absent : test du coffre à fichiers ignoré");
        String secret = "s".repeat(64);
        Path stockage = dossier.resolve("stockage-club");
        Path racine = dossier.resolve("public");
        Files.createDirectories(racine);
        Files.copy(Path.of("deploiement/o2switch-stockage/public/index.php"), racine.resolve("index.php"));
        Files.writeString(dossier.resolve("config-stockage-club.php"),
                "<?php return ['cle' => '" + secret + "', 'dossier' => '" + stockage.toString().replace("\\", "/") + "'];");
        int port;
        try (ServerSocket libre = new ServerSocket(0)) {
            port = libre.getLocalPort();
        }
        // Limites reprises du fichier .user.ini déposé avec le script (le serveur intégré de PHP ne le lit pas).
        Process serveur = new ProcessBuilder("php", "-d", "post_max_size=16M", "-d", "upload_max_filesize=16M", "-d", "memory_limit=128M",
                "-S", "127.0.0.1:" + port, "-t", racine.toString(), racine.resolve("index.php").toString())
                .redirectErrorStream(true)
                .redirectOutput(dossier.resolve("php.log").toFile())
                .start();
        try {
            String adresse = "http://127.0.0.1:" + port + "/";
            RelaisStorageService coffre = new RelaisStorageService(adresse, secret);
            for (int essai = 0; ; essai++) {
                try {
                    coffre.verifier();
                    break;
                } catch (IOException pasEncore) {
                    if (essai > 50) throw pasEncore;
                    Thread.sleep(100);
                }
            }
            cycleComplet(coffre);

            // Mauvaise clé : tout est refusé.
            RelaisStorageService intrus = new RelaisStorageService(adresse, "x".repeat(64));
            assertThatThrownBy(intrus::verifier).isInstanceOf(IOException.class);
            assertThatThrownBy(() -> intrus.enregistrer("2026/10/intrus", new ByteArrayInputStream(CONTENU), CONTENU.length, "application/pdf"))
                    .isInstanceOf(IOException.class);
            assertThat(stockage.resolve("2026/10/intrus")).doesNotExist();

            // Clé de fichier sortant du dossier : refusée.
            assertThatThrownBy(() -> coffre.lire("../config-stockage-club")).isInstanceOf(IOException.class);
            assertThatThrownBy(() -> coffre.enregistrer("../ailleurs", new ByteArrayInputStream(CONTENU), CONTENU.length, "application/pdf"))
                    .isInstanceOf(IOException.class);
            assertThat(dossier.resolve("ailleurs")).doesNotExist();

            // Fichier de 10 Mo (taille maximale du backend) : accepté et relu à l'identique.
            byte[] gros = new byte[10 * 1024 * 1024];
            new java.util.Random(7).nextBytes(gros);
            coffre.enregistrer("2026/10/gros", new ByteArrayInputStream(gros), gros.length, "application/pdf");
            try (InputStream relu = coffre.lire("2026/10/gros")) {
                assertThat(relu.readAllBytes()).isEqualTo(gros);
            }
            coffre.supprimer("2026/10/gros");
        } finally {
            serveur.destroy();
            serveur.waitFor();
        }
    }

    private static boolean phpDisponible() {
        try {
            Process version = new ProcessBuilder("php", "-v").redirectErrorStream(true).start();
            version.getInputStream().readAllBytes();
            return version.waitFor() == 0;
        } catch (IOException | InterruptedException absent) {
            return false;
        }
    }

    @Test
    @DisplayName("Stockage objet : cycle complet sur un service compatible S3")
    void stockageObjet() throws IOException {
        try (GenericContainer<?> service = new GenericContainer<>("adobe/s3mock:4.7.0")
                .withExposedPorts(9090)
                .waitingFor(Wait.forListeningPort())) {
            service.start();
            StockageConfig.Proprietes.S3 reglages = new StockageConfig.Proprietes.S3(
                    "http://" + service.getHost() + ":" + service.getMappedPort(9090), "us-east-1", "club-essai", "cle-essai", "secret-essai");
            try (S3Client client = StockageConfig.clientS3(reglages)) {
                client.createBucket(requete -> requete.bucket("club-essai"));
                cycleComplet(new S3StorageService(client, "club-essai"));
            }
        }
    }
}
