package com.clubinfo.ist.inscription;

import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.exception.DuplicateResourceException;
import com.clubinfo.ist.evenement.entity.Evenement;
import com.clubinfo.ist.evenement.repository.EvenementRepository;
import com.clubinfo.ist.formation.repository.SessionFormationRepository;
import com.clubinfo.ist.inscription.dto.InscriptionDto;
import com.clubinfo.ist.inscription.entity.Inscription;
import com.clubinfo.ist.inscription.entity.StatutInscription;
import com.clubinfo.ist.inscription.mapper.InscriptionMapper;
import com.clubinfo.ist.inscription.repository.InscriptionRepository;
import com.clubinfo.ist.inscription.repository.PresenceRepository;
import com.clubinfo.ist.inscription.service.InscriptionServiceImpl;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InscriptionServiceTest {

    @Mock
    private InscriptionRepository inscriptionRepository;

    @Mock
    private PresenceRepository presenceRepository;

    @Mock
    private EvenementRepository evenementRepository;

    @Mock
    private SessionFormationRepository sessionRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private InscriptionMapper inscriptionMapper;

    @InjectMocks
    private InscriptionServiceImpl inscriptionService;

    private Utilisateur mockUser;
    private Evenement mockEvent;

    @BeforeEach
    void setUp() {
        mockUser = Utilisateur.builder()
                .nom("Kouassi")
                .prenom("Marc")
                .email("marc.kouassi@ist.ci")
                .build();
        mockUser.setId(10L);

        mockEvent = Evenement.builder()
                .titre("Hackathon IA 2026")
                .dateDebut(LocalDateTime.now().plusDays(5))
                .dateFin(LocalDateTime.now().plusDays(6))
                .lieu("Amphi 3")
                .capaciteMax(50)
                .publie(true)
                .build();
        mockEvent.setId(20L);
    }

    @Test
    @DisplayName("Inscription événement confirmée si places disponibles (UC-09)")
    void testInscrireEvenementConfirmed() {
        when(utilisateurRepository.findByEmail("marc.kouassi@ist.ci")).thenReturn(Optional.of(mockUser));
        when(evenementRepository.findByIdAndDeletedAtIsNull(20L)).thenReturn(Optional.of(mockEvent));
        when(inscriptionRepository.existsByUtilisateurIdAndEvenementIdAndStatutNot(10L, 20L, StatutInscription.ANNULEE)).thenReturn(false);
        when(inscriptionRepository.countConfirmedByEvenementId(20L)).thenReturn(30L); // 30 < 50

        Inscription saved = Inscription.builder()
                .utilisateur(mockUser)
                .evenement(mockEvent)
                .statut(StatutInscription.CONFIRMEE)
                .build();
        saved.setId(100L);

        when(inscriptionRepository.save(any(Inscription.class))).thenReturn(saved);
        when(inscriptionMapper.toDto(any(Inscription.class))).thenReturn(InscriptionDto.builder()
                .id(100L)
                .statut(StatutInscription.CONFIRMEE)
                .build());

        InscriptionDto result = inscriptionService.inscrireEvenement("marc.kouassi@ist.ci", 20L);

        assertNotNull(result);
        assertEquals(StatutInscription.CONFIRMEE, result.getStatut());
        verify(inscriptionRepository).save(any(Inscription.class));
    }

    @Test
    @DisplayName("Inscription événement bascule en LISTE_ATTENTE si capacité atteinte (UC-09)")
    void testInscrireEvenementWaitingListWhenFull() {
        when(utilisateurRepository.findByEmail("marc.kouassi@ist.ci")).thenReturn(Optional.of(mockUser));
        when(evenementRepository.findByIdAndDeletedAtIsNull(20L)).thenReturn(Optional.of(mockEvent));
        when(inscriptionRepository.existsByUtilisateurIdAndEvenementIdAndStatutNot(10L, 20L, StatutInscription.ANNULEE)).thenReturn(false);
        when(inscriptionRepository.countConfirmedByEvenementId(20L)).thenReturn(50L); // 50 == 50

        Inscription saved = Inscription.builder()
                .utilisateur(mockUser)
                .evenement(mockEvent)
                .statut(StatutInscription.LISTE_ATTENTE)
                .build();
        saved.setId(101L);

        when(inscriptionRepository.save(any(Inscription.class))).thenReturn(saved);
        when(inscriptionMapper.toDto(any(Inscription.class))).thenReturn(InscriptionDto.builder()
                .id(101L)
                .statut(StatutInscription.LISTE_ATTENTE)
                .build());

        InscriptionDto result = inscriptionService.inscrireEvenement("marc.kouassi@ist.ci", 20L);

        assertNotNull(result);
        assertEquals(StatutInscription.LISTE_ATTENTE, result.getStatut());
    }

    @Test
    @DisplayName("Annulation libère une place et promeut le premier de la liste d'attente (UC-09)")
    void testCancelPromotesWaitingList() {
        Inscription confirmed = Inscription.builder()
                .utilisateur(mockUser)
                .evenement(mockEvent)
                .statut(StatutInscription.CONFIRMEE)
                .build();
        confirmed.setId(100L);

        Utilisateur waitingUser = Utilisateur.builder().nom("Diallo").prenom("Aicha").email("aicha@ist.ci").build();
        waitingUser.setId(15L);

        Inscription waiting = Inscription.builder()
                .utilisateur(waitingUser)
                .evenement(mockEvent)
                .statut(StatutInscription.LISTE_ATTENTE)
                .build();
        waiting.setId(105L);

        when(utilisateurRepository.findByEmail("marc.kouassi@ist.ci")).thenReturn(Optional.of(mockUser));
        when(inscriptionRepository.findByIdAndDeletedAtIsNull(100L)).thenReturn(Optional.of(confirmed));
        when(inscriptionRepository.save(confirmed)).thenReturn(confirmed);
        when(inscriptionRepository.findWaitingListByEvenementId(20L)).thenReturn(List.of(waiting));
        when(inscriptionMapper.toDto(any(Inscription.class))).thenReturn(InscriptionDto.builder()
                .id(100L)
                .statut(StatutInscription.ANNULEE)
                .build());

        InscriptionDto result = inscriptionService.annulerInscription("marc.kouassi@ist.ci", 100L, "Empêchement");

        assertNotNull(result);
        assertEquals(StatutInscription.ANNULEE, result.getStatut());
        assertEquals(StatutInscription.CONFIRMEE, waiting.getStatut());
        verify(inscriptionRepository).save(waiting);
    }
}
