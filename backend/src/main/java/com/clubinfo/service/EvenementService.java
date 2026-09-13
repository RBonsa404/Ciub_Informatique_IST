package com.clubinfo.service;

import com.clubinfo.dto.EvenementDTO;
import com.clubinfo.entity.*;
import com.clubinfo.exception.BadRequestException;
import com.clubinfo.exception.ResourceNotFoundException;
import com.clubinfo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EvenementService {

    private final EvenementRepository evenementRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final CategorieRepository categorieRepository;
    private final InscriptionRepository inscriptionRepository;

    @Transactional(readOnly = true)
    public Page<EvenementDTO> getPublishedEvenements(Pageable pageable) {
        return evenementRepository.findByStatut(StatutEvenement.PLANIFIE, pageable).map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public List<EvenementDTO> getUpcomingEvenements() {
        return evenementRepository.findByDateDebutAfterAndStatutOrderByDateDebutAsc(LocalDateTime.now(), StatutEvenement.PLANIFIE)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EvenementDTO getEvenementById(Long id) {
        Evenement ev = evenementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Événement non trouvé avec l'id : " + id));
        return mapToDTO(ev);
    }

    @Transactional
    public EvenementDTO createEvenement(EvenementDTO dto, Long organisateurId) {
        Utilisateur org = utilisateurRepository.findById(organisateurId)
                .orElseThrow(() -> new ResourceNotFoundException("Organisateur non trouvé"));

        Evenement ev = new Evenement();
        ev.setTitre(dto.getTitre());
        ev.setDescription(dto.getDescription());
        ev.setDateDebut(dto.getDateDebut());
        ev.setDateFin(dto.getDateFin());
        ev.setLieu(dto.getLieu());
        ev.setCapaciteMax(dto.getCapaciteMax());
        ev.setStatut(dto.getStatut() != null ? dto.getStatut() : StatutEvenement.PLANIFIE);
        ev.setImageUrl(dto.getImageUrl());
        ev.setOrganisateur(org);

        if (dto.getCategorieId() != null) {
            Categorie cat = categorieRepository.findById(dto.getCategorieId()).orElse(null);
            ev.setCategorie(cat);
        }

        return mapToDTO(evenementRepository.save(ev));
    }

    @Transactional
    public void inscrireMembre(Long evenementId, Long utilisateurId) {
        Evenement ev = evenementRepository.findById(evenementId)
                .orElseThrow(() -> new ResourceNotFoundException("Événement non trouvé"));

        Utilisateur u = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (inscriptionRepository.existsByUtilisateurIdAndEvenementId(utilisateurId, evenementId)) {
            throw new BadRequestException("Vous êtes déjà inscrit à cet événement");
        }

        int count = inscriptionRepository.findByEvenementId(evenementId).size();
        if (ev.getCapaciteMax() != null && count >= ev.getCapaciteMax()) {
            throw new BadRequestException("Cet événement est complet");
        }

        Inscription ins = new Inscription();
        ins.setUtilisateur(u);
        ins.setEvenement(ev);
        ins.setStatut(StatutInscription.ACCEPTE);

        inscriptionRepository.save(ins);
    }

    @Transactional
    public void desinscrireMembre(Long evenementId, Long utilisateurId) {
        Inscription ins = inscriptionRepository.findByUtilisateurIdAndEvenementId(utilisateurId, evenementId)
                .orElseThrow(() -> new ResourceNotFoundException("Inscription non trouvée"));
        inscriptionRepository.delete(ins);
    }

    private EvenementDTO mapToDTO(Evenement ev) {
        EvenementDTO dto = new EvenementDTO();
        dto.setId(ev.getId());
        dto.setTitre(ev.getTitre());
        dto.setDescription(ev.getDescription());
        dto.setDateDebut(ev.getDateDebut());
        dto.setDateFin(ev.getDateFin());
        dto.setLieu(ev.getLieu());
        dto.setCapaciteMax(ev.getCapaciteMax());
        dto.setStatut(ev.getStatut());
        dto.setImageUrl(ev.getImageUrl());
        dto.setDateCreation(ev.getDateCreation());
        if (ev.getOrganisateur() != null) {
            dto.setOrganisateurId(ev.getOrganisateur().getId());
            dto.setOrganisateurNomComplet(ev.getOrganisateur().getPrenom() + " " + ev.getOrganisateur().getNom());
        }
        if (ev.getCategorie() != null) {
            dto.setCategorieId(ev.getCategorie().getId());
            dto.setCategorieNom(ev.getCategorie().getNom());
        }
        dto.setNombreInscrits(inscriptionRepository.findByEvenementId(ev.getId()).size());
        return dto;
    }
}
