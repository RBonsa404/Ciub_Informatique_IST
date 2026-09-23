package com.clubinfo.ist.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Levée lors d'une tentative de création d'une ressource déjà existante.
 */
public class DuplicateResourceException extends BusinessException {

    public DuplicateResourceException(String message) {
        super(message, HttpStatus.CONFLICT, "DUPLICATE_RESOURCE");
    }

    public DuplicateResourceException(String resourceName, String fieldName, Object fieldValue) {
        super(
                String.format("%s existe déjà avec %s : '%s'", resourceName, fieldName, fieldValue),
                HttpStatus.CONFLICT,
                "DUPLICATE_RESOURCE"
        );
    }
}
