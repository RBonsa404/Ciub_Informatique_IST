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

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Comptes de test : un par rôle, marqués {@code test = true}, sur le domaine réservé « .invalid »
 * (aucun courriel ne peut leur parvenir). Ils servent aux essais et se retirent en une opération,
 * avec tout ce qu'ils ont produit.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ComptesDeTestService {

    static final String DOMAINE = "recette.invalid";

    private record Modele(String prenom, String nom, String filiere, List<String> roles) {
        String adresse() {
            return (prenom + "." + nom).toLowerCase()
                    .replace("é", "e").replace("è", "e").replace("ï", "i").replace(" ", "") + "@" + DOMAINE;
        }
    }

    private static final List<Modele> MODELES = List.of(
            new Modele("Aminata", "Sawadogo", "Génie logiciel", List.of("ROLE_MEMBRE")),
            new Modele("Issouf", "Ouédraogo", "Réseaux et télécommunications", List.of("ROLE_MEMBRE", "ROLE_FORMATEUR")),
            new Modele("Rasmata", "Kaboré", "Génie logiciel", List.of("ROLE_MEMBRE", "ROLE_RESPONSABLE_CLUB")),
            new Modele("Boukary", "Zongo", "Systèmes d'information", List.of("ROLE_ADMIN")),
            new Modele("Salimata", "Compaoré", "Systèmes d'information", List.of("ROLE_ADMIN", "ROLE_SUPER_ADMIN")),
            new Modele("Adama", "Traoré", "Réseaux et télécommunications", List.of("ROLE_DSI")));

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

    /** Crée les comptes manquants. @return le nombre de comptes créés. */
    @Transactional
    public int creer(String motDePasse) {
        if (motDePasse == null || motDePasse.length() < SuperAdminAmorcage.LONGUEUR_MINIMALE) {
            throw new IllegalArgumentException("Le mot de passe des comptes de test doit compter au moins "
                    + SuperAdminAmorcage.LONGUEUR_MINIMALE + " caractères (APP_TEST_ACCOUNTS_PASSWORD).");
        }
        String empreinte = passwordEncoder.encode(motDePasse);
        int crees = 0;
        for (Modele modele : MODELES) {
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
                    .filiere(modele.filiere())
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
