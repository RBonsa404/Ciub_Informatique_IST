package com.clubinfo.ist.notification.mapper;

import com.clubinfo.ist.notification.dto.NotificationDto;
import com.clubinfo.ist.notification.entity.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationDto toDto(Notification notification) {
        if (notification == null) return null;

        return NotificationDto.builder()
                .id(notification.getId())
                .destinataireId(notification.getDestinataire() != null ? notification.getDestinataire().getId() : null)
                .titre(notification.getTitre())
                .message(notification.getMessage())
                .type(notification.getType())
                .lien(notification.getLien())
                .lue(notification.getLue())
                .dateLecture(notification.getDateLecture())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
