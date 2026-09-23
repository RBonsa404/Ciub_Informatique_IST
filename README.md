# 🚀 Plateforme Numérique du Club Informatique de l'IST

Plateforme officielle de gestion, de formation et de collaboration du **Club Informatique de l'Institut Supérieur de Technologie (IST)**.

Conçue selon les standards de l'ingénierie logicielle moderne, la plateforme digitalise l'intégralité des activités du club : adhésions, catalogue et sessions de formation certifiantes, feuilles d'émargement, organisation de hackathons, publication d'actualités, hébergement et suivi de projets étudiants, gestion des rôles et supervision institutionnelle par la DSI.

---

## 🏛️ Rôles & Gouvernance (RBAC)

La plateforme met en œuvre un contrôle d'accès strict basé sur les rôles (RBAC) avec 6 profils hiérarchisés :

1. **Visiteur** : Consultation des pages publiques (actualités, agenda, catalogue formations, galerie projets, bureau exécutif, ressources ouvertes).
2. **Membre** : Inscription aux formations et hackathons, tableau de bord étudiant, consultation et rendu des devoirs/TPs, proposition de projets, gestion du profil et 2FA.
3. **Formateur** : Planification des formations et sessions, émargement des présences (*Présent*, *Absent*, *Excusé*), partage de ressources pédagogiques, suivi et mentoring des équipes projets.
4. **Responsable du Club** : Rédaction et publication d'actualités, création d'événements/hackathons, commission d'approbation des projets étudiants, gestion des inscriptions et diffusion de notifications broadcast.
5. **Administrateur** : Administration de la base utilisateurs, gestion des statuts de compte (actif/suspendu), métriques et statistiques globales, modération des catégories CMS.
6. **Super Administrateur** : Configuration des paramètres système critiques (politique de mots de passe, quotas, règles anti brute-force, mode maintenance).
7. **DSI (Direction des Systèmes d'Information)** : Audit technique et conformité réglementaire en **lecture seule** (accès sécurisé aux logs d'audit et politiques de sécurité).

---

## 🏗️ Architecture Globale

Le projet repose sur une architecture client-serveur découplée et modulaire :

```
                        ┌──────────────────────────────────────┐
                        │       Navigateur Web / Client        │
                        └──────────────────┬───────────────────┘
                                           │
                                HTTPS / REST (JSON)
                                Bearer JWT + Rate Limit
                                           │
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Frontend : Angular + Tailwind CSS                         │
│  - Architecture Standalone & Signals                                         │
│  - Design System Charte v1.0 (Bleu Royal #1B3A8C, Ambre Tech #F5A623)        │
│  - Thème double (Dark Cyber / Light Glassmorphism)                           │
│  - Intercepteurs Auth JWT & Gestion d'erreurs globales                       │
│  - Guards de routage par rôle & état d'authentification                      │
└──────────────────────────────────────────┬───────────────────────────────────┘
                                           │
                                 Appels API REST (/api/v1)
                                           │
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                 Backend : Spring Boot (Java 17 LTS)                          │
│  - Clean Architecture & Séparation en couches (Controller, Service, Repo)    │
│  - Spring Security (Stateless JWT HMAC-SHA512 + Refresh Tokens tournants)   │
│  - Authentification à double facteur (2FA TOTP RFC 6238)                     │
│  - Filtre Rate-Limiting IP Token Bucket (Bucket4j) & Anti Brute-Force       │
│  - Audit Trail persistant (BaseEntity, AuditLog immuable)                    │
│  - Spring Data JPA / Hibernate 6 + Migrations Flyway                         │
│  - Documentation Swagger OpenAPI v3                                          │
└──────────────────────────────────────────┬───────────────────────────────────┘
                                           │
                                  JDBC / PostgreSQL
                                           │
                                           ▼
                        ┌──────────────────────────────────────┐
                        │      PostgreSQL Database             │
                        └──────────────────────────────────────┘
```

---

## 💻 Stack Technique Complète

