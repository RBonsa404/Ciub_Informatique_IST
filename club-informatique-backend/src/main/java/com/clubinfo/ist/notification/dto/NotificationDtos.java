package com.clubinfo.ist.notification.dto;

import com.clubinfo.ist.notification.entity.Notification;
import com.clubinfo.ist.notification.entity.TypeNotification;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/** Corps des requêtes et des réponses des notifications. */
public final class NotificationDtos {

    private NotificationDtos() {
    }

    public record NotificationDto(Long id, String titre, String message, TypeNotification type, String lien, boolean lue, LocalDateTime createdAt) {

        public static NotificationDto de(Notification notification) {
            return new NotificationDto(notification.getId(), notification.getTitre(), notification.getMessage(), notification.getType(),
                    notification.getLien(), Boolean.TRUE.equals(notification.getLue()), notification.getCreatedAt());
        }
    }

    public record CompteurNonLues(long nonLues) {
    }

    /** Le lien est un chemin interne du site : une annonce ne peut pas envoyer les membres vers un autre site. */
    public record NotificationGlobale(
            @NotBlank(message = "Le titre est obligatoire.") @Size(min = 3, max = 200, message = "Le titre doit compter de 3 à 200 caractères.") String titre,
            @NotBlank(message = "Le message est obligatoire.") @Size(max = 2000, message = "Le message ne doit pas dépasser 2 000 caractères.") String message,
            @Size(max = 500, message = "Le lien ne doit pas dépasser 500 caractères.")
            @Pattern(regexp = "^$|^/(?!/)[^\\s\\\\]*$", message = "Le lien doit être un chemin interne du site, par exemple « /evenements ».") String lien) {
    }
}
