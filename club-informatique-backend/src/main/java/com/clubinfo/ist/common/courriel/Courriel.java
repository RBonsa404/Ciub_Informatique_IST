package com.clubinfo.ist.common.courriel;

/** Message en texte brut adressé à un seul destinataire. */
public record Courriel(String destinataire, String objet, String texte) {

    public Courriel {
        if (destinataire == null || destinataire.isBlank()) {
            throw new IllegalArgumentException("Destinataire absent");
        }
        destinataire = destinataire.trim();
        // Un objet tient sur une ligne : aucun en-tête ne peut être ajouté par un saut de ligne.
        objet = objet == null ? "" : objet.replaceAll("[\\r\\n]+", " ").trim();
        texte = texte == null ? "" : texte;
    }
}
