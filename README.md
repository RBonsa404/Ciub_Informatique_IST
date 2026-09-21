# Plateforme Web de Gestion du Club Informatique

Squelette de démarrage initialisé par **OUARE Arnaud** (partie transverse :
base de données, CI, configuration Angular/Spring Boot, déploiement —
section 2.6 du document de dispatch d'architecture). Chaque membre développe
son module dans les dossiers déjà en place, sans changer l'organisation
générale du dépôt.

## Équipe et modules

| Membre | Module |
|---|---|
| PAMOUSSO PRINCE | Utilisateur / Rôle / Permission / Sécurité (auth, RBAC, 2FA) |
| BONSA Abdoul Rachid | Événements / Inscriptions |
| SALOU Christ-Orient | Formations / Sessions / Présence |
| KI Fode | Actualités / Projets / Contact |
| ZONGO Tony | Notifications / Tableau de bord |
| OUARE Arnaud | Base de données, CI/CD, intégration, tests transverses, déploiement |

## Stack

Angular (TypeScript) · Spring Boot 3 / Java 17 · PostgreSQL · Flyway ·
Spring Security · MapStruct · OpenAPI/Swagger · GitHub Actions · Playwright.

## Structure du dépôt

```
club-informatique/
├── backend/     API Spring Boot (voir backend/README ci-dessous)
├── frontend/    SPA Angular
├── db/
│   ├── init/    Scripts exécutés au premier démarrage du conteneur Postgres
│   └── seeds/   Données de référence pour le dev local (hors Flyway)
├── deploy/      Config Nginx d'exemple pour le serveur de prod
└── .github/workflows/ci.yml
```

Les migrations Flyway "officielles" vivent dans
`backend/src/main/resources/db/migration/` (c'est ce que Spring Boot exécute
réellement au démarrage) ; `db/init` et `db/seeds` sont des scripts annexes
pour l'environnement local.

## Démarrage local

1. **Base de données**
   ```bash
   docker compose up -d
   ```

2. **Backend** (nécessite Java 17 + Maven)
   ```bash
   cd backend
   mvn spring-boot:run
   # API sur http://localhost:8080, Swagger sur /swagger-ui.html
   ```

3. **Frontend** (nécessite Node.js 20)
   ```bash
   cd frontend
   npm install
   npm start
   # http://localhost:4200
   ```

## Workflow Git (voir section 4 du document de dispatch)

- Branches longues : `main`, `develop`. Rien n'est mergé directement dans `main`.
- Branches courtes : `<type>/<MEMBRE_EN_MAJUSCULES>-<module>-<action>`
  (ex. `feature/OUARE-database`, `feature/PAMOUSSO-auth-register`).
- Toute Pull Request part de `feature/*` vers `develop`, doit passer la CI
  (build backend + frontend, tests) avant merge.
- `develop` → `main` seulement après validation d'intégration.

## État du squelette (première itération)

Ce qui est en place : arborescence backend/frontend conforme aux sections
1.3/1.4 du document de dispatch, config CORS/erreurs/Swagger/Actuator,
sécurité Spring de base (à compléter par PAMOUSSO pour RBAC/JWT/2FA),
schéma PostgreSQL initial (V1__init_schema.sql, à faire évoluer module par
module via de nouvelles migrations), CI GitHub Actions minimale,
docker-compose Postgres, config Nginx d'exemple.

À faire ensuite par chacun : générer son `package-lock.json` réel
(`npm install` en local, à committer), écrire les migrations spécifiques à
son module, et brancher ses controllers/services/composants dans les
dossiers déjà créés.
