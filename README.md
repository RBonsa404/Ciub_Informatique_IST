# Plateforme du Club Informatique de l'IST

Site et espace de gestion du Club Informatique de l'Institut Supérieur de Technologie (Ouagadougou) : présentation du club, actualités, événements, formations et inscriptions, supports de cours, projets des membres, notifications, administration.

Le dépôt contient deux applications et leur documentation.

| Dossier | Contenu |
|---|---|
| `club-informatique-frontend/` | application web (Angular, Tailwind CSS), servie en production par Nginx |
| `club-informatique-backend/` | API REST (Java 17, Spring Boot, PostgreSQL), servie sous `/api/v1` |
| `docs/` | contrat de l'API, décisions, exploitation, performance, journaux de recette |

## Principes

- Aucune donnée affichée n'est écrite dans le frontend : chaque chiffre, nom, date ou contenu vient de l'API, donc de la base. Une donnée absente donne un état vide, jamais une valeur d'exemple. Une garde automatique (`npm run check`) le vérifie.
- Les droits sont appliqués par le serveur, rôle par rôle et ressource par ressource. Le frontend ne fait que masquer ce que le rôle ne peut pas ouvrir.
- Aucun secret n'est versionné : la configuration passe par des variables d'environnement (`club-informatique-backend/.env.example`).

## Rôles

Visiteur, Membre, Formateur, Responsable du Club, Administrateur, Super Admin, DSI. La matrice des droits est celle que renvoie l'API (`GET /api/v1/admin/roles`) et qu'affiche l'écran « Rôles et permissions ».

## Prérequis

| Outil | Version |
|---|---|
| Java | 17 |
| Maven | 3.9 |
| Node.js, npm | 24, 11 |
| Docker | pour la base locale, la capture des courriels, les tests d'intégration et les images de production |

## Installation et lancement en local

1. Base PostgreSQL et capture des courriels (Mailpit) :

```bash
docker compose -f club-informatique-backend/compose.dev.yml up -d
```

