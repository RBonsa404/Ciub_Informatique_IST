package com.clubinfo.ist.formation.service;

import com.clubinfo.ist.categorie.entity.Categorie;
import com.clubinfo.ist.categorie.repository.CategorieRepository;
import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.exception.ResourceNotFoundException;
import com.clubinfo.ist.formation.dto.DevoirCreateDto;
import com.clubinfo.ist.formation.dto.DevoirDto;
import com.clubinfo.ist.formation.dto.FormationCreateDto;
import com.clubinfo.ist.formation.dto.FormationDto;
import com.clubinfo.ist.formation.dto.FormationUpdateDto;
import com.clubinfo.ist.formation.dto.SessionFormationCreateDto;
import com.clubinfo.ist.formation.dto.SessionFormationDto;
import com.clubinfo.ist.formation.entity.Devoir;
import com.clubinfo.ist.formation.entity.Formation;
import com.clubinfo.ist.formation.entity.NiveauFormation;
import com.clubinfo.ist.formation.entity.SessionFormation;
import com.clubinfo.ist.formation.mapper.FormationMapper;
import com.clubinfo.ist.formation.repository.DevoirRepository;
import com.clubinfo.ist.formation.repository.FormationRepository;
import com.clubinfo.ist.formation.repository.SessionFormationRepository;
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
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FormationServiceImpl implements FormationService {

    private final FormationRepository formationRepository;
    private final SessionFormationRepository sessionRepository;
    private final DevoirRepository devoirRepository;
    private final CategorieRepository categorieRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final FormationMapper formationMapper;

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    @Override
    @Transactional(readOnly = true)
    public Page<FormationDto> getPublishedFormations(Long categorieId, NiveauFormation niveau, String search, Pageable pageable) {
        return formationRepository.findPublishedWithFilters(categorieId, niveau, search, pageable)
                .map(formationMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FormationDto> getAllFormationsForAdmin(Pageable pageable) {
        return formationRepository.findAllByDeletedAtIsNull(pageable)
                .map(formationMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public FormationDto getFormationById(Long id) {
        Formation formation = findFormationById(id);
        return formationMapper.toDto(formation);
    }

    @Override
    @Transactional(readOnly = true)
    public FormationDto getFormationBySlug(String slug) {
        Formation formation = formationRepository.findBySlugAndDeletedAtIsNull(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Formation", "slug", slug));
        return formationMapper.toDto(formation);
    }

    @Override
    @Transactional
    public FormationDto createFormation(String formateurEmail, FormationCreateDto dto) {
        Utilisateur formateur = utilisateurRepository.findByEmail(formateurEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", formateurEmail));

        Categorie categorie = null;
        if (dto.getCategorieId() != null) {
            categorie = categorieRepository.findByIdAndDeletedAtIsNull(dto.getCategorieId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categorie", "id", dto.getCategorieId()));
        }

        String baseSlug = toSlug(dto.getTitre());
        String slug = baseSlug;
        if (formationRepository.findBySlugAndDeletedAtIsNull(slug).isPresent()) {
            slug = baseSlug + "-" + System.currentTimeMillis() % 10000;
        }

        Formation formation = Formation.builder()
                .titre(dto.getTitre())
                .slug(slug)
                .description(dto.getDescription())
                .niveau(dto.getNiveau() != null ? dto.getNiveau() : NiveauFormation.DEBUTANT)
                .prerequis(dto.getPrerequis())
                .objectifs(dto.getObjectifs())
                .image(dto.getImage())
                .publie(Boolean.TRUE.equals(dto.getPublie()))
                .formateur(formateur)
                .categorie(categorie)
                .build();

        formation = formationRepository.save(formation);
        log.info("Formation créée : '{}' par {}", formation.getTitre(), formateurEmail);
        return formationMapper.toDto(formation);
    }

    @Override
    @Transactional
    public FormationDto updateFormation(Long id, FormationUpdateDto dto) {
        Formation formation = findFormationById(id);

        if (dto.getTitre() != null) formation.setTitre(dto.getTitre());
        if (dto.getDescription() != null) formation.setDescription(dto.getDescription());
        if (dto.getNiveau() != null) formation.setNiveau(dto.getNiveau());
        if (dto.getPrerequis() != null) formation.setPrerequis(dto.getPrerequis());
        if (dto.getObjectifs() != null) formation.setObjectifs(dto.getObjectifs());
        if (dto.getImage() != null) formation.setImage(dto.getImage());
        if (dto.getPublie() != null) formation.setPublie(dto.getPublie());

        if (dto.getCategorieId() != null) {
            Categorie categorie = categorieRepository.findByIdAndDeletedAtIsNull(dto.getCategorieId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categorie", "id", dto.getCategorieId()));
            formation.setCategorie(categorie);
        }

        formation = formationRepository.save(formation);
        log.info("Formation mise à jour : ID {}", id);
        return formationMapper.toDto(formation);
    }

    @Override
    @Transactional
    public FormationDto togglePublication(Long id) {
        Formation formation = findFormationById(id);
        formation.setPublie(!Boolean.TRUE.equals(formation.getPublie()));
        formation = formationRepository.save(formation);
        log.info("Publication de formation ID {} basculée à {}", id, formation.getPublie());
        return formationMapper.toDto(formation);
    }

    @Override
    @Transactional
    public void deleteFormation(Long id) {
        Formation formation = findFormationById(id);
        formation.setDeletedAt(LocalDateTime.now());
        formationRepository.save(formation);
        log.info("Formation ID {} supprimée logiquement", id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SessionFormationDto> getSessions(Long formationId) {
        findFormationById(formationId);
        return sessionRepository.findAllByFormationIdAndDeletedAtIsNullOrderByDateDebutAsc(formationId).stream()
                .map(formationMapper::toSessionDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SessionFormationDto addSession(Long formationId, SessionFormationCreateDto dto) {
        Formation formation = findFormationById(formationId);

        if (dto.getDateFin().isBefore(dto.getDateDebut())) {
            throw new BusinessException("La date de fin ne peut pas précéder la date de début", HttpStatus.BAD_REQUEST);
        }

        SessionFormation session = SessionFormation.builder()
                .formation(formation)
                .dateDebut(dto.getDateDebut())
                .dateFin(dto.getDateFin())
                .lieu(dto.getLieu())
                .lienVisio(dto.getLienVisio())
                .capaciteMax(dto.getCapaciteMax())
                .statut(dto.getStatut())
                .build();

        session = sessionRepository.save(session);
        log.info("Session ajoutée pour la formation ID {} : du {} au {}", formationId, session.getDateDebut(), session.getDateFin());
        return formationMapper.toSessionDto(session);
    }

    @Override
    @Transactional
    public SessionFormationDto updateSession(Long formationId, Long sessionId, SessionFormationCreateDto dto) {
        findFormationById(formationId);
        SessionFormation session = sessionRepository.findByIdAndDeletedAtIsNull(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("SessionFormation", "id", sessionId));

        if (dto.getDateDebut() != null && dto.getDateFin() != null) {
            if (dto.getDateFin().isBefore(dto.getDateDebut())) {
                throw new BusinessException("La date de fin ne peut pas précéder la date de début", HttpStatus.BAD_REQUEST);
            }
            session.setDateDebut(dto.getDateDebut());
            session.setDateFin(dto.getDateFin());
        }

        if (dto.getLieu() != null) session.setLieu(dto.getLieu());
        if (dto.getLienVisio() != null) session.setLienVisio(dto.getLienVisio());
        if (dto.getCapaciteMax() != null) session.setCapaciteMax(dto.getCapaciteMax());
        if (dto.getStatut() != null) session.setStatut(dto.getStatut());

        session = sessionRepository.save(session);
        log.info("Session ID {} mise à jour", sessionId);
        return formationMapper.toSessionDto(session);
    }

    @Override
    @Transactional
    public void deleteSession(Long formationId, Long sessionId) {
        findFormationById(formationId);
        SessionFormation session = sessionRepository.findByIdAndDeletedAtIsNull(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("SessionFormation", "id", sessionId));
        session.setDeletedAt(LocalDateTime.now());
        sessionRepository.save(session);
        log.info("Session ID {} supprimée logiquement", sessionId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DevoirDto> getDevoirs(Long formationId) {
        findFormationById(formationId);
        return devoirRepository.findAllByFormationIdAndDeletedAtIsNullOrderByDateLimiteAsc(formationId).stream()
                .map(formationMapper::toDevoirDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DevoirDto addDevoir(Long formationId, DevoirCreateDto dto) {
        Formation formation = findFormationById(formationId);

        Devoir devoir = Devoir.builder()
                .formation(formation)
                .titre(dto.getTitre())
                .description(dto.getDescription())
                .dateLimite(dto.getDateLimite())
                .fichierConsigne(dto.getFichierConsigne())
                .build();

        devoir = devoirRepository.save(devoir);
        log.info("Devoir '{}' ajouté à la formation ID {}", devoir.getTitre(), formationId);
        return formationMapper.toDevoirDto(devoir);
    }

    @Override
    @Transactional
    public void deleteDevoir(Long formationId, Long devoirId) {
        findFormationById(formationId);
        Devoir devoir = devoirRepository.findByIdAndDeletedAtIsNull(devoirId)
                .orElseThrow(() -> new ResourceNotFoundException("Devoir", "id", devoirId));
        devoir.setDeletedAt(LocalDateTime.now());
        devoirRepository.save(devoir);
        log.info("Devoir ID {} supprimé logiquement", devoirId);
    }

    private Formation findFormationById(Long id) {
        return formationRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Formation", "id", id));
    }

    private String toSlug(String input) {
        String nowhitespace = WHITESPACE.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH);
    }
}
