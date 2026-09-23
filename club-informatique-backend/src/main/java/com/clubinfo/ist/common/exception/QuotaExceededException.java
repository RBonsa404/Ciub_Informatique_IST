package com.clubinfo.ist.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Levée lorsqu'un quota est dépassé (places d'événement, capacité de formation).
 */
public class QuotaExceededException extends BusinessException {

    public QuotaExceededException(String message) {
        super(message, HttpStatus.CONFLICT, "QUOTA_EXCEEDED");
    }
}
