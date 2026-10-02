package com.clubinfo.ist.user.service;

import com.clubinfo.ist.auth.entity.JetonUsageUnique;
import com.clubinfo.ist.auth.service.CourrielsDeCompte;
import com.clubinfo.ist.auth.service.JetonService;
import com.clubinfo.ist.auth.service.SessionService;
import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.journal.JournalService;
import com.clubinfo.ist.common.journal.JournalService.Resultat;
import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.user.dto.GestionDesComptesDtos.Compte;
import com.clubinfo.ist.user.dto.GestionDesComptesDtos.CompteMiseAJour;
import com.clubinfo.ist.user.dto.GestionDesComptesDtos.DefinitionRole;
import com.clubinfo.ist.user.dto.GestionDesComptesDtos.Invitation;
import com.clubinfo.ist.user.dto.GestionDesComptesDtos.Permission;
import com.clubinfo.ist.user.dto.GestionDesComptesDtos.RoleDuCompte;
import com.clubinfo.ist.user.entity.Role;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.PermissionRepository;
import com.clubinfo.ist.user.repository.RoleRepository;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Gestion des comptes par l'administration. La hiérarchie des rôles est appliquée ici : nul ne modifie ses propres
 * rôles ni son propre statut, nul n'agit sur un compte d'un rang supérieur au sien ni n'accorde un rôle au-dessus
 * du sien, et la plateforme garde toujours un Super Admin réel et actif.
 */
@Service
@RequiredArgsConstructor
public class GestionDesComptesService {

    private static final Duration VALIDITE_INVITATION = Duration.ofHours(72);
    private static final Set<RoleDuCompte> MEMBRES_DU_CLUB = Set.of(RoleDuCompte.FORMATEUR, RoleDuCompte.RESPONSABLE_CLUB);

    private final UtilisateurRepository utilisateurs;
    private final RoleRepository roles;
    private final PermissionRepository permissions;
    private final SessionService sessions;
    private final JetonService jetons;
    private final CourrielsDeCompte courriels;
    private final JournalService journal;

    // ---------------------------------------------------------------- Lecture

    @Transactional(readOnly = true)
    public Page<Compte> lister(String recherche, RoleDuCompte role, StatutUtilisateur statut, Pageable pageable) {
        String terme = recherche == null || recherche.isBlank() ? null : recherche.trim();
        Pageable recentsDAbord = pageable.getSort().isSorted() ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        return utilisateurs.gerer(terme, role == null ? null : role.nomTechnique(), statut, recentsDAbord).map(Compte::de);
    }

    @Transactional(readOnly = true)
    public Compte lire(Long id) {
        return Compte.de(trouver(id));
    }

