package com.clubinfo.ist.common.stockage;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Fichiers conservés par le coffre à fichiers de l'hébergement web (script deploiement/o2switch-stockage).
 * Chaque requête porte la clé secrète partagée ; seuls GET et POST sont employés, admis par tous les hébergements mutualisés.
 */
public class RelaisStorageService implements StorageService {

    static final String EN_TETE_CLE = "X-Cle-Stockage";

    private final HttpClient client;
    private final String adresse;
    private final String secret;

    public RelaisStorageService(String adresse, String secret) {
        this.adresse = adresse.endsWith("/") ? adresse : adresse + "/";
        this.secret = secret;
        this.client = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
    }

    @Override
    public void enregistrer(String cle, InputStream contenu, long taille, String typeMime) throws IOException {
        HttpRequest requete = requete("enregistrer", cle)
                .header("Content-Type", "application/octet-stream")
                .POST(HttpRequest.BodyPublishers.fromPublisher(HttpRequest.BodyPublishers.ofInputStream(() -> contenu), taille))
                .timeout(Duration.ofSeconds(120))
                .build();
        HttpResponse<String> reponse = envoyer(requete, HttpResponse.BodyHandlers.ofString());
        if (reponse.statusCode() / 100 != 2) {
            throw new IOException("Dépôt refusé par le coffre à fichiers (" + reponse.statusCode() + ")");
        }
    }

    @Override
    public InputStream lire(String cle) throws IOException {
        HttpRequest requete = requete(null, cle).GET().timeout(Duration.ofSeconds(60)).build();
        HttpResponse<InputStream> reponse = envoyer(requete, HttpResponse.BodyHandlers.ofInputStream());
        if (reponse.statusCode() == 200) {
            return reponse.body();
        }
        reponse.body().close();
        throw new IOException(reponse.statusCode() == 404
                ? "Contenu absent du stockage"
                : "Lecture refusée par le coffre à fichiers (" + reponse.statusCode() + ")");
    }

    @Override
    public void supprimer(String cle) throws IOException {
        HttpRequest requete = requete("supprimer", cle)
                .POST(HttpRequest.BodyPublishers.noBody())
                .timeout(Duration.ofSeconds(30))
                .build();
        HttpResponse<String> reponse = envoyer(requete, HttpResponse.BodyHandlers.ofString());
        if (reponse.statusCode() / 100 != 2) {
            throw new IOException("Suppression refusée par le coffre à fichiers (" + reponse.statusCode() + ")");
        }
    }

    /** Vérifie, au démarrage, que le coffre répond et accepte la clé. */
    public void verifier() throws IOException {
        HttpRequest requete = HttpRequest.newBuilder(URI.create(adresse + "?action=sante"))
                .header(EN_TETE_CLE, secret)
                .GET()
                .timeout(Duration.ofSeconds(20))
                .build();
        HttpResponse<String> reponse = envoyer(requete, HttpResponse.BodyHandlers.ofString());
        if (reponse.statusCode() != 200) {
            throw new IOException("Coffre à fichiers indisponible (" + reponse.statusCode() + " : " + reponse.body().strip() + ")");
        }
    }

    private HttpRequest.Builder requete(String action, String cle) {
        String parametres = (action == null ? "" : "action=" + action + "&") + "cle=" + URLEncoder.encode(cle, StandardCharsets.UTF_8);
        return HttpRequest.newBuilder(URI.create(adresse + "?" + parametres)).header(EN_TETE_CLE, secret);
    }

    private <T> HttpResponse<T> envoyer(HttpRequest requete, HttpResponse.BodyHandler<T> traitement) throws IOException {
        try {
            return client.send(requete, traitement);
        } catch (InterruptedException interruption) {
            Thread.currentThread().interrupt();
            throw new IOException("Échange avec le coffre à fichiers interrompu", interruption);
        }
    }
}
