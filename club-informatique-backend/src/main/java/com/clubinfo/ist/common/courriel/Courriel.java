package com.clubinfo.ist.common.courriel;

import java.util.List;

/**
 * Message rédigé en texte brut, adressé à un seul destinataire ; une version HTML en est dérivée à l'envoi
 * ({@link MiseEnFormeCourriel}).
 * « repondreA », facultatif, est l'adresse vers laquelle part la réponse du destinataire.
 * « pieces » : fichiers joints ; une pièce « en ligne » s'affiche dans le corps HTML à l'emplacement
 * d'une ligne {@code [[image:identifiant]]} du texte.
 */
public record Courriel(String destinataire, String objet, String texte, String repondreA, List<PieceJointe> pieces) {

    /** Fichier joint ; « identifiant » n'est requis que pour une image affichée dans le corps du message. */
    public record PieceJointe(String nom, String typeMime, byte[] contenu, String identifiant) {
    }

    public Courriel {
        if (destinataire == null || destinataire.isBlank()) {
            throw new IllegalArgumentException("Destinataire absent");
        }
        destinataire = destinataire.trim();
        // Un objet tient sur une ligne : aucun en-tête ne peut être ajouté par un saut de ligne.
        objet = objet == null ? "" : objet.replaceAll("[\\r\\n]+", " ").trim();
        texte = texte == null ? "" : texte;
        repondreA = repondreA == null || repondreA.isBlank() ? null : repondreA.replaceAll("[\\r\\n]+", "").trim();
        pieces = pieces == null ? List.of() : List.copyOf(pieces);
    }

    public Courriel(String destinataire, String objet, String texte, String repondreA) {
        this(destinataire, objet, texte, repondreA, List.of());
    }

    public Courriel(String destinataire, String objet, String texte) {
        this(destinataire, objet, texte, null, List.of());
    }
}
