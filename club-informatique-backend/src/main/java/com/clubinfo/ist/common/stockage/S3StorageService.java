package com.clubinfo.ist.common.stockage;

import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;

import java.io.IOException;
import java.io.InputStream;

/** Fichiers conservés dans un stockage objet compatible S3. Le compartiment est privé : tout accès passe par l'API. */
public class S3StorageService implements StorageService {

    private final S3Client client;
    private final String compartiment;

    public S3StorageService(S3Client client, String compartiment) {
        this.client = client;
        this.compartiment = compartiment;
    }

    @Override
    public void enregistrer(String cle, InputStream contenu, long taille, String typeMime) throws IOException {
        try {
            client.putObject(requete -> requete.bucket(compartiment).key(cle).contentType(typeMime), RequestBody.fromInputStream(contenu, taille));
        } catch (SdkException erreur) {
            throw new IOException("Dépôt refusé par le stockage objet", erreur);
        }
    }

    @Override
    public InputStream lire(String cle) throws IOException {
        try {
            return client.getObject(requete -> requete.bucket(compartiment).key(cle));
        } catch (SdkException erreur) {
            throw new IOException("Contenu absent du stockage", erreur);
        }
    }

    @Override
    public void supprimer(String cle) throws IOException {
        try {
            client.deleteObject(requete -> requete.bucket(compartiment).key(cle));
        } catch (SdkException erreur) {
            throw new IOException("Suppression refusée par le stockage objet", erreur);
        }
    }
}