    @Transactional(readOnly = true)
    public List<DefinitionRole> definitionsDesRoles() {
        return roles.findAll().stream()
                .sorted(Comparator.comparing(Role::getId))
                .map(role -> new DefinitionRole(role.getNom().replaceFirst("^ROLE_", ""), role.getDescription(),
                        role.getPermissions().stream().map(com.clubinfo.ist.user.entity.Permission::getCode).sorted().toList()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Permission> listeDesPermissions() {
        return permissions.findAll().stream()
                .sorted(Comparator.comparing(com.clubinfo.ist.user.entity.Permission::getCode))
                .map(permission -> new Permission(permission.getCode(), permission.getLibelle()))
                .toList();
    }

    // ---------------------------------------------------------------- Écriture

    @Transactional
    public Compte modifierIdentite(Long id, CompteMiseAJour saisie) {
        Utilisateur compte = trouver(id);
        compte.setNom(saisie.nom().trim());
        compte.setPrenom(saisie.prenom().trim());
        compte.setFiliere(saisie.filiere() == null || saisie.filiere().isBlank() ? null : saisie.filiere().trim());
        journal.enregistrer("COMPTE_MODIFIE", "Identité modifiée : " + compte.getEmail(), Resultat.SUCCES);
        return Compte.de(compte);
    }

    @Transactional
    public Compte attribuerRoles(Long id, Set<RoleDuCompte> demandes, UserDetailsImpl acteur) {
        Utilisateur compte = trouver(id);
        if (compte.getId().equals(acteur.getId())) {
            throw new BusinessException("Vous ne pouvez pas modifier vos propres rôles.", HttpStatus.FORBIDDEN, "PROPRES_ROLES");
        }
        int rangDeLActeur = rangDe(acteur);
        boolean tropHaut = RoleDuCompte.rangLePlusEleve(compte.getRoles()) > rangDeLActeur
                || demandes.stream().anyMatch(role -> role.rang() > rangDeLActeur);
        if (tropHaut) {
            journal.enregistrer("ROLES_REFUSES", "Élévation refusée sur " + compte.getEmail(), Resultat.ECHEC);
            throw new BusinessException("Vous ne pouvez ni accorder un rôle supérieur au vôtre, ni modifier un compte d'un rang supérieur.",
                    HttpStatus.FORBIDDEN, "ELEVATION_REFUSEE");
        }
        if (estSuperAdminReel(compte) && !demandes.contains(RoleDuCompte.SUPER_ADMIN)) {
            exigerUnAutreSuperAdmin();
        }
        Set<Role> attribues = new HashSet<>();
        for (RoleDuCompte role : demandes) {
            attribues.add(roles.findByNom(role.nomTechnique()).orElseThrow(() -> new IllegalStateException("Rôle absent de la base : " + role)));
        }
        compte.setRoles(attribues);
        utilisateurs.saveAndFlush(compte);
        // Les droits ont changé : les jetons déjà émis portent les anciens.
        sessions.fermerToutes(compte);
        journal.enregistrer("ROLES_MODIFIES", compte.getEmail() + " : " + demandes.stream().map(Enum::name).sorted().toList(), Resultat.SUCCES);
        return Compte.de(trouver(id));
    }

    @Transactional
    public Compte changerStatut(Long id, StatutUtilisateur statut, UserDetailsImpl acteur) {
        if (statut == StatutUtilisateur.EN_ATTENTE_ACTIVATION) {
            throw new BusinessException("Ce statut ne se choisit pas : il résulte d'une inscription ou d'une invitation.", HttpStatus.BAD_REQUEST, "STATUT_REFUSE");
        }
        Utilisateur compte = trouver(id);
        if (compte.getId().equals(acteur.getId())) {
            throw new BusinessException("Vous ne pouvez pas modifier le statut de votre propre compte.", HttpStatus.FORBIDDEN, "PROPRE_COMPTE");
        }
        if (RoleDuCompte.rangLePlusEleve(compte.getRoles()) > rangDe(acteur)) {
            throw new BusinessException("Vous ne pouvez pas modifier un compte d'un rang supérieur au vôtre.", HttpStatus.FORBIDDEN, "ELEVATION_REFUSEE");
        }
        if (statut != StatutUtilisateur.ACTIF && estSuperAdminReel(compte)) {
            exigerUnAutreSuperAdmin();
        }
        compte.setStatut(statut);
        utilisateurs.saveAndFlush(compte);
        if (statut != StatutUtilisateur.ACTIF) {
            sessions.fermerToutes(compte);
        }
        journal.enregistrer("STATUT_MODIFIE", compte.getEmail() + " : " + statut, Resultat.SUCCES);
        return Compte.de(trouver(id));
    }

    @Transactional
    public void deverrouiller(Long id) {
        Utilisateur compte = trouver(id);
        compte.reinitialiserTentativesConnexion();
        journal.enregistrer("COMPTE_DEVERROUILLE", compte.getEmail(), Resultat.SUCCES);
    }

    /** Crée le compte sans mot de passe ; la personne le choisit par le lien reçu, ce qui vérifie aussi son adresse. */
    @Transactional
    public void inviter(Invitation invitation, UserDetailsImpl acteur) {
        if (invitation.role().rang() > rangDe(acteur)) {
            throw new BusinessException("Vous ne pouvez pas inviter à un rôle supérieur au vôtre.", HttpStatus.FORBIDDEN, "ELEVATION_REFUSEE");
        }
        String email = invitation.email().trim().toLowerCase(Locale.ROOT);
        if (utilisateurs.existsByEmail(email)) {
            throw new BusinessException("Un compte existe déjà pour cette adresse.", HttpStatus.CONFLICT, "ADRESSE_DEJA_UTILISEE");
        }
        Set<RoleDuCompte> attribues = new HashSet<>(Set.of(invitation.role()));
        if (MEMBRES_DU_CLUB.contains(invitation.role())) {
            attribues.add(RoleDuCompte.MEMBRE);
        }
        if (invitation.role() == RoleDuCompte.SUPER_ADMIN) {
            attribues.add(RoleDuCompte.ADMIN);
        }
        Set<Role> rolesDuCompte = new HashSet<>();
        for (RoleDuCompte role : attribues) {
            rolesDuCompte.add(roles.findByNom(role.nomTechnique()).orElseThrow(() -> new IllegalStateException("Rôle absent de la base : " + role)));
        }
        Utilisateur invite = utilisateurs.save(Utilisateur.builder()
                .nom(invitation.nom().trim())
                .prenom(invitation.prenom().trim())
                .email(email)
                .motDePasse("!")
                .statut(StatutUtilisateur.EN_ATTENTE_ACTIVATION)
                .numeroMembre(attribues.contains(RoleDuCompte.MEMBRE) ? "IST-%d-%04d".formatted(LocalDate.now().getYear(), utilisateurs.prochainNumeroDeMembre()) : null)
                .dateAdhesion(LocalDate.now())
                .roles(rolesDuCompte)
                .build());
        String jeton = jetons.emettre(invite, JetonUsageUnique.Type.INVITATION, VALIDITE_INVITATION);
        courriels.invitation(invite, jeton, VALIDITE_INVITATION.toHours());
        journal.enregistrer("INVITATION", email + " : " + invitation.role(), Resultat.SUCCES);
    }

    // ---------------------------------------------------------------- Règles communes

    private static int rangDe(UserDetailsImpl acteur) {
        return acteur.getAuthorities().stream()
                .map(droit -> RoleDuCompte.de(droit.getAuthority()))
                .flatMap(java.util.Optional::stream)
                .mapToInt(RoleDuCompte::rang).max().orElse(0);
    }

    private static boolean estSuperAdminReel(Utilisateur compte) {
        return !Boolean.TRUE.equals(compte.getTest())
                && compte.getRoles().stream().anyMatch(role -> RoleDuCompte.SUPER_ADMIN.nomTechnique().equals(role.getNom()));
    }

    private void exigerUnAutreSuperAdmin() {
        if (utilisateurs.compterReelsAvecRole(RoleDuCompte.SUPER_ADMIN.nomTechnique()) <= 1) {
            throw new BusinessException("Ce compte est le dernier Super Admin : désignez-en un autre d'abord.", HttpStatus.CONFLICT, "DERNIER_SUPER_ADMIN");
        }
    }

    private Utilisateur trouver(Long id) {
        return utilisateurs.findByIdAndDeletedAtIsNull(id).orElseThrow(() -> new BusinessException("Compte introuvable.", HttpStatus.NOT_FOUND));
    }
}
