package com.clubinfo.ist.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import java.util.List;

/**
 * Erreur renvoyée par l'API au format RFC 9457 (« problem details »).
 * Le code est stable et sert au frontend ; le détail est rédigé en français.
 * Aucune valeur refusée ni information technique interne n'y figure.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record Probleme(String type, String title, int status, String detail, String instance, String code, List<ErreurChamp> errors) {

    public static final MediaType MEDIA_TYPE = MediaType.APPLICATION_PROBLEM_JSON;

    /** Erreur de validation portant sur un champ de la requête. */
    public record ErreurChamp(String field, String message) {
    }

    public static Probleme de(HttpStatus statut, String code, String detail, String chemin) {
        return new Probleme("about:blank", titreDe(statut), statut.value(), detail, chemin, code != null ? code : codeDe(statut), null);
    }

    public static Probleme deValidation(String detail, String chemin, List<ErreurChamp> erreurs) {
        return new Probleme("about:blank", titreDe(HttpStatus.BAD_REQUEST), 400, detail, chemin, "VALIDATION", erreurs);
    }

    /** Code par défaut d'un statut, quand l'exception n'en porte pas de plus précis. */
    public static String codeDe(HttpStatus statut) {
        return switch (statut) {
            case BAD_REQUEST, UNPROCESSABLE_ENTITY -> "VALIDATION";
            case UNAUTHORIZED -> "NON_AUTHENTIFIE";
            case FORBIDDEN -> "ACCES_REFUSE";
            case NOT_FOUND -> "INTROUVABLE";
            case METHOD_NOT_ALLOWED -> "METHODE_REFUSEE";
            case CONFLICT -> "CONFLIT";
            case PAYLOAD_TOO_LARGE -> "FICHIER_TROP_VOLUMINEUX";
            case UNSUPPORTED_MEDIA_TYPE -> "TYPE_REFUSE";
            case LOCKED -> "COMPTE_VERROUILLE";
            case TOO_MANY_REQUESTS -> "DEBIT_DEPASSE";
            default -> statut.is5xxServerError() ? "ERREUR_INTERNE" : "ERREUR";
        };
    }

    private static String titreDe(HttpStatus statut) {
        return switch (statut) {
            case BAD_REQUEST, UNPROCESSABLE_ENTITY -> "Requête invalide";
            case UNAUTHORIZED -> "Authentification requise";
            case FORBIDDEN -> "Accès refusé";
            case NOT_FOUND -> "Ressource introuvable";
            case METHOD_NOT_ALLOWED -> "Méthode non autorisée";
            case CONFLICT -> "Conflit";
            case PAYLOAD_TOO_LARGE -> "Fichier trop volumineux";
            case UNSUPPORTED_MEDIA_TYPE -> "Type de contenu refusé";
            case LOCKED -> "Compte verrouillé";
            case TOO_MANY_REQUESTS -> "Trop de requêtes";
            default -> statut.is5xxServerError() ? "Erreur interne" : "Erreur";
        };
    }
}
