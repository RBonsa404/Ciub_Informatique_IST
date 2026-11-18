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
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Comptes réels du club, attachés aux fonctions (adresses @informatique.ist-club.bf) : bureau et équipe DSI (le DSI et ses deux assistants, dont la fonction affichée est « DSI »).
 * Créés au démarrage s'ils n'existent pas encore, avec un mot de passe provisoire fourni par l'environnement
 * (APP_INITIAL_ACCOUNTS_PASSWORD), à changer obligatoirement à la première connexion. Un compte existant n'est
 * jamais modifié : la liste ne sert qu'à la première mise en place.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ComptesDuClubService {

    static final String DOMAINE = "informatique.ist-club.bf";

    private record Compte(String identifiant, String prenom, String nom, String fonction, List<String> roles) {
        String adresse() {
            return identifiant + "@" + DOMAINE;
        }
    }

    /** Membres du bureau : responsables du club et formateurs. */
    private static final List<String> BUREAU = List.of("ROLE_MEMBRE", "ROLE_RESPONSABLE_CLUB", "ROLE_FORMATEUR");

    private static final List<Compte> COMPTES = List.of(
            new Compte("president", "Abdoul Rachid", "BONSA", "Président",
                    List.of("ROLE_MEMBRE", "ROLE_FORMATEUR", "ROLE_RESPONSABLE_CLUB", "ROLE_DSI", "ROLE_ADMIN", "ROLE_SUPER_ADMIN")),
            new Compte("vice-president", "Prince Henri Junior", "PAMOUSSO", "Vice-président",
                    List.of("ROLE_MEMBRE", "ROLE_RESPONSABLE_CLUB", "ROLE_ADMIN")),
            new Compte("secretariat", "Hannifah", "OUEDRAOGO", "Secrétaire générale", BUREAU),
            new Compte("tresorerie", "Fode Sandrine", "KI", "Responsable trésorerie", BUREAU),
            new Compte("formation", "Giles Christ-Orient", "SALOU", "Responsable formation", BUREAU),
            new Compte("projets", "Tony Darel", "ZONGO", "Responsable projets", BUREAU),
            new Compte("communication", "Davy Arnaud", "OUARE", "Responsable communication", BUREAU),
            new Compte("partenariats", "Ramatou", "SIDIBE", "Responsable des relations extérieures", BUREAU),
            new Compte("dsi", "Soumaïla", "SANKARA", "DSI", List.of("ROLE_DSI")),
            new Compte("sawadogof", "Francis", "SAWADOGO", "DSI", List.of("ROLE_DSI")),
            new Compte("sawadogom", "Moses Wilfried", "SAWADOGO", "DSI", List.of("ROLE_DSI")));

    private final UtilisateurRepository utilisateurs;
    private final RoleRepository roles;
    private final PasswordEncoder passwordEncoder;
    private final JournalService journal;

    /** Crée les comptes du club manquants. @return le nombre de comptes créés. */
    @Transactional
    public int creer(String motDePasseProvisoire) {
        if (motDePasseProvisoire == null || motDePasseProvisoire.length() < SuperAdminAmorcage.LONGUEUR_MINIMALE) {
            throw new IllegalArgumentException("le mot de passe provisoire doit compter au moins "
                    + SuperAdminAmorcage.LONGUEUR_MINIMALE + " caractères (APP_INITIAL_ACCOUNTS_PASSWORD).");
        }
        String empreinte = passwordEncoder.encode(motDePasseProvisoire);
        int crees = 0;
        for (Compte compte : COMPTES) {
            if (utilisateurs.existsByEmail(compte.adresse())) {
                continue;
            }
            Set<Role> attribues = new HashSet<>();
            for (String nom : compte.roles()) {
                attribues.add(roles.findByNom(nom).orElseThrow(() -> new IllegalStateException("Rôle absent de la base : " + nom)));
            }
            utilisateurs.save(Utilisateur.builder()
                    .prenom(compte.prenom())
                    .nom(compte.nom())
                    .email(compte.adresse())
                    .fonction(compte.fonction())
                    .motDePasse(empreinte)
                    .dateAdhesion(LocalDate.now())
                    .statut(StatutUtilisateur.ACTIF)
                    .emailVerifieLe(LocalDateTime.now())
                    .changementMotDePasseRequis(true)
                    .roles(attribues)
                    .build());
            crees++;
        }
        if (crees > 0) {
            journal.enregistrer("CREATION_COMPTES_DU_CLUB", crees + " compte(s) du club créé(s), mot de passe provisoire à changer",
                    JournalService.Resultat.SUCCES);
            log.info("{} compte(s) du club créé(s) ; mot de passe à changer à la première connexion.", crees);
        }
        return crees;
    }
}
