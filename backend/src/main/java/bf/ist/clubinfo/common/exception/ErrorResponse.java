package bf.ist.clubinfo.common.exception;

import java.time.Instant;
import java.util.List;

/**
 * Format d'erreur unique de l'API (principe non négociable de la section 1.5
 * du document de dispatch : "les erreurs API utilisent un format unique").
 */
public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        List<FieldError> fieldErrors
) {
    public record FieldError(String field, String message) {
    }

    public static ErrorResponse of(int status, String error, String message, String path) {
        return new ErrorResponse(Instant.now(), status, error, message, path, List.of());
    }

    public static ErrorResponse ofFieldErrors(int status, String error, String message, String path, List<FieldError> fieldErrors) {
        return new ErrorResponse(Instant.now(), status, error, message, path, fieldErrors);
    }
}
