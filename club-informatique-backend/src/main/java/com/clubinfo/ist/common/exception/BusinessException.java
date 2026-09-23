package com.clubinfo.ist.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Exception métier de base pour toutes les erreurs applicatives.
 */
@Getter
public class BusinessException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    public BusinessException(String message, HttpStatus status, String errorCode) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public BusinessException(String message, HttpStatus status) {
        this(message, status, null);
    }
}
