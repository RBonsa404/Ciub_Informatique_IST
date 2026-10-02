# Audit du backend existant

Date : 1er octobre 2026. Périmètre : `club-informatique-backend` à la révision `a7eba0c` de `main`. Les numéros de ligne renvoient à cette révision. Chemin de base du code : `src/main/java/com/clubinfo/ist/`.

## Synthèse

Le backend compile, démarre sur une architecture en couches cohérente (contrôleur, service, dépôt, DTO, mappage MapStruct) et couvre correctement le cœur des opérations de lecture et d'écriture des contenus. Il n'est cependant pas exploitable en l'état :

- quatre fonctions sont simulées (réinitialisation de mot de passe, configuration système, sauvegarde, tableau de conformité) ;
- aucun courriel n'est envoyé et aucun fichier ne peut être téléversé ;
- les autorisations reposent sur le seul rôle, sans contrôle de propriété, et plusieurs lectures publiques exposent des contenus non publiés ;
- un compte Super Admin dont le mot de passe figure en clair dans le dépôt public est créé par migration ;
- les notifications prévues par les cas d'usage ne sont jamais émises ;
- la couverture de tests mesurée est de 12,9 % des lignes, sans aucun test d'intégration.

## G.1. Inventaire

| Module | Entités | Dépôts | Services | Contrôleurs | DTO |
|---|---|---|---|---|---|
| `auth` | `RefreshToken` | 1 | `AuthService` | `AuthController` | 8 |
| `user` | `Utilisateur`, `Role`, `Permission`, `StatutUtilisateur` | 3 | `UserService`, `RolePermissionService` | `UserController`, `AdminUserController`, `RolePermissionController` | 7 |
| `actualite` | `Actualite` | 1 | `ActualiteService` | `ActualiteController` | 3 |
| `evenement` | `Evenement` | 1 | `EvenementService` | `EvenementController` | 3 |
| `formation` | `Formation`, `SessionFormation`, `Devoir`, 2 énumérations | 3 | `FormationService` | `FormationController` | 7 |
| `inscription` | `Inscription`, `Presence`, 2 énumérations | 2 | `InscriptionService` | `InscriptionController`, `PresenceController` | 4 |
| `projet` | `Projet`, `ProjetMembre`, 2 énumérations | 2 | `ProjetService` | `ProjetController` | 5 |
| `ressource` | `Ressource`, `TypeRessource` | 1 | `RessourceService` | `RessourceController` | 2 |
| `notification` | `Notification`, `TypeNotification` | 1 | `NotificationService` | `NotificationController` | 2 |
| `contact` | `MessageContact` | 1 | `ContactService` | `ContactController` | 2 |
| `page` | `PageInfo` | 1 | `PageInfoService` | `PageInfoController` | 2 |
| `categorie` | `Categorie` | 1 | `CategorieService` | `CategorieController` | 2 |
| `admin` | `AuditLog` | 1 | `AdminService` | `StatistiquesController`, `StatistiquesPubliquesController`, `SecurityController`, `SystemController`, `ConformiteController` | 5 |
| `common` | `BaseEntity` (audit, suppression logique) | — | — | filtres JWT et limitation de débit, gestionnaire d'exceptions | `ErrorResponse` |

Total : 21 tables, 20 contrôleurs, 108 points d'accès, 11 437 lignes (code, configuration et tests). Entités absentes au regard du CDC et du cahier d’exécution : membre du bureau, fichier stocké, jeton de réinitialisation, jeton de vérification d'adresse, paramètre système, préférence de notification, indicateur de compte de test.

## G.2. Points d'accès

