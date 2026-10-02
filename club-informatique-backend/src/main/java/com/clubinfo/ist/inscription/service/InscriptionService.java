package com.clubinfo.ist.inscription.service;

import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.evenement.entity.Evenement;
import com.clubinfo.ist.evenement.repository.EvenementRepository;
import com.clubinfo.ist.formation.entity.Formation;
import com.clubinfo.ist.formation.entity.SessionFormation;
import com.clubinfo.ist.formation.entity.StatutSession;
import com.clubinfo.ist.formation.repository.SessionFormationRepository;
import com.clubinfo.ist.formation.service.EquipePedagogique;
import com.clubinfo.ist.inscription.dto.InscriptionDtos.InscriptionDto;
import com.clubinfo.ist.inscription.dto.InscriptionDtos.Pointage;
import com.clubinfo.ist.inscription.dto.InscriptionDtos.PresenceDto;
import com.clubinfo.ist.inscription.entity.Inscription;
import com.clubinfo.ist.inscription.entity.Presence;
import com.clubinfo.ist.inscription.entity.StatutInscription;
import com.clubinfo.ist.inscription.repository.InscriptionRepository;
import com.clubinfo.ist.inscription.repository.PresenceRepository;
import com.clubinfo.ist.notification.entity.TypeNotification;
import com.clubinfo.ist.notification.service.NotificationService;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Inscriptions aux événements et aux séances de formation.
 * Toute opération qui touche au décompte des places verrouille d'abord l'activité : deux inscriptions simultanées
 * ne peuvent pas obtenir la même dernière place, et la liste d'attente avance dans l'ordre d'arrivée.
 */
@Service
@RequiredArgsConstructor
public class InscriptionService {

    private final InscriptionRepository inscriptions;
    private final PresenceRepository presences;
    private final EvenementRepository evenements;
    private final SessionFormationRepository seances;
    private final UtilisateurRepository utilisateurs;
    private final NotificationService notifications;

    // ---------------------------------------------------------------- Inscription

    @Transactional
    public InscriptionDto inscrireAEvenement(Long membreId, Long evenementId) {
        Evenement evenement = evenements.verrouiller(evenementId)
                .filter(trouve -> Boolean.TRUE.equals(trouve.getPublie()))
                .orElseThrow(() -> new BusinessException("Événement introuvable.", HttpStatus.NOT_FOUND));
        if (!evenement.getDateDebut().isAfter(LocalDateTime.now())) {
            throw closes("Les inscriptions à cet événement sont closes.");
        }
        if (inscriptions.inscritAEvenement(membreId, evenementId)) {
            throw dejaInscrit();
        }
        boolean complet = evenement.getCapaciteMax() != null && inscriptions.confirmeesDeLEvenement(evenementId) >= evenement.getCapaciteMax();
        Inscription inscription = inscriptions.save(Inscription.builder()
                .utilisateur(utilisateurs.getReferenceById(membreId))
                .evenement(evenement)
                .dateInscription(LocalDateTime.now())
                .statut(complet ? StatutInscription.LISTE_ATTENTE : StatutInscription.CONFIRMEE)
                .build());
        annoncerInscription(inscription);
        return InscriptionDto.pourLeMembre(inscription);
    }

    @Transactional
    public InscriptionDto inscrireASeance(Long membreId, Long seanceId) {
        SessionFormation seance = seances.verrouiller(seanceId)
                .filter(trouvee -> !trouvee.getFormation().isDeleted() && Boolean.TRUE.equals(trouvee.getFormation().getPublie()))
                .orElseThrow(() -> new BusinessException("Séance introuvable.", HttpStatus.NOT_FOUND));
        if (seance.getStatut() != StatutSession.PLANIFIEE || !seance.getDateDebut().isAfter(LocalDateTime.now())) {
            throw closes("Les inscriptions à cette séance sont closes.");
        }
        if (inscriptions.inscritASeance(membreId, seanceId)) {
            throw dejaInscrit();
        }
        boolean complet = seance.getCapaciteMax() != null && inscriptions.confirmeesDeLaSeance(seanceId) >= seance.getCapaciteMax();
        Inscription inscription = inscriptions.save(Inscription.builder()
                .utilisateur(utilisateurs.getReferenceById(membreId))
                .sessionFormation(seance)
                .dateInscription(LocalDateTime.now())
                .statut(complet ? StatutInscription.LISTE_ATTENTE : StatutInscription.CONFIRMEE)
                .build());
        annoncerInscription(inscription);
        return InscriptionDto.pourLeMembre(inscription);
    }

