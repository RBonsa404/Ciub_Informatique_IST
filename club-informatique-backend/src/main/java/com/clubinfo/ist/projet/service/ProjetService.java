package com.clubinfo.ist.projet.service;

import com.clubinfo.ist.categorie.entity.Categorie;
import com.clubinfo.ist.categorie.repository.CategorieRepository;
import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.journal.JournalService;
import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.common.web.Slugs;
import com.clubinfo.ist.formation.service.EquipePedagogique;
import com.clubinfo.ist.notification.entity.TypeNotification;
import com.clubinfo.ist.notification.service.NotificationService;
import com.clubinfo.ist.projet.dto.ProjetDtos.CompteursProjets;
import com.clubinfo.ist.projet.dto.ProjetDtos.Decision;
import com.clubinfo.ist.projet.dto.ProjetDtos.DecisionProjet;
import com.clubinfo.ist.projet.dto.ProjetDtos.ProjetDto;
import com.clubinfo.ist.projet.dto.ProjetDtos.ProjetSaisie;
import com.clubinfo.ist.projet.dto.ProjetDtos.SuiviProjet;
import com.clubinfo.ist.projet.entity.Projet;
import com.clubinfo.ist.projet.entity.ProjetMembre;
import com.clubinfo.ist.projet.entity.RoleProjetMembre;
import com.clubinfo.ist.projet.entity.StatutProjet;
import com.clubinfo.ist.projet.repository.ProjetRepository;
import com.clubinfo.ist.user.entity.Utilisateur;
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
import java.util.List;
import java.util.Set;

/**
 * Projets des membres. Une proposition n'est publiée qu'après la décision du Responsable du Club ;
 * avant cela, et si elle est rejetée, seuls son porteur, les formateurs et la gestion la lisent.
 */
@Service
@RequiredArgsConstructor
public class ProjetService {

    private static final Set<StatutProjet> PUBLICS = Set.of(StatutProjet.VALIDE, StatutProjet.EN_COURS, StatutProjet.TERMINE);
    private static final String ROLE_FORMATEUR = "ROLE_FORMATEUR";
    private static final String ROLE_RESPONSABLE = "ROLE_RESPONSABLE_CLUB";

    private final ProjetRepository projets;
    private final CategorieRepository categories;
    private final UtilisateurRepository utilisateurs;
    private final NotificationService notifications;
    private final JournalService journal;

    // ---------------------------------------------------------------- Lecture

    @Transactional(readOnly = true)
    public Page<ProjetDto> publies(Long categorieId, String recherche, Pageable pageable) {
        String terme = recherche == null || recherche.isBlank() ? null : recherche.trim();
        return projets.parStatuts(PUBLICS, categorieId, terme, recentsDAbord(pageable)).map(projet -> ProjetDto.de(projet, false));
    }

    @Transactional(readOnly = true)
    public ProjetDto publie(String slug) {
        return projets.findBySlugAndDeletedAtIsNull(slug)
                .filter(projet -> PUBLICS.contains(projet.getStatut()))
                .map(projet -> ProjetDto.de(projet, false))
                .orElseThrow(ProjetService::introuvable);
    }

    @Transactional(readOnly = true)
    public ProjetDto lire(Long id, UserDetailsImpl lecteur) {
        Projet projet = trouver(id);
        boolean interne = voitLesNotesInternes(projet, lecteur);
        if (!PUBLICS.contains(projet.getStatut()) && !interne) {
            throw new AccessDeniedException("Proposition réservée");
        }
        return ProjetDto.de(projet, interne);
    }

    @Transactional(readOnly = true)
    public Page<ProjetDto> duPorteur(Long porteurId, StatutProjet statut, Long categorieId, Pageable pageable) {
        return projets.duPorteur(porteurId, statut, categorieId, recentsDAbord(pageable)).map(projet -> ProjetDto.de(projet, true));
    }

    @Transactional(readOnly = true)
    public List<ProjetDto> enAttente() {
        return projets.findAllByStatutAndDeletedAtIsNullOrderByCreatedAtAscIdAsc(StatutProjet.PROPOSE).stream()
                .map(projet -> ProjetDto.de(projet, true)).toList();
    }

    @Transactional(readOnly = true)
    public Page<ProjetDto> geres(StatutProjet statut, Pageable pageable) {
        return projets.geres(statut, recentsDAbord(pageable)).map(projet -> ProjetDto.de(projet, true));
    }

    @Transactional(readOnly = true)
    public CompteursProjets compteurs() {
        return new CompteursProjets(
                projets.countByStatutAndDeletedAtIsNull(StatutProjet.PROPOSE),
                projets.countByStatutInAndDeletedAtIsNull(PUBLICS),
                projets.countByStatutAndDeletedAtIsNull(StatutProjet.REJETE));
    }

    // ---------------------------------------------------------------- Écriture

