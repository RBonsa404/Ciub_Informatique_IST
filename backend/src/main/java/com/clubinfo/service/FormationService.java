package com.clubinfo.service;

import com.clubinfo.dto.FormationDTO;
import com.clubinfo.entity.*;
import com.clubinfo.exception.ResourceNotFoundException;
import com.clubinfo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FormationService {

    private final FormationRepository formationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final CategorieRepository categorieRepository;

    @Transactional(readOnly = true)
    public Page<FormationDTO> getPublishedFormations(Pageable pageable) {
        return formationRepository.findByStatut(StatutFormation.PUBLIE, pageable).map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public FormationDTO getFormationById(Long id) {
        Formation f = formationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Formation non trouvée avec l'id : " + id));
        return mapToDTO(f);
    }

    @Transactional
    public FormationDTO createFormation(FormationDTO dto, Long formateurId) {
        Utilisateur formateur = utilisateurRepository.findById(formateurId)
                .orElseThrow(() -> new ResourceNotFoundException("Formateur non trouvé"));

        Formation f = new Formation();
        f.setTitre(dto.getTitre());
        f.setDescription(dto.getDescription());
        f.setNiveau(dto.getNiveau());
        f.setDuree(dto.getDuree());
        f.setStatut(dto.getStatut() != null ? dto.getStatut() : StatutFormation.PUBLIE);
        f.setImageUrl(dto.getImageUrl());
        f.setFormateur(formateur);

        if (dto.getCategorieId() != null) {
            Categorie cat = categorieRepository.findById(dto.getCategorieId()).orElse(null);
            f.setCategorie(cat);
        }

        return mapToDTO(formationRepository.save(f));
    }

    private FormationDTO mapToDTO(Formation f) {
        FormationDTO dto = new FormationDTO();
        dto.setId(f.getId());
        dto.setTitre(f.getTitre());
        dto.setDescription(f.getDescription());
        dto.setNiveau(f.getNiveau());
        dto.setDuree(f.getDuree());
        dto.setStatut(f.getStatut());
        dto.setImageUrl(f.getImageUrl());
        dto.setDateCreation(f.getDateCreation());
        if (f.getFormateur() != null) {
            dto.setFormateurId(f.getFormateur().getId());
            dto.setFormateurNomComplet(f.getFormateur().getPrenom() + " " + f.getFormateur().getNom());
        }
        if (f.getCategorie() != null) {
            dto.setCategorieId(f.getCategorie().getId());
            dto.setCategorieNom(f.getCategorie().getNom());
        }
        return dto;
    }
}
