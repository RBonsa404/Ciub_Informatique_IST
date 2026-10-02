package com.clubinfo.ist.common.amorcage;

import com.clubinfo.ist.common.journal.JournalService;
import com.clubinfo.ist.user.entity.Role;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.RoleRepository;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Premier Super Admin réel. Créé une seule fois, à partir de l'adresse et du mot de passe initial fournis
 * par l'environnement, tant qu'aucun Super Admin réel n'existe. Le mot de passe initial doit être changé
 * à la première connexion.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SuperAdminAmorcage {

    static final int LONGUEUR_MINIMALE = 12;
    private static final String ROLE_SUPER_ADMIN = "ROLE_SUPER_ADMIN";
    private static final String ROLE_ADMIN = "ROLE_ADMIN";

    private final UtilisateurRepository utilisateurs;
    private final RoleRepository roles;
    private final PasswordEncoder passwordEncoder;
    private final JournalService journal;

    /** @return vrai si un compte vient d'être créé. */
    @Transactional
    public boolean amorcer(String adresse, String motDePasseInitial) {
        if (utilisateurs.existeReelAvecRole(ROLE_SUPER_ADMIN)) {
            return false;
        }
        if (adresse == null || adresse.isBlank() || motDePasseInitial == null || motDePasseInitial.isBlank()) {
            log.warn("Aucun Super Admin réel : renseignez APP_BOOTSTRAP_ADMIN_EMAIL et APP_BOOTSTRAP_ADMIN_PASSWORD pour en créer un au démarrage.");
            return false;
        }
        if (motDePasseInitial.length() < LONGUEUR_MINIMALE) {
            log.error("Super Admin non créé : le mot de passe initial doit compter au moins {} caractères.", LONGUEUR_MINIMALE);
            return false;
        }
        String email = adresse.trim().toLowerCase(Locale.ROOT);
        if (utilisateurs.existsByEmail(email)) {
            log.error("Super Admin non créé : l'adresse fournie appartient déjà à un compte.");
            return false;
        }

        Set<Role> attribues = new HashSet<>();
        attribues.add(role(ROLE_SUPER_ADMIN));
        attribues.add(role(ROLE_ADMIN));
        utilisateurs.save(Utilisateur.builder()
                .nom("Club Informatique")
                .prenom("Administration")
                .email(email)
                .motDePasse(passwordEncoder.encode(motDePasseInitial))
                .dateAdhesion(LocalDate.now())
                .statut(StatutUtilisateur.ACTIF)
                .changementMotDePasseRequis(true)
                .roles(attribues)
                .build());
        journal.enregistrer("AMORCAGE_SUPER_ADMIN", "Premier Super Admin créé au démarrage", email, JournalService.Resultat.SUCCES);
        log.info("Premier Super Admin créé ; le mot de passe initial devra être changé à la première connexion.");
        return true;
    }

    private Role role(String nom) {
        return roles.findByNom(nom).orElseThrow(() -> new IllegalStateException("Rôle absent de la base : " + nom));
    }
}
