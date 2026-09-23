package com.clubinfo.ist.projet.service;

import com.clubinfo.ist.categorie.entity.Categorie;
import com.clubinfo.ist.categorie.repository.CategorieRepository;
import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.exception.DuplicateResourceException;
import com.clubinfo.ist.common.exception.ResourceNotFoundException;
import com.clubinfo.ist.projet.dto.ProjetCreateDto;
import com.clubinfo.ist.projet.dto.ProjetDto;
import com.clubinfo.ist.projet.dto.ProjetMembreDto;
import com.clubinfo.ist.projet.dto.ProjetSuiviDto;
import com.clubinfo.ist.projet.dto.ProjetValidationDto;
import com.clubinfo.ist.projet.entity.Projet;
import com.clubinfo.ist.projet.entity.ProjetMembre;
import com.clubinfo.ist.projet.entity.RoleProjetMembre;
import com.clubinfo.ist.projet.entity.StatutProjet;
import com.clubinfo.ist.projet.mapper.ProjetMapper;
import com.clubinfo.ist.projet.repository.ProjetMembreRepository;
import com.clubinfo.ist.projet.repository.ProjetRepository;
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
public class ProjetServiceImpl implements ProjetService {

    private final ProjetRepository projetRepository;
    private final ProjetMembreRepository projetMembreRepository;
    private final CategorieRepository categorieRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ProjetMapper projetMapper;

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    @Override
    @Transactional(readOnly = true)
    public Page<ProjetDto> getPublishedProjets(Long categorieId, String search, Pageable pageable) {
        List<StatutProjet> publishedStatuses = List.of(StatutProjet.VALIDE, StatutProjet.EN_COURS, StatutProjet.TERMINE);
        return projetRepository.findByStatutInWithFilters(publishedStatuses, categorieId, search, pageable)
                .map(projetMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProjetDto> getAllProjetsForAdmin(Pageable pageable) {
        return projetRepository.findAllByDeletedAtIsNull(pageable)
                .map(projetMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjetDto> getProjetsEnAttente() {
        return projetRepository.findAllByStatutAndDeletedAtIsNull(StatutProjet.PROPOSE).stream()
                .map(projetMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProjetDto getProjetById(Long id) {
        Projet projet = findProjetById(id);
        return projetMapper.toDto(projet);
    }

    @Override
    @Transactional(readOnly = true)
    public ProjetDto getProjetBySlug(String slug) {
        Projet projet = projetRepository.findBySlugAndDeletedAtIsNull(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Projet", "slug", slug));
        return projetMapper.toDto(projet);
    }

    @Override
    @Transactional
    public ProjetDto proposerProjet(String userEmail, ProjetCreateDto dto) {
        Utilisateur porteur = findUserByEmail(userEmail);

        Categorie categorie = null;
        if (dto.getCategorieId() != null) {
            categorie = categorieRepository.findByIdAndDeletedAtIsNull(dto.getCategorieId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categorie", "id", dto.getCategorieId()));
        }

        String baseSlug = toSlug(dto.getTitre());
        String slug = baseSlug;
        if (projetRepository.findBySlugAndDeletedAtIsNull(slug).isPresent()) {
            slug = baseSlug + "-" + System.currentTimeMillis() % 10000;
        }

        Projet projet = Projet.builder()
                .titre(dto.getTitre())
                .slug(slug)
                .description(dto.getDescription())
                .objectifs(dto.getObjectifs())
                .technologies(dto.getTechnologies())
                .depotGit(dto.getDepotGit())
                .documentationUrl(dto.getDocumentationUrl())
                .statut(StatutProjet.PROPOSE)
                .porteur(porteur)
                .categorie(categorie)
                .avancementPourcentage(0)
                .build();

        projet = projetRepository.save(projet);

        // Ajouter automatiquement le porteur comme premier membre avec le rôle PORTEUR
        ProjetMembre membre = ProjetMembre.builder()
                .projet(projet)
                .utilisateur(porteur)
                .role(RoleProjetMembre.PORTEUR)
                .dateRejoint(LocalDateTime.now())
                .build();
        projetMembreRepository.save(membre);

        log.info("Projet '{}' proposé par {}", projet.getTitre(), userEmail);
        return projetMapper.toDto(projet);
    }

    @Override
    @Transactional
    public ProjetDto validerProjet(Long id, ProjetValidationDto dto) {
        Projet projet = findProjetById(id);

        if (dto.getStatut() != StatutProjet.VALIDE && dto.getStatut() != StatutProjet.REJETE) {
            throw new BusinessException("Statut de validation non valide. Utilisez VALIDE ou REJETE.", HttpStatus.BAD_REQUEST);
        }

        projet.setStatut(dto.getStatut());
        if (dto.getStatut() == StatutProjet.VALIDE) {
            projet.setStatut(StatutProjet.EN_COURS);
        }

        projet = projetRepository.save(projet);
        log.info("Projet ID {} statué à {} : {}", id, projet.getStatut(), dto.getMotif());
        return projetMapper.toDto(projet);
    }

    @Override
    @Transactional
    public ProjetMembreDto rejoindreProjet(String userEmail, Long projetId) {
        Utilisateur user = findUserByEmail(userEmail);
        Projet projet = findProjetById(projetId);

        if (projet.getStatut() == StatutProjet.PROPOSE || projet.getStatut() == StatutProjet.REJETE) {
            throw new BusinessException("Ce projet n'est pas encore validé ou a été rejeté", HttpStatus.BAD_REQUEST);
        }

        if (projetMembreRepository.existsByProjetIdAndUtilisateurId(projetId, user.getId())) {
            throw new DuplicateResourceException("Vous êtes déjà membre de ce projet");
        }

        ProjetMembre membre = ProjetMembre.builder()
                .projet(projet)
                .utilisateur(user)
                .role(RoleProjetMembre.CONTRIBUTEUR)
                .dateRejoint(LocalDateTime.now())
                .build();

        membre = projetMembreRepository.save(membre);
        log.info("Utilisateur {} a rejoint le projet ID {}", userEmail, projetId);
        return projetMapper.toMembreDto(membre);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjetMembreDto> getMembres(Long projetId) {
        findProjetById(projetId);
        return projetMembreRepository.findAllByProjetId(projetId).stream()
                .map(projetMapper::toMembreDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ProjetDto updateSuiviFormateur(Long projetId, ProjetSuiviDto dto) {
        Projet projet = findProjetById(projetId);

        if (dto.getSuiviFormateur() != null) {
            projet.setSuiviFormateur(dto.getSuiviFormateur());
        }
        if (dto.getAvancementPourcentage() != null) {
            projet.setAvancementPourcentage(dto.getAvancementPourcentage());
            if (dto.getAvancementPourcentage() >= 100) {
                projet.setStatut(StatutProjet.TERMINE);
            }
        }

        projet = projetRepository.save(projet);
        log.info("Suivi formateur mis à jour pour projet ID {} (avancement : {}%)", projetId, projet.getAvancementPourcentage());
        return projetMapper.toDto(projet);
    }

    @Override
    @Transactional
    public void deleteProjet(Long id) {
        Projet projet = findProjetById(id);
        projet.setDeletedAt(LocalDateTime.now());
        projetRepository.save(projet);
        log.info("Projet ID {} supprimé logiquement", id);
    }

    private Projet findProjetById(Long id) {
        return projetRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet", "id", id));
    }

    private Utilisateur findUserByEmail(String email) {
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", email));
    }

    private String toSlug(String input) {
        String nowhitespace = WHITESPACE.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH);
    }
}
