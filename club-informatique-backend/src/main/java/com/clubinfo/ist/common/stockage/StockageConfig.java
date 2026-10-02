package com.clubinfo.ist.common.stockage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;

import java.net.URI;

/**
 * Choix du stockage par configuration : {@code app.storage.type=local} (par défaut, dossier sur volume persistant)
 * ou {@code s3} (stockage objet compatible S3).
 */
@Configuration
@EnableConfigurationProperties(StockageConfig.Proprietes.class)
@Slf4j
public class StockageConfig {

    @ConfigurationProperties("app.storage")
    public record Proprietes(String type, long maxSizeBytes, Local local, S3 s3) {

        public record Local(String directory) {
        }

        public record S3(String endpoint, String region, String bucket, String accessKey, String secretKey) {
        }
    }

    @Bean
    @ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
    public StorageService stockageLocal(Proprietes proprietes) {
        log.info("Stockage des fichiers : dossier local.");
        return new LocalStorageService(proprietes.local().directory());
    }

    @Bean
    @ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
    public StorageService stockageObjet(Proprietes proprietes) {
        log.info("Stockage des fichiers : stockage objet.");
        return new S3StorageService(clientS3(proprietes.s3()), proprietes.s3().bucket());
    }

    /** Client S3 ; l'adressage par chemin est requis par les services compatibles hébergés hors d'AWS. */
    public static S3Client clientS3(Proprietes.S3 s3) {
        if (vide(s3.bucket()) || vide(s3.accessKey()) || vide(s3.secretKey())) {
            throw new IllegalStateException("Stockage objet : STORAGE_S3_BUCKET, STORAGE_S3_ACCESS_KEY et STORAGE_S3_SECRET_KEY sont obligatoires.");
        }
        S3ClientBuilder client = S3Client.builder()
                .httpClientBuilder(UrlConnectionHttpClient.builder())
                .region(Region.of(vide(s3.region()) ? "us-east-1" : s3.region()))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(s3.accessKey(), s3.secretKey())));
        if (!vide(s3.endpoint())) {
            client.endpointOverride(URI.create(s3.endpoint())).forcePathStyle(true);
        }
        return client.build();
    }

    private static boolean vide(String valeur) {
        return valeur == null || valeur.isBlank();
    }
}
