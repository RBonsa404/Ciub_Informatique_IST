package com.clubinfo.ist.formation.service;

import com.clubinfo.ist.categorie.entity.Categorie;
import com.clubinfo.ist.categorie.repository.CategorieRepository;
import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.journal.JournalService;
import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.common.validation.AdresseWebSure;
import com.clubinfo.ist.common.web.Slugs;
import com.clubinfo.ist.fichier.Fichier;
import com.clubinfo.ist.fichier.FichierService;
import com.clubinfo.ist.formation.dto.FormationDtos.DevoirDto;
import com.clubinfo.ist.formation.dto.FormationDtos.DevoirSaisie;
import com.clubinfo.ist.formation.dto.FormationDtos.FormationDto;
import com.clubinfo.ist.formation.dto.FormationDtos.FormationSaisie;
import com.clubinfo.ist.formation.dto.FormationDtos.SeanceDto;
import com.clubinfo.ist.formation.dto.FormationDtos.SeanceSaisie;
import com.clubinfo.ist.formation.entity.Devoir;
import com.clubinfo.ist.formation.entity.Formation;
import com.clubinfo.ist.formation.entity.NiveauFormation;
import com.clubinfo.ist.formation.entity.SessionFormation;
import com.clubinfo.ist.formation.entity.StatutSession;
import com.clubinfo.ist.formation.repository.DevoirRepository;
import com.clubinfo.ist.formation.repository.FormationRepository;
import com.clubinfo.ist.formation.repository.SessionFormationRepository;
import com.clubinfo.ist.inscription.entity.Inscription;
import com.clubinfo.ist.inscription.entity.StatutInscription;
import com.clubinfo.ist.inscription.repository.InscriptionRepository;
import com.clubinfo.ist.inscription.service.Effectifs;
import com.clubinfo.ist.inscription.service.InscriptionService;
import com.clubinfo.ist.notification.entity.TypeNotification;
import com.clubinfo.ist.notification.service.NotificationService;
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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Formations, séances et devoirs. Une formation appartient à son formateur : lui seul (et le Responsable du Club)
 * la modifie, planifie ses séances et publie ses devoirs. Les devoirs ne sont lus que par les inscrits confirmés.
 */
@Service
@RequiredArgsConstructor
public class FormationService {

    private static final long AUCUNE_SEANCE = -1L;

    private final FormationRepository formations;
    private final SessionFormationRepository seances;
    private final DevoirRepository devoirs;
    private final CategorieRepository categories;
    private final UtilisateurRepository utilisateurs;
    private final InscriptionRepository inscriptions;
    private final InscriptionService inscriptionService;
    private final Effectifs effectifs;
    private final NotificationService notifications;
    private final FichierService fichiers;
    private final JournalService journal;

    // ---------------------------------------------------------------- Lecture

    @Transactional(readOnly = true)
    public Page<FormationDto> publiees(Long categorieId, NiveauFormation niveau, String recherche, Pageable pageable, UserDetailsImpl lecteur) {
        String terme = recherche == null || recherche.isBlank() ? null : recherche.trim();
        return decrire(formations.publiees(categorieId, niveau, terme, recentesDAbord(pageable)), lecteur != null);
    }

    @Transactional(readOnly = true)
    public FormationDto publiee(String slug, UserDetailsImpl lecteur) {
        return decrire(formations.findBySlugAndPublieTrueAndDeletedAtIsNull(slug).orElseThrow(FormationService::introuvable), lecteur != null);
    }

    /** Une formation non publiée n'existe que pour son équipe pédagogique. */
    @Transactional(readOnly = true)
    public FormationDto lire(Long id, UserDetailsImpl lecteur) {
        Formation formation = trouver(id);
        if (!Boolean.TRUE.equals(formation.getPublie()) && !EquipePedagogique.gere(formation, lecteur)) {
            throw introuvable();
        }
        return decrire(formation, true);
    }

    @Transactional(readOnly = true)
    public Page<FormationDto> gerees(Boolean publie, Pageable pageable, UserDetailsImpl lecteur) {
        Long formateurId = EquipePedagogique.estResponsable(lecteur) ? null : lecteur.getId();
        return decrire(formations.gerees(formateurId, publie, recentesDAbord(pageable)), true);
    }

    // ---------------------------------------------------------------- Formation

    @Transactional
    public FormationDto creer(FormationSaisie saisie, UserDetailsImpl formateur) {
        Formation formation = Formation.builder()
                .slug(Slugs.libre(saisie.titre(), formations::existsBySlug))
                .formateur(utilisateurs.getReferenceById(formateur.getId()))
                .build();
        appliquer(formation, saisie);
        formation = formations.save(formation);
        journal.enregistrer("FORMATION_CREEE", formation.getTitre(), JournalService.Resultat.SUCCES);
        return decrire(trouver(formation.getId()), true);
    }

    @Transactional
    public FormationDto modifier(Long id, FormationSaisie saisie, UserDetailsImpl auteur) {
        Formation formation = trouver(id);
        EquipePedagogique.exiger(formation, auteur);
        appliquer(formation, saisie);
        return decrire(formation, true);
    }

