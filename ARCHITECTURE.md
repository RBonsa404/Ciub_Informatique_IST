# Architecture — Application Web Club Informatique

## Vue d'ensemble (C4 Niveau 1)

```
[Navigateur] <──HTTPS──> [Nginx Reverse Proxy]
                              │
                    ┌─────────┴─────────┐
                    │                   │
              [Angular SPA]      [Spring Boot API]
               :4200 / :80          :8080
                                       │
                              [PostgreSQL :5432]
```

## Stack Technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend | Angular | 18.x (dernière stable) |
| Backend | Spring Boot | 4.1.1 |
| Langage Backend | Java | 17 |
| Build Backend | Maven | 3.9+ |
| Base de données | PostgreSQL | 16 |
| Migrations DB | Flyway | inclus Spring Boot |
| Sécurité | Spring Security + JWT | inclus Spring Boot |
| 2FA | TOTP (dev.samstevens.totp) | 1.5.1 |
| Mapping DTO | MapStruct | 1.5.5 |
| Documentation API | springdoc-openapi | 2.x |
| Reverse Proxy | Nginx | 1.25-alpine |
| Conteneurs | Docker + Docker Compose | 24+ |

## Architecture Backend (couches strictes)

```
com.clubinfo/
├── ClubInfoApplication.java
├── config/
│   ├── SecurityConfig.java          ← Spring Security + JWT filter chain
│   ├── JwtConfig.java               ← Paramètres JWT (expiry, secret)
│   ├── CorsConfig.java              ← Configuration CORS
│   └── OpenApiConfig.java           ← Swagger/OpenAPI 3.0
├── controller/
│   ├── AuthController.java
│   ├── UtilisateurController.java
│   ├── ActualiteController.java
│   ├── EvenementController.java
│   ├── FormationController.java
│   ├── SessionFormationController.java
│   ├── DevoirController.java
│   ├── ProjetController.java
│   ├── RessourceController.java
│   ├── NotificationController.java
│   ├── ContactController.java
│   ├── CategorieController.java
│   ├── RoleController.java
│   ├── InscriptionController.java
│   └── AdminController.java
├── service/
│   ├── AuthService.java
│   ├── UtilisateurService.java
│   ├── ActualiteService.java
│   ├── EvenementService.java
│   ├── FormationService.java
│   ├── SessionFormationService.java
│   ├── DevoirService.java
│   ├── ProjetService.java
│   ├── RessourceService.java
│   ├── NotificationService.java
│   ├── ContactService.java
│   ├── CategorieService.java
│   ├── RoleService.java
│   ├── InscriptionService.java
│   ├── PresenceService.java
│   ├── StatistiquesService.java
│   └── TotpService.java
├── repository/
│   ├── UtilisateurRepository.java
│   ├── MembreRepository.java
│   ├── ActualiteRepository.java
│   ├── EvenementRepository.java
│   ├── FormationRepository.java
│   ├── SessionFormationRepository.java
│   ├── DevoirRepository.java
│   ├── ProjetRepository.java
│   ├── RessourceRepository.java
│   ├── NotificationRepository.java
│   ├── MessageContactRepository.java
│   ├── CategorieRepository.java
│   ├── RoleRepository.java
│   ├── PermissionRepository.java
│   ├── InscriptionRepository.java
│   └── PresenceRepository.java
├── entity/
│   ├── Utilisateur.java             ← @MappedSuperclass abstract
│   ├── Membre.java
│   ├── Formateur.java
│   ├── ResponsableClub.java
│   ├── Administrateur.java
│   ├── SuperAdmin.java
│   ├── DSI.java
│   ├── Role.java
│   ├── Permission.java
│   ├── Categorie.java
│   ├── Actualite.java
│   ├── Evenement.java
│   ├── Formation.java
│   ├── SessionFormation.java
│   ├── Devoir.java
│   ├── Ressource.java
│   ├── Projet.java
│   ├── Notification.java
│   ├── Inscription.java
│   ├── Presence.java
│   └── MessageContact.java
├── dto/
│   ├── request/                     ← DTOs d'entrée (validation Bean Validation)
│   └── response/                    ← DTOs de sortie (pas d'entités exposées)
├── mapper/                          ← MapStruct mappers (interface annotée)
├── security/
│   ├── JwtTokenProvider.java
│   ├── JwtAuthenticationFilter.java
│   └── UserDetailsServiceImpl.java
└── exception/
    ├── GlobalExceptionHandler.java  ← @RestControllerAdvice
    ├── ResourceNotFoundException.java
    ├── EmailAlreadyExistsException.java
    ├── InscriptionConflictException.java
    └── SessionCompleteException.java
```

