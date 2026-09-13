package com.clubinfo.service;

import com.clubinfo.dto.NotificationDTO;
import com.clubinfo.entity.Notification;
import com.clubinfo.entity.Utilisateur;
import com.clubinfo.exception.ResourceNotFoundException;
import com.clubinfo.repository.NotificationRepository;
import com.clubinfo.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Transactional(readOnly = true)
    public List<NotificationDTO> getUserNotifications(Long userId) {
        return notificationRepository.findByDestinataireIdOrderByDateEnvoiDesc(userId)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByDestinataireIdAndLuFalse(userId);
    }

    @Transactional
    public void envoyerNotification(Long destinataireId, String titre, String message, String type) {
        Utilisateur dest = utilisateurRepository.findById(destinataireId)
                .orElseThrow(() -> new ResourceNotFoundException("Destinataire non trouvé"));

        Notification n = new Notification();
        n.setDestinataire(dest);
        n.setTitre(titre);
        n.setMessage(message);
        n.setType(type != null ? type : "INFO");
        n.setLu(false);

        notificationRepository.save(n);
    }

    @Transactional
    public void marquerCommeLue(Long notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification non trouvée"));
        n.setLu(true);
        notificationRepository.save(n);
    }

    private NotificationDTO mapToDTO(Notification n) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(n.getId());
        dto.setDestinataireId(n.getDestinataire().getId());
        dto.setTitre(n.getTitre());
        dto.setMessage(n.getMessage());
        dto.setDateEnvoi(n.getDateEnvoi());
        dto.setLu(n.isLu());
        dto.setType(n.getType());
        return dto;
    }
}
