package com.clubinfo.ist.common.web;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;

/** Identifiants d'adresse lisibles, dérivés d'un titre. */
public final class Slugs {

    private static final int LONGUEUR_MAXIMALE = 200;

    private Slugs() {
    }

    /** Minuscules sans accent, mots séparés par des tirets. */
    public static String de(String texte) {
        String sansAccent = Normalizer.normalize(texte == null ? "" : texte, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        String slug = sansAccent.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
        if (slug.length() > LONGUEUR_MAXIMALE) {
            slug = slug.substring(0, LONGUEUR_MAXIMALE).replaceAll("-+$", "");
        }
        return slug.isEmpty() ? "contenu" : slug;
    }

    /** Premier identifiant libre : « titre », puis « titre-2 », « titre-3 »… L'ordre ne dépend pas de l'horloge. */
    public static String libre(String texte, Predicate<String> dejaPris) {
        String base = de(texte);
        String candidat = base;
        for (int suffixe = 2; dejaPris.test(candidat); suffixe++) {
            candidat = base + "-" + suffixe;
        }
        return candidat;
    }
}
