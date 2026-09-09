package com.example.api.config;

import com.example.api.model.Permission;
import com.example.api.model.ProfilMembre;
import com.example.api.model.Role;
import com.example.api.model.Utilisateur;
import com.example.api.repository.PermissionRepository;
import com.example.api.repository.RoleRepository;
import com.example.api.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("--- Initialisation des données de référence (RBAC Club Informatique) ---");

        // 1. Initialiser les permissions
        Map<String, Permission> permMap = initPermissions();

        // 2. Initialiser les 7 rôles
        Map<String, Role> roleMap = initRoles(permMap);

        // 3. Initialiser les comptes par défaut pour tester immédiatement
        initDefaultAccounts(roleMap);

        log.info("--- Initialisation RBAC terminée avec succès ! ---");
    }

    private Map<String, Permission> initPermissions() {
        Map<String, String> perms = Map.of(
                "USER_READ", "Consulter la liste et détails des utilisateurs",
                "USER_WRITE", "Créer ou modifier des utilisateurs",
                "USER_DELETE", "Supprimer des utilisateurs",
                "ROLE_MANAGE", "Gérer et attribuer les rôles et permissions",
                "EVENT_MANAGE", "Créer et gérer les événements du club",
                "FORMATION_MANAGE", "Créer et gérer les formations et présences",
                "PROJECT_MANAGE", "Valider et administrer les projets étudiants",
                "NEWS_MANAGE", "Publier et gérer les actualités du club",
                "SYSTEM_SUPERVISE", "Superviser la conformité et la sécurité (DSI)"
        );

        Map<String, Permission> resultMap = new HashMap<>();
        for (Map.Entry<String, String> entry : perms.entrySet()) {
            Permission p = permissionRepository.findByCode(entry.getKey())
                    .orElseGet(() -> permissionRepository.save(
                            Permission.builder().code(entry.getKey()).libelle(entry.getValue()).build()
                    ));
            resultMap.put(entry.getKey(), p);
        }
        return resultMap;
    }

    private Map<String, Role> initRoles(Map<String, Permission> perms) {
        Map<String, String> roleDefs = Map.of(
                "ROLE_VISITEUR", "Visiteur non authentifié (accès public uniquement)",
                "ROLE_MEMBRE", "Membre / Étudiant adhérent au Club Informatique",
                "ROLE_FORMATEUR", "Formateur / Responsable d'activité et d'ateliers",
                "ROLE_RESPONSABLE_CLUB", "Membre du bureau dirigeant du club",
                "ROLE_ADMINISTRATEUR", "Administrateur métier et gestionnaire de contenu",
                "ROLE_SUPER_ADMIN", "Super Administrateur de la plateforme web",
                "ROLE_DSI", "Direction des Systèmes d'Information (supervision)"
        );

        Map<String, Role> resultMap = new HashMap<>();
        for (Map.Entry<String, String> entry : roleDefs.entrySet()) {
            String roleName = entry.getKey();
            String desc = entry.getValue();

            Role role = roleRepository.findByNom(roleName).orElse(null);
            if (role == null) {
                role = Role.builder()
                        .nom(roleName)
                        .description(desc)
                        .permissions(new HashSet<>())
                        .build();
            }

            // Affectation des permissions selon la matrice
            Set<Permission> pSet = new HashSet<>();
            switch (roleName) {
                case "ROLE_SUPER_ADMIN" -> pSet.addAll(perms.values());
                case "ROLE_ADMINISTRATEUR" -> {
                    pSet.add(perms.get("USER_READ"));
                    pSet.add(perms.get("USER_WRITE"));
                    pSet.add(perms.get("EVENT_MANAGE"));
                    pSet.add(perms.get("FORMATION_MANAGE"));
                    pSet.add(perms.get("PROJECT_MANAGE"));
                    pSet.add(perms.get("NEWS_MANAGE"));
                }
                case "ROLE_RESPONSABLE_CLUB" -> {
                    pSet.add(perms.get("EVENT_MANAGE"));
                    pSet.add(perms.get("PROJECT_MANAGE"));
                    pSet.add(perms.get("NEWS_MANAGE"));
                }
                case "ROLE_FORMATEUR" -> pSet.add(perms.get("FORMATION_MANAGE"));
                case "ROLE_DSI" -> {
                    pSet.add(perms.get("USER_READ"));
                    pSet.add(perms.get("SYSTEM_SUPERVISE"));
                }
            }
            role.setPermissions(pSet);
            resultMap.put(roleName, roleRepository.save(role));
        }

        return resultMap;
    }

    private void initDefaultAccounts(Map<String, Role> roleMap) {
        // Super Administrateur
        if (!utilisateurRepository.existsByEmail("admin@clubinfo.com")) {
            Utilisateur admin = Utilisateur.builder()
                    .nom("PAMOUSSO")
                    .prenom("Prince")
                    .email("admin@clubinfo.com")
                    .motDePasse(passwordEncoder.encode("Admin123!"))
                    .dateCreation(LocalDateTime.now())
                    .statut("ACTIF")
                    .roles(new HashSet<>(Arrays.asList(roleMap.get("ROLE_SUPER_ADMIN"), roleMap.get("ROLE_ADMINISTRATEUR"))))
                    .build();
            utilisateurRepository.save(admin);
            log.info(">>> Compte SuperAdmin créé : admin@clubinfo.com / Admin123!");
        }

        // Compte DSI
        if (!utilisateurRepository.existsByEmail("dsi@clubinfo.com")) {
            Utilisateur dsi = Utilisateur.builder()
                    .nom("Direction")
                    .prenom("DSI")
                    .email("dsi@clubinfo.com")
                    .motDePasse(passwordEncoder.encode("Dsi123!"))
                    .dateCreation(LocalDateTime.now())
                    .statut("ACTIF")
                    .roles(new HashSet<>(Collections.singletonList(roleMap.get("ROLE_DSI"))))
                    .build();
            utilisateurRepository.save(dsi);
            log.info(">>> Compte DSI créé : dsi@clubinfo.com / Dsi123!");
        }

        // Compte Membre Étudiant Test
        if (!utilisateurRepository.existsByEmail("membre@clubinfo.com")) {
            Utilisateur membre = Utilisateur.builder()
                    .nom("Ouédraogo")
                    .prenom("Aline")
                    .email("membre@clubinfo.com")
                    .motDePasse(passwordEncoder.encode("Membre123!"))
                    .dateCreation(LocalDateTime.now())
                    .statut("ACTIF")
                    .roles(new HashSet<>(Collections.singletonList(roleMap.get("ROLE_MEMBRE"))))
                    .build();

            ProfilMembre profil = ProfilMembre.builder()
                    .numeroMembre("CI-2026-0001")
                    .dateNaissance(LocalDate.of(2003, 5, 14))
                    .filiere("Génie Logiciel")
                    .anneeEtude("Licence 3")
                    .dateAdhesion(LocalDate.now())
                    .biographie("Passionnée de développement web et d'intelligence artificielle.")
                    .utilisateur(membre)
                    .build();

            membre.setProfilMembre(profil);
            utilisateurRepository.save(membre);
            log.info(">>> Compte Membre créé : membre@clubinfo.com / Membre123!");
        }
    }
}
