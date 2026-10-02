package com.clubinfo.ist.evenement.service;

import com.clubinfo.ist.categorie.entity.Categorie;
import com.clubinfo.ist.categorie.repository.CategorieRepository;
import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.journal.JournalService;
import com.clubinfo.ist.common.web.Slugs;
import com.clubinfo.ist.evenement.dto.EvenementDtos.EvenementDto;
import com.clubinfo.ist.evenement.dto.EvenementDtos.EvenementSaisie;
import com.clubinfo.ist.evenement.entity.Evenement;
import com.clubinfo.ist.evenement.repository.EvenementRepository;
import com.clubinfo.ist.inscription.service.Effectifs;
import com.clubinfo.ist.inscription.service.InscriptionService;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Événements du club. Hors de la gestion, seuls les événements publiés existent. Le nombre d'inscrits est toujours
 * calculé en base sur les inscriptions confirmées.
 */
@Service
@RequiredArgsConstructor
public class EvenementService {

    private static final LocalDateTime DEBUT_DES_TEMPS = LocalDateTime.of(1970, 1, 1, 0, 0);
    private static final LocalDateTime FIN_DES_TEMPS = LocalDateTime.of(9999, 1, 1, 0, 0);

    private final EvenementRepository evenements;
    private final CategorieRepository categories;
    private final UtilisateurRepository utilisateurs;
    private final Effectifs effectifs;
    private final InscriptionService inscriptions;
    private final JournalService journal;

    @Value("${app.frontend-url}")
    private String frontend;

    @Transactional(readOnly = true)
    public Page<EvenementDto> publies(boolean nonTermines, Long categorieId, String recherche, Pageable pageable) {
        String terme = recherche == null || recherche.isBlank() ? null : recherche.trim();
        return decrire(evenements.publies(nonTermines, categorieId, terme, LocalDateTime.now(), parDate(pageable, Sort.Direction.ASC)));
    }

    @Transactional(readOnly = true)
    public EvenementDto publie(String slug) {
        Evenement evenement = evenements.findBySlugAndPublieTrueAndDeletedAtIsNull(slug).orElseThrow(EvenementService::introuvable);
        return decrire(evenement);
    }

    @Transactional(readOnly = true)
    public Page<EvenementDto> geres(LocalDate du, LocalDate au, Pageable pageable) {
        LocalDateTime debut = du == null ? DEBUT_DES_TEMPS : du.atStartOfDay();
        LocalDateTime avant = au == null ? FIN_DES_TEMPS : au.plusDays(1).atStartOfDay();
        return decrire(evenements.geres(debut, avant, parDate(pageable, Sort.Direction.DESC)));
    }

    @Transactional
    public EvenementDto creer(Long organisateurId, EvenementSaisie saisie) {
        if (!saisie.dateDebut().isAfter(LocalDateTime.now())) {
            throw new BusinessException("La date de début doit être à venir.", HttpStatus.BAD_REQUEST, "DATE_PASSEE");
        }
        Evenement evenement = Evenement.builder()
                .slug(Slugs.libre(saisie.titre(), evenements::existsBySlug))
                .organisateur(utilisateurs.getReferenceById(organisateurId))
                .build();
        appliquer(evenement, saisie);
        evenement = evenements.save(evenement);
        journal.enregistrer("EVENEMENT_CREE", evenement.getTitre(), JournalService.Resultat.SUCCES);
        return decrire(trouver(evenement.getId()));
    }

    @Transactional
    public EvenementDto modifier(Long id, EvenementSaisie saisie) {
        Evenement evenement = evenements.verrouiller(id).orElseThrow(EvenementService::introuvable);
        long inscrits = effectifs.evenement(id);
        if (saisie.capaciteMax() != null && saisie.capaciteMax() < inscrits) {
            throw new BusinessException("La capacité ne peut pas être inférieure au nombre d'inscrits confirmés (" + inscrits + ").",
                    HttpStatus.CONFLICT, "CAPACITE_INSUFFISANTE");
        }
        appliquer(evenement, saisie);
        evenements.saveAndFlush(evenement);
        // Des places supplémentaires profitent aussitôt à la liste d'attente.
        inscriptions.promouvoirEnAttente(evenement);
        return decrire(trouver(id));
    }

    /** L'événement disparaît du site ; ses inscrits sont désinscrits et prévenus. */
    @Transactional
    public void supprimer(Long id) {
        Evenement evenement = evenements.verrouiller(id).orElseThrow(EvenementService::introuvable);
        inscriptions.annulerToutes(evenement);
        evenement.softDelete();
        journal.enregistrer("EVENEMENT_SUPPRIME", evenement.getTitre(), JournalService.Resultat.SUCCES);
    }

    /** Fichier iCalendar d'un événement publié. */
    @Transactional(readOnly = true)
    public String calendrier(Long id) {
        Evenement evenement = evenements.findByIdAndDeletedAtIsNull(id)
                .filter(trouve -> Boolean.TRUE.equals(trouve.getPublie()))
                .orElseThrow(EvenementService::introuvable);
        String base = frontend.endsWith("/") ? frontend.substring(0, frontend.length() - 1) : frontend;
        String domaine = URI.create(base).getHost();
        return Calendrier.de(evenement, domaine == null ? "club-informatique" : domaine, base + "/evenements/" + evenement.getSlug());
    }

    public String nomDuFichier(Long id) {
        return "evenement-" + id + ".ics";
    }

    private void appliquer(Evenement evenement, EvenementSaisie saisie) {
        if (!saisie.dateFin().isAfter(saisie.dateDebut())) {
            throw new BusinessException("La date de fin doit suivre la date de début.", HttpStatus.BAD_REQUEST, "DATES_INCOHERENTES");
        }
        Categorie categorie = saisie.categorieId() == null ? null : categories.findByIdAndDeletedAtIsNull(saisie.categorieId())
                .orElseThrow(() -> new BusinessException("Catégorie introuvable.", HttpStatus.BAD_REQUEST, "CATEGORIE_INCONNUE"));
        evenement.setTitre(saisie.titre().trim());
        evenement.setDescription(saisie.description());
        evenement.setDateDebut(saisie.dateDebut());
        evenement.setDateFin(saisie.dateFin());
        evenement.setLieu(saisie.lieu().trim());
        evenement.setCapaciteMax(saisie.capaciteMax());
        evenement.setCategorie(categorie);
        evenement.setPublie(saisie.publie());
    }

    private Evenement trouver(Long id) {
        return evenements.findByIdAndDeletedAtIsNull(id).orElseThrow(EvenementService::introuvable);
    }

    private EvenementDto decrire(Evenement evenement) {
        return EvenementDto.de(evenement, effectifs.evenement(evenement.getId()));
    }

    /** Une seule requête de décompte pour toute la page. */
    private Page<EvenementDto> decrire(Page<Evenement> page) {
        List<Long> ids = page.getContent().stream().map(Evenement::getId).toList();
        Map<Long, Long> inscrits = effectifs.evenements(ids);
        return page.map(evenement -> EvenementDto.de(evenement, inscrits.getOrDefault(evenement.getId(), 0L)));
    }

    private static Pageable parDate(Pageable pageable, Sort.Direction sens) {
        return pageable.getSort().isSorted() ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(sens, "dateDebut").and(Sort.by("id")));
    }

    private static BusinessException introuvable() {
        return new BusinessException("Événement introuvable.", HttpStatus.NOT_FOUND);
    }
}
