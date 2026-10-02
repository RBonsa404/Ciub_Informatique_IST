package com.clubinfo.ist.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Adresse affichée ou suivie par le navigateur : lien « http(s) » ou fichier déposé sur la plateforme.
 * Tout autre schéma (« javascript: », « data: »…) est refusé.
 */
@Target({ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = AdresseWebSure.Validateur.class)
public @interface AdresseWebSure {

    String message() default "L'adresse doit être un lien http(s) ou un fichier déposé sur la plateforme.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    class Validateur implements ConstraintValidator<AdresseWebSure, String> {

        private static final Pattern FICHIER_DEPOSE = Pattern.compile("^(?:/[A-Za-z0-9_-]+)*/fichiers/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$");

        @Override
        public boolean isValid(String valeur, ConstraintValidatorContext contexte) {
            return valeur == null || valeur.isBlank() || fichierDepose(valeur).isPresent() || lienExterne(valeur);
        }

        /** Identifiant du fichier quand l'adresse désigne un fichier déposé sur la plateforme. */
        public static Optional<String> fichierDepose(String adresse) {
            if (adresse == null) {
                return Optional.empty();
            }
            Matcher fichier = FICHIER_DEPOSE.matcher(adresse);
            return fichier.matches() ? Optional.of(fichier.group(1)) : Optional.empty();
        }

        private static boolean lienExterne(String valeur) {
            try {
                URI adresse = new URI(valeur);
                String schema = adresse.getScheme();
                return ("https".equalsIgnoreCase(schema) || "http".equalsIgnoreCase(schema)) && adresse.getHost() != null;
            } catch (URISyntaxException malFormee) {
                return false;
            }
        }
    }
}