    @Transactional(readOnly = true)
    public Page<InscriptionDto> duMembre(Long membreId, String type, StatutInscription statut, Pageable pageable) {
        Pageable recentesDAbord = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "dateInscription", "id"));
        return inscriptions.duMembre(membreId, type, statut, recentesDAbord).map(InscriptionDto::pourLeMembre);
    }

    /** Désistement du membre. Sans effet si l'inscription est déjà annulée. */
    @Transactional
    public void annuler(Long membreId, Long inscriptionId) {
        Inscription inscription = trouver(inscriptionId);
        if (!inscription.getUtilisateur().getId().equals(membreId)) {
            throw new AccessDeniedException("Inscription d'un autre membre");
        }
        verrouillerActivite(inscription);
        changer(inscription, StatutInscription.ANNULEE, "Annulation par le membre", false);
    }

    // ---------------------------------------------------------------- Gestion

    @Transactional(readOnly = true)
    public List<InscriptionDto> deLEvenement(Long evenementId) {
        evenements.findByIdAndDeletedAtIsNull(evenementId).orElseThrow(() -> new BusinessException("Événement introuvable.", HttpStatus.NOT_FOUND));
        return inscriptions.toutesDeLEvenement(evenementId).stream().map(InscriptionDto::pourLaGestion).toList();
    }

    @Transactional(readOnly = true)
    public List<InscriptionDto> deLaSeance(Long seanceId, UserDetailsImpl lecteur) {
        seanceGeree(seanceId, lecteur);
        return inscriptions.toutesDeLaSeance(seanceId).stream().map(InscriptionDto::pourLaGestion).toList();
    }

    /** Décision de la gestion sur une inscription : confirmer (dans la limite des places), remettre en attente ou annuler. */
    @Transactional
    public InscriptionDto changerStatut(Long inscriptionId, StatutInscription statut, String motif) {
        Inscription inscription = trouver(inscriptionId);
        verrouillerActivite(inscription);
        changer(inscription, statut, motif, true);
        return InscriptionDto.pourLaGestion(inscription);
    }

    /** Confirme les premiers de la liste d'attente tant que des places sont libres. */
    @Transactional
    public void promouvoirEnAttente(Evenement evenement) {
        promouvoirEnAttente(evenement, null);
    }

    @Transactional
    public void promouvoirEnAttente(SessionFormation seance) {
        promouvoirEnAttente(seance, null);
    }

    /** Annule toutes les inscriptions d'un événement supprimé et prévient les inscrits. */
    @Transactional
    public void annulerToutes(Evenement evenement) {
        for (Inscription inscription : inscriptions.toutesDeLEvenement(evenement.getId())) {
            if (inscription.getStatut() != StatutInscription.ANNULEE) {
                inscription.setStatut(StatutInscription.ANNULEE);
                inscription.setMotifAnnulation("Événement annulé");
                notifications.notifier(inscription.getUtilisateur().getId(), TypeNotification.INSCRIPTION, "Événement annulé",
                        "L'événement « " + evenement.getTitre() + " » est annulé. Votre inscription a été retirée.", "/evenements");
            }
        }
    }

    /** Annule toutes les inscriptions d'une séance supprimée ou annulée et prévient les inscrits. */
    @Transactional
    public void annulerToutes(SessionFormation seance) {
        Formation formation = seance.getFormation();
        for (Inscription inscription : inscriptions.toutesDeLaSeance(seance.getId())) {
            if (inscription.getStatut() != StatutInscription.ANNULEE) {
                inscription.setStatut(StatutInscription.ANNULEE);
                inscription.setMotifAnnulation("Séance annulée");
                notifications.notifier(inscription.getUtilisateur().getId(), TypeNotification.INSCRIPTION, "Séance annulée",
                        "Une séance de la formation « " + formation.getTitre() + " » est annulée. Votre inscription a été retirée.",
                        "/formations/" + formation.getSlug());
            }
        }
    }

    // ---------------------------------------------------------------- Émargement

    @Transactional(readOnly = true)
    public List<PresenceDto> feuilleDEmargement(Long seanceId, UserDetailsImpl lecteur) {
        seanceGeree(seanceId, lecteur);
        return presences.deLaSeance(seanceId).stream().map(PresenceDto::de).toList();
    }

    /** Un pointage ne vaut que pour un inscrit confirmé de la séance ; le refaire le corrige. */
    @Transactional
    public List<PresenceDto> pointer(Long seanceId, List<Pointage> pointages, UserDetailsImpl formateur) {
        SessionFormation seance = seanceGeree(seanceId, formateur);
        List<Presence> enregistres = new ArrayList<>();
        for (Pointage pointage : pointages) {
            Inscription inscription = inscriptions.findByIdAndDeletedAtIsNull(pointage.inscriptionId())
                    .filter(trouvee -> trouvee.getSessionFormation() != null && trouvee.getSessionFormation().getId().equals(seanceId)
                            && trouvee.getStatut() == StatutInscription.CONFIRMEE)
                    .orElseThrow(() -> new BusinessException("Un pointage vise une inscription qui n'est pas confirmée pour cette séance.",
                            HttpStatus.BAD_REQUEST, "INSCRIPTION_HORS_SEANCE"));
            Presence presence = presences.findByInscriptionIdAndSessionFormationId(inscription.getId(), seanceId)
                    .orElseGet(() -> Presence.builder().inscription(inscription).sessionFormation(seance).build());
            presence.setStatut(pointage.statut());
            presence.setDatePointage(LocalDateTime.now());
            presence.setRemarque(pointage.remarque() == null || pointage.remarque().isBlank() ? null : pointage.remarque().trim());
            enregistres.add(presences.save(presence));
        }
        return enregistres.stream().map(PresenceDto::de).toList();
    }

    // ---------------------------------------------------------------- Règles communes

    private void changer(Inscription inscription, StatutInscription statut, String motif, boolean parLaGestion) {
        StatutInscription avant = inscription.getStatut();
        if (avant == statut) {
            return;
        }
        if (statut == StatutInscription.CONFIRMEE && complet(inscription)) {
            throw new BusinessException("Toutes les places sont prises : libérez une place ou augmentez la capacité.", HttpStatus.CONFLICT, "COMPLET");
        }
        inscription.setStatut(statut);
        inscription.setMotifAnnulation(statut == StatutInscription.ANNULEE ? (motif == null || motif.isBlank() ? null : motif.trim()) : null);
        inscriptions.saveAndFlush(inscription);

        if (statut == StatutInscription.CONFIRMEE) {
            annoncerPlaceConfirmee(inscription);
        } else if (statut == StatutInscription.ANNULEE && parLaGestion) {
            notifications.notifier(inscription.getUtilisateur().getId(), TypeNotification.INSCRIPTION, "Inscription annulée",
                    "Votre inscription à « " + titre(inscription) + " » a été annulée par le club.", lien(inscription));
        }
        if (avant == StatutInscription.CONFIRMEE) {
            // La place libérée revient au premier en attente, jamais à celui qui vient de la quitter.
            if (inscription.getEvenement() != null) {
                promouvoirEnAttente(inscription.getEvenement(), inscription.getId());
            } else {
                promouvoirEnAttente(inscription.getSessionFormation(), inscription.getId());
            }
        }
    }

    private void promouvoirEnAttente(Evenement evenement, Long sauf) {
        promouvoir(inscriptions.deLEvenement(evenement.getId(), StatutInscription.LISTE_ATTENTE), evenement.getCapaciteMax(),
                inscriptions.confirmeesDeLEvenement(evenement.getId()), sauf);
    }

    private void promouvoirEnAttente(SessionFormation seance, Long sauf) {
        promouvoir(inscriptions.deLaSeance(seance.getId(), StatutInscription.LISTE_ATTENTE), seance.getCapaciteMax(),
                inscriptions.confirmeesDeLaSeance(seance.getId()), sauf);
    }

    private void promouvoir(List<Inscription> attente, Integer capacite, long confirmees, Long sauf) {
        for (Inscription suivante : attente) {
            if (capacite != null && confirmees >= capacite) {
                return;
            }
            if (suivante.getId().equals(sauf)) {
                continue;
            }
            suivante.setStatut(StatutInscription.CONFIRMEE);
            confirmees++;
            annoncerPlaceConfirmee(suivante);
        }
    }

    private boolean complet(Inscription inscription) {
        if (inscription.getEvenement() != null) {
            Integer capacite = inscription.getEvenement().getCapaciteMax();
            return capacite != null && inscriptions.confirmeesDeLEvenement(inscription.getEvenement().getId()) >= capacite;
        }
        Integer capacite = inscription.getSessionFormation().getCapaciteMax();
        return capacite != null && inscriptions.confirmeesDeLaSeance(inscription.getSessionFormation().getId()) >= capacite;
    }

    private void verrouillerActivite(Inscription inscription) {
        if (inscription.getEvenement() != null) {
            evenements.verrouiller(inscription.getEvenement().getId());
        } else {
            seances.verrouiller(inscription.getSessionFormation().getId());
        }
    }

    private SessionFormation seanceGeree(Long seanceId, UserDetailsImpl lecteur) {
        SessionFormation seance = seances.findByIdAndDeletedAtIsNull(seanceId)
                .filter(trouvee -> !trouvee.getFormation().isDeleted())
                .orElseThrow(() -> new BusinessException("Séance introuvable.", HttpStatus.NOT_FOUND));
        EquipePedagogique.exiger(seance.getFormation(), lecteur);
        return seance;
    }

    private Inscription trouver(Long id) {
        return inscriptions.findByIdAndDeletedAtIsNull(id).orElseThrow(() -> new BusinessException("Inscription introuvable.", HttpStatus.NOT_FOUND));
    }

    private void annoncerInscription(Inscription inscription) {
        boolean confirmee = inscription.getStatut() == StatutInscription.CONFIRMEE;
        notifications.notifier(inscription.getUtilisateur().getId(), TypeNotification.INSCRIPTION,
                confirmee ? "Inscription confirmée" : "Inscription en liste d'attente",
                confirmee ? "Votre inscription à « " + titre(inscription) + " » est confirmée."
                        : "« " + titre(inscription) + " » est complet : vous êtes en liste d'attente et serez prévenu si une place se libère.",
                lien(inscription));
    }

    private void annoncerPlaceConfirmee(Inscription inscription) {
        notifications.notifier(inscription.getUtilisateur().getId(), TypeNotification.INSCRIPTION, "Votre place est confirmée",
                "Une place s'est libérée : votre inscription à « " + titre(inscription) + " » est confirmée.", lien(inscription));
    }

    private static String titre(Inscription inscription) {
        return inscription.getEvenement() != null ? inscription.getEvenement().getTitre() : inscription.getSessionFormation().getFormation().getTitre();
    }

    private static String lien(Inscription inscription) {
        return inscription.getEvenement() != null ? "/evenements/" + inscription.getEvenement().getSlug()
                : "/formations/" + inscription.getSessionFormation().getFormation().getSlug();
    }

    private static BusinessException closes(String detail) {
        return new BusinessException(detail, HttpStatus.CONFLICT, "INSCRIPTIONS_CLOSES");
    }

    private static BusinessException dejaInscrit() {
        return new BusinessException("Vous êtes déjà inscrit.", HttpStatus.CONFLICT, "DEJA_INSCRIT");
    }
}
