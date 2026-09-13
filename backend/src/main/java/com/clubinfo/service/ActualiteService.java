package com.clubinfo.service;

import com.clubinfo.dto.ActualiteDTO;
import com.clubinfo.entity.Actualite;
import com.clubinfo.entity.Categorie;
import com.clubinfo.entity.StatutActualite;
import com.clubinfo.entity.Utilisateur;
import com.clubinfo.exception.ResourceNotFoundException;
import com.clubinfo.repository.ActualiteRepository;
import com.clubinfo.repository.CategorieRepository;
import com.clubinfo.repository.UtilisateurRepository;
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
public class ActualiteService {

    private final ActualiteRepository actualiteRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final CategorieRepository categorieRepository;

    @Transactional(readOnly = true)
    public Page<ActualiteDTO> getPublishedActualites(Pageable pageable) {
        return actualiteRepository.findByStatut(StatutActualite.PUBLIE, pageable)
                .map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public List<ActualiteDTO> getTopPublishedActualites() {
        return actualiteRepository.findTop5ByStatutOrderByDatePublicationDesc(StatutActualite.PUBLIE)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ActualiteDTO getActualiteById(Long id) {
        Actualite actualite = actualiteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Actualité non trouvée avec l'id : " + id));
        return mapToDTO(actualite);
    }

    @Transactional
    public ActualiteDTO createActualite(ActualiteDTO dto, Long auteurId) {
        Utilisateur auteur = utilisateurRepository.findById(auteurId)
                .orElseThrow(() -> new ResourceNotFoundException("Auteur non trouvé avec l'id : " + auteurId));

        Actualite act = new Actualite();
        act.setTitre(dto.getTitre());
        act.setContenu(dto.getContenu());
        act.setImageUrl(dto.getImageUrl());
        act.setStatut(dto.getStatut() != null ? dto.getStatut() : StatutActualite.PUBLIE);
        act.setDatePublication(act.getStatut() == StatutActualite.PUBLIE ? LocalDateTime.now() : null);
        act.setAuteur(auteur);

        if (dto.getCategorieId() != null) {
            Categorie cat = categorieRepository.findById(dto.getCategorieId())
                    .orElseThrow(() -> new ResourceNotFoundException("Catégorie non trouvée avec l'id : " + dto.getCategorieId()));
            act.setCategorie(cat);
        }

        return mapToDTO(actualiteRepository.save(act));
    }

    @Transactional
    public ActualiteDTO updateActualite(Long id, ActualiteDTO dto) {
        Actualite act = actualiteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Actualité non trouvée avec l'id : " + id));

        act.setTitre(dto.getTitre());
        act.setContenu(dto.getContenu());
        if (dto.getImageUrl() != null) act.setImageUrl(dto.getImageUrl());
        if (dto.getStatut() != null) {
            act.setStatut(dto.getStatut());
            if (dto.getStatut() == StatutActualite.PUBLIE && act.getDatePublication() == null) {
                act.setDatePublication(LocalDateTime.now());
            }
        }

        if (dto.getCategorieId() != null) {
            Categorie cat = categorieRepository.findById(dto.getCategorieId())
                    .orElseThrow(() -> new ResourceNotFoundException("Catégorie non trouvée"));
            act.setCategorie(cat);
        }

        return mapToDTO(actualiteRepository.save(act));
    }

    @Transactional
    public void deleteActualite(Long id) {
        if (!actualiteRepository.existsById(id)) {
            throw new ResourceNotFoundException("Actualité non trouvée avec l'id : " + id);
        }
        actualiteRepository.deleteById(id);
    }

    private ActualiteDTO mapToDTO(Actualite act) {
        ActualiteDTO dto = new ActualiteDTO();
        dto.setId(act.getId());
        dto.setTitre(act.getTitre());
        dto.setContenu(act.getContenu());
        dto.setImageUrl(act.getImageUrl());
        dto.setDateCreation(act.getDateCreation());
        dto.setDatePublication(act.getDatePublication());
        dto.setStatut(act.getStatut());
        if (act.getAuteur() != null) {
            dto.setAuteurId(act.getAuteur().getId());
            dto.setAuteurNomComplet(act.getAuteur().getPrenom() + " " + act.getAuteur().getNom());
        }
        if (act.getCategorie() != null) {
            dto.setCategorieId(act.getCategorie().getId());
            dto.setCategorieNom(act.getCategorie().getNom());
        }
        return dto;
    }
}
