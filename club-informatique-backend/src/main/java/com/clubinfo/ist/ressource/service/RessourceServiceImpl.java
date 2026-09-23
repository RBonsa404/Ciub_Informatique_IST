package com.clubinfo.ist.ressource.service;

import com.clubinfo.ist.categorie.entity.Categorie;
import com.clubinfo.ist.categorie.repository.CategorieRepository;
import com.clubinfo.ist.common.exception.ResourceNotFoundException;
import com.clubinfo.ist.formation.entity.Formation;
import com.clubinfo.ist.formation.repository.FormationRepository;
import com.clubinfo.ist.ressource.dto.RessourceCreateDto;
import com.clubinfo.ist.ressource.dto.RessourceDto;
import com.clubinfo.ist.ressource.entity.Ressource;
import com.clubinfo.ist.ressource.entity.TypeRessource;
import com.clubinfo.ist.ressource.mapper.RessourceMapper;
import com.clubinfo.ist.ressource.repository.RessourceRepository;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RessourceServiceImpl implements RessourceService {

    private final RessourceRepository ressourceRepository;
    private final FormationRepository formationRepository;
    private final CategorieRepository categorieRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final RessourceMapper ressourceMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<RessourceDto> getPublicRessources(Long categorieId, TypeRessource type, String search, Pageable pageable) {
        return ressourceRepository.findPublicWithFilters(categorieId, type, search, pageable)
                .map(ressourceMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RessourceDto> getAllRessourcesForAdmin(Pageable pageable) {
        return ressourceRepository.findAllByDeletedAtIsNull(pageable)
                .map(ressourceMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public RessourceDto getRessourceById(Long id) {
        Ressource ressource = findRessourceById(id);
        return ressourceMapper.toDto(ressource);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RessourceDto> getRessourcesByFormation(Long formationId) {
        return ressourceRepository.findAllByFormationIdAndDeletedAtIsNull(formationId).stream()
                .map(ressourceMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RessourceDto createRessource(String userEmail, RessourceCreateDto dto) {
        Utilisateur auteur = utilisateurRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", userEmail));

        Formation formation = null;
        if (dto.getFormationId() != null) {
            formation = formationRepository.findByIdAndDeletedAtIsNull(dto.getFormationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Formation", "id", dto.getFormationId()));
        }

        Categorie categorie = null;
        if (dto.getCategorieId() != null) {
            categorie = categorieRepository.findByIdAndDeletedAtIsNull(dto.getCategorieId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categorie", "id", dto.getCategorieId()));
        }

        Ressource ressource = Ressource.builder()
                .titre(dto.getTitre())
                .description(dto.getDescription())
                .type(dto.getType())
                .urlFichier(dto.getUrlFichier())
                .estPublique(Boolean.TRUE.equals(dto.getEstPublique()))
                .formation(formation)
                .categorie(categorie)
                .auteur(auteur)
                .build();

        ressource = ressourceRepository.save(ressource);
        log.info("Ressource créée : '{}' par {}", ressource.getTitre(), userEmail);
        return ressourceMapper.toDto(ressource);
    }

    @Override
    @Transactional
    public RessourceDto updateRessource(Long id, RessourceCreateDto dto) {
        Ressource ressource = findRessourceById(id);

        ressource.setTitre(dto.getTitre());
        ressource.setDescription(dto.getDescription());
        ressource.setType(dto.getType());
        ressource.setUrlFichier(dto.getUrlFichier());
        ressource.setEstPublique(dto.getEstPublique());

        if (dto.getFormationId() != null) {
            Formation formation = formationRepository.findByIdAndDeletedAtIsNull(dto.getFormationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Formation", "id", dto.getFormationId()));
            ressource.setFormation(formation);
        } else {
            ressource.setFormation(null);
        }

        if (dto.getCategorieId() != null) {
            Categorie categorie = categorieRepository.findByIdAndDeletedAtIsNull(dto.getCategorieId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categorie", "id", dto.getCategorieId()));
            ressource.setCategorie(categorie);
        } else {
            ressource.setCategorie(null);
        }

        ressource = ressourceRepository.save(ressource);
        log.info("Ressource ID {} mise à jour", id);
        return ressourceMapper.toDto(ressource);
    }

    @Override
    @Transactional
    public void deleteRessource(Long id) {
        Ressource ressource = findRessourceById(id);
        ressource.setDeletedAt(LocalDateTime.now());
        ressourceRepository.save(ressource);
        log.info("Ressource ID {} supprimée logiquement", id);
    }

    private Ressource findRessourceById(Long id) {
        return ressourceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ressource", "id", id));
    }
}
