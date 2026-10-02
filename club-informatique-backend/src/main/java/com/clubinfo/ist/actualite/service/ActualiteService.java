package com.clubinfo.ist.actualite.service;

import com.clubinfo.ist.actualite.dto.ActualiteDtos.ActualiteDto;
import com.clubinfo.ist.actualite.dto.ActualiteDtos.ActualiteSaisie;
import com.clubinfo.ist.actualite.entity.Actualite;
import com.clubinfo.ist.actualite.entity.Visibilite;
import com.clubinfo.ist.actualite.repository.ActualiteRepository;
import com.clubinfo.ist.categorie.entity.Categorie;
import com.clubinfo.ist.categorie.repository.CategorieRepository;
import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.journal.JournalService;
import com.clubinfo.ist.common.validation.AdresseWebSure;
import com.clubinfo.ist.common.web.Slugs;
import com.clubinfo.ist.fichier.Fichier;
import com.clubinfo.ist.fichier.FichierService;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Actualités du club. Seules les actualités publiées sont lisibles hors de la gestion : publiques pour tous,
 * réservées aux membres pour les comptes connectés. Un brouillon n'existe que pour le Responsable du Club.
 */
@Service
@RequiredArgsConstructor
public class ActualiteService {

    private final ActualiteRepository actualites;
    private final CategorieRepository categories;
    private final UtilisateurRepository utilisateurs;
    private final FichierService fichiers;
    private final JournalService journal;

    @Transactional(readOnly = true)
    public Page<ActualiteDto> publiees(Visibilite visibilite, Long categorieId, String recherche, Pageable pageable) {
        String terme = recherche == null || recherche.isBlank() ? null : recherche.trim();
        return actualites.publiees(visibilite, categorieId, terme, recentesDAbord(pageable, "datePublication")).map(ActualiteDto::de);
    }

    @Transactional(readOnly = true)
    public ActualiteDto publiee(String slug, Visibilite visibilite) {
        return actualites.findBySlugAndVisibiliteAndPublieTrueAndDeletedAtIsNull(slug, visibilite)
                .map(ActualiteDto::de)
                .orElseThrow(ActualiteService::introuvable);
    }

    @Transactional(readOnly = true)
    public Page<ActualiteDto> gerees(Boolean publie, Pageable pageable) {
        return actualites.gerees(publie, recentesDAbord(pageable, "createdAt")).map(ActualiteDto::de);
    }

    @Transactional(readOnly = true)
    public ActualiteDto geree(Long id) {
        return ActualiteDto.de(trouver(id));
    }

    @Transactional
    public ActualiteDto creer(Long auteurId, ActualiteSaisie saisie) {
        Actualite actualite = Actualite.builder()
                .slug(Slugs.libre(saisie.titre(), actualites::existsBySlug))
                .auteur(utilisateurs.getReferenceById(auteurId))
                .build();
        appliquer(actualite, saisie);
        actualite = actualites.save(actualite);
        journal.enregistrer("ACTUALITE_CREEE", "Actualité créée : " + actualite.getTitre(), JournalService.Resultat.SUCCES);
        return ActualiteDto.de(trouver(actualite.getId()));
    }

    @Transactional
    public ActualiteDto modifier(Long id, ActualiteSaisie saisie) {
        Actualite actualite = trouver(id);
        appliquer(actualite, saisie);
        return ActualiteDto.de(actualite);
    }

    /** État explicite : publier deux fois de suite ne retire rien. */
    @Transactional
    public ActualiteDto publier(Long id, boolean publie) {
        Actualite actualite = trouver(id);
        definirPublication(actualite, publie);
        journal.enregistrer(publie ? "ACTUALITE_PUBLIEE" : "ACTUALITE_RETIREE", actualite.getTitre(), JournalService.Resultat.SUCCES);
        return ActualiteDto.de(actualite);
    }

    @Transactional
    public void supprimer(Long id) {
        Actualite actualite = trouver(id);
        actualite.softDelete();
        journal.enregistrer("ACTUALITE_SUPPRIMEE", actualite.getTitre(), JournalService.Resultat.SUCCES);
    }

    private void appliquer(Actualite actualite, ActualiteSaisie saisie) {
        Categorie categorie = saisie.categorieId() == null ? null : categories.findByIdAndDeletedAtIsNull(saisie.categorieId())
                .orElseThrow(() -> new BusinessException("Catégorie introuvable.", HttpStatus.BAD_REQUEST, "CATEGORIE_INCONNUE"));
        actualite.setTitre(saisie.titre().trim());
        actualite.setContenu(saisie.contenu());
        actualite.setResume(vide(saisie.resume()));
        actualite.setImage(vide(saisie.image()));
        actualite.setCategorie(categorie);
        actualite.setVisibilite(saisie.visibilite());
        definirPublication(actualite, saisie.publie());
    }

    private void definirPublication(Actualite actualite, boolean publie) {
        actualite.setPublie(publie);
        if (publie) {
            if (actualite.getDatePublication() == null) {
                actualite.setDatePublication(LocalDateTime.now());
            }
            // L'image de couverture déposée sur la plateforme devient lisible par les lecteurs de l'actualité.
            AdresseWebSure.Validateur.fichierDepose(actualite.getImage()).ifPresent(fichier ->
                    fichiers.ouvrirA(fichier, actualite.getVisibilite() == Visibilite.PUBLIC ? Fichier.Acces.PUBLIC : Fichier.Acces.MEMBRES));
        }
    }

    private Actualite trouver(Long id) {
        return actualites.findByIdAndDeletedAtIsNull(id).orElseThrow(ActualiteService::introuvable);
    }

    /** Sans tri demandé, les plus récentes d'abord. */
    private static Pageable recentesDAbord(Pageable pageable, String champ) {
        return pageable.getSort().isSorted() ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, champ, "id"));
    }

    private static String vide(String valeur) {
        return valeur == null || valeur.isBlank() ? null : valeur.trim();
    }

    private static BusinessException introuvable() {
        return new BusinessException("Actualité introuvable.", HttpStatus.NOT_FOUND);
    }
}
