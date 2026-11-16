package com.clubinfo.ist.carte;

/**
 * Informations imprimées sur la carte de membre. « lienQr » est l'adresse encodée dans le QR code :
 * elle ne contient qu'un jeton opaque, jamais de donnée personnelle.
 */
public record DonneesCarte(String prenom, String nom, String filiere, String numeroMembre, String membreDepuis, String lienQr) {
}
