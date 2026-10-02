package com.clubinfo.ist.common.journal;

import com.clubinfo.ist.admin.entity.AuditLog;
import com.clubinfo.ist.admin.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;

/**
 * Journal des opérations sensibles. Une entrée est écrite dans sa propre transaction :
 * elle subsiste si l'opération journalisée échoue ensuite, et son échec n'interrompt jamais l'opération.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JournalService {

    public enum Resultat { SUCCES, ECHEC }

    private final AuditLogRepository entrees;

    /** Entrée attribuée au compte connecté, ou sans compte si l'opération vient du système. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enregistrer(String action, String description, Resultat resultat) {
        enregistrer(action, description, compteCourant(), resultat);
    }

    /** Entrée attribuée à une adresse précise (connexion refusée, par exemple : personne n'est encore authentifié). */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enregistrer(String action, String description, String adresseDuCompte, Resultat resultat) {
        try {
            entrees.save(AuditLog.builder()
                    .action(action)
                    .description(description)
                    .utilisateurEmail(adresseDuCompte)
                    .ipAddress(adresseDistante())
                    .dateAction(LocalDateTime.now())
                    .statut(resultat.name())
                    .build());
        } catch (RuntimeException erreur) {
            log.error("Entrée de journal non enregistrée ({})", action, erreur);
        }
    }

    /** Journal du plus récent au plus ancien, filtré par adresse de compte (fragment) et par résultat. */
    @Transactional(readOnly = true)
    public Page<EntreeJournalDto> consulter(String utilisateur, String statut, Pageable pageable) {
        Pageable recentDabord = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "dateAction", "id"));
        return entrees.rechercher(vide(utilisateur), vide(statut), recentDabord).map(EntreeJournalDto::de);
    }

    private static String vide(String valeur) {
        return valeur == null || valeur.isBlank() ? null : valeur.trim();
    }

    private static String compteCourant() {
        Authentication authentification = SecurityContextHolder.getContext().getAuthentication();
        if (authentification == null || !authentification.isAuthenticated() || authentification instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return authentification.getName();
    }

    private static String adresseDistante() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes requete) {
            return requete.getRequest().getRemoteAddr();
        }
        return null;
    }
}
