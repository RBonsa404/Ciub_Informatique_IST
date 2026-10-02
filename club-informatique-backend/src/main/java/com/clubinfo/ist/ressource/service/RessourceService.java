package com.clubinfo.ist.ressource.service;

import com.clubinfo.ist.categorie.entity.Categorie;
import com.clubinfo.ist.categorie.repository.CategorieRepository;
import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.common.validation.AdresseWebSure;
import com.clubinfo.ist.fichier.Fichier;
import com.clubinfo.ist.fichier.FichierService;
import com.clubinfo.ist.formation.entity.Formation;
import com.clubinfo.ist.formation.service.EquipePedagogique;
import com.clubinfo.ist.formation.service.FormationService;
import com.clubinfo.ist.ressource.dto.RessourceCreateDto;
import com.clubinfo.ist.ressource.dto.RessourceDto;
import com.clubinfo.ist.ressource.entity.Ressource;
import com.clubinfo.ist.ressource.entity.TypeRessource;
import com.clubinfo.ist.ressource.mapper.RessourceMapper;
import com.clubinfo.ist.ressource.repository.RessourceRepository;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Ressources pédagogiques. Une ressource publique se lit librement ; un support attaché à une formation est réservé
 * à ses inscrits confirmés et à son équipe pédagogique ; seul l'auteur (ou le Responsable du Club) la modifie.
 */
@Service
@RequiredArgsConstructor
public class RessourceService {

    private final RessourceRepository ressources;
    private final CategorieRepository categories;
    private final UtilisateurRepository utilisateurs;
    private final FormationService formations;
    private final FichierService fichiers;
    private final RessourceMapper mapper;

    @Transactional(readOnly = true)
    public Page<RessourceDto> publiques(Long categorieId, TypeRessource type, String recherche, Pageable pageable) {
        String terme = recherche == null || recherche.isBlank() ? null : recherche.trim();
        Pageable recentesDAbord = pageable.getSort().isSorted() ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        return ressources.findPublicWithFilters(categorieId, type, terme, recentesDAbord).map(mapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<RessourceDto> deLaFormation(Long formationId, UserDetailsImpl lecteur) {
        Formation formation = formations.trouver(formationId);
        formations.exigerInscritOuEquipe(formation, lecteur);
        return ressources.findAllByFormationIdAndDeletedAtIsNull(formationId).stream().map(mapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public RessourceDto lire(Long id, UserDetailsImpl lecteur) {
        Ressource ressource = trouver(id);
        if (!Boolean.TRUE.equals(ressource.getEstPublique())) {
            if (ressource.getFormation() != null && !ressource.getFormation().isDeleted()) {
                formations.exigerInscritOuEquipe(ressource.getFormation(), lecteur);
            } else if (!peutModifier(ressource, lecteur)) {
                throw new AccessDeniedException("Ressource réservée");
            }
        }
        return mapper.toDto(ressource);
    }

    @Transactional
    public RessourceDto publier(RessourceCreateDto saisie, UserDetailsImpl auteur) {
        Ressource ressource = Ressource.builder().auteur(utilisateurs.getReferenceById(auteur.getId())).build();
        appliquer(ressource, saisie, auteur);
        return mapper.toDto(ressources.saveAndFlush(ressource));
    }

    @Transactional
    public RessourceDto modifier(Long id, RessourceCreateDto saisie, UserDetailsImpl auteur) {
        Ressource ressource = trouver(id);
        exigerAuteur(ressource, auteur);
        appliquer(ressource, saisie, auteur);
        return mapper.toDto(ressource);
    }

    @Transactional
    public void supprimer(Long id, UserDetailsImpl auteur) {
        Ressource ressource = trouver(id);
        exigerAuteur(ressource, auteur);
        ressource.softDelete();
    }

    private void appliquer(Ressource ressource, RessourceCreateDto saisie, UserDetailsImpl auteur) {
        Formation formation = null;
        if (saisie.getFormationId() != null) {
            formation = formations.trouver(saisie.getFormationId());
            // On ne publie pas un support dans la formation d'un autre.
            EquipePedagogique.exiger(formation, auteur);
        }
        Categorie categorie = saisie.getCategorieId() == null ? null : categories.findByIdAndDeletedAtIsNull(saisie.getCategorieId())
                .orElseThrow(() -> new BusinessException("Catégorie introuvable.", HttpStatus.BAD_REQUEST, "CATEGORIE_INCONNUE"));
        boolean publique = Boolean.TRUE.equals(saisie.getEstPublique());
        ressource.setTitre(saisie.getTitre().trim());
        ressource.setDescription(saisie.getDescription() == null || saisie.getDescription().isBlank() ? null : saisie.getDescription().trim());
        ressource.setType(saisie.getType());
        ressource.setUrlFichier(saisie.getUrlFichier().trim());
        ressource.setEstPublique(publique);
        ressource.setFormation(formation);
        ressource.setCategorie(categorie);
        // Le fichier déposé sur la plateforme suit la visibilité de la ressource qui le porte.
        AdresseWebSure.Validateur.fichierDepose(ressource.getUrlFichier())
                .ifPresent(fichier -> fichiers.ouvrirA(fichier, publique ? Fichier.Acces.PUBLIC : Fichier.Acces.MEMBRES));
    }

    private static void exigerAuteur(Ressource ressource, UserDetailsImpl compte) {
        if (!peutModifier(ressource, compte)) {
            throw new AccessDeniedException("Ressource d'un autre auteur");
        }
    }

    private static boolean peutModifier(Ressource ressource, UserDetailsImpl compte) {
        return compte != null && (EquipePedagogique.estResponsable(compte)
                || (ressource.getAuteur() != null && ressource.getAuteur().getId().equals(compte.getId())));
    }

    private Ressource trouver(Long id) {
        return ressources.findByIdAndDeletedAtIsNull(id).orElseThrow(() -> new BusinessException("Ressource introuvable.", HttpStatus.NOT_FOUND));
    }
}
