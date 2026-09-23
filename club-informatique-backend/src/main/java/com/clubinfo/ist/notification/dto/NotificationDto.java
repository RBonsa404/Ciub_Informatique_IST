package com.clubinfo.ist.notification.dto;

import com.clubinfo.ist.notification.entity.TypeNotification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {

    private Long id;
    private Long destinataireId;
    private String titre;
    private String message;
    private TypeNotification type;
    private String lien;
    private Boolean lue;
    private LocalDateTime dateLecture;
    private LocalDateTime createdAt;
}
