package com.clubinfo.ist.common.stockage;

import java.io.IOException;
import java.io.InputStream;

/**
 * Conservation du contenu des fichiers déposés. La clé est attribuée par l'application (jamais par l'utilisateur) ;
 * les métadonnées et les droits d'accès sont tenus en base, pas ici.
 */
public interface StorageService {

    void enregistrer(String cle, InputStream contenu, long taille, String typeMime) throws IOException;

    /** Flux à fermer par l'appelant. */
    InputStream lire(String cle) throws IOException;

    void supprimer(String cle) throws IOException;
}
