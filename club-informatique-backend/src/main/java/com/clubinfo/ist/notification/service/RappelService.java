package com.clubinfo.ist.notification.service;

import com.clubinfo.ist.inscription.entity.Inscription;
import com.clubinfo.ist.inscription.repository.InscriptionRepository;
import com.clubinfo.ist.notification.entity.TypeNotification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/** Rappels envoyés aux inscrits confirmés dans les vingt-quatre heures qui précèdent une séance ou un événement. */
@Service
@RequiredArgsConstructor
@Slf4j
public class RappelService {

    private static final Duration AVANCE = Duration.ofHours(24);
    private static final DateTimeFormatter HEURE = DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH'h'mm 'UTC'");

    private final InscriptionRepository inscriptions;
    private final NotificationService notifications;

    /** Chaque inscription n'est rappelée qu'une fois : la date du rappel est conservée. */
    @Scheduled(cron = "${app.rappels.cron:0 5 * * * *}")
    @Transactional
    public void envoyerLesRappels() {
        LocalDateTime maintenant = LocalDateTime.now();
        List<Inscription> aRappeler = inscriptions.aRappeler(maintenant, maintenant.plus(AVANCE));
        for (Inscription inscription : aRappeler) {
            boolean evenement = inscription.getEvenement() != null;
            String titre = evenement ? inscription.getEvenement().getTitre() : inscription.getSessionFormation().getFormation().getTitre();
            LocalDateTime debut = evenement ? inscription.getEvenement().getDateDebut() : inscription.getSessionFormation().getDateDebut();
            String lieu = evenement ? inscription.getEvenement().getLieu() : inscription.getSessionFormation().getLieu();
            String lien = evenement ? "/evenements/" + inscription.getEvenement().getSlug()
                    : "/formations/" + inscription.getSessionFormation().getFormation().getSlug();
            notifications.notifier(inscription.getUtilisateur().getId(), TypeNotification.RAPPEL_SESSION,
                    evenement ? "Rappel : événement à venir" : "Rappel : séance à venir",
                    "« " + titre + " » commence le " + HEURE.format(debut) + (lieu == null ? "" : ", " + lieu) + ".", lien);
            inscription.setRappelEnvoyeLe(maintenant);
        }
        if (!aRappeler.isEmpty()) {
            log.info("{} rappel(s) envoyé(s)", aRappeler.size());
        }
    }
}
