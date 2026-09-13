# 🚀 Application Web — Club Informatique

Bienvenue sur le dépôt officiel de l'application web du **Club Informatique**. Plateforme complète conçue pour gérer les membres, formations, événements, projets, actualités, ressources et l'administration avec contrôle d'accès RBAC et sécurité renforcée (2FA/TOTP, JWT, RGPD).

---

## 🏗️ Architecture & Technologies

### Backend
- **Framework** : Java 17, Spring Boot 3.2.3 / 4.x
- **Securité** : Spring Security, JWT (stateless), TOTP 2FA (`dev.samstevens.totp`), BCrypt (coût 12)
- **Persistence** : Spring Data JPA, Hibernate, PostgreSQL 16 (Héritage `SINGLE_TABLE`)
- **Migrations DB** : Flyway (V1 Schema, V2 Seed Data)
- **Documentation API** : OpenAPI 3 / Swagger UI (`/swagger-ui.html`)
- **Qualité & Audit** : JaCoCo, Journalisation d'audit des actions sensibles

### Frontend
- **Framework** : Angular 17 (Standalone Components, Signals)
- **Design System** : Custom SCSS Glassmorphism Dark Mode (Palette Néon Violet `#7c3aed` & Cyan `#06b6d4`)
- **Icons** : FontAwesome 6, Lucide
- **Routage & Guards** : Route Guards par rôles RBAC, Intercepteur JWT

### Infrastructure
- **Containers** : Docker & Docker Compose (PostgreSQL, Backend Spring Boot, Frontend Nginx Reverse Proxy)

---

## 🔑 Comptes de Démonstration (Seed Data)

Tous les comptes ci-dessous ont pour mot de passe : **`Demo@1234`**

| Rôle | Nom / Prénom | Email | Description |
| :--- | :--- | :--- | :--- |
| **Membre** | Thomas Dubois | `thomas.dubois@clubinfo.fr` | Consultation, inscription événements/formations |
| **Formateur** | Sophie Martin | `sophie.martin@clubinfo.fr` | Création formations & ressources |
| **Responsable Club** | Alexandre Bernard | `alexandre.bernard@clubinfo.fr` | Publication actualités & validation projets |
| **Administrateur** | Marie Petit | `marie.petit@clubinfo.fr` | Gestion utilisateurs & modération |
| **SuperAdmin** | Nicolas Robert | `nicolas.robert@clubinfo.fr` | Accès complet système |
| **DSI** | Julien Richard | `julien.richard@clubinfo.fr` | Supervision technique, logs d'audit & sécurité 2FA |

---

## 🚀 Démarrage Rapide

### Option 1 — Avec Docker Compose (Recommandé)

```bash
docker-compose up --build -d
```

Accès aux services :
- **Frontend Web** : [http://localhost](http://localhost)
- **Backend API** : [http://localhost:8080/api](http://localhost:8080/api)
- **Swagger UI** : [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

### Option 2 — Démarrage Local (Développement)

#### 1. Backend Spring Boot
```bash
cd backend
mvn clean compile
mvn spring-boot:run
```

#### 2. Frontend Angular
```bash
cd frontend
npm install
npm start
```

---

## 📊 Endpoints REST Principaux

- `POST /api/auth/login` — Connexion (avec support 2FA TOTP)
- `POST /api/auth/register` — Inscription membre
- `GET /api/actualites` — Liste des actualités publiées
- `GET /api/evenements` — Liste des événements à venir
- `POST /api/evenements/{id}/inscription` — Inscription à un événement
- `GET /api/formations` — Liste des formations disponibles
- `POST /api/projets/soumettre` — Soumission d'un projet étudiant
- `GET /api/ressources/publiques` — Bibliothèque de documents publics
- `POST /api/contact` — Formulaire de contact public
- `GET /api/admin/users` — [ADMIN] Gestion des utilisateurs
- `GET /api/admin/audit-logs` — [ADMIN/DSI] Consultation du journal d'audit

---

## 📝 Documentation Architecture & Décisions

Pour plus de détails sur le modèle de domaine et la stratégie technique :
- Consulter [ARCHITECTURE.md](file:///c:/Users/rachi/Desktop/DON'T_OPEN/Club_Informatique/ARCHITECTURE.md)
- Consulter [DECISIONS.md](file:///c:/Users/rachi/Desktop/DON'T_OPEN/Club_Informatique/DECISIONS.md)
