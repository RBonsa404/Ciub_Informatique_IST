package com.clubinfo.ist.categorie.service;

import com.clubinfo.ist.categorie.dto.CategorieDto;
import com.clubinfo.ist.categorie.dto.CategorieRequestDto;
import com.clubinfo.ist.categorie.entity.Categorie;
import com.clubinfo.ist.categorie.mapper.CategorieMapper;
import com.clubinfo.ist.categorie.repository.CategorieRepository;
import com.clubinfo.ist.common.exception.DuplicateResourceException;
import com.clubinfo.ist.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategorieServiceImpl implements CategorieService {

    private final CategorieRepository categorieRepository;
    private final CategorieMapper categorieMapper;

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    @Override
    @Transactional(readOnly = true)
    public List<CategorieDto> getAllCategories() {
        return categorieRepository.findAllByDeletedAtIsNull().stream()
                .map(categorieMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategorieDto getCategorieById(Long id) {
        Categorie categorie = findCategorieById(id);
        return categorieMapper.toDto(categorie);
    }

    @Override
    @Transactional(readOnly = true)
    public CategorieDto getCategorieBySlug(String slug) {
        Categorie categorie = categorieRepository.findBySlugAndDeletedAtIsNull(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Categorie", "slug", slug));
        return categorieMapper.toDto(categorie);
    }

    @Override
    @Transactional
    public CategorieDto createCategorie(CategorieRequestDto dto) {
        if (categorieRepository.existsByNomAndDeletedAtIsNull(dto.getNom())) {
            throw new DuplicateResourceException("Une catégorie avec ce nom existe déjà : " + dto.getNom());
        }

        String slug = toSlug(dto.getNom());
        if (categorieRepository.existsBySlugAndDeletedAtIsNull(slug)) {
            slug = slug + "-" + System.currentTimeMillis() % 1000;
        }

        Categorie categorie = Categorie.builder()
                .nom(dto.getNom())
                .slug(slug)
                .description(dto.getDescription())
                .couleur(dto.getCouleur())
                .build();

        categorie = categorieRepository.save(categorie);
        log.info("Catégorie créée : {}", categorie.getNom());
        return categorieMapper.toDto(categorie);
    }

    @Override
    @Transactional
    public CategorieDto updateCategorie(Long id, CategorieRequestDto dto) {
        Categorie categorie = findCategorieById(id);

        if (!categorie.getNom().equalsIgnoreCase(dto.getNom())
                && categorieRepository.existsByNomAndDeletedAtIsNull(dto.getNom())) {
            throw new DuplicateResourceException("Une catégorie avec ce nom existe déjà : " + dto.getNom());
        }

        categorie.setNom(dto.getNom());
        categorie.setDescription(dto.getDescription());
        if (dto.getCouleur() != null) categorie.setCouleur(dto.getCouleur());

        categorie = categorieRepository.save(categorie);
        log.info("Catégorie mise à jour : {}", categorie.getNom());
        return categorieMapper.toDto(categorie);
    }

    @Override
    @Transactional
    public void deleteCategorie(Long id) {
        Categorie categorie = findCategorieById(id);
        categorie.setDeletedAt(LocalDateTime.now());
        categorieRepository.save(categorie);
        log.info("Catégorie ID {} supprimée logiquement", id);
    }

    private Categorie findCategorieById(Long id) {
        return categorieRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categorie", "id", id));
    }

    private String toSlug(String input) {
        String nowhitespace = WHITESPACE.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH);
    }
}
