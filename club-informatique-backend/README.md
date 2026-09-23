# Backend — Plateforme du Club Informatique IST

API REST moderne, robuste et sécurisée pour la gestion intégrale du Club Informatique de l'Institut Supérieur de Technologie (IST).

---

## 🛠 Stack Technique

- **Langage** : Java 17 LTS
- **Framework** : Spring Boot 3.5.3
- **Accès aux données** : Spring Data JPA / Hibernate 6
- **Base de données** : PostgreSQL 16 (H2 pour tests mémoire rapides, Testcontainers pour intégration)
- **Migrations DB** : Flyway
- **Sécurité** : Spring Security 6, JWT (JJWT 0.12.6, tokens signés HMAC-SHA512), 2FA TOTP (`dev.samstevens.totp`)
- **Protection Brute-force & Anti-DDoS** : Bucket4j (`bucket4j_jdk17-core`) Token Bucket algorithm
- **Documentation API** : SpringDoc OpenAPI 2.8.4 (Swagger UI)
- **Tests** : JUnit 5, Mockito, Spring Security Test

---

## 🚀 Démarrage Rapide

### 1. Prérequis
- Java 17+ installé (`java -version`)
- Maven 3.9+ installé (`mvn -version`)
- PostgreSQL 14+ en cours d'exécution (ou conteneur Docker)

### 2. Configuration d'environnement
Copiez le modèle de configuration d'environnement :
```bash
cp .env.example .env
```
Renseignez les variables nécessaires (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, etc.).

### 3. Compilation et Tests
```bash
# Compilation complète
mvn clean compile

# Exécution des tests unitaires
mvn test
```

### 4. Lancement de l'application

#### Profil Développement (Recommandé en local)
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

#### Profil Production
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

L'application démarre sur le port `8080` avec le préfixe d'API `/api`.

---

## 📖 Documentation Interactive Swagger UI

Une fois l'application démarrée, accédez à la documentation OpenAPI complète et testez les endpoints :
👉 **[http://localhost:8080/api/swagger-ui.html](http://localhost:8080/api/swagger-ui.html)**

Spécification JSON brute : `http://localhost:8080/api/v3/api-docs`

---

## 🔒 Compte Administrateur Initial

Lors de la première migration Flyway (`V2__seed_reference_data.sql`), un compte Super Administrateur par défaut est initialisé :

- **Email** : `admin@clubinfo-ist.ci`
- **Mot de passe** : `Admin@IST2026!`
- **Rôles associés** : `ROLE_SUPER_ADMIN`, `ROLE_ADMIN`, `ROLE_RESPONSABLE_CLUB`, `ROLE_FORMATEUR`, `ROLE_MEMBRE`

> [!WARNING]
> Changez immédiatement ce mot de passe dès le premier déploiement en production !

---

## 📂 Architecture des Modules

```
com.clubinfo.ist/
├── ClubInfoApplication.java       # Entrée principale Spring Boot (@EnableJpaAuditing, @EnableAsync)
├── common/                        # Socle transversal
│   ├── audit/                     # BaseEntity (champs audit, soft delete) & AuditAwareImpl
│   ├── config/                    # SecurityConfig, CorsConfig, OpenApiConfig
│   ├── exception/                 # GlobalExceptionHandler & exceptions métier normalisées
│   └── security/                  # JwtProvider, JwtAuthFilter, RateLimitFilter, UserDetails
├── auth/                          # UC-05, UC-06, UC-08 : Inscription, login, refresh, 2FA TOTP
├── user/                          # UC-07, UC-23, UC-24 : Profils, annuaire, attribution rôles & permissions
├── categorie/                     # UC-25 : Catégories thématiques
├── actualite/                     # UC-02, UC-18 : Articles, blog, publications
├── evenement/                     # UC-02, UC-19 : Conférences, hackathons, meetups
├── formation/                     # UC-02, UC-10, UC-14, UC-16 : Formations, sessions, devoirs
├── inscription/                   # UC-09, UC-12, UC-15, UC-21 : Inscriptions, liste d'attente auto, présences
├── projet/                        # UC-02, UC-11, UC-17, UC-20 : Projets étudiants, validation, équipe, encadrement
├── ressource/                     # UC-03, UC-10, UC-16 : Documents PDF, supports de cours, vidéos
├── notification/                  # UC-13, UC-22 : Notifications in-app et diffusion globale
├── contact/                       # UC-04 : Formulaire de contact public et traitement admin
├── page/                          # UC-01, UC-25 : Contenu dynamique CMS (accueil, présentation, bureau)
└── admin/                         # UC-26, UC-27, UC-28, UC-29 : Statistiques, alertes, config système, audit DSI
```

---

## 🛡️ Règles de Sécurité Implémentées

1. **Tokens JWT Stateless** : Access token court (15 min) signé HS512 + Refresh token rotatif (7 jours) stocké et révocable.
2. **Double Authentification (TOTP)** : Compatible Google Authenticator / Microsoft Authenticator via standard RFC 6238.
3. **Protection Brute Force** :
   - Limitation à 5 tentatives de connexion consécutives avant verrouillage automatique du compte pour 15 minutes.
   - Rate limiter Bucket4j par adresse IP sur les endpoints sensibles (`/api/auth/**`).
4. **Cloisonnement des Rôles (RBAC)** :
   - Hiérarchie stricte (`ROLE_MEMBRE`, `ROLE_FORMATEUR`, `ROLE_RESPONSABLE_CLUB`, `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`).
   - Acteur `ROLE_DSI` indépendant strictement cantonné à la lecture seule d'audit et de conformité.
5. **Suppression Logique (Soft Delete)** : Conservation de l'intégrité référentielle et conformité traçabilité avec champ `deleted_at`.
