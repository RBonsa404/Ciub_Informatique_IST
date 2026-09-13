package com.clubinfo.service;

import com.clubinfo.dto.RessourceDTO;
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
public class RessourceService {

    private final RessourceRepository ressourceRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final CategorieRepository categorieRepository;
    private final FormationRepository formationRepository;

    @Transactional(readOnly = true)
    public Page<RessourceDTO> getPublicRessources(Pageable pageable) {
        return ressourceRepository.findByVisibilite(Visibilite.PUBLIC, pageable).map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public Page<RessourceDTO> getAllRessources(Pageable pageable) {
        return ressourceRepository.findAll(pageable).map(this::mapToDTO);
    }

    @Transactional
    public RessourceDTO createRessource(RessourceDTO dto, Long auteurId) {
        Utilisateur auteur = utilisateurRepository.findById(auteurId)
                .orElseThrow(() -> new ResourceNotFoundException("Auteur non trouvé"));

        Ressource r = new Ressource();
        r.setTitre(dto.getTitre());
        r.setType(dto.getType());
        r.setUrl(dto.getUrl());
        r.setVisibilite(dto.getVisibilite() != null ? dto.getVisibilite() : Visibilite.PUBLIC);
        r.setAuteur(auteur);

        if (dto.getCategorieId() != null) {
            Categorie cat = categorieRepository.findById(dto.getCategorieId()).orElse(null);
            r.setCategorie(cat);
        }
        if (dto.getFormationId() != null) {
            Formation f = formationRepository.findById(dto.getFormationId()).orElse(null);
            r.setFormation(f);
        }

        return mapToDTO(ressourceRepository.save(r));
    }

    private RessourceDTO mapToDTO(Ressource r) {
        RessourceDTO dto = new RessourceDTO();
        dto.setId(r.getId());
        dto.setTitre(r.getTitre());
        dto.setType(r.getType());
        dto.setUrl(r.getUrl());
        dto.setDateAjout(r.getDateAjout());
        dto.setVisibilite(r.getVisibilite());
        if (r.getAuteur() != null) {
            dto.setAuteurId(r.getAuteur().getId());
            dto.setAuteurNomComplet(r.getAuteur().getPrenom() + " " + r.getAuteur().getNom());
        }
        if (r.getCategorie() != null) {
            dto.setCategorieId(r.getCategorie().getId());
            dto.setCategorieNom(r.getCategorie().getNom());
        }
        if (r.getFormation() != null) {
            dto.setFormationId(r.getFormation().getId());
            dto.setFormationTitre(r.getFormation().getTitre());
        }
        return dto;
    }
}
