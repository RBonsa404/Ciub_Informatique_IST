# Backend du Club Informatique de l'IST

API REST de la plateforme du Club Informatique de l'IST : comptes, contenus publics, formations, événements, inscriptions, projets, notifications et administration.

Le contrat de l'API est `docs/api-contract.openapi.yaml` (OpenAPI 3.1). Toutes les routes sont servies sous `/api/v1`.

## Pile technique

| Élément | Choix |
|---|---|
| Langage, cadre | Java 17, Spring Boot 3.5 |
| Données | PostgreSQL 16, Spring Data JPA, migrations Flyway (`src/main/resources/db/migration`) |
| Sécurité | Spring Security, jeton d'accès JWT de 15 minutes, session par cookie `HttpOnly` avec rotation, limitation de débit (Bucket4j) |
| Courriel | SMTP, envoi asynchrone |
| Fichiers | dossier local (volume persistant) ou stockage objet compatible S3 |
| Tests | JUnit 5, Testcontainers (PostgreSQL, serveur de capture des courriels, stockage objet), JaCoCo |

## Démarrer en local

Prérequis : Java 17, Maven 3.9, Docker.

```bash
docker compose -f compose.dev.yml up -d
```

```bash
cp .env.example .env
```

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

`compose.dev.yml` lance PostgreSQL (port 5432) et Mailpit, qui capture tous les courriels : rien ne sort de la machine, et les messages se lisent sur http://localhost:8025. L'API répond sur http://localhost:8080/api/v1 ; la documentation interactive est sur http://localhost:8080/api/v1/swagger-ui.html (désactivée en production).

Les migrations s'appliquent au démarrage. Une base neuve ne contient aucun compte.

## Premier Super Admin

Aucun compte n'est livré avec l'application. Tant qu'aucun Super Admin réel n'existe, le démarrage en crée un à partir de deux variables d'environnement :

| Variable | Rôle |
|---|---|
| `APP_BOOTSTRAP_ADMIN_EMAIL` | adresse du compte |
| `APP_BOOTSTRAP_ADMIN_PASSWORD` | mot de passe initial, douze caractères au moins |

Le mot de passe initial doit être changé à la première connexion : tant qu'il ne l'est pas, le compte n'accède à rien d'autre. Une fois le compte créé, les deux variables peuvent être retirées.

## Comptes de test

Pour les essais, un compte par rôle peut être créé sur le domaine réservé `recette.invalid` (aucun courriel ne leur est envoyé) :

| Variable | Rôle |
|---|---|
| `APP_SEED_TEST_ACCOUNTS=true` | crée les comptes manquants au démarrage |
| `APP_TEST_ACCOUNTS_PASSWORD` | leur mot de passe, douze caractères au moins |
| `APP_PURGE_TEST_ACCOUNTS=true` | retire au démarrage les comptes de test et tout ce qu'ils ont créé |

Ces comptes sont marqués en base et n'entrent dans aucune statistique. À la fin des essais, un démarrage avec `APP_PURGE_TEST_ACCOUNTS=true` les retire ; l'opération est inscrite au journal d'audit.

## Variables d'environnement

Le fichier `.env.example` les liste toutes. Les principales :

| Variable | Obligatoire en production | Rôle |
|---|---|---|
| `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | oui | base PostgreSQL |
| `JWT_SECRET` | oui | secret de signature des jetons, 32 octets au moins |
| `CORS_ALLOWED_ORIGINS` | oui | origines exactes du frontend, séparées par des virgules |
| `APP_FRONTEND_URL` | oui | adresse publique du frontend, pour les liens des courriels |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` | oui | serveur SMTP et adresse d'expédition |
| `CONTACT_EMAIL` | non | adresse qui reçoit les messages du formulaire de contact |
| `STORAGE_TYPE`, `UPLOAD_DIR`, `STORAGE_S3_*` | non | stockage des fichiers déposés |
| `BCRYPT_STRENGTH` | non | coût du hachage des mots de passe (11 par défaut) |
| `DB_POOL_MAX` | non | taille du pool de connexions (10 par défaut) |

Aucun secret n'est écrit dans le dépôt ; le fichier `.env` n'est jamais versionné.

## Tests

```bash
mvn verify
```

La commande lance les tests unitaires, puis les tests d'intégration sur un PostgreSQL réel démarré par Testcontainers (Docker doit tourner). Le rapport de couverture est produit dans `target/site/jacoco/index.html`.

## Organisation du code

```
com.clubinfo.ist
├── common        erreurs (RFC 9457), sécurité, courriel, stockage, journal d'audit, comptes techniques
├── auth          inscription, vérification d'adresse, session, réinitialisation
├── user          mon compte, gestion des comptes, rôles
├── page, bureau, categorie, actualite, contact      contenus publics
├── formation, inscription, evenement, ressource     activités
├── projet        propositions, décision, suivi
├── notification  notifications, rappels
├── fichier       dépôt et téléchargement contrôlés
└── admin         statistiques, réglages, sauvegardes, conformité
```

## Exploitation

Sauvegarde, restauration, journaux, santé et réglages : `docs/exploitation.md`. Mesures de performance : `docs/performance.md`.
