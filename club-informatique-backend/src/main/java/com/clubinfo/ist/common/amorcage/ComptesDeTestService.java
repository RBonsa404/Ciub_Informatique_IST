package com.clubinfo.ist.common.amorcage;

import com.clubinfo.ist.common.journal.JournalService;
import com.clubinfo.ist.fichier.FichierService;
import com.clubinfo.ist.user.entity.Role;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.RoleRepository;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Comptes de test, marqués {@code test = true}, sur le domaine réservé « .invalid » (aucun courriel ne peut leur parvenir) :
 * un compte par rôle au nom des membres du bureau, et des comptes d'essai de simple membre à confier à des étudiants.
 * Les deux groupes ont des mots de passe distincts. Ils se retirent en une opération, avec tout ce qu'ils ont produit.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ComptesDeTestService {

    static final String DOMAINE = "recette.invalid";

    private record Modele(String prenom, String nom, String adresse, List<String> roles) {

        Modele(String prenom, String nom, List<String> roles) {
            this(prenom, nom, versAdresse(prenom) + "." + versAdresse(nom) + "@" + DOMAINE, roles);
        }

        private static String versAdresse(String texte) {
            return Normalizer.normalize(texte, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                    .toLowerCase(Locale.ROOT).trim().replaceAll("\\s+", "-");
        }
    }

    /** Membres du bureau : un compte par rôle. */
    static final List<Modele> BUREAU = List.of(
            new Modele("Abdoul Rachid", "Bonsa", List.of("ROLE_ADMIN", "ROLE_SUPER_ADMIN")),
            new Modele("Prince", "Pamousso", List.of("ROLE_ADMIN")),
            new Modele("Ramatou", "Sidibé", List.of("ROLE_MEMBRE", "ROLE_RESPONSABLE_CLUB")),
            new Modele("Arnaud", "Ouare", List.of("ROLE_MEMBRE", "ROLE_FORMATEUR")),
            new Modele("Tony Darel", "Zongo", List.of("ROLE_DSI")),
            new Modele("Christ Orient", "Salou", List.of("ROLE_MEMBRE")));

    /** Comptes d'essai : simples membres, à confier aux étudiants invités à essayer la plateforme. */
    static final List<Modele> ESSAIS = List.of(
            new Modele("Compte", "Essai 1", "essai1@" + DOMAINE, List.of("ROLE_MEMBRE")),
            new Modele("Compte", "Essai 2", "essai2@" + DOMAINE, List.of("ROLE_MEMBRE")),
            new Modele("Compte", "Essai 3", "essai3@" + DOMAINE, List.of("ROLE_MEMBRE")),
            new Modele("Compte", "Essai 4", "essai4@" + DOMAINE, List.of("ROLE_MEMBRE")));

    /** Contenus sans propriétaire obligatoire : la suppression du compte ne les emporterait pas. */
    private static final List<String> CONTENUS_RATTACHES = List.of(
            "DELETE FROM ressource WHERE auteur_id IN (SELECT id FROM utilisateur WHERE test)",
            "DELETE FROM actualite WHERE auteur_id IN (SELECT id FROM utilisateur WHERE test)",
            "DELETE FROM evenement WHERE organisateur_id IN (SELECT id FROM utilisateur WHERE test)",
            "DELETE FROM formation WHERE formateur_id IN (SELECT id FROM utilisateur WHERE test)");

    private final UtilisateurRepository utilisateurs;
    private final RoleRepository roles;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbc;
    private final JournalService journal;
    private final FichierService fichiers;

    /** Crée les comptes du bureau manquants. @return le nombre de comptes créés. */
    @Transactional
    public int creer(String motDePasse) {
        return creer(BUREAU, motDePasse, "APP_TEST_ACCOUNTS_PASSWORD");
    }

    /** Crée les comptes d'essai manquants. @return le nombre de comptes créés. */
    @Transactional
    public int creerEssais(String motDePasse) {
        return creer(ESSAIS, motDePasse, "APP_TRIAL_ACCOUNTS_PASSWORD");
    }

    private int creer(List<Modele> modeles, String motDePasse, String variable) {
        if (motDePasse == null || motDePasse.length() < SuperAdminAmorcage.LONGUEUR_MINIMALE) {
            throw new IllegalArgumentException("Le mot de passe des comptes de test doit compter au moins "
                    + SuperAdminAmorcage.LONGUEUR_MINIMALE + " caractères (" + variable + ").");
        }
        String empreinte = passwordEncoder.encode(motDePasse);
        int crees = 0;
        for (Modele modele : modeles) {
            if (utilisateurs.existsByEmail(modele.adresse())) {
                continue;
            }
            Set<Role> attribues = new HashSet<>();
            for (String nom : modele.roles()) {
                attribues.add(roles.findByNom(nom).orElseThrow(() -> new IllegalStateException("Rôle absent de la base : " + nom)));
            }
            utilisateurs.save(Utilisateur.builder()
                    .prenom(modele.prenom())
                    .nom(modele.nom())
                    .email(modele.adresse())
                    .motDePasse(empreinte)
                    .dateAdhesion(LocalDate.now())
                    .statut(StatutUtilisateur.ACTIF)
                    .test(true)
                    .roles(attribues)
                    .build());
            crees++;
        }
        if (crees > 0) {
            journal.enregistrer("CREATION_COMPTES_DE_TEST", crees + " compte(s) de test créé(s)", JournalService.Resultat.SUCCES);
            log.warn("{} compte(s) de test créé(s) sur le domaine {} ; à retirer à la fin des essais.", crees, DOMAINE);
        }
        return crees;
    }

    /** Retire les comptes de test et tout ce qui leur est rattaché. @return le nombre de comptes retirés. */
    @Transactional
    public int purger() {
        fichiers.supprimerDepotsDesComptesDeTest();
        CONTENUS_RATTACHES.forEach(jdbc::update);
        int retires = jdbc.update("DELETE FROM utilisateur WHERE test");
        journal.enregistrer("PURGE_COMPTES_DE_TEST", retires + " compte(s) de test retiré(s) avec leurs données", JournalService.Resultat.SUCCES);
        log.info("{} compte(s) de test retiré(s).", retires);
        return retires;
    }
}
