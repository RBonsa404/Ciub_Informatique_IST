package com.clubinfo.ist.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Levée lorsqu'une ressource demandée n'existe pas.
 */
public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(
                String.format("%s introuvable avec %s : '%s'", resourceName, fieldName, fieldValue),
                HttpStatus.NOT_FOUND,
                "RESOURCE_NOT_FOUND"
        );
    }

    public ResourceNotFoundException(String resourceName, Long id) {
        this(resourceName, "id", id);
    }
}
