package com.clubinfo.ist.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

/**
 * Politique de mot de passe, identique à celle du frontend : huit caractères au moins, une minuscule,
 * une majuscule, un chiffre et un symbole, quel qu'il soit. La longueur est bornée à 72 octets,
 * au-delà desquels l'algorithme de hachage ignore la suite.
 */
@Target({ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = MotDePasseConforme.Validateur.class)
public @interface MotDePasseConforme {

    String message() default "Le mot de passe doit compter au moins 8 caractères, dont une minuscule, une majuscule, un chiffre et un symbole.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    class Validateur implements ConstraintValidator<MotDePasseConforme, String> {

        static final int LONGUEUR_MINIMALE = 8;
        static final int OCTETS_MAXIMUM = 72;
        private static final Pattern MINUSCULE = Pattern.compile("\\p{Ll}");
        private static final Pattern MAJUSCULE = Pattern.compile("\\p{Lu}");
        private static final Pattern CHIFFRE = Pattern.compile("\\d");
        private static final Pattern SYMBOLE = Pattern.compile("[^\\p{L}\\d\\s]");

        @Override
        public boolean isValid(String valeur, ConstraintValidatorContext contexte) {
            return valeur != null && conforme(valeur);
        }

        public static boolean conforme(String valeur) {
            return valeur.length() >= LONGUEUR_MINIMALE
                    && valeur.getBytes(StandardCharsets.UTF_8).length <= OCTETS_MAXIMUM
                    && MINUSCULE.matcher(valeur).find()
                    && MAJUSCULE.matcher(valeur).find()
                    && CHIFFRE.matcher(valeur).find()
                    && SYMBOLE.matcher(valeur).find();
        }
    }
}