2. Backend, sur `http://localhost:8080/api/v1` (les migrations Flyway s'appliquent au démarrage) :

```bash
cd club-informatique-backend && cp .env.example .env && mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

3. Frontend, sur `http://localhost:4200` (les appels à `/api` sont relayés vers le backend local) :

```bash
cd club-informatique-frontend && npm ci && npm start
```

Les courriels envoyés par l'application se lisent sur `http://localhost:8025` ; aucun ne sort de la machine.

## Variables d'environnement

La liste complète et commentée est dans `club-informatique-backend/.env.example`.

| Variable | En production | Rôle |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` | profil d'exécution |
| `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | obligatoires | base PostgreSQL (URL au format `jdbc:postgresql://…`) |
| `JWT_SECRET` | obligatoire | secret de signature des jetons, 32 octets au moins |
| `CORS_ALLOWED_ORIGINS` | obligatoire | adresse publique exacte du site (plusieurs valeurs séparées par des virgules) |
| `APP_FRONTEND_URL` | obligatoire | adresse publique du site, pour les liens placés dans les courriels |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_SMTP_AUTH`, `MAIL_SMTP_STARTTLS`, `MAIL_FROM` | obligatoires | serveur SMTP et adresse d'expédition |
| `CONTACT_EMAIL` | facultative | adresse qui reçoit les messages du formulaire de contact |
| `STORAGE_TYPE`, `UPLOAD_DIR`, `STORAGE_S3_*` | selon le stockage | fichiers déposés : dossier sur volume persistant (`local`) ou stockage objet compatible S3 (`s3`) |
| `APP_BOOTSTRAP_ADMIN_EMAIL`, `APP_BOOTSTRAP_ADMIN_PASSWORD` | au premier démarrage | création du premier Super Admin (voir plus bas) |
| `APP_SEED_TEST_ACCOUNTS`, `APP_TEST_ACCOUNTS_PASSWORD`, `APP_PURGE_TEST_ACCOUNTS` | essais seulement | comptes de test (voir plus bas) |
| `API_URL` (service du frontend) | obligatoire | adresse interne du backend, sans barre finale |

## Tests et contrôles

| Commande | Dossier | Ce qu'elle vérifie |
|---|---|---|
| `mvn verify` | backend | tests unitaires, puis tests d'intégration sur un PostgreSQL réel (Testcontainers), couverture (`target/site/jacoco/index.html`) |
| `npm test` | frontend | tests unitaires |
| `npm run check` | frontend | aucun chiffre écrit dans les gabarits ; casse des noms de fichiers |
| `npm run build` | frontend | construction de production |
| `node e2e/recette-page.mjs <page>` | frontend | recette d'une page sur la pile locale : deux thèmes, sept largeurs, console, accessibilité (journal dans `docs/recette/<page>/`) |
| `node e2e/integration.mjs` | frontend | par module : lecture, refus d'un visiteur, refus d'un rôle insuffisant, erreur restituée, garde de la page (`docs/recette/integration.md`) |
| `node e2e/parcours.mjs` | frontend | parcours complets de chaque rôle sur base vierge, backend construit et frontend de production (`docs/recette/parcours.md`) |

La recette et les parcours demandent Docker démarré, le conteneur de base `ci-ist-pg` (PostgreSQL 16, port 5433) et le conteneur de courriel `ci-ist-mail` (Mailpit, ports 1025 et 8025) ; le backend de recette se lance par `node e2e/backend-recette.mjs` et se peuple par `node e2e/seed-recette.mjs`. Ces scripts ne visent que des bases locales.

L'intégration continue (`.github/workflows/ci.yml`) rejoue les gardes, les tests et les constructions à chaque poussée.

## Premier Super Admin

Aucun compte n'est livré avec l'application. Tant qu'aucun Super Admin réel n'existe, le démarrage du backend en crée un à partir de `APP_BOOTSTRAP_ADMIN_EMAIL` et `APP_BOOTSTRAP_ADMIN_PASSWORD` (douze caractères au moins). Ce mot de passe initial doit être changé à la première connexion : d'ici là, le compte n'accède à rien d'autre. Les deux variables peuvent ensuite être retirées.

## Comptes de test

Pour les essais, `APP_SEED_TEST_ACCOUNTS=true` crée au démarrage un compte par rôle sur le domaine réservé `recette.invalid` (aucun courriel ne leur est envoyé), avec le mot de passe donné par `APP_TEST_ACCOUNTS_PASSWORD`. Ces comptes sont marqués en base et exclus de toutes les statistiques.

À la fin des essais, un seul démarrage avec `APP_PURGE_TEST_ACCOUNTS=true` (et `APP_SEED_TEST_ACCOUNTS=false`) retire ces comptes et tout ce qu'ils ont créé ; l'opération est inscrite au journal d'audit. Remettre ensuite la variable à `false`.

## Déploiement (Railway)

Trois services dans un même projet : la base PostgreSQL gérée, le backend, le frontend. Seul le frontend reçoit un domaine public ; il relaie `/api` vers le backend par le réseau privé, si bien que le site et l'API partagent la même origine.

| Service | Dossier racine | Construction | Réglages |
|---|---|---|---|
| Backend | `club-informatique-backend` | `Dockerfile` (`railway.toml`) | variables ci-dessus ; volume persistant monté sur `/app/uploads` avec `UPLOAD_DIR=/app/uploads` ; sonde `/api/v1/actuator/health/liveness` ; mise en veille désactivée |
| Frontend | `club-informatique-frontend` | `Dockerfile` (`railway.toml`) | `API_URL` = adresse interne du backend ; sonde `/sante` ; domaine public |
| Base | PostgreSQL géré | | ses variables de connexion alimentent `SPRING_DATASOURCE_*` |

Après le premier déploiement : vérifier la sonde de santé, se connecter avec le Super Admin d'amorçage et changer son mot de passe, envoyer un message par le formulaire de contact (réception du courriel), déposer un fichier, puis planifier la sauvegarde. Une version fautive se retire depuis l'onglet des déploiements du service, en redéployant la version précédente ; les migrations de base sont additives et ne se défont pas automatiquement (restaurer la dernière sauvegarde si une migration est en cause).

## Sauvegarde et restauration

`club-informatique-backend/scripts/sauvegarde.sh` produit une sauvegarde complète de la base (`pg_dump`) et inscrit son résultat dans l'application, où le Super Admin le consulte. `club-informatique-backend/scripts/restauration.sh` remplace le contenu d'une base par celui d'une sauvegarde, après confirmation explicite. Procédure détaillée, planification et test de restauration consigné : `docs/exploitation.md`.

Les fichiers déposés ne sont pas dans la base : ils se sauvegardent avec le volume ou le compartiment de stockage.

## Documentation

| Document | Sujet |
|---|---|
| `docs/api-contract.openapi.yaml` | contrat de l'API (OpenAPI 3.1) |
| `docs/decisions.md` | décisions techniques et arbitrages |
| `docs/exploitation.md` | santé, journaux, tâches planifiées, sauvegarde, restauration |
| `docs/performance.md` | mesures avant et après, réglages |
| `docs/ecarts-maquette.md` | écarts assumés entre la maquette de référence et le produit |
| `docs/informations-a-fournir.md` | informations attendues du club avant publication (mentions légales, hébergeur, durées de conservation) |
| `docs/recette/` | journaux de recette des pages, preuve d'intégration, parcours |
| `docs/PROGRESSION.md` | état d'avancement |
