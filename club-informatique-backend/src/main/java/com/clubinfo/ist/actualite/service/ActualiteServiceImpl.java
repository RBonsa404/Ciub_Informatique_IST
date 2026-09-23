package com.clubinfo.ist.actualite.service;

import com.clubinfo.ist.actualite.dto.ActualiteCreateDto;
import com.clubinfo.ist.actualite.dto.ActualiteDto;
import com.clubinfo.ist.actualite.dto.ActualiteUpdateDto;
import com.clubinfo.ist.actualite.entity.Actualite;
import com.clubinfo.ist.actualite.mapper.ActualiteMapper;
import com.clubinfo.ist.actualite.repository.ActualiteRepository;
import com.clubinfo.ist.categorie.entity.Categorie;
import com.clubinfo.ist.categorie.repository.CategorieRepository;
import com.clubinfo.ist.common.exception.ResourceNotFoundException;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActualiteServiceImpl implements ActualiteService {

    private final ActualiteRepository actualiteRepository;
    private final CategorieRepository categorieRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ActualiteMapper actualiteMapper;

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    @Override
    @Transactional(readOnly = true)
    public Page<ActualiteDto> getPublishedActualites(Long categorieId, String search, Pageable pageable) {
        return actualiteRepository.findPublishedWithFilters(categorieId, search, pageable)
                .map(actualiteMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ActualiteDto> getAllActualitesForAdmin(Pageable pageable) {
        return actualiteRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc(pageable)
                .map(actualiteMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public ActualiteDto getActualiteById(Long id) {
        Actualite actualite = findActualiteById(id);
        return actualiteMapper.toDto(actualite);
    }

    @Override
    @Transactional(readOnly = true)
    public ActualiteDto getActualiteBySlug(String slug) {
        Actualite actualite = actualiteRepository.findBySlugAndDeletedAtIsNull(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Actualite", "slug", slug));
        return actualiteMapper.toDto(actualite);
    }

    @Override
    @Transactional
    public ActualiteDto createActualite(String userEmail, ActualiteCreateDto dto) {
        Utilisateur auteur = utilisateurRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", userEmail));

        Categorie categorie = null;
        if (dto.getCategorieId() != null) {
            categorie = categorieRepository.findByIdAndDeletedAtIsNull(dto.getCategorieId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categorie", "id", dto.getCategorieId()));
        }

        String baseSlug = toSlug(dto.getTitre());
        String slug = baseSlug;
        if (actualiteRepository.findBySlugAndDeletedAtIsNull(slug).isPresent()) {
            slug = baseSlug + "-" + System.currentTimeMillis() % 10000;
        }

        Actualite actualite = Actualite.builder()
                .titre(dto.getTitre())
                .slug(slug)
                .contenu(dto.getContenu())
                .resume(dto.getResume())
                .image(dto.getImage())
                .publie(Boolean.TRUE.equals(dto.getPublie()))
                .datePublication(Boolean.TRUE.equals(dto.getPublie()) ? LocalDateTime.now() : null)
                .auteur(auteur)
                .categorie(categorie)
                .build();

        actualite = actualiteRepository.save(actualite);
        log.info("Article d'actualité créé : '{}' par {}", actualite.getTitre(), userEmail);
        return actualiteMapper.toDto(actualite);
    }

    @Override
    @Transactional
    public ActualiteDto updateActualite(Long id, ActualiteUpdateDto dto) {
        Actualite actualite = findActualiteById(id);

        if (dto.getTitre() != null) actualite.setTitre(dto.getTitre());
        if (dto.getContenu() != null) actualite.setContenu(dto.getContenu());
        if (dto.getResume() != null) actualite.setResume(dto.getResume());
        if (dto.getImage() != null) actualite.setImage(dto.getImage());

        if (dto.getCategorieId() != null) {
            Categorie categorie = categorieRepository.findByIdAndDeletedAtIsNull(dto.getCategorieId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categorie", "id", dto.getCategorieId()));
            actualite.setCategorie(categorie);
        }

        if (dto.getPublie() != null) {
            if (dto.getPublie() && !actualite.getPublie()) {
                actualite.setDatePublication(LocalDateTime.now());
            }
            actualite.setPublie(dto.getPublie());
        }

        actualite = actualiteRepository.save(actualite);
        log.info("Article d'actualité mis à jour : ID {}", id);
        return actualiteMapper.toDto(actualite);
    }

    @Override
    @Transactional
    public ActualiteDto togglePublication(Long id) {
        Actualite actualite = findActualiteById(id);
        boolean nouveauStatut = !Boolean.TRUE.equals(actualite.getPublie());
        actualite.setPublie(nouveauStatut);
        if (nouveauStatut && actualite.getDatePublication() == null) {
            actualite.setDatePublication(LocalDateTime.now());
        }
        actualite = actualiteRepository.save(actualite);
        log.info("Statut publication basculé à {} pour actualité ID {}", nouveauStatut, id);
        return actualiteMapper.toDto(actualite);
    }

    @Override
    @Transactional
    public void deleteActualite(Long id) {
        Actualite actualite = findActualiteById(id);
        actualite.setDeletedAt(LocalDateTime.now());
        actualiteRepository.save(actualite);
        log.info("Actualité ID {} supprimée logiquement", id);
    }

    private Actualite findActualiteById(Long id) {
        return actualiteRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Actualite", "id", id));
    }

    private String toSlug(String input) {
        String nowhitespace = WHITESPACE.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH);
    }
}
