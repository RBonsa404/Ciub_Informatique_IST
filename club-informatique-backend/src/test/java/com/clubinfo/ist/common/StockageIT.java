package com.clubinfo.ist.common;

import com.clubinfo.ist.common.stockage.LocalStorageService;
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
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Les deux stockages rendent le même service : enregistrer, relire à l'identique, supprimer. */
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