## Architecture Frontend (feature-based)

```
src/app/
├── core/
│   ├── auth/
│   │   ├── auth.service.ts
│   │   └── auth.state.ts
│   ├── interceptors/
│   │   ├── jwt.interceptor.ts
│   │   └── error.interceptor.ts
│   └── guards/
│       ├── auth.guard.ts
│       └── role.guard.ts
├── shared/
│   ├── components/
│   │   ├── navbar/
│   │   ├── footer/
│   │   ├── card/
│   │   ├── button/
│   │   ├── badge/
│   │   ├── modal/
│   │   ├── spinner/
│   │   ├── alert/
│   │   └── pagination/
│   ├── pipes/
│   └── models/                      ← Interfaces TypeScript (domain models)
└── features/
    ├── home/
    ├── about/
    ├── auth/                        ← login, register, reset-password
    ├── actualites/
    ├── evenements/
    ├── formations/
    ├── projets/
    ├── ressources/
    ├── contact/
    ├── profil/                      ← profil, mes-données RGPD
    ├── notifications/
    ├── formateur/                   ← dashboard formateur
    ├── responsable/                 ← dashboard responsable club
    └── admin/                       ← dashboard administrateur
```

## Modèle de Données

### Stratégie d'héritage JPA
- `Utilisateur` : `@MappedSuperclass` (table de base `utilisateurs`)
- Sous-classes concrètes : `TABLE_PER_CLASS` → chaque rôle a sa propre table complète
- Avantage : requêtes simples sans JOIN complexes

### Tables principales
| Table | Clé primaire | Notes |
|-------|-------------|-------|
| utilisateurs | id (BIGSERIAL) | table de base avec discriminant dtype |
| membres | id (FK utilisateurs) | |
| formateurs | id (FK utilisateurs) | |
| responsables_club | id (FK utilisateurs) | |
| administrateurs | id (FK utilisateurs) | |
| super_admins | id (FK utilisateurs) | |
| dsi | id (FK utilisateurs) | |
| roles | id | |
| permissions | id | |
| utilisateurs_roles | utilisateur_id, role_id | M:N |
| roles_permissions | role_id, permission_id | M:N |
| categories | id | |
| actualites | id, auteur_id (FK utilisateurs) | |
| evenements | id, organisateur_id (FK utilisateurs) | |
| formations | id, formateur_id (FK utilisateurs) | |
| sessions_formation | id, formation_id | |
| devoirs | id, formation_id | |
| ressources | id, formation_id (nullable) | |
| projets | id, soumetteur_id, encadrant_id | |
| inscriptions | id, utilisateur_id, evenement_id?, session_id? | |
| presences | id, inscription_id, session_id | |
| notifications | id, destinataire_id | |
| messages_contact | id | |

## Endpoints REST — Résumé

Voir [Implementation Plan](../brain/implementation_plan.md) pour la liste complète.
Base URL : `/api/v1`

## Sécurité

- JWT access token (15 min) + refresh token (7 jours) en HttpOnly cookie
- 2FA TOTP obligatoire pour ADMINISTRATEUR, SUPERADMIN, DSI
- RBAC vérifié via `@PreAuthorize` sur chaque endpoint
- BCrypt coût 12 pour les mots de passe
- Journalisation des connexions (succès/échec) dans la table `audit_logs`
- Headers de sécurité via Spring Security defaults + CORS strict

## Performance

- Pagination serveur sur toutes les listes (`Page<T>`, paramètres `page` et `size`)
- Index sur les colonnes fréquemment filtrées (email, statut, datePublication)
- ETag et Cache-Control sur les endpoints lecture publique