Toutes les routes sont préfixées par `/api` (chemin de contexte). État : réel (lit et écrit en base selon la règle métier), partiel (fonctionne mais règle, droit ou donnée manquants), simulé (ne fait pas ce qu'il annonce).

### Authentification (`/auth`)

| Méthode | Chemin | Rôle | Entrée | Sortie | État |
|---|---|---|---|---|---|
| POST | `/auth/register` | public | `RegisterRequest` | `TokenResponse` (201) | partiel : connexion immédiate sans vérification d'adresse ; message révélant l'existence du compte ; numéro de membre aléatoire |
| POST | `/auth/login` | public | `LoginRequest` | `TokenResponse` | partiel : seuils codés en dur, aucun journal, jetons renvoyés dans le corps |
| POST | `/auth/refresh` | public | `RefreshTokenRequest` | `TokenResponse` | partiel : rotation et détection de réutilisation présentes ; jeton stocké en clair et transmis dans le corps |
| POST | `/auth/logout` | connecté | — | message | réel |
| POST | `/auth/forgot-password` | public | courriel | message générique | simulé : jeton conservé en mémoire et écrit dans les journaux, aucun courriel |
| POST | `/auth/reset-password` | public | jeton, mot de passe | message | simulé : dépend du jeton en mémoire |
| POST | `/auth/2fa/setup`, `/verify`, `/disable` | connecté | code TOTP | secret, message | réel (fondations conservées, non exposées dans l'interface) |

### Profil et administration des utilisateurs

| Méthode | Chemin | Rôle | État |
|---|---|---|---|
| GET, PUT | `/users/me` | connecté | partiel : un membre peut modifier lui-même `fonction` et `specialite` ; `photo` est une chaîne libre |
| PUT | `/users/me/password` | connecté | partiel : les sessions existantes ne sont pas révoquées |
| GET | `/admin/users` | ADMIN, SUPER_ADMIN | partiel : `findAll` inclut les comptes supprimés ; recherche et filtre présents dans le dépôt mais non exposés |
| GET, POST, PUT, DELETE | `/admin/users/{id}` | ADMIN, SUPER_ADMIN | partiel : aucune entrée au journal d'audit ; suppression logique bloquant la réutilisation du courriel |
| PUT | `/admin/users/{id}/roles` | ADMIN, SUPER_ADMIN | partiel : aucune vérification de hiérarchie (un Administrateur peut s'attribuer SUPER_ADMIN) |
| PATCH | `/admin/users/{id}/status` | ADMIN, SUPER_ADMIN | partiel : possible sur soi-même et sur le dernier Super Admin |
| GET, POST | `/admin/roles`, GET `/admin/roles/{id}`, PUT `/admin/roles/{id}/permissions`, GET `/admin/permissions` | ADMIN, SUPER_ADMIN | partiel : les permissions sont stockées et placées dans le jeton, mais aucune autorisation ne s'appuie sur elles |

### Contenus

| Méthode | Chemin | Rôle | État |
|---|---|---|---|
| GET | `/actualites`, `/evenements`, `/formations`, `/projets` | public | réel (pagination, filtres, recherche) |
| GET | `/actualites/{id}`, `/actualites/slug/{slug}`, équivalents événements et formations | public | partiel : aucune vérification du statut publié (brouillons lisibles par identifiant) |
| GET | `/projets/{id}`, `/projets/slug/{slug}` | public | partiel : propositions en attente et projets rejetés lisibles |
| GET | `/projets/{id}/membres` | public | partiel : expose l'adresse électronique des membres (`ProjetMembreDto.utilisateurEmail`) |
| GET | `/…/admin/all` (actualités, événements, formations, projets, ressources) | rôles de gestion | réel |
| POST, PUT, PATCH, DELETE | `/actualites…`, `/evenements…` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | réel ; image sous forme d'URL libre |
| POST, PUT, PATCH | `/formations…`, sessions, devoirs | FORMATEUR et rôles de gestion | partiel : aucun contrôle de propriété ; aucun contrôle de conflit de planning |
| GET | `/formations/{id}/devoirs` | annoncé « connecté » | bogue : accessible sans authentification (règle `GET /formations/**` en accès libre, aucune annotation sur la méthode) |
| GET | `/formations/{id}/sessions` | public | réel |
| POST | `/projets` ; POST `/projets/{id}/membres` | membres | partiel : aucune notification |
| GET | `/projets/en-attente` | rôles de gestion | réel (liste non paginée) |
| PUT | `/projets/{id}/validation` | rôles de gestion | partiel : motif non enregistré, auteur non notifié |
| PUT | `/projets/{id}/suivi` | FORMATEUR et rôles de gestion | partiel : aucun rattachement projet-formation, tout formateur peut modifier tout projet |
| GET | `/ressources/publiques` | public | partiel : une ressource est une simple URL |
| GET | `/ressources/{id}`, `/ressources/formation/{id}` | connecté | partiel : inscription à la formation non vérifiée |
| POST, PUT, DELETE | `/ressources…` | FORMATEUR et rôles de gestion | partiel : aucun fichier, aucun contrôle de propriété |
| GET, POST, PUT, DELETE | `/categories…` | lecture publique ; écriture rôles de gestion | partiel : suppression non conditionnée à l'absence de contenu actif |
| GET, PUT | `/pages/{slug}` | lecture publique ; écriture ADMIN | partiel : contenu amorcé inventé |

### Inscriptions, présences, notifications, contact

| Méthode | Chemin | Rôle | État |
|---|---|---|---|
| POST | `/inscriptions/evenements/{id}`, `/inscriptions/formations/{sessionId}` | connecté | partiel : quota et liste d'attente gérés ; comptage non verrouillé (dépassement possible en concurrence) ; aucune notification |
| GET | `/inscriptions/me` | connecté | réel |
| DELETE | `/inscriptions/{id}` | propriétaire | réel (promotion automatique du premier en attente, sans notification) |
| GET | `/inscriptions/evenements/{id}`, `/inscriptions/formations/{id}` | rôles de gestion | partiel : non paginé, expose les courriels |
| PUT | `/inscriptions/{id}/statut` | rôles de gestion | partiel : quota non vérifié lors d'une promotion manuelle |
| GET, POST | `/presences/sessions/{id}` | FORMATEUR et rôles de gestion | partiel : propriété et clôture de séance non gérées ; appartenance de l'inscription à la session non vérifiée |
| GET | `/notifications`, `/notifications/non-lues/count` | connecté | réel |
| PUT | `/notifications/{id}/lue`, `/notifications/lire-toutes` | connecté | réel |
| POST | `/notifications/globales` | rôles de gestion | partiel : aucun ciblage, aucune vérification de cible vide |
| POST | `/contact` | public | partiel : enregistré en base ; aucun courriel, aucun accusé, aucune limitation de débit |
| GET | `/contact/admin` ; PUT `/contact/admin/{id}/traite` | rôles de gestion | partiel : pas d'état « archivé » |

### Statistiques, sécurité, système, conformité

| Méthode | Chemin | Rôle | État |
|---|---|---|---|
| GET | `/statistiques/publiques` | public | partiel : `count()` inclut brouillons, propositions, éléments supprimés et comptes d'administration |
| GET | `/admin/statistiques` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | partiel : totaux uniquement, calcul en mémoire, aucune série temporelle ; les indicateurs du CDC (visites, taux de conversion) sont absents |
| GET | `/admin/security/alerts` | ADMIN, SUPER_ADMIN | partiel : `dateDetection` vaut l'heure de la requête ; charge tous les utilisateurs |
| PUT | `/admin/security/2fa/{userId}` | ADMIN, SUPER_ADMIN | simulé : positionne un indicateur sans secret, donc sans effet |
| GET | `/admin/security/audit-logs`, `/dsi/conformite/logs` | ADMIN ; DSI | partiel : entité exposée directement ; journal presque jamais alimenté |
| GET, PUT | `/admin/system/config` | SUPER_ADMIN | simulé : valeurs en mémoire, perdues au redémarrage, lues par aucun autre composant |
| POST | `/admin/system/backup` | SUPER_ADMIN | simulé : renvoie « SUCCESS » et un nom de fichier sans rien sauvegarder |
| GET | `/dsi/conformite` | DSI | simulé : statut « CONFORME » et sept contrôles codés en dur à `true` |

## G.3. Configuration de sécurité

| Sujet | Constat | Référence |
|---|---|---|
| Jeton d'accès | HMAC, 15 minutes, rôles et permissions dans les revendications ; l'utilisateur est rechargé en base à chaque requête | `common/security/JwtProvider.java`, `JwtAuthenticationFilter.java` |
| Secret JWT | valeur par défaut connue si la variable `JWT_SECRET` est absente ; aucun échec au démarrage | `application.yml:54` |
| Jeton de rafraîchissement | UUID, 7 jours, rotation, révocation de tous les jetons en cas de réutilisation ; stocké en clair ; transmis dans le corps JSON | `auth/service/AuthServiceImpl.java:160-200` |
| Hachage | BCrypt coût 10 codé en dur ; la propriété `app.security.bcrypt-strength: 12` est ignorée ; le CDC exige un coût d'au moins 12 | `common/config/SecurityConfig.java:101` |
| Verrouillage | 5 échecs, 15 minutes, codés en dur (propriétés ignorées) ; le compteur n'est pas remis à zéro à l'expiration du verrou | `AuthServiceImpl.java:125-135` |
| CORS | motifs `https://*.up.railway.app`, `https://*.railway.app` et `http://localhost:*` avec identifiants autorisés : tout site hébergé sur Railway est accepté | `common/config/CorsConfig.java:28-30` |
| Limitation de débit | 5 requêtes par 15 minutes par adresse IP et par chemin, sur quatre routes d'authentification ; table en mémoire non bornée ; adresse lue dans `X-Forwarded-For` sans proxy de confiance ; contact non couvert | `common/security/RateLimitFilter.java` |
| Routes ouvertes | `/actuator/**` avec `show-details: always` ; `/h2-console/**` dans tous les profils ; documentation Swagger publique en production | `SecurityConfig.java:67-75`, `application.yml:102` |
| En-têtes | aucune politique CSP, `Referrer-Policy` ni `Permissions-Policy` définie | `SecurityConfig.java` |
| Politique de mot de passe | 8 caractères, quatre classes ; seuls les caractères spéciaux `@$!%*?&` sont acceptés, tout autre symbole fait échouer la validation | `auth/dto/RegisterRequest.java:37` |
| Erreurs de validation | la valeur rejetée est renvoyée au client, y compris un mot de passe refusé | `common/exception/GlobalExceptionHandler.java:49` et `:71` |

## G.4. Migrations, profils, propriétés

- `V1__create_schema.sql` : 21 tables, index sur les clés étrangères et les statuts, colonnes `TIMESTAMP` sans fuseau.
- `V2__seed_reference_data.sql` : rôles, 30 permissions, 5 catégories, 3 pages de contenu, un compte Super Admin. Données de référence et données de compte sont mêlées ; le texte des pages et les catégories sont inventés.
- `FlywayConfig` exécute `repair()` avant chaque migration (masque toute divergence de somme de contrôle) ; `baseline-on-migrate: true`.
- Profils : `dev` (PostgreSQL local, journaux SQL détaillés), `h2` (Flyway désactivé, `ddl-auto: update`, donc aucun rôle de référence), `test` (pilote Testcontainers, utilisé par aucun test), `prod` (Railway ; pool de 20 connexions, `initialization-fail-timeout: -1`).
- Propriétés définies mais sans effet : `app.security.*`, `app.rate-limit.password-reset.*`, `app.upload.*`.

## G.5. Tests

| Élément | Résultat |
|---|---|
| Commande | `mvn -B test` (JDK 17.0.12, Maven 3.9.16) |
| Résultat | 17 tests, 0 échec, 0 erreur (`AuthServiceTest` 6, `InscriptionServiceTest` 3, `ProjetServiceTest` 4, `UserServiceTest` 4) |
| Nature | tests unitaires de services avec doublures Mockito |
| Tests d'intégration | aucun (ni contexte Spring, ni contrôleur, ni base réelle) ; Testcontainers est déclaré mais inutilisé |
| Couverture mesurée | 12,9 % des lignes (260 sur 2 013), 11,8 % des instructions ; mesure par JaCoCo 0.8.13 exécuté en ligne de commande, le projet ne configurant aucun outil de couverture |
| Écart | le CDC vise plus de 80 % de couverture unitaire |

## G.6. Indices de simulation

| Fichier et ligne | Constat |
|---|---|
| `auth/service/AuthServiceImpl.java:68` | jetons de réinitialisation dans une table en mémoire |
| `auth/service/AuthServiceImpl.java:222-223` | jeton écrit dans les journaux ; commentaire « En production, envoyer l'email ici » |
| `auth/service/AuthServiceImpl.java:89`, `user/service/UserServiceImpl.java:116` | numéro de membre tiré au hasard (`Math.random`), collision possible avec la contrainte d'unicité |
| `admin/service/AdminServiceImpl.java:49-56` | paramètres système en mémoire |
| `admin/service/AdminServiceImpl.java:184-199` | sauvegarde fictive |
| `admin/service/AdminServiceImpl.java:204-232` | contrôles de conformité constants, version Java en dur, statut « CONFORME » |
| `admin/service/AdminServiceImpl.java:128-143` | « obligation 2FA » sans effet |
| `resources/db/migration/V2__seed_reference_data.sql:116-121` | contenu éditorial inventé injecté en production |
| `resources/db/migration/V2__seed_reference_data.sql:123-140` | compte Super Admin injecté en production |
| ensemble du code | aucune utilisation de `JavaMailSender` ni de `MultipartFile` : ni courriel, ni téléversement, malgré les dépendances et les propriétés |

Aucune valeur statistique constante n'a été trouvée dans les tableaux de bord : les compteurs proviennent de la base, mais leur périmètre est faux (G.2).

## G.7. Écarts entre `use-cases.md` et le code

| Cas d'usage | État | Écart |
|---|---|---|
| UC-01 | partiel | bureau réduit à un texte ; contenu amorcé inventé |
| UC-02 | partiel | brouillons et propositions lisibles par identifiant |
| UC-03 | partiel | pas de fichier réel |
| UC-04 | partiel | pas d'accusé de réception, pas d'anti-spam |
| UC-05 | partiel | pas de courriel de confirmation ; pas de statut d'attente |
| UC-06 | partiel | motif de refus (suspendu, non activé) incomplet |
| UC-07 | partiel | photo non téléversable ; préférences absentes |
| UC-08 | simulé | aucun courriel, jeton volatil |
| UC-09 | partiel | notification de confirmation absente ; proposition de liste d'attente imposée et non proposée |
| UC-10 | non conforme | accès non conditionné à l'inscription ; devoirs lisibles sans compte |
| UC-11 | partiel | Responsable non notifié |
| UC-12 | partiel | historique limité aux inscriptions (projets absents) |
| UC-13 | partiel | seule la diffusion globale crée des notifications ; aucun canal courriel ; préférences absentes |
| UC-14 | partiel | propriété et conflit de planning non contrôlés |
| UC-15 | partiel | clôture de séance absente |
| UC-16 | partiel | pas de dépôt de fichier, pas de contrôle de taille ni de type |
| UC-17 | partiel | rattachement projet-formation absent |
| UC-18, UC-19 | réel | contrôle de cohérence de la capacité à compléter |
| UC-20 | partiel | motif de rejet perdu, auteur non notifié |
| UC-21 | partiel | quota non vérifié, membres non notifiés |
| UC-22 | partiel | ciblage absent, cible vide non détectée |
| UC-23 | partiel | suppression sans contrôle des données liées ; pas de journal |
| UC-24 | partiel | hiérarchie non respectée ; permissions sans effet |
| UC-25 | partiel | dépendances non contrôlées à la suppression d'une catégorie |
| UC-26 | partiel | pas de période, pas de série |
| UC-27 | partiel | alertes approximatives ; pas de déverrouillage |
| UC-28 | simulé | configuration et sauvegarde fictives |
| UC-29 | simulé | conformité déclarative |

## G.8. Bogues connus et suspectés

Critiques :

1. B-01. Compte Super Admin créé par migration avec un mot de passe publié dans le dépôt (`V2__seed_reference_data.sql:123-140`) et dans le guide de déploiement. L'empreinte insérée diffère de celle du commentaire ; sa validité reste à vérifier, mais dans les deux cas le compte doit être neutralisé par une nouvelle migration et remplacé par l'amorçage par variables d'environnement.
2. B-02. Devoirs d'une formation accessibles sans authentification (`formation/controller/FormationController.java:161-166` et `SecurityConfig.java:60`).
3. B-03. Élévation de privilège : un Administrateur peut s'attribuer ou attribuer le rôle Super Admin (`user/service/UserServiceImpl.java:172-185`).
4. B-04. CORS ouvert à tout sous-domaine Railway avec identifiants (`CorsConfig.java`).
5. B-05. Secret JWT par défaut accepté en production (`application.yml:54`).
6. B-06. Jeton de réinitialisation écrit dans les journaux (`AuthServiceImpl.java:222`).
7. B-07. Mot de passe refusé renvoyé dans la réponse d'erreur de validation (`GlobalExceptionHandler.java:49`).

Majeurs :

8. B-08. Brouillons, propositions et projets rejetés lisibles publiquement par identifiant ou slug.
9. B-09. Adresses électroniques exposées publiquement par `/projets/{id}/membres`.
10. B-10. Aucun contrôle de propriété sur formations, sessions, devoirs, ressources, présences et suivi de projet.
11. B-11. Promotion manuelle d'une inscription sans vérification du quota ; inscriptions concurrentes pouvant dépasser la capacité.
12. B-12. Motif de validation ou de rejet d'un projet non persistant.
13. B-13. Réinscription impossible après suppression logique d'un compte (contrainte d'unicité du courriel) : erreur 409 générique.
14. B-14. Numéro de membre aléatoire : collision possible, erreur 409 à l'inscription.
15. B-15. Compteur d'échecs de connexion non remis à zéro après expiration du verrou : un seul nouvel échec reverrouille le compte.
16. B-16. `/admin/users` retourne aussi les comptes supprimés.
17. B-17. Un membre peut modifier sa propre `fonction` (affichée comme fonction au bureau).
18. B-18. Présences : l'inscription pointée n'est pas vérifiée comme appartenant à la session.
19. B-19. Statistiques publiques faussées (brouillons, propositions, éléments supprimés, comptes techniques).
20. B-20. Message d'inscription révélant l'existence d'un compte (énumération).

Mineurs et conception :

21. B-21. Format d'erreur propre au projet (non conforme à la RFC 9457) ; la réponse 429 est écrite à la main avec un format divergent.
22. B-22. Dates sérialisées sans fuseau (`LocalDateTime`), contraires à l'ISO 8601 UTC attendu.
23. B-23. Entité `AuditLog` exposée directement par deux contrôleurs.
24. B-24. Slugs de secours fondés sur l'horloge (`System.currentTimeMillis() % 10000`).
25. B-25. Routes hétérogènes (`/…/admin/all`, `/contact/admin`, `/notifications/lire-toutes`, verbes `PUT` pour des actions partielles), listes non paginées, absence de version d'API.
26. B-26. Journal d'audit alimenté par trois actions seulement ; ni connexion, ni changement de rôle, ni suppression, ni publication.
27. B-27. Politique de mot de passe refusant les symboles hors `@$!%*?&`.
28. B-28. Changement de mot de passe sans révocation des sessions.
29. B-29. Profil `h2` sans données de référence ; console H2 autorisée dans tous les profils.

Constatés à l'exécution sur PostgreSQL 16 le 1er octobre 2026 (base vierge, backend démarré localement, voir `club-informatique-frontend/e2e/backend-recette.sh`) :

30. B-30 (critique). Toutes les listes publiques à recherche facultative répondent 500 lorsque le paramètre `search` est absent : `GET /actualites`, `/evenements`, `/formations`, `/projets`, `/ressources/publiques`. Cause : `LOWER(CONCAT('%', :search, '%'))` avec un paramètre nul, que PostgreSQL type en `bytea` (« function lower(bytea) does not exist »). Avec `?search=a`, la réponse est 200. Les tests unitaires à doublures ne pouvaient pas le détecter.
31. B-31 (critique). Le compte Super Admin créé par la migration V2 ne peut pas se connecter (réponse 401 avec le mot de passe documenté) : l'empreinte insérée n'est pas celle du mot de passe annoncé. Une base neuve ne possède donc aucun administrateur utilisable. Ce constat précise B-01 : le risque n'est pas un mot de passe connu, mais l'absence d'administration et un compte résiduel à neutraliser.
32. B-32 (majeur). Un secret JWT qui n'est pas du base64 valide (par exemple contenant un tiret) provoque une erreur 500 à l'inscription et à la connexion : `JwtProvider.getSigningKey` n'intercepte que `IllegalArgumentException`, alors que le décodeur lève `DecodingException`.
33. B-33 (mineur). Une route inexistante répond 500 au lieu de 404 (exemple : `POST /auth/verification`) : le gestionnaire générique absorbe l'exception « ressource introuvable ».
34. B-34 (mineur). La limitation de débit de 5 requêtes par quart d'heure s'applique par adresse IP et par chemin, connexions réussies comprises : plusieurs utilisateurs derrière une même adresse (réseau de l'établissement) se bloquent mutuellement.
35. B-35. Le nombre d'inscrits d'une séance de formation est toujours renvoyé à zéro et les places restantes égales à la capacité (`formation/mapper/FormationMapper.java:66-67`, valeurs écrites en dur). Conséquences constatées le 1er octobre 2026 sur la base de recette : une séance comptant un inscrit confirmé est annoncée « Aucun inscrit » dans l'espace Formateur ; côté public, les places restantes ne diminuent jamais et une séance complète n'est jamais signalée (l'inscription bascule pourtant en liste d'attente côté serveur). Le même défaut touche les événements : `evenement/service/EvenementServiceImpl.java` transmet `0L` au mappeur dans toutes ses méthodes (lignes 46, 53, 60, 68, 109, 140 et 150) ; un événement comptant un inscrit confirmé est annoncé à zéro inscrit, y compris dans la gestion des événements. À corriger en Phase 3 avec un test préalable.
36. B-36. Une proposition de projet non validée est lisible sans authentification par son identifiant (`GET /projets/{id}`, constaté le 2 octobre 2026 sur un projet au statut `PROPOSE`), alors que le CDC impose la validation par le Responsable avant toute publication (UC-11, UC-20). Le détail d'un projet non publié doit être réservé à son porteur, aux formateurs et aux rôles de gestion.
37. B-37. Aucun point d'accès ne restitue à un membre les projets qu'il a proposés (`GET /projets/mes-projets` répond 400, le chemin étant interprété comme un identifiant) : un membre ne peut pas suivre une proposition en attente ou rejetée, ni lire le motif d'un rejet, lequel n'est d'ailleurs pas restitué par `ProjetDto`.
38. B-38 (mineur). Les libellés amorcés par la migration V2 sont écrits sans accents (« Developpement Web & Mobile », « Creer une formation », « Cybersecurite & Reseaux ») : ils s'affichent tels quels dans les catégories publiques et dans la matrice des permissions. À corriger par une nouvelle migration (typographie française, règle 6.8).
39. B-39. Les statistiques d'administration comptent les comptes de recette et le compte amorcé (sept comptes pour six comptes d'essai et un compte technique) : aucun marquage « test » n'existe (règle 7). Les totaux et répartitions affichés par l'écran 55 sont donc réels mais non conformes tant que cette exclusion n'est pas faite côté serveur.

## G.9. Lenteur de connexion et de chargement : causes probables

| Cause | Constat | Vérification prévue en Phase 3 |
|---|---|---|
| Coût du hachage | passage du coût 12 au coût 10 déjà effectué ; les mesures de `PERFORMANCE_NOTES.md` ne sont accompagnées d'aucune preuve | mesurer le coût 10, 11 et 12 sur l'instance Railway réelle ; viser 12 si le 95e centile reste sous 500 ms |
| Chargement de l'utilisateur à chaque requête | `JwtAuthenticationFilter` relit l'utilisateur, ses rôles et leurs permissions (`EAGER` sur deux niveaux) à chaque appel authentifié | authentifier à partir des revendications du jeton ; charger en base seulement si nécessaire |
| Démarrage à froid | mise en veille éventuelle du service Railway et démarrage de la JVM ; délai de sonde de 180 s dans `railway.toml` | vérifier le réglage de veille du service ; mesurer le temps de démarrage |
| Pool de connexions | 20 connexions maximum et 5 au repos pour une petite instance | dimensionner selon l'offre Railway |
| Requêtes | statistiques calculées par `findAll()` en mémoire (N utilisateurs par rôle) ; alertes et conformité idem | agrégations SQL |
| Volume et cache | aucune compression, aucun `ETag` ni `Cache-Control` sur les contenus publics | activer la compression et le cache conditionnel |
| Courriel | sans objet aujourd'hui (aucun envoi) ; devra être asynchrone | — |
| Frontend précédent | deux origines distinctes (pré-vérifications CORS sur chaque appel), polices chargées depuis un CDN | même origine par proxy `/api`, polices locales |

## G.10. Fichiers de déploiement existants

| Fichier | Contenu |
|---|---|
| `club-informatique-backend/Dockerfile` | deux étapes (Maven et JRE 17 Alpine), utilisateur non privilégié, tests ignorés à la construction, `MaxRAMPercentage=75` |
| `club-informatique-backend/railway.toml` | constructeur Dockerfile, sonde `/api/actuator/health/liveness` (180 s), redémarrage sur échec (5 essais) |
| `club-informatique-backend/.env.example` | base, secret JWT, CORS, SMTP, dossier de téléversement |
| `club-informatique-frontend/Dockerfile`, `nginx.conf.template`, `railway.toml` | service Nginx avec proxy `/api` ; supprimés avec l'ancien frontend en Phase 1 puis réécrits |
| CI | aucune (pas de dossier `.github/workflows`) |

Variables attendues en production : `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, `MAIL_*`, `SPRING_PROFILES_ACTIVE`, `PORT`.
