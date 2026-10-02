package com.clubinfo.ist.common.courriel;

/**
 * Message en texte brut adressé à un seul destinataire.
 * « repondreA », facultatif, est l'adresse vers laquelle part la réponse du destinataire.
 */
public record Courriel(String destinataire, String objet, String texte, String repondreA) {

    public Courriel {
        if (destinataire == null || destinataire.isBlank()) {
            throw new IllegalArgumentException("Destinataire absent");
        }
        destinataire = destinataire.trim();
        // Un objet tient sur une ligne : aucun en-tête ne peut être ajouté par un saut de ligne.
        objet = objet == null ? "" : objet.replaceAll("[\\r\\n]+", " ").trim();
        texte = texte == null ? "" : texte;
        repondreA = repondreA == null || repondreA.isBlank() ? null : repondreA.replaceAll("[\\r\\n]+", "").trim();
    }

    public Courriel(String destinataire, String objet, String texte) {
        this(destinataire, objet, texte, null);
    }
}
