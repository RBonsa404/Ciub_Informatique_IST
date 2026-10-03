# Backend : API du Club Informatique de l'IST

![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5-6DB33F?logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Flyway](https://img.shields.io/badge/Migrations-Flyway-CC0200?logo=flyway&logoColor=white)

API REST de la plateforme : comptes et sessions, contenus publics, formations, événements, inscriptions, projets, fichiers, notifications et administration. Toutes les routes sont servies sous `/api/v1`. Le contrat complet est dans [`docs/api-contract.openapi.yaml`](../docs/api-contract.openapi.yaml) (OpenAPI 3.1).

## Sommaire

- [Pile technique](#pile-technique)
- [Démarrer en local](#démarrer-en-local)
- [Configuration](#configuration)
- [Premier Super Admin](#premier-super-admin)
- [Comptes de test](#comptes-de-test)
- [Tests](#tests)
- [Base de données](#base-de-données)
- [Organisation du code](#organisation-du-code)
- [Image de production](#image-de-production)
- [Exploitation](#exploitation)

## Pile technique

| Domaine | Choix |
|---|---|
| Langage et cadre | Java 17, Spring Boot 3.5 |
| Données | PostgreSQL 16, Spring Data JPA, migrations Flyway |
| Sécurité | Spring Security ; jeton d'accès JWT de 15 minutes ; session par cookie `HttpOnly` avec rotation ; BCrypt ; limitation du débit (Bucket4j) |
| Erreurs | réponses au format RFC 9457 (`application/problem+json`) avec un code métier stable |
| Courriel | SMTP, envoi asynchrone |
| Fichiers | dossier local sur volume persistant, ou stockage objet compatible S3 |
| Documentation | springdoc-openapi (Swagger UI en développement uniquement) |
| Tests | JUnit 5, Testcontainers (PostgreSQL, capture des courriels, stockage objet), JaCoCo |

## Démarrer en local

Prérequis : Java 17 ou plus récent, Maven 3.9, Docker.

1. Démarrer PostgreSQL (port 5432) et Mailpit (ports 1025 et 8025) :

   ```bash
   docker compose -f compose.dev.yml up -d
   ```

2. Démarrer l'API :

   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=dev
   ```

| Adresse | Contenu |
|---|---|
| http://localhost:8080/api/v1 | API |
| http://localhost:8080/api/v1/swagger-ui.html | documentation interactive |
| http://localhost:8080/api/v1/actuator/health | état de santé |
| http://localhost:8025 | courriels envoyés par l'application, capturés par Mailpit |

Le profil `dev` se suffit à lui-même : base locale, courriels capturés (rien ne sort de la machine), secret de signature provisoire régénéré à chaque démarrage. Une base neuve ne contient aucun compte ; voir [Premier Super Admin](#premier-super-admin).

## Configuration

Toute la configuration passe par des variables d'environnement. [`.env.example`](.env.example) les liste toutes, avec leurs valeurs de développement ; le fichier `.env` n'est jamais versionné. Pour modifier une valeur en local, exporter la variable dans le terminal ou la déclarer dans la configuration d'exécution de l'IDE.

| Variable | Production | Défaut | Description |
|---|:---:|---|---|
| `SPRING_PROFILES_ACTIVE` | requise | `dev` | `prod` en ligne |
| `PORT` | requise | `8080` | port d'écoute |
| `SPRING_DATASOURCE_URL` | requise | base locale | `jdbc:postgresql://<hôte>:<port>/<base>` |
| `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | requises | `postgres` | identifiants de la base |
| `JWT_SECRET` | requise | aléatoire hors production | secret de signature des jetons ; 32 octets au moins, 64 caractères aléatoires recommandés |
| `CORS_ALLOWED_ORIGINS` | requise | `http://localhost:4200` | origines autorisées, séparées par des virgules |
| `APP_FRONTEND_URL` | requise | `http://localhost:4200` | adresse du site, pour les liens des courriels |
| `MAIL_HOST`, `MAIL_PORT` | requises | `localhost`, `1025` | serveur SMTP |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | selon le fournisseur | vides | identifiants SMTP |
| `MAIL_SMTP_AUTH`, `MAIL_SMTP_STARTTLS` | selon le fournisseur | `false` | authentification et chiffrement SMTP |
| `MAIL_FROM` | requise | `ne-pas-repondre@localhost` | adresse d'expédition |
| `CONTACT_EMAIL` | facultative | adresse du club | destinataire des messages de contact |
| `STORAGE_TYPE` | facultative | `local` | `local` ou `s3` |
| `UPLOAD_DIR` | avec `local` | `./uploads` | dossier des fichiers déposés |
| `STORAGE_S3_*` | avec `s3` | vides | point d'accès, région, compartiment, clés |
| `COOKIE_SECURE` | | `false` en `dev` | cookie de session `Secure` ; toujours actif en `prod` |
| `BCRYPT_STRENGTH` | facultative | `11` | coût du hachage des mots de passe |
| `DB_POOL_MAX` | facultative | `10` | taille du pool de connexions |
| `RATE_LIMIT_AUTH_CAPACITY` | facultative | `20` | tentatives d'authentification par fenêtre |

Le profil `prod` impose le cookie `Secure`, désactive la documentation interactive, écrit les journaux en JSON et lit l'adresse du client dans les en-têtes du proxy. Il refuse de démarrer sans `JWT_SECRET` valable.

## Premier Super Admin

Aucun compte n'est livré avec l'application. Tant qu'aucun Super Admin réel n'existe, le démarrage en crée un :

| Variable | Description |
|---|---|
| `APP_BOOTSTRAP_ADMIN_EMAIL` | adresse du compte |
| `APP_BOOTSTRAP_ADMIN_PASSWORD` | mot de passe initial, douze caractères au moins |

À la première connexion, le site impose le choix d'un nouveau mot de passe ; d'ici là, le compte n'accède à rien d'autre. Les deux variables se retirent ensuite. Pas à pas en ligne : [mise en service, étapes 2 et 3](../docs/mise-en-service.md#2-première-connexion-du-super-admin).

## Comptes de test

| Variable | Effet au démarrage |
|---|---|
| `APP_SEED_TEST_ACCOUNTS=true` | crée un compte par rôle sur le domaine réservé `recette.invalid` |
| `APP_TEST_ACCOUNTS_PASSWORD` | leur mot de passe, douze caractères au moins |
| `APP_PURGE_TEST_ACCOUNTS=true` | retire les comptes de test et tout ce qu'ils ont créé, avec une entrée au journal d'audit |

Ces comptes sont marqués en base (`test = true`), n'entrent dans aucune statistique et ne reçoivent aucun courriel.

## Tests

```bash
mvn verify
```

Docker doit être démarré. La commande enchaîne :

1. les tests unitaires (`*Test`) ;
2. les tests d'intégration (`*IT`) sur un PostgreSQL réel, un serveur de capture des courriels et un stockage objet, démarrés par Testcontainers ;
3. le rapport de couverture, dans `target/site/jacoco/index.html`.

Pour une seule classe d'intégration :

```bash
mvn verify -Dit.test=ContenusPublicsIT -Dtest=NONE -Dsurefire.failIfNoSpecifiedTests=false
```

## Base de données

Les migrations sont dans [`src/main/resources/db/migration`](src/main/resources/db/migration) et s'appliquent au démarrage. Une migration déjà appliquée n'est jamais modifiée : toute évolution passe par un nouveau fichier `V<n>__<objet>.sql`.

| Migration | Objet |
|---|---|
| V1, V2 | schéma initial et données de référence |
| V3 | comptes techniques : retrait du compte d'origine, comptes de test, changement de mot de passe imposé |
| V4 | fichiers déposés |
| V5 | authentification (sessions, jetons à usage unique, vérification d'adresse) |
| V6 | contenus publics |
| V7 | inscriptions, émargement et rappels |
| V8 | projets |
| V9 | administration et exploitation (réglages, sauvegardes) |
| V10 | index des jointures et des filtres |
| V11 | premiers textes des pages d'accueil et de présentation |

## Organisation du code

```
com.clubinfo.ist
├── common        configuration, erreurs RFC 9457, sécurité, courriel, stockage, journal d'audit, amorçage
├── auth          inscription, vérification d'adresse, session, réinitialisation du mot de passe
├── user          compte personnel, gestion des comptes, rôles
├── page          pages d'information (accueil, présentation)
├── bureau, categorie, actualite, contact           contenus publics
├── formation, inscription, evenement, ressource    activités
├── projet        propositions, décisions, suivi
├── notification  notifications et rappels
├── fichier       dépôt et téléchargement contrôlés
└── admin         statistiques, réglages, sauvegardes, conformité
```

## Image de production

Le [`Dockerfile`](Dockerfile) construit l'archive avec Maven, puis l'exécute sur une image JRE minimale, sous un utilisateur sans privilège. Réglages mémoire adaptés aux petits conteneurs (512 Mo suffisent). [`railway.toml`](railway.toml) déclare la sonde `/api/v1/actuator/health/liveness` et la politique de redémarrage.

```bash
docker build -t club-backend .
```

## Exploitation

| Sujet | Référence |
|---|---|
| Santé, journaux, tâches planifiées | [docs/exploitation.md](../docs/exploitation.md) |
| Sauvegarde et restauration | [`scripts/sauvegarde.sh`](scripts/sauvegarde.sh), [`scripts/restauration.sh`](scripts/restauration.sh), [docs/exploitation.md](../docs/exploitation.md) |
| Déploiement | [docs/deploiement.md](../docs/deploiement.md), [docs/mise-en-service.md](../docs/mise-en-service.md) |
| Performance | [docs/performance.md](../docs/performance.md) |