### Backend
- **Langage** : Java 17 LTS
- **Framework** : Spring Boot 3.5.3 (Spring Security, Spring Data JPA, Spring Validation)
- **Base de Données** : PostgreSQL 15+
- **Migrations & Schéma** : Flyway
- **Sécurité** : JWT (jjwt 0.12.6), TOTP 2FA (Bouncy Castle), Bucket4j (Rate Limiting), BCrypt
- **Documentation API** : SpringDoc OpenAPI 2.8.4 (Swagger UI)
- **Tests** : JUnit 5, Mockito, AssertJ

### Frontend
- **Framework** : Angular (Standalone Components, Signals, Router Lazy Loading)
- **Styles** : Tailwind CSS v4 + Design Tokens personnalisés CSS Variables
- **Typographie** : Poppins, Inter, JetBrains Mono (Google Fonts)
- **Icônes** : SVG vectoriels natifs intégrés

---

## 📁 Structure du Dépôt

```
.
├── club-informatique-backend/       # Application Backend Spring Boot
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/clubinfo/ist/   # Code source Java (Controllers, Services, Entités...)
│   │   │   └── resources/               # Configurations application.yml et migrations db/migration
│   │   └── test/                        # Tests unitaires et d'intégration
│   ├── .env.example                     # Exemple de variables d'environnement backend
│   ├── ENDPOINTS.md                     # Matrice détaillée des 29 Use Cases et endpoints REST
│   └── pom.xml                          # Dépendances et configuration Maven
│
├── club-informatique-frontend/      # Application Frontend Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                    # Services transverses, Modèles, Guards, Intercepteurs
│   │   │   ├── features/                # Modules métiers (public, auth, membre, formateur, responsable, admin)
│   │   │   ├── layouts/                 # Layouts (PublicLayout, DashboardLayout)
│   │   │   └── shared/                  # Composants partagés (Navbar, Footer, Modal, Toast, Pagination...)
│   │   ├── styles.css                   # Design tokens, thème et directives Tailwind
│   │   └── index.html                   # Point d'entrée HTML
│   ├── angular.json                     # Configuration Angular CLI
│   └── package.json                     # Dépendances NPM
│
├── .gitignore                       # Règles d'exclusion Git strictes
└── README.md                        # Documentation générale du projet
```

---

## ⚡ Démarrage Rapide

### 1. Prérequis
- Java Development Kit (JDK) 17+
- Node.js 20+ et npm 10+
- PostgreSQL 15+ (local ou conteneurisé)
- Maven 3.9+ (ou wrapper `mvnw`)

### 2. Démarrage du Backend
1. Accédez au répertoire backend :
   ```bash
   cd club-informatique-backend
   ```
2. Configurez les variables d'environnement (en vous basant sur `.env.example`) :
   ```bash
   cp .env.example .env
   ```
   Renseignez vos accès PostgreSQL locaux et secrets JWT génériques.
3. Lancez les tests et l'application :
   ```bash
   mvn clean package -DskipTests=false
   mvn spring-boot:run
   ```
4. Le backend démarre sur `http://localhost:8080`.
   - **Documentation Swagger UI** : `http://localhost:8080/swagger-ui.html`
   - **Spécification OpenAPI JSON** : `http://localhost:8080/v3/api-docs`

### 3. Démarrage du Frontend
1. Accédez au répertoire frontend :
   ```bash
   cd club-informatique-frontend
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Lancez le serveur de développement :
   ```bash
   npm start
   ```
4. L'application est accessible sur `http://localhost:4200`.

---

## 📖 Guides Complémentaires

Pour accompagner les équipes de développement et d'infrastructure, des guides détaillés pas à pas sont fournis séparément en dehors du dépôt :
- **Guide de Test Local** : Procédure pas à pas d'installation, exécution des suites de tests automatisés et résolution des incidents fréquents.
- **Guide de Déploiement Railway** : Déploiement automatisé du backend Spring Boot, du service managé PostgreSQL et du frontend avec nom de domaine et certificats SSL.

---

## 📄 Licence & Contact

- **Éditeur** : Club Informatique de l'Institut Supérieur de Technologie (IST)
- **Contact** : `contact@clubinfo-ist.bf` / Bureau Exécutif de l'IST
- **Licence** : Projet universitaire interne — Tous droits réservés © 2026.
