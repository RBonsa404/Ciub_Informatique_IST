package com.clubinfo.ist.inscription.service;

import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.exception.DuplicateResourceException;
import com.clubinfo.ist.common.exception.ResourceNotFoundException;
import com.clubinfo.ist.evenement.entity.Evenement;
import com.clubinfo.ist.evenement.repository.EvenementRepository;
import com.clubinfo.ist.formation.entity.SessionFormation;
import com.clubinfo.ist.formation.repository.SessionFormationRepository;
import com.clubinfo.ist.inscription.dto.InscriptionDto;
import com.clubinfo.ist.inscription.dto.InscriptionStatutUpdateDto;
import com.clubinfo.ist.inscription.dto.PresenceBulkRequestDto;
import com.clubinfo.ist.inscription.dto.PresenceDto;
import com.clubinfo.ist.inscription.entity.Inscription;
import com.clubinfo.ist.inscription.entity.Presence;
import com.clubinfo.ist.inscription.entity.StatutInscription;
import com.clubinfo.ist.inscription.mapper.InscriptionMapper;
import com.clubinfo.ist.inscription.repository.InscriptionRepository;
import com.clubinfo.ist.inscription.repository.PresenceRepository;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InscriptionServiceImpl implements InscriptionService {

    private final InscriptionRepository inscriptionRepository;
    private final PresenceRepository presenceRepository;
    private final EvenementRepository evenementRepository;
    private final SessionFormationRepository sessionRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final InscriptionMapper inscriptionMapper;

    @Override
    @Transactional
    public InscriptionDto inscrireEvenement(String userEmail, Long evenementId) {
        Utilisateur user = findUserByEmail(userEmail);
        Evenement event = evenementRepository.findByIdAndDeletedAtIsNull(evenementId)
                .orElseThrow(() -> new ResourceNotFoundException("Evenement", "id", evenementId));

        if (!Boolean.TRUE.equals(event.getPublie())) {
            throw new BusinessException("Cet événement n'est pas ouvert aux inscriptions", HttpStatus.BAD_REQUEST);
        }

        if (event.getDateDebut().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Cet événement a déjà commencé ou est passé", HttpStatus.BAD_REQUEST);
        }

        // Vérification doublon actif
        if (inscriptionRepository.existsByUtilisateurIdAndEvenementIdAndStatutNot(user.getId(), evenementId, StatutInscription.ANNULEE)) {
            throw new DuplicateResourceException("Vous êtes déjà inscrit à cet événement");
        }

        // Vérification capacité
        StatutInscription statut = StatutInscription.CONFIRMEE;
        if (event.getCapaciteMax() != null) {
            long countConfirmed = inscriptionRepository.countConfirmedByEvenementId(evenementId);
            if (countConfirmed >= event.getCapaciteMax()) {
                statut = StatutInscription.LISTE_ATTENTE;
                log.info("Capacité atteinte pour événement ID {} : inscription de {} en liste d'attente", evenementId, userEmail);
            }
        }

        Inscription inscription = Inscription.builder()
                .utilisateur(user)
                .evenement(event)
                .dateInscription(LocalDateTime.now())
                .statut(statut)
                .build();

        inscription = inscriptionRepository.save(inscription);
        log.info("Inscription enregistrée (ID {}, statut {}) pour l'événement '{}' par {}",
                inscription.getId(), statut, event.getTitre(), userEmail);
        return inscriptionMapper.toDto(inscription);
    }

    @Override
    @Transactional
    public InscriptionDto inscrireSessionFormation(String userEmail, Long sessionId) {
        Utilisateur user = findUserByEmail(userEmail);
        SessionFormation session = sessionRepository.findByIdAndDeletedAtIsNull(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("SessionFormation", "id", sessionId));

        if (session.getDateDebut().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Cette session a déjà commencé ou est passée", HttpStatus.BAD_REQUEST);
        }

        // Vérification doublon actif
        if (inscriptionRepository.existsByUtilisateurIdAndSessionFormationIdAndStatutNot(user.getId(), sessionId, StatutInscription.ANNULEE)) {
            throw new DuplicateResourceException("Vous êtes déjà inscrit à cette session de formation");
        }

        // Vérification capacité
        StatutInscription statut = StatutInscription.CONFIRMEE;
        if (session.getCapaciteMax() != null) {
            long countConfirmed = inscriptionRepository.countConfirmedBySessionId(sessionId);
            if (countConfirmed >= session.getCapaciteMax()) {
                statut = StatutInscription.LISTE_ATTENTE;
                log.info("Capacité atteinte pour session ID {} : inscription de {} en liste d'attente", sessionId, userEmail);
            }
        }

        Inscription inscription = Inscription.builder()
                .utilisateur(user)
                .sessionFormation(session)
                .dateInscription(LocalDateTime.now())
                .statut(statut)
                .build();

        inscription = inscriptionRepository.save(inscription);
        log.info("Inscription enregistrée (ID {}, statut {}) pour la session {} par {}",
                inscription.getId(), statut, sessionId, userEmail);
        return inscriptionMapper.toDto(inscription);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InscriptionDto> getMyInscriptions(String userEmail, Pageable pageable) {
        Utilisateur user = findUserByEmail(userEmail);
        return inscriptionRepository.findAllByUtilisateurIdAndDeletedAtIsNullOrderByDateInscriptionDesc(user.getId(), pageable)
                .map(inscriptionMapper::toDto);
    }

    @Override
    @Transactional
    public InscriptionDto annulerInscription(String userEmail, Long inscriptionId, String motif) {
        Utilisateur user = findUserByEmail(userEmail);
        Inscription inscription = inscriptionRepository.findByIdAndDeletedAtIsNull(inscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Inscription", "id", inscriptionId));

        if (!inscription.getUtilisateur().getId().equals(user.getId())) {
            throw new BusinessException("Vous ne pouvez annuler que vos propres inscriptions", HttpStatus.FORBIDDEN);
        }

        if (inscription.getStatut() == StatutInscription.ANNULEE) {
            throw new BusinessException("Cette inscription est déjà annulée", HttpStatus.BAD_REQUEST);
        }

        boolean wasConfirmed = inscription.getStatut() == StatutInscription.CONFIRMEE;
        inscription.setStatut(StatutInscription.ANNULEE);
        inscription.setMotifAnnulation(motif != null ? motif : "Annulation par l'utilisateur");
        inscription = inscriptionRepository.save(inscription);
        log.info("Inscription ID {} annulée par {}", inscriptionId, userEmail);

        // Si l'inscription annulée était CONFIRMEE, promouvoir automatiquement le 1er de la liste d'attente
        if (wasConfirmed) {
            promouvoirPremierEnListeAttente(inscription);
        }

        return inscriptionMapper.toDto(inscription);
    }

    private void promouvoirPremierEnListeAttente(Inscription inscription) {
        if (inscription.getEvenement() != null) {
            List<Inscription> attente = inscriptionRepository.findWaitingListByEvenementId(inscription.getEvenement().getId());
            if (!attente.isEmpty()) {
                Inscription premier = attente.get(0);
                premier.setStatut(StatutInscription.CONFIRMEE);
                inscriptionRepository.save(premier);
                log.info("Promotion automatique de la liste d'attente : Inscription ID {} confirmée pour événement ID {}",
                        premier.getId(), inscription.getEvenement().getId());
            }
        } else if (inscription.getSessionFormation() != null) {
            List<Inscription> attente = inscriptionRepository.findWaitingListBySessionId(inscription.getSessionFormation().getId());
            if (!attente.isEmpty()) {
                Inscription premier = attente.get(0);
                premier.setStatut(StatutInscription.CONFIRMEE);
                inscriptionRepository.save(premier);
                log.info("Promotion automatique de la liste d'attente : Inscription ID {} confirmée pour session ID {}",
                        premier.getId(), inscription.getSessionFormation().getId());
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<InscriptionDto> getInscriptionsByEvenement(Long evenementId) {
        return inscriptionRepository.findAllByEvenementIdAndDeletedAtIsNull(evenementId).stream()
                .map(inscriptionMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<InscriptionDto> getInscriptionsBySession(Long sessionId) {
        return inscriptionRepository.findAllBySessionFormationIdAndDeletedAtIsNull(sessionId).stream()
                .map(inscriptionMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InscriptionDto updateStatutInscription(Long inscriptionId, InscriptionStatutUpdateDto dto) {
        Inscription inscription = inscriptionRepository.findByIdAndDeletedAtIsNull(inscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Inscription", "id", inscriptionId));

        inscription.setStatut(dto.getStatut());
        if (dto.getMotif() != null) {
            inscription.setMotifAnnulation(dto.getMotif());
        }

        inscription = inscriptionRepository.save(inscription);
        log.info("Statut d'inscription ID {} modifié à {}", inscriptionId, dto.getStatut());
        return inscriptionMapper.toDto(inscription);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PresenceDto> getPresencesBySession(Long sessionId) {
        return presenceRepository.findAllBySessionFormationId(sessionId).stream()
                .map(inscriptionMapper::toPresenceDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<PresenceDto> enregistrerPresencesBulk(Long sessionId, PresenceBulkRequestDto dto) {
        SessionFormation session = sessionRepository.findByIdAndDeletedAtIsNull(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("SessionFormation", "id", sessionId));

        List<Presence> savedPresences = new ArrayList<>();

        for (PresenceBulkRequestDto.PresenceBulkItemDto item : dto.getPresences()) {
            Inscription inscription = inscriptionRepository.findByIdAndDeletedAtIsNull(item.getInscriptionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Inscription", "id", item.getInscriptionId()));

            Presence presence = presenceRepository.findByInscriptionIdAndSessionFormationId(item.getInscriptionId(), sessionId)
                    .orElseGet(() -> Presence.builder()
                            .inscription(inscription)
                            .sessionFormation(session)
                            .build());

            presence.setStatut(item.getStatut());
            presence.setDatePointage(LocalDateTime.now());
            presence.setRemarque(item.getRemarque());

            savedPresences.add(presenceRepository.save(presence));
        }

        log.info("{} pointages de présence enregistrés pour la session ID {}", savedPresences.size(), sessionId);
        return savedPresences.stream()
                .map(inscriptionMapper::toPresenceDto)
                .collect(Collectors.toList());
    }

    private Utilisateur findUserByEmail(String email) {
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", email));
    }
}
