package com.clubinfo.ist.notification.service;

import com.clubinfo.ist.notification.dto.GlobalNotificationCreateDto;
import com.clubinfo.ist.notification.dto.NotificationDto;
import com.clubinfo.ist.notification.entity.TypeNotification;
import com.clubinfo.ist.user.entity.Utilisateur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    Page<NotificationDto> getMyNotifications(String userEmail, Pageable pageable);

    long countUnreadNotifications(String userEmail);

    void markAsRead(String userEmail, Long notificationId);

    void markAllAsRead(String userEmail);

    void sendNotification(Utilisateur destinataire, String titre, String message, TypeNotification type, String lien);

    void broadcastNotification(GlobalNotificationCreateDto dto);
}
