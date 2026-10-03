# Déploiement sur Railway

Ce document décrit la mise en ligne de la plateforme : services, variables, volume, vérifications, retour arrière. Aucune valeur secrète n'y figure : elles se saisissent dans le tableau de bord de l'hébergeur.

## 1. Architecture

Trois services dans un même projet.

| Service | Source | Exposition |
|---|---|---|
| Base | PostgreSQL géré par l'hébergeur | réseau privé seulement |
| Backend | dossier `club-informatique-backend`, `Dockerfile` et `railway.toml` | réseau privé seulement (aucun domaine public nécessaire) |
| Frontend | dossier `club-informatique-frontend`, `Dockerfile` et `railway.toml` | domaine public |

Le frontend (Nginx) sert l'application construite et relaie `/api` vers le backend par le réseau privé. Le site et l'API ont donc la même origine : le cookie de session reste de première partie et aucune adresse d'API n'est écrite dans l'application.

## 2. Base

Créer la base PostgreSQL depuis le projet. Ses variables (`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`) servent à composer celles du backend. Les migrations Flyway s'appliquent au démarrage du backend ; sur une base déjà alimentée par une version antérieure, elles s'appliquent à la suite de celles déjà passées.

## 3. Backend

Réglages du service : dossier racine `club-informatique-backend` ; construction par le `Dockerfile` ; sonde `/api/v1/actuator/health/liveness` (déclarée dans `railway.toml`) ; mise en veille désactivée (le démarrage prend 16 à 20 secondes ; mesure locale de l'image en profil de production dans un conteneur de 512 Mo : 16 s et 378 Mio occupés) ; un volume persistant monté sur `/app/uploads`.

| Variable | Valeur |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `PORT` | `8080` (port d'écoute, repris dans `API_URL` du frontend) |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` |
| `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | `${{Postgres.PGUSER}}`, `${{Postgres.PGPASSWORD}}` |
| `JWT_SECRET` | chaîne aléatoire de 64 caractères au moins |
| `CORS_ALLOWED_ORIGINS` | adresse publique exacte du site, par exemple `https://<domaine du frontend>` |
| `APP_FRONTEND_URL` | la même adresse publique |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | serveur SMTP du fournisseur retenu |
| `MAIL_SMTP_AUTH`, `MAIL_SMTP_STARTTLS` | `true`, `true` |
| `MAIL_FROM` | adresse d'expédition validée auprès du fournisseur |
| `CONTACT_EMAIL` | adresse du club qui reçoit les messages de contact |
| `STORAGE_TYPE`, `UPLOAD_DIR` | `local`, `/app/uploads` |
| `APP_BOOTSTRAP_ADMIN_EMAIL`, `APP_BOOTSTRAP_ADMIN_PASSWORD` | adresse et mot de passe initial du premier Super Admin (à retirer une fois le compte créé) |

Le profil `prod` impose le cookie de session `Secure`, désactive la documentation interactive, écrit les journaux en JSON et lit l'adresse du client dans les en-têtes transmis par le proxy.

## 4. Frontend

Réglages du service : dossier racine `club-informatique-frontend` ; construction par le `Dockerfile` (gardes, construction Angular, puis image Nginx) ; sonde `/sante` ; domaine public généré ou personnalisé.

| Variable | Valeur |
|---|---|
| `API_URL` | adresse interne du backend, sans barre finale : `http://<nom du service backend>.railway.internal:8080` |

`PORT` est fourni par l'hébergeur. La construction pré-rend onze pages publiques à adresse fixe (accueil, présentation, bureau, listes, pages légales), puis inscrit dans chaque page la feuille de style et le script du thème (`deploiement/optimiser-pages.mjs`). Nginx sert ces pages telles quelles et, pour toute autre adresse, la page d'entrée de l'application ; il applique la compression, un cache d'un an pour les fichiers à empreinte, la revalidation systématique des pages, les en-têtes de sécurité, et sert `robots.txt` et `sitemap.xml` (`deploiement/nginx.conf.template`, `deploiement/en-tetes.conf`).

## 5. Ordre de mise en ligne

1. Créer la base, puis le service backend avec ses variables et son volume ; attendre la sonde verte.
2. Créer le service frontend avec `API_URL` ; générer son domaine public.
3. Reporter ce domaine dans `CORS_ALLOWED_ORIGINS` et `APP_FRONTEND_URL` du backend ; redéployer le backend.
4. Dérouler les vérifications ci-dessous.

## 6. Vérifications en ligne

| Vérification | Attendu |
|---|---|
| `GET https://<site>/sante` | `ok` |
| `GET https://<site>/api/v1/actuator/health` | `{"status":"UP"}` |
| `GET https://<site>/robots.txt` et `/sitemap.xml` | adresses en `https` sur le domaine public ; espace connecté et API exclus |
| Page d'accueil | logo, favicon, polices et pictogrammes affichés ; aucune erreur dans la console du navigateur |
| En-têtes de la page d'accueil | `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Cache-Control: no-cache` ; fichiers à empreinte en `immutable` |
| Connexion du Super Admin d'amorçage | redirection vers le choix du mot de passe ; cookie `club_session` marqué `HttpOnly`, `Secure`, `SameSite=Strict` |
| Formulaire de contact | message enregistré ; courriel reçu par le club ; accusé de réception reçu par l'expéditeur |
| Dépôt d'un fichier (support de cours ou photo de profil) | fichier téléchargeable après un redéploiement du backend (volume persistant) |
| Écran « Supervision technique » (DSI) | contrôles conformes, hors sauvegarde tant que la première n'est pas faite |

Le pas à pas des réglages qui suivent la mise en ligne (Super Admin, domaine du backend, volume, courriels, sauvegarde, dépannage) est dans [mise-en-service.md](mise-en-service.md).

Le **Root Directory** de chaque service doit désigner son dossier (`club-informatique-backend` ou `club-informatique-frontend`) : sinon Railway ignore son `railway.toml` et garde les réglages saisis dans le tableau de bord (sonde de santé notamment).

Consigner dans `docs/PROGRESSION.md` l'adresse du site, la version déployée (identifiant du commit) et le résultat de chaque vérification.

## 7. Sauvegarde planifiée

Planifier `club-informatique-backend/scripts/sauvegarde.sh` (au moins une fois par semaine) depuis un environnement qui dispose des outils clients de PostgreSQL 16 et des variables de connexion à la base : tâche planifiée de l'hébergeur ou poste d'administration. Le script inscrit son résultat dans l'application ; au-delà de huit jours sans sauvegarde réussie, le contrôle de conformité le signale. Conserver les fichiers hors de l'hébergeur. Procédure et test de restauration : `docs/exploitation.md`.

## 8. Fin des essais

Si des comptes de test ont été créés en ligne (`APP_SEED_TEST_ACCOUNTS=true`), les retirer par un démarrage avec `APP_PURGE_TEST_ACCOUNTS=true` et `APP_SEED_TEST_ACCOUNTS=false`, puis remettre `APP_PURGE_TEST_ACCOUNTS=false`. Vérifier sur l'écran de la DSI que le contrôle « Aucun compte de test présent » est conforme.

## 9. Retour arrière

Depuis l'onglet des déploiements du service concerné, redéployer la version précédente. Une version antérieure du backend fonctionne avec un schéma plus récent tant qu'aucune migration n'a retiré une colonne qu'elle utilise. Ce n'est pas le cas de la première mise en ligne de cette version (la migration V5 retire les colonnes de la double authentification) : revenir à l'ancien backend exige alors de restaurer la sauvegarde prise avant la mise en ligne (`scripts/restauration.sh`).
