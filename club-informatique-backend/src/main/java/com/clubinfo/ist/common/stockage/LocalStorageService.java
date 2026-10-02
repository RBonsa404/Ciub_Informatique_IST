package com.clubinfo.ist.common.stockage;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

/** Fichiers conservés dans un dossier du serveur (volume persistant en ligne), hors de toute racine servie directement. */
public class LocalStorageService implements StorageService {

    private final Path racine;

    public LocalStorageService(String dossier) {
        this.racine = Path.of(dossier).toAbsolutePath().normalize();
    }

    @Override
    public void enregistrer(String cle, InputStream contenu, long taille, String typeMime) throws IOException {
        Path cible = chemin(cle);
        Files.createDirectories(cible.getParent());
        Files.copy(contenu, cible, StandardCopyOption.REPLACE_EXISTING);
    }

    @Override
    public InputStream lire(String cle) throws IOException {
        try {
            return Files.newInputStream(chemin(cle));
        } catch (NoSuchFileException absent) {
            throw new IOException("Contenu absent du stockage", absent);
        }
    }

    @Override
    public void supprimer(String cle) throws IOException {
        Files.deleteIfExists(chemin(cle));
    }

    /** Une clé ne peut pas désigner un emplacement hors du dossier de stockage. */
    private Path chemin(String cle) throws IOException {
        Path cible = racine.resolve(cle).normalize();
        if (!cible.startsWith(racine) || cible.equals(racine)) {
            throw new IOException("Clé de stockage refusée");
        }
        return cible;
    }
}