    @Transactional
    public ProjetDto proposer(Long porteurId, ProjetSaisie saisie) {
        Categorie categorie = saisie.categorieId() == null ? null : categories.findByIdAndDeletedAtIsNull(saisie.categorieId())
                .orElseThrow(() -> new BusinessException("Catégorie introuvable.", HttpStatus.BAD_REQUEST, "CATEGORIE_INCONNUE"));
        Utilisateur porteur = utilisateurs.findByIdAndDeletedAtIsNull(porteurId).orElseThrow(ProjetService::introuvable);
        Projet projet = Projet.builder()
                .titre(saisie.titre().trim())
                .slug(Slugs.libre(saisie.titre(), projets::existsBySlug))
                .description(saisie.description())
                .objectifs(vide(saisie.objectifs()))
                .technologies(saisie.technologies().trim())
                .depotGit(vide(saisie.depotGit()))
                .statut(StatutProjet.PROPOSE)
                .porteur(porteur)
                .categorie(categorie)
                .avancementPourcentage(0)
                .build();
        projet.getMembres().add(ProjetMembre.builder()
                .projet(projet).utilisateur(porteur).role(RoleProjetMembre.PORTEUR).dateRejoint(LocalDateTime.now()).build());
        projet = projets.save(projet);
        for (Utilisateur responsable : utilisateurs.actifsAvecRole(ROLE_RESPONSABLE)) {
            notifications.notifier(responsable.getId(), TypeNotification.VALIDATION_PROJET, "Nouvelle proposition de projet",
                    porteur.getPrenom() + " " + porteur.getNom() + " propose le projet « " + projet.getTitre() + " ».", "/espace/gestion/projets");
        }
        return ProjetDto.de(projet, true);
    }

    /** Une proposition ne reçoit qu'une décision ; un rejet est toujours motivé, et le motif est conservé. */
    @Transactional
    public ProjetDto decider(Long id, DecisionProjet decision) {
        Projet projet = trouver(id);
        boolean rejet = decision.statut() == Decision.REJETE;
        String motif = vide(decision.motif());
        if (rejet && motif == null) {
            throw new BusinessException("Le motif est obligatoire pour un rejet.", HttpStatus.BAD_REQUEST, "MOTIF_REQUIS");
        }
        if (projet.getStatut() != StatutProjet.PROPOSE) {
            throw new BusinessException("Une décision a déjà été prise sur cette proposition.", HttpStatus.CONFLICT, "DECISION_DEJA_PRISE");
        }
        projet.setStatut(rejet ? StatutProjet.REJETE : StatutProjet.VALIDE);
        projet.setMotifDecision(motif);
        projet.setDateDecision(LocalDateTime.now());
        notifications.notifier(projet.getPorteur().getId(), TypeNotification.VALIDATION_PROJET,
                rejet ? "Votre projet n'a pas été retenu" : "Votre projet est validé",
                rejet ? "Le projet « " + projet.getTitre() + " » n'a pas été retenu. Motif : " + motif
                        : "Le projet « " + projet.getTitre() + " » est validé" + (motif == null ? "." : ". " + motif),
                "/espace/projets");
        journal.enregistrer(rejet ? "PROJET_REJETE" : "PROJET_VALIDE", projet.getTitre(), JournalService.Resultat.SUCCES);
        return ProjetDto.de(projet, true);
    }

    /** Note et avancement saisis par un formateur ; l'avancement fait passer le projet en cours, puis terminé. */
    @Transactional
    public ProjetDto suivre(Long id, SuiviProjet suivi) {
        Projet projet = trouver(id);
        if (!PUBLICS.contains(projet.getStatut())) {
            throw new BusinessException("Seul un projet validé peut être suivi.", HttpStatus.CONFLICT, "PROJET_NON_VALIDE");
        }
        projet.setSuiviFormateur(vide(suivi.suiviFormateur()));
        projet.setAvancementPourcentage(suivi.avancementPourcentage());
        projet.setStatut(suivi.avancementPourcentage() >= 100 ? StatutProjet.TERMINE
                : suivi.avancementPourcentage() > 0 ? StatutProjet.EN_COURS : StatutProjet.VALIDE);
        return ProjetDto.de(projet, true);
    }

    // ---------------------------------------------------------------- Règles communes

    private static boolean voitLesNotesInternes(Projet projet, UserDetailsImpl lecteur) {
        return lecteur != null && (projet.getPorteur().getId().equals(lecteur.getId())
                || EquipePedagogique.aRole(lecteur, ROLE_FORMATEUR) || EquipePedagogique.aRole(lecteur, ROLE_RESPONSABLE));
    }

    private Projet trouver(Long id) {
        return projets.findByIdAndDeletedAtIsNull(id).orElseThrow(ProjetService::introuvable);
    }

    private static Pageable recentsDAbord(Pageable pageable) {
        return pageable.getSort().isSorted() ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt", "id"));
    }

    private static String vide(String valeur) {
        return valeur == null || valeur.isBlank() ? null : valeur.trim();
    }

    private static BusinessException introuvable() {
        return new BusinessException("Projet introuvable.", HttpStatus.NOT_FOUND);
    }
}
