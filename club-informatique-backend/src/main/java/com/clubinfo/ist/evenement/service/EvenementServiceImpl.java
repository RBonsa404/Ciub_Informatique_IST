package com.clubinfo.ist.evenement.service;

import com.clubinfo.ist.categorie.entity.Categorie;
import com.clubinfo.ist.categorie.repository.CategorieRepository;
import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.exception.ResourceNotFoundException;
import com.clubinfo.ist.evenement.dto.EvenementCreateDto;
import com.clubinfo.ist.evenement.dto.EvenementDto;
import com.clubinfo.ist.evenement.dto.EvenementUpdateDto;
import com.clubinfo.ist.evenement.entity.Evenement;
import com.clubinfo.ist.evenement.mapper.EvenementMapper;
import com.clubinfo.ist.evenement.repository.EvenementRepository;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class EvenementServiceImpl implements EvenementService {

    private final EvenementRepository evenementRepository;
    private final CategorieRepository categorieRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final EvenementMapper evenementMapper;

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    @Override
    @Transactional(readOnly = true)
    public Page<EvenementDto> getPublishedEvenements(Boolean aVenir, Long categorieId, String search, Pageable pageable) {
        LocalDateTime now = LocalDateTime.now();
        return evenementRepository.findPublishedWithFilters(aVenir, categorieId, search, now, pageable)
                .map(e -> evenementMapper.toDto(e, 0L));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EvenementDto> getAllEvenementsForAdmin(Pageable pageable) {
        return evenementRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc(pageable)
                .map(e -> evenementMapper.toDto(e, 0L));
    }

    @Override
    @Transactional(readOnly = true)
    public EvenementDto getEvenementById(Long id) {
        Evenement evenement = findEvenementById(id);
        return evenementMapper.toDto(evenement, 0L);
    }

    @Override
    @Transactional(readOnly = true)
    public EvenementDto getEvenementBySlug(String slug) {
        Evenement evenement = evenementRepository.findBySlugAndDeletedAtIsNull(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Evenement", "slug", slug));
        return evenementMapper.toDto(evenement, 0L);
    }

    @Override
    @Transactional
    public EvenementDto createEvenement(String userEmail, EvenementCreateDto dto) {
        if (dto.getDateFin().isBefore(dto.getDateDebut())) {
            throw new BusinessException("La date de fin ne peut pas être antérieure à la date de début", HttpStatus.BAD_REQUEST);
        }

        Utilisateur organisateur = utilisateurRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", userEmail));

        Categorie categorie = null;
        if (dto.getCategorieId() != null) {
            categorie = categorieRepository.findByIdAndDeletedAtIsNull(dto.getCategorieId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categorie", "id", dto.getCategorieId()));
        }

        String baseSlug = toSlug(dto.getTitre());
        String slug = baseSlug;
        if (evenementRepository.findBySlugAndDeletedAtIsNull(slug).isPresent()) {
            slug = baseSlug + "-" + System.currentTimeMillis() % 10000;
        }

        Evenement evenement = Evenement.builder()
                .titre(dto.getTitre())
                .slug(slug)
                .description(dto.getDescription())
                .dateDebut(dto.getDateDebut())
                .dateFin(dto.getDateFin())
                .lieu(dto.getLieu())
                .capaciteMax(dto.getCapaciteMax())
                .image(dto.getImage())
                .publie(Boolean.TRUE.equals(dto.getPublie()))
                .categorie(categorie)
                .organisateur(organisateur)
                .build();

        evenement = evenementRepository.save(evenement);
        log.info("Événement créé : '{}' par {}", evenement.getTitre(), userEmail);
        return evenementMapper.toDto(evenement, 0L);
    }

    @Override
    @Transactional
    public EvenementDto updateEvenement(Long id, EvenementUpdateDto dto) {
        Evenement evenement = findEvenementById(id);

        if (dto.getDateDebut() != null && dto.getDateFin() != null) {
            if (dto.getDateFin().isBefore(dto.getDateDebut())) {
                throw new BusinessException("La date de fin ne peut pas être antérieure à la date de début", HttpStatus.BAD_REQUEST);
            }
            evenement.setDateDebut(dto.getDateDebut());
            evenement.setDateFin(dto.getDateFin());
        }

        if (dto.getTitre() != null) evenement.setTitre(dto.getTitre());
        if (dto.getDescription() != null) evenement.setDescription(dto.getDescription());
        if (dto.getLieu() != null) evenement.setLieu(dto.getLieu());
        if (dto.getCapaciteMax() != null) evenement.setCapaciteMax(dto.getCapaciteMax());
        if (dto.getImage() != null) evenement.setImage(dto.getImage());
        if (dto.getPublie() != null) evenement.setPublie(dto.getPublie());

        if (dto.getCategorieId() != null) {
            Categorie categorie = categorieRepository.findByIdAndDeletedAtIsNull(dto.getCategorieId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categorie", "id", dto.getCategorieId()));
            evenement.setCategorie(categorie);
        }

        evenement = evenementRepository.save(evenement);
        log.info("Événement mis à jour : ID {}", id);
        return evenementMapper.toDto(evenement, 0L);
    }

    @Override
    @Transactional
    public EvenementDto togglePublication(Long id) {
        Evenement evenement = findEvenementById(id);
        evenement.setPublie(!Boolean.TRUE.equals(evenement.getPublie()));
        evenement = evenementRepository.save(evenement);
        log.info("Publication de l'événement ID {} basculée à {}", id, evenement.getPublie());
        return evenementMapper.toDto(evenement, 0L);
    }

    @Override
    @Transactional
    public void deleteEvenement(Long id) {
        Evenement evenement = findEvenementById(id);
        evenement.setDeletedAt(LocalDateTime.now());
        evenementRepository.save(evenement);
        log.info("Événement ID {} supprimé logiquement", id);
    }

    private Evenement findEvenementById(Long id) {
        return evenementRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evenement", "id", id));
    }

    private String toSlug(String input) {
        String nowhitespace = WHITESPACE.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH);
    }
}
