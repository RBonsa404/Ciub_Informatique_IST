package com.clubinfo.ist.projet;

import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.exception.DuplicateResourceException;
import com.clubinfo.ist.projet.dto.ProjetCreateDto;
import com.clubinfo.ist.projet.dto.ProjetDto;
import com.clubinfo.ist.projet.dto.ProjetMembreDto;
import com.clubinfo.ist.projet.dto.ProjetValidationDto;
import com.clubinfo.ist.projet.entity.Projet;
import com.clubinfo.ist.projet.entity.ProjetMembre;
import com.clubinfo.ist.projet.entity.RoleProjetMembre;
import com.clubinfo.ist.projet.entity.StatutProjet;
import com.clubinfo.ist.projet.mapper.ProjetMapper;
import com.clubinfo.ist.projet.repository.ProjetMembreRepository;
import com.clubinfo.ist.projet.repository.ProjetRepository;
import com.clubinfo.ist.projet.service.ProjetServiceImpl;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjetServiceTest {

    @Mock
    private ProjetRepository projetRepository;

    @Mock
    private ProjetMembreRepository projetMembreRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private ProjetMapper projetMapper;

    @InjectMocks
    private ProjetServiceImpl projetService;

    private Utilisateur mockPorteur;
    private Utilisateur mockCollaborateur;
    private Projet mockProjet;

    @BeforeEach
    void setUp() {
        mockPorteur = Utilisateur.builder().nom("Traore").prenom("Ali").email("ali@ist.ci").build();
        mockPorteur.setId(1L);

        mockCollaborateur = Utilisateur.builder().nom("Kone").prenom("Fatou").email("fatou@ist.ci").build();
        mockCollaborateur.setId(2L);

        mockProjet = Projet.builder()
                .titre("Plateforme IA IST")
                .slug("plateforme-ia-ist")
                .description("Application de recommandation")
                .statut(StatutProjet.EN_COURS)
                .porteur(mockPorteur)
                .build();
        mockProjet.setId(50L);
    }

    @Test
    @DisplayName("Proposition de projet initialise avec statut PROPOSE et assigne le porteur (UC-11)")
    void testProposerProjet() {
        ProjetCreateDto dto = ProjetCreateDto.builder()
                .titre("Plateforme IA IST")
                .description("Application de recommandation")
                .build();

        when(utilisateurRepository.findByEmail("ali@ist.ci")).thenReturn(Optional.of(mockPorteur));
        when(projetRepository.save(any(Projet.class))).thenAnswer(i -> {
            Projet p = i.getArgument(0);
            p.setId(50L);
            return p;
        });
        when(projetMapper.toDto(any(Projet.class))).thenReturn(ProjetDto.builder()
                .id(50L)
                .titre("Plateforme IA IST")
                .statut(StatutProjet.PROPOSE)
                .build());

        ProjetDto result = projetService.proposerProjet("ali@ist.ci", dto);

        assertNotNull(result);
        assertEquals(StatutProjet.PROPOSE, result.getStatut());
        verify(projetMembreRepository).save(any(ProjetMembre.class));
    }

    @Test
    @DisplayName("Validation de projet par Responsable Club passe le statut en EN_COURS (UC-20)")
    void testValiderProjet() {
        mockProjet.setStatut(StatutProjet.PROPOSE);
        when(projetRepository.findByIdAndDeletedAtIsNull(50L)).thenReturn(Optional.of(mockProjet));
        when(projetRepository.save(any(Projet.class))).thenReturn(mockProjet);
        when(projetMapper.toDto(any(Projet.class))).thenReturn(ProjetDto.builder()
                .id(50L)
                .statut(StatutProjet.EN_COURS)
                .build());

        ProjetValidationDto valDto = ProjetValidationDto.builder()
                .statut(StatutProjet.VALIDE)
                .motif("Excellente initiative technique")
                .build();

        ProjetDto result = projetService.validerProjet(50L, valDto);

        assertNotNull(result);
        assertEquals(StatutProjet.EN_COURS, result.getStatut());
    }

    @Test
    @DisplayName("Rejoindre un projet validé ajoute le membre comme contributeur (UC-11 / CDC)")
    void testRejoindreProjetSuccess() {
        when(utilisateurRepository.findByEmail("fatou@ist.ci")).thenReturn(Optional.of(mockCollaborateur));
        when(projetRepository.findByIdAndDeletedAtIsNull(50L)).thenReturn(Optional.of(mockProjet));
        when(projetMembreRepository.existsByProjetIdAndUtilisateurId(50L, 2L)).thenReturn(false);

        ProjetMembre pm = ProjetMembre.builder()
                .projet(mockProjet)
                .utilisateur(mockCollaborateur)
                .role(RoleProjetMembre.CONTRIBUTEUR)
                .build();
        pm.setId(200L);

        when(projetMembreRepository.save(any(ProjetMembre.class))).thenReturn(pm);
        when(projetMapper.toMembreDto(any(ProjetMembre.class))).thenReturn(ProjetMembreDto.builder()
                .id(200L)
                .role(RoleProjetMembre.CONTRIBUTEUR)
                .utilisateurEmail("fatou@ist.ci")
                .build());

        ProjetMembreDto result = projetService.rejoindreProjet("fatou@ist.ci", 50L);

        assertNotNull(result);
        assertEquals(RoleProjetMembre.CONTRIBUTEUR, result.getRole());
    }

    @Test
    @DisplayName("Rejoindre un projet échoue si déjà membre (UC-11)")
    void testRejoindreProjetAlreadyMember() {
        when(utilisateurRepository.findByEmail("fatou@ist.ci")).thenReturn(Optional.of(mockCollaborateur));
        when(projetRepository.findByIdAndDeletedAtIsNull(50L)).thenReturn(Optional.of(mockProjet));
        when(projetMembreRepository.existsByProjetIdAndUtilisateurId(50L, 2L)).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> projetService.rejoindreProjet("fatou@ist.ci", 50L));
    }
}
