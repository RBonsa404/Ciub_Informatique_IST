package com.clubinfo.ist.fichier;

/** Fichier déposé, tel que l'API le décrit. L'adresse est celle du téléchargement contrôlé. */
public record FichierDto(String id, String url, String nom, String type, long tailleOctets) {
}
