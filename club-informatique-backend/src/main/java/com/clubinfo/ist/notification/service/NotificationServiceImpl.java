package com.clubinfo.ist.notification.service;

import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.exception.ResourceNotFoundException;
import com.clubinfo.ist.notification.dto.GlobalNotificationCreateDto;
import com.clubinfo.ist.notification.dto.NotificationDto;
import com.clubinfo.ist.notification.entity.Notification;
import com.clubinfo.ist.notification.entity.TypeNotification;
import com.clubinfo.ist.notification.mapper.NotificationMapper;
import com.clubinfo.ist.notification.repository.NotificationRepository;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationMapper notificationMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDto> getMyNotifications(String userEmail, Pageable pageable) {
        Utilisateur user = findUserByEmail(userEmail);
        return notificationRepository.findAllByDestinataireIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(notificationMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnreadNotifications(String userEmail) {
        Utilisateur user = findUserByEmail(userEmail);
        return notificationRepository.countByDestinataireIdAndLueFalse(user.getId());
    }

    @Override
    @Transactional
    public void markAsRead(String userEmail, Long notificationId) {
        Utilisateur user = findUserByEmail(userEmail);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (!notification.getDestinataire().getId().equals(user.getId())) {
            throw new BusinessException("Vous ne pouvez pas modifier cette notification", HttpStatus.FORBIDDEN);
        }

        notification.setLue(true);
        notification.setDateLecture(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(String userEmail) {
        Utilisateur user = findUserByEmail(userEmail);
        notificationRepository.markAllAsRead(user.getId(), LocalDateTime.now());
        log.info("Toutes les notifications marquées comme lues pour {}", userEmail);
    }

    @Override
    @Transactional
    public void sendNotification(Utilisateur destinataire, String titre, String message, TypeNotification type, String lien) {
        Notification notification = Notification.builder()
                .destinataire(destinataire)
                .titre(titre)
                .message(message)
                .type(type)
                .lien(lien)
                .lue(false)
                .build();

        notificationRepository.save(notification);
        log.info("Notification envoyée à {} : '{}'", destinataire.getEmail(), titre);
    }

    @Override
    @Transactional
    public void broadcastNotification(GlobalNotificationCreateDto dto) {
        List<Utilisateur> activeUsers = utilisateurRepository.findAllByStatut(StatutUtilisateur.ACTIF, Pageable.unpaged()).getContent();
        List<Notification> notifications = new ArrayList<>();

        for (Utilisateur user : activeUsers) {
            notifications.add(Notification.builder()
                    .destinataire(user)
                    .titre(dto.getTitre())
                    .message(dto.getMessage())
                    .type(TypeNotification.MESSAGE_GLOBAL)
                    .lien(dto.getLien())
                    .lue(false)
                    .build());
        }

        notificationRepository.saveAll(notifications);
        log.info("Notification globale diffusée à {} membres actifs : '{}'", notifications.size(), dto.getTitre());
    }

    private Utilisateur findUserByEmail(String email) {
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", email));
    }
}