    /** Refusée tant que des membres sont inscrits à une séance à venir : ils perdraient leur place sans le savoir. */
    @Transactional
    public void supprimer(Long id) {
        Formation formation = trouver(id);
        long inscrits = inscriptions.inscriptionsActivesDeLaFormation(id, LocalDateTime.now());
        if (inscrits > 0) {
            throw new BusinessException("Cette formation compte " + inscrits + " inscription(s) à des séances à venir : annulez-les d'abord.",
                    HttpStatus.CONFLICT, "FORMATION_SUIVIE");
        }
        LocalDateTime maintenant = LocalDateTime.now();
        seances.desFormations(List.of(id)).forEach(seance -> seance.setDeletedAt(maintenant));
        formation.softDelete();
        journal.enregistrer("FORMATION_SUPPRIMEE", formation.getTitre(), JournalService.Resultat.SUCCES);
    }

    // ---------------------------------------------------------------- Séances

    @Transactional
    public SeanceDto planifier(Long formationId, SeanceSaisie saisie, UserDetailsImpl formateur) {
        Formation formation = trouver(formationId);
        EquipePedagogique.exiger(formation, formateur);
        if (!saisie.dateDebut().isAfter(LocalDateTime.now())) {
            throw new BusinessException("La date de début doit être à venir.", HttpStatus.BAD_REQUEST, "DATE_PASSEE");
        }
        SessionFormation seance = SessionFormation.builder().formation(formation).build();
        appliquer(seance, saisie, AUCUNE_SEANCE);
        seance = seances.save(seance);
        return SeanceDto.de(seance, 0, true);
    }

    @Transactional
    public SeanceDto modifierSeance(Long formationId, Long seanceId, SeanceSaisie saisie, UserDetailsImpl formateur) {
        SessionFormation seance = seanceDe(formationId, seanceId, formateur);
        long inscrits = effectifs.seance(seanceId);
        if (saisie.capaciteMax() != null && saisie.capaciteMax() < inscrits) {
            throw new BusinessException("La capacité ne peut pas être inférieure au nombre d'inscrits confirmés (" + inscrits + ").",
                    HttpStatus.CONFLICT, "CAPACITE_INSUFFISANTE");
        }
        appliquer(seance, saisie, seanceId);
        seances.saveAndFlush(seance);
        if (seance.getStatut() == StatutSession.ANNULEE) {
            inscriptionService.annulerToutes(seance);
        } else {
            inscriptionService.promouvoirEnAttente(seance);
        }
        return SeanceDto.de(seance, effectifs.seance(seanceId), true);
    }

    /** La séance disparaît ; ses inscrits sont désinscrits et prévenus. */
    @Transactional
    public void supprimerSeance(Long formationId, Long seanceId, UserDetailsImpl formateur) {
        SessionFormation seance = seanceDe(formationId, seanceId, formateur);
        inscriptionService.annulerToutes(seance);
        seance.softDelete();
    }

    // ---------------------------------------------------------------- Devoirs

    @Transactional(readOnly = true)
    public List<DevoirDto> devoirs(Long formationId, UserDetailsImpl lecteur) {
        Formation formation = trouver(formationId);
        exigerInscritOuEquipe(formation, lecteur);
        return devoirs.findAllByFormationIdAndDeletedAtIsNullOrderByDateLimiteAsc(formationId).stream().map(DevoirDto::de).toList();
    }

    @Transactional
    public DevoirDto publierDevoir(Long formationId, DevoirSaisie saisie, UserDetailsImpl formateur) {
        Formation formation = trouver(formationId);
        EquipePedagogique.exiger(formation, formateur);
        String consigne = saisie.fichierConsigne() == null || saisie.fichierConsigne().isBlank() ? null : saisie.fichierConsigne().trim();
        Devoir devoir = devoirs.save(Devoir.builder()
                .formation(formation)
                .titre(saisie.titre().trim())
                .description(saisie.description())
                .dateLimite(saisie.dateLimite())
                .fichierConsigne(consigne)
                .build());
        AdresseWebSure.Validateur.fichierDepose(consigne).ifPresent(fichier -> fichiers.ouvrirA(fichier, Fichier.Acces.MEMBRES));
        for (Long inscrit : inscritsConfirmes(formationId)) {
            notifications.notifier(inscrit, TypeNotification.SYSTEME, "Nouveau devoir",
                    "Un devoir a été publié pour la formation « " + formation.getTitre() + " » : " + devoir.getTitre() + ".", "/espace/supports");
        }
        return DevoirDto.de(devoir);
    }

    @Transactional
    public void supprimerDevoir(Long formationId, Long devoirId, UserDetailsImpl formateur) {
        Formation formation = trouver(formationId);
        EquipePedagogique.exiger(formation, formateur);
        Devoir devoir = devoirs.findByIdAndDeletedAtIsNull(devoirId)
                .filter(trouve -> trouve.getFormation().getId().equals(formationId))
                .orElseThrow(() -> new BusinessException("Devoir introuvable.", HttpStatus.NOT_FOUND));
        devoir.softDelete();
    }

