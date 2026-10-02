package com.clubinfo.ist.notification.service;

import com.clubinfo.ist.common.courriel.Courriel;
import com.clubinfo.ist.common.courriel.CourrielService;
import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.journal.JournalService;
import com.clubinfo.ist.notification.dto.NotificationDtos.NotificationDto;
import com.clubinfo.ist.notification.entity.Notification;
import com.clubinfo.ist.notification.entity.TypeNotification;
import com.clubinfo.ist.notification.repository.NotificationRepository;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Notifications des membres. Elles naissent des événements du club (inscription, place libérée, annulation,
 * décision sur un projet, rappel, annonce du Responsable) et sont doublées d'un courriel pour qui l'accepte.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notifications;
    private final UtilisateurRepository utilisateurs;
    private final CourrielService courriels;
    private final JournalService journal;

    @Value("${app.frontend-url}")
    private String frontend;

    /** Notifie un compte ; « lien » est un chemin interne du site. */
    @Transactional
    public void notifier(Long destinataireId, TypeNotification type, String titre, String message, String lien) {
        utilisateurs.findByIdAndDeletedAtIsNull(destinataireId).ifPresent(destinataire -> {
            notifications.save(Notification.builder()
                    .destinataire(destinataire).type(type).titre(titre).message(message).lien(lien).lue(false).build());
            parCourriel(destinataire, titre, message, lien);
        });
    }

    /** Annonce adressée à tous les comptes actifs. */
    @Transactional
    public int diffuser(String titre, String message, String lien) {
        List<Utilisateur> destinataires = utilisateurs.findAllByStatutAndDeletedAtIsNull(StatutUtilisateur.ACTIF);
        List<Notification> annonces = new ArrayList<>(destinataires.size());
        for (Utilisateur destinataire : destinataires) {
            annonces.add(Notification.builder()
                    .destinataire(destinataire).type(TypeNotification.MESSAGE_GLOBAL).titre(titre).message(message).lien(lien).lue(false).build());
        }
        notifications.saveAll(annonces);
        destinataires.forEach(destinataire -> parCourriel(destinataire, titre, message, lien));
        journal.enregistrer("NOTIFICATION_GLOBALE", "Annonce diffusée à " + destinataires.size() + " compte(s) : " + titre, JournalService.Resultat.SUCCES);
        return destinataires.size();
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> lister(Long destinataireId, TypeNotification type, Boolean lue, Pageable pageable) {
        Pageable recentesDAbord = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        return notifications.lister(destinataireId, type, lue, recentesDAbord).map(NotificationDto::de);
    }

    @Transactional(readOnly = true)
    public long nonLues(Long destinataireId) {
        return notifications.countByDestinataireIdAndLueFalse(destinataireId);
    }

    /** La notification d'un autre compte est introuvable pour qui la demande : son existence n'est pas révélée. */
    @Transactional
    public void marquerLue(Long destinataireId, Long id) {
        Notification notification = notifications.findByIdAndDestinataireId(id, destinataireId)
                .orElseThrow(() -> new BusinessException("Notification introuvable.", HttpStatus.NOT_FOUND));
        if (!Boolean.TRUE.equals(notification.getLue())) {
            notification.setLue(true);
            notification.setDateLecture(LocalDateTime.now());
        }
    }

    @Transactional
    public void marquerToutesLues(Long destinataireId) {
        notifications.marquerToutesLues(destinataireId, LocalDateTime.now());
    }

    private void parCourriel(Utilisateur destinataire, String titre, String message, String lien) {
        if (!Boolean.TRUE.equals(destinataire.getNotificationsCourriel()) || destinataire.getStatut() != StatutUtilisateur.ACTIF) {
            return;
        }
        String base = frontend.endsWith("/") ? frontend.substring(0, frontend.length() - 1) : frontend;
        String suite = lien == null || lien.isBlank() ? "" : "\n\nPour en savoir plus : " + base + lien;
        courriels.envoyer(new Courriel(destinataire.getEmail(), titre, """
                Bonjour %s,

                %s%s

                Vous recevez ce courriel parce que les notifications par courriel sont activées dans les paramètres de votre compte.
                """.formatted(destinataire.getPrenom(), message, suite)));
    }
}
