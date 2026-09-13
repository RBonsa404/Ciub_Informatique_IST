package com.clubinfo.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationDTO {
    private Long id;
    private Long destinataireId;
    private String titre;
    private String message;
    private LocalDateTime dateEnvoi;
    private boolean lu;
    private String type;
}