    // ---------------------------------------------------------------- Règles communes

    /** Supports et devoirs : inscrits confirmés et équipe pédagogique seulement. */
    public void exigerInscritOuEquipe(Formation formation, UserDetailsImpl lecteur) {
        if (lecteur == null || !(EquipePedagogique.gere(formation, lecteur) || inscriptions.suitLaFormation(lecteur.getId(), formation.getId()))) {
            throw new AccessDeniedException("Réservé aux inscrits de la formation");
        }
    }

    public Formation trouver(Long id) {
        return formations.findByIdAndDeletedAtIsNull(id).orElseThrow(FormationService::introuvable);
    }

    private Set<Long> inscritsConfirmes(Long formationId) {
        Set<Long> inscrits = new LinkedHashSet<>();
        for (SessionFormation seance : seances.desFormations(List.of(formationId))) {
            for (Inscription inscription : inscriptions.deLaSeance(seance.getId(), StatutInscription.CONFIRMEE)) {
                inscrits.add(inscription.getUtilisateur().getId());
            }
        }
        return inscrits;
    }

    private SessionFormation seanceDe(Long formationId, Long seanceId, UserDetailsImpl formateur) {
        Formation formation = trouver(formationId);
        EquipePedagogique.exiger(formation, formateur);
        return seances.verrouiller(seanceId)
                .filter(seance -> seance.getFormation().getId().equals(formationId))
                .orElseThrow(() -> new BusinessException("Séance introuvable.", HttpStatus.NOT_FOUND));
    }

    private void appliquer(Formation formation, FormationSaisie saisie) {
        Categorie categorie = saisie.categorieId() == null ? null : categories.findByIdAndDeletedAtIsNull(saisie.categorieId())
                .orElseThrow(() -> new BusinessException("Catégorie introuvable.", HttpStatus.BAD_REQUEST, "CATEGORIE_INCONNUE"));
        formation.setTitre(saisie.titre().trim());
        formation.setDescription(saisie.description());
        formation.setNiveau(saisie.niveau());
        formation.setPrerequis(vide(saisie.prerequis()));
        formation.setObjectifs(vide(saisie.objectifs()));
        formation.setCategorie(categorie);
        formation.setPublie(saisie.publie());
    }

    private void appliquer(SessionFormation seance, SeanceSaisie saisie, long saufSeance) {
        if (!saisie.dateFin().isAfter(saisie.dateDebut())) {
            throw new BusinessException("La date de fin doit suivre la date de début.", HttpStatus.BAD_REQUEST, "DATES_INCOHERENTES");
        }
        Formation formation = seance.getFormation();
        if (saisie.statut() != StatutSession.ANNULEE && formation.getFormateur() != null
                && seances.chevauche(formation.getFormateur().getId(), saufSeance, saisie.dateDebut(), saisie.dateFin())) {
            throw new BusinessException("Le formateur anime déjà une séance sur ce créneau.", HttpStatus.CONFLICT, "CONFLIT_PLANNING");
        }
        seance.setDateDebut(saisie.dateDebut());
        seance.setDateFin(saisie.dateFin());
        seance.setLieu(saisie.lieu().trim());
        seance.setLienVisio(vide(saisie.lienVisio()));
        seance.setCapaciteMax(saisie.capaciteMax());
        seance.setStatut(saisie.statut());
    }

    private FormationDto decrire(Formation formation, boolean avecLien) {
        List<SessionFormation> desSeances = seances.desFormations(List.of(formation.getId()));
        Map<Long, Long> inscrits = effectifs.seances(desSeances.stream().map(SessionFormation::getId).toList());
        return FormationDto.de(formation, desSeances.stream()
                .map(seance -> SeanceDto.de(seance, inscrits.getOrDefault(seance.getId(), 0L), avecLien)).toList());
    }

    /** Trois requêtes pour toute la page : formations, séances, effectifs. */
    private Page<FormationDto> decrire(Page<Formation> page, boolean avecLien) {
        List<Long> ids = page.getContent().stream().map(Formation::getId).toList();
        List<SessionFormation> desSeances = ids.isEmpty() ? List.of() : seances.desFormations(ids);
        Map<Long, Long> inscrits = effectifs.seances(desSeances.stream().map(SessionFormation::getId).toList());
        Map<Long, List<SeanceDto>> parFormation = new HashMap<>();
        for (SessionFormation seance : desSeances) {
            parFormation.computeIfAbsent(seance.getFormation().getId(), cle -> new ArrayList<>())
                    .add(SeanceDto.de(seance, inscrits.getOrDefault(seance.getId(), 0L), avecLien));
        }
        return page.map(formation -> FormationDto.de(formation, parFormation.getOrDefault(formation.getId(), List.of())));
    }

    private static Pageable recentesDAbord(Pageable pageable) {
        return pageable.getSort().isSorted() ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt", "id"));
    }

    private static String vide(String valeur) {
        return valeur == null || valeur.isBlank() ? null : valeur.trim();
    }

    private static BusinessException introuvable() {
        return new BusinessException("Formation introuvable.", HttpStatus.NOT_FOUND);
    }
}
