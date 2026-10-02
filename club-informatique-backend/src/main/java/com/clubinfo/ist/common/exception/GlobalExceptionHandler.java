package com.clubinfo.ist.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.mapping.PropertyReferenceException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.BindException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.List;

/**
 * Convertit toute exception en réponse RFC 9457. Les messages sont en français ; aucune valeur refusée,
 * requête SQL ni trace d'exécution n'est renvoyée au client.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Probleme> metier(BusinessException ex, HttpServletRequest request) {
        log.warn("Erreur métier {} sur {} : {}", ex.getErrorCode(), request.getRequestURI(), ex.getMessage());
        return reponse(ex.getStatus(), ex.getErrorCode(), ex.getMessage(), request);
    }

    /** Erreurs de validation d'un corps ou de paramètres : une entrée par champ, sans la valeur refusée. */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<Probleme> validation(BindException ex, HttpServletRequest request) {
        List<Probleme.ErreurChamp> erreurs = ex.getBindingResult().getFieldErrors().stream()
                .map(erreur -> new Probleme.ErreurChamp(erreur.getField(), erreur.getDefaultMessage()))
                .toList();
        return corps(HttpStatus.BAD_REQUEST, Probleme.deValidation("Certains champs sont invalides. Vérifiez votre saisie.", request.getRequestURI(), erreurs));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Probleme> contrainte(ConstraintViolationException ex, HttpServletRequest request) {
        List<Probleme.ErreurChamp> erreurs = ex.getConstraintViolations().stream()
                .map(violation -> new Probleme.ErreurChamp(dernierSegment(violation.getPropertyPath().toString()), violation.getMessage()))
                .toList();
        return corps(HttpStatus.BAD_REQUEST, Probleme.deValidation("Certains paramètres sont invalides.", request.getRequestURI(), erreurs));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Probleme> illisible(HttpMessageNotReadableException ex, HttpServletRequest request) {
        return reponse(HttpStatus.BAD_REQUEST, "REQUETE_ILLISIBLE", "Le contenu de la requête est illisible ou incomplet.", request);
    }

    @ExceptionHandler({MethodArgumentTypeMismatchException.class, MissingServletRequestParameterException.class,
            MissingServletRequestPartException.class, PropertyReferenceException.class})
    public ResponseEntity<Probleme> parametre(Exception ex, HttpServletRequest request) {
        return reponse(HttpStatus.BAD_REQUEST, "PARAMETRE_INVALIDE", "Un paramètre de la requête est absent ou invalide.", request);
    }

    @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
    public ResponseEntity<Probleme> routeInconnue(Exception ex, HttpServletRequest request) {
        return reponse(HttpStatus.NOT_FOUND, null, "Cette adresse n’existe pas.", request);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Probleme> methode(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        return reponse(HttpStatus.METHOD_NOT_ALLOWED, null, "Cette opération n’est pas disponible à cette adresse.", request);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<Probleme> typeDeContenu(HttpMediaTypeNotSupportedException ex, HttpServletRequest request) {
        return reponse(HttpStatus.UNSUPPORTED_MEDIA_TYPE, null, "Le type de contenu envoyé n’est pas accepté.", request);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Probleme> fichierTropVolumineux(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        return reponse(HttpStatus.PAYLOAD_TOO_LARGE, null, "Le fichier dépasse la taille autorisée.", request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Probleme> accesRefuse(AccessDeniedException ex, HttpServletRequest request) {
        log.warn("Accès refusé sur {}", request.getRequestURI());
        return reponse(HttpStatus.FORBIDDEN, null, "Vous n’avez pas les droits nécessaires pour cette opération.", request);
    }

    /** Réponse identique que le compte existe ou non : aucune énumération possible. */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Probleme> identifiantsRefuses(BadCredentialsException ex, HttpServletRequest request) {
        return reponse(HttpStatus.UNAUTHORIZED, "IDENTIFIANTS_REFUSES", "L’adresse électronique ou le mot de passe est incorrect.", request);
    }

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<Probleme> compteVerrouille(LockedException ex, HttpServletRequest request) {
        return reponse(HttpStatus.LOCKED, null, "Votre compte est temporairement verrouillé après plusieurs tentatives infructueuses. Réessayez plus tard.", request);
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Probleme> compteInactif(DisabledException ex, HttpServletRequest request) {
        return reponse(HttpStatus.FORBIDDEN, "COMPTE_INACTIF", "Votre compte n’est pas actif.", request);
    }

    @ExceptionHandler({DataIntegrityViolationException.class, OptimisticLockingFailureException.class})
    public ResponseEntity<Probleme> conflit(Exception ex, HttpServletRequest request) {
        log.error("Conflit de données sur {} : {}", request.getRequestURI(), ex.getMessage());
        return reponse(HttpStatus.CONFLICT, null, "Cette opération entre en conflit avec des données existantes.", request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Probleme> inattendue(Exception ex, HttpServletRequest request) {
        log.error("Erreur inattendue sur {}", request.getRequestURI(), ex);
        return reponse(HttpStatus.INTERNAL_SERVER_ERROR, null, "Un problème est survenu de notre côté. Réessayez dans quelques instants.", request);
    }

    private static ResponseEntity<Probleme> reponse(HttpStatus statut, String code, String detail, HttpServletRequest request) {
        return corps(statut, Probleme.de(statut, code, detail, request.getRequestURI()));
    }

    private static ResponseEntity<Probleme> corps(HttpStatus statut, Probleme probleme) {
        return ResponseEntity.status(statut).contentType(Probleme.MEDIA_TYPE).body(probleme);
    }

    private static String dernierSegment(String chemin) {
        int index = chemin.lastIndexOf('.');
        return index < 0 ? chemin : chemin.substring(index + 1);
    }
}
