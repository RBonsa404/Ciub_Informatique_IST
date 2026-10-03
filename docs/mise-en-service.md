# Mise en service pas à pas

Ce guide accompagne les réglages à faire une fois les trois services en ligne sur Railway (base, `club-backend`, `club-frontend`). Chaque étape se termine par une vérification. Les noms de menus sont ceux du tableau de bord Railway.

Aucune valeur secrète n'est écrite ici : mots de passe, clés et identifiants se saisissent uniquement dans l'onglet **Variables** des services.

| Étape | Objet | Durée indicative |
|---|---|---|
| [1](#1-contrôler-les-réglages-des-services) | Contrôler les réglages des services | 5 min |
| [2](#2-première-connexion-du-super-admin) | Première connexion du Super Admin | 5 min |
| [3](#3-retirer-les-variables-damorçage) | Retirer les variables d'amorçage | 2 min |
| [4](#4-supprimer-le-domaine-public-du-backend) | Supprimer le domaine public du backend | 2 min |
| [5](#5-volume-persistant-des-fichiers-déposés) | Volume persistant des fichiers déposés | 10 min |
| [6](#6-envoi-des-courriels) | Envoi des courriels | 15 min |
| [7](#7-sauvegarde-de-la-base) | Sauvegarde de la base | 15 min |
| [8](#8-comptes-de-test) | Comptes de test | 5 min |
| [9](#9-en-cas-de-problème) | En cas de problème | |

---

## 1. Contrôler les réglages des services

Ouvrir le projet sur Railway, puis chaque service, onglet **Settings**.

| Réglage | `club-backend` | `club-frontend` |
|---|---|---|
| Source → **Root Directory** | `club-informatique-backend` | `club-informatique-frontend` |
| Deploy → **Healthcheck Path** | `/api/v1/actuator/health/liveness` | `/sante` |
| Deploy → **Serverless** (mise en veille) | désactivé | indifférent |
| Networking → **Public Networking** | aucun domaine (voir l'étape 4) | domaine public, port `8080` |

Le dossier racine compte : c'est lui qui fait lire à Railway le fichier `railway.toml` du service (sonde, délai, redémarrage).

Puis, onglet **Variables** de `club-backend`, vérifier la présence de :

| Variable | Valeur attendue |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `PORT` | `8080` |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` |
| `SPRING_DATASOURCE_USERNAME` | `${{Postgres.PGUSER}}` |
| `SPRING_DATASOURCE_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
| `JWT_SECRET` | chaîne aléatoire d'au moins 64 caractères (voir ci-dessous) |
| `CORS_ALLOWED_ORIGINS` | adresse publique exacte du site, sans barre finale : `https://<domaine du site>` |
| `APP_FRONTEND_URL` | la même adresse |

`Postgres` est le nom du service de base dans le projet ; s'il porte un autre nom, l'adapter dans les références `${{…}}`.

Pour produire un `JWT_SECRET`, dans un terminal Git Bash :

```bash
openssl rand -base64 48
```

Changer ce secret plus tard déconnecte tous les utilisateurs ; ce n'est pas grave, mais à éviter sans raison.

Onglet **Variables** de `club-frontend` :

| Variable | Valeur attendue |
|---|---|
| `API_URL` | `http://club-backend.railway.internal:8080` |

`club-backend` est le nom du service tel qu'il apparaît sur sa carte ; `http` et non `https` (réseau privé) ; pas de barre finale.

**Vérification.** Dans un navigateur, ouvrir `https://<domaine du site>/api/v1/actuator/health`. La réponse doit contenir `"status":"UP"`.

---

## 2. Première connexion du Super Admin

Au premier démarrage, le backend crée le compte Super Admin à partir de deux variables de `club-backend` : `APP_BOOTSTRAP_ADMIN_EMAIL` (adresse) et `APP_BOOTSTRAP_ADMIN_PASSWORD` (mot de passe initial, douze caractères au moins). Si elles n'étaient pas renseignées au démarrage, les ajouter maintenant ; Railway redéploie le service, et le compte est créé au démarrage suivant.

1. Ouvrir `https://<domaine du site>/connexion`.
2. Saisir l'adresse et le mot de passe initial, puis **Se connecter**.
3. Le site ouvre l'écran **Choix du mot de passe** (`/espace/mot-de-passe`). Tant que ce choix n'est pas fait, le compte n'accède à rien d'autre.
4. Saisir le mot de passe initial, puis un nouveau mot de passe d'au moins douze caractères, différent du premier, deux fois.
5. Valider. Le site ouvre l'espace d'administration.

Conserver le nouveau mot de passe dans un gestionnaire de mots de passe : il n'est écrit nulle part ailleurs.

**Vérification.**

- La barre latérale propose l'administration (utilisateurs, rôles, statistiques, journal d'audit) et la configuration du système.
- Dans **Journal d'audit**, la connexion et le changement de mot de passe apparaissent.
- Facultatif : dans les outils de développement du navigateur (F12, onglet **Application** → **Cookies**), le cookie `club_session` est marqué `HttpOnly`, `Secure` et `SameSite=Strict`.

Pour donner des droits à d'autres membres : ils s'inscrivent eux-mêmes sur `/inscription`, puis le Super Admin leur attribue un rôle dans **Administration → Utilisateurs**.

---

## 3. Retirer les variables d'amorçage

Une fois le mot de passe changé, les deux variables ne servent plus. Les laisser en place exposerait inutilement le mot de passe initial.

1. `club-backend` → **Variables**.
2. Sur la ligne `APP_BOOTSTRAP_ADMIN_PASSWORD`, menu **⋮** → **Delete**. Faire de même pour `APP_BOOTSTRAP_ADMIN_EMAIL`.
3. Cliquer sur **Deploy** dans le bandeau qui récapitule les changements.

**Vérification.** Après le redéploiement, la connexion avec le nouveau mot de passe fonctionne toujours. Le retrait des variables ne touche pas au compte : il empêche seulement d'en créer un autre au démarrage.

---

## 4. Supprimer le domaine public du backend

Le site relaie déjà `/api` vers le backend par le réseau privé de Railway. Un domaine public sur le backend ouvrirait une seconde porte d'entrée vers l'API, inutile et non prévue par les règles d'origine (CORS).

Ne faire cette étape qu'après avoir vérifié que `https://<domaine du site>/api/v1/actuator/health` répond `UP` (étape 1).

1. `club-backend` → **Settings** → **Networking** → **Public Networking**.
2. Sur la ligne du domaine `club-backend-production-….up.railway.app`, cliquer sur l'icône de corbeille, puis confirmer.
3. Ne pas toucher à **Private Networking** : c'est l'adresse `club-backend.railway.internal` utilisée par le site.

**Vérification.**

- `https://<domaine du site>/api/v1/actuator/health` répond toujours `UP`.
- L'ancienne adresse du backend ne répond plus (page d'erreur de Railway).

---

## 5. Volume persistant des fichiers déposés

Les photos de profil, supports de cours et rendus de devoirs sont enregistrés sur disque. Sans volume, ils disparaissent à chaque redéploiement.

1. Dans la vue du projet, clic droit sur la carte `club-backend` → **Attach volume** (ou bouton **+ Create** → **Volume**, puis choisir `club-backend`).
2. **Mount path** : `/app/uploads`. Valider.
3. `club-backend` → **Variables** : `STORAGE_TYPE` = `local` et `UPLOAD_DIR` = `/app/uploads`.
4. Déployer.

L'application tourne dans son conteneur sous un utilisateur sans privilège, alors que Railway crée le volume au nom de l'administrateur du système. Si le dépôt d'un fichier échoue (message d'erreur à l'envoi, ligne `AccessDeniedException` ou `Permission denied` dans **Deploy Logs**), ajouter la variable `RAILWAY_RUN_UID` = `0` sur `club-backend` et redéployer.

**Vérification.**

1. Connecté, ouvrir **Profil → Modifier** et déposer une photo (JPEG, PNG ou WebP).
2. `club-backend` → **Deployments** → menu **⋮** du dernier déploiement → **Redeploy**.
3. Après le redémarrage, recharger le profil : la photo est toujours là.

---

## 6. Envoi des courriels

Le site envoie des courriels pour la vérification d'adresse à l'inscription, la réinitialisation du mot de passe, les accusés de réception du formulaire de contact et les rappels. Il faut un serveur SMTP.

### 6.1 Choisir un fournisseur

| Fournisseur | Hôte | Port | Remarques |
|---|---|---|---|
| Compte Gmail du club | `smtp.gmail.com` | `587` | demande la validation en deux étapes sur le compte Google, puis un « mot de passe d'application » (Compte Google → Sécurité → Mots de passe des applications) ; volume quotidien limité |
| Service d'envoi transactionnel (Brevo, Mailjet, etc.) | indiqué par le service | `587` | identifiants fournis par le service ; adresse d'expédition à valider chez lui |

Selon l'offre souscrite, Railway peut bloquer les connexions SMTP sortantes. Si aucun courriel ne part alors que les réglages sont justes, consulter la page « Outbound networking » de la documentation Railway et l'offre du compte.

### 6.2 Renseigner les variables de `club-backend`

| Variable | Valeur |
|---|---|
| `MAIL_HOST` | hôte du fournisseur |
| `MAIL_PORT` | `587` |
| `MAIL_USERNAME` | identifiant SMTP (pour Gmail : l'adresse complète) |
| `MAIL_PASSWORD` | mot de passe SMTP (pour Gmail : le mot de passe d'application, sans espaces) |
| `MAIL_SMTP_AUTH` | `true` |
| `MAIL_SMTP_STARTTLS` | `true` |
| `MAIL_FROM` | adresse d'expédition (pour Gmail : la même adresse que `MAIL_USERNAME`) |
| `CONTACT_EMAIL` | adresse du club qui reçoit les messages du formulaire de contact |

Déployer.

**Vérification.**

1. Sur `https://<domaine du site>/contact`, envoyer un message avec une adresse personnelle.
2. L'adresse `CONTACT_EMAIL` reçoit le message ; l'adresse personnelle reçoit un accusé de réception.
3. Le message apparaît aussi dans **Administration → Messages**.
4. Si rien n'arrive : `club-backend` → **Deploy Logs**, rechercher `mail` ou `SMTP`. Un message `Authentication failed` désigne l'identifiant ou le mot de passe ; un délai dépassé (`timeout`) désigne un blocage réseau.

---

## 7. Sauvegarde de la base

Railway ne remplace pas une sauvegarde conservée ailleurs. Le script `club-informatique-backend/scripts/sauvegarde.sh` produit un fichier de sauvegarde complet et inscrit son résultat dans l'application ; l'écran **Supervision technique** (DSI) signale toute absence de sauvegarde réussie depuis plus de huit jours.

### 7.1 Préparer le poste qui sauvegarde

1. Installer les outils clients de PostgreSQL 16 (`pg_dump` et `psql`), par exemple avec l'installateur officiel de PostgreSQL en ne cochant que **Command Line Tools**.
2. Sur Railway, ouvrir le service de base → **Settings** → **Networking** → **TCP Proxy** : Railway y donne un hôte et un port joignables depuis l'extérieur. Les activer s'ils n'existent pas.
3. Le service de base → **Variables** donne `PGUSER`, `PGPASSWORD` et `PGDATABASE`.

### 7.2 Lancer une sauvegarde

Dans Git Bash, depuis le dossier `club-informatique-backend` :

```bash
PGHOST=<hôte du TCP Proxy> PGPORT=<port du TCP Proxy> PGUSER=<PGUSER> PGPASSWORD=<PGPASSWORD> PGDATABASE=<PGDATABASE> DOSSIER_SAUVEGARDES="$HOME/sauvegardes-club" ./scripts/sauvegarde.sh
```

Le fichier produit contient des données personnelles : le conserver dans un espace à accès restreint, jamais dans le dépôt.

### 7.3 Planifier

Une sauvegarde par semaine au moins : tâche planifiée Windows (Planificateur de tâches) lançant la commande ci-dessus, ou rappel dans l'agenda d'un membre du bureau. La procédure de restauration et son test sont décrits dans [exploitation.md](exploitation.md).

**Vérification.** Dans l'espace DSI, **Supervision technique** : le contrôle de sauvegarde est conforme et indique la date de la dernière sauvegarde.

---

## 8. Comptes de test

À ne faire que pendant la période d'essai. Les comptes et leurs identifiants sont listés dans le [README](../README.md#comptes-de-test).

### 8.1 Créer les comptes

1. Choisir deux mots de passe d'au moins douze caractères, différents l'un de l'autre : un pour les comptes du bureau, un pour les comptes d'essai confiés aux étudiants. Le second circulera plus largement : il ne doit jamais ouvrir un compte du bureau.
2. `club-backend` → **Variables** :

   | Variable | Valeur |
   |---|---|
   | `APP_SEED_TEST_ACCOUNTS` | `true` |
   | `APP_TEST_ACCOUNTS_PASSWORD` | mot de passe des comptes du bureau |
   | `APP_TRIAL_ACCOUNTS_PASSWORD` | mot de passe des comptes d'essai |

3. Déployer. Au démarrage, **Deploy Logs** affiche « 7 compte(s) de test créé(s) », puis « 4 compte(s) de test créé(s) ».
4. Transmettre les identifiants et les mots de passe par message privé (jamais dans un groupe public, jamais dans le dépôt).

**Vérification.** Se connecter sur `/connexion` avec `christ-orient.salou@recette.invalid`, puis avec `essai1@recette.invalid` : chacun arrive sur l'espace Membre.

Ces comptes n'entrent dans aucune statistique et ne reçoivent aucun courriel. Un compte de test ne compte pas comme Super Admin réel : il n'empêche pas l'amorçage du premier Super Admin (étape 2).

### 8.2 Changer un mot de passe

Les comptes déjà créés gardent leur mot de passe : modifier la variable ne suffit pas. Il faut retirer les comptes (8.3), puis les recréer (8.1) avec la nouvelle valeur. Les contenus créés par les comptes de test disparaissent avec eux.

### 8.3 Retirer les comptes en fin d'essai

1. `APP_SEED_TEST_ACCOUNTS` = `false` et `APP_PURGE_TEST_ACCOUNTS` = `true`. Déployer. Les comptes de test et tout ce qu'ils ont créé sont retirés ; l'opération est inscrite au journal d'audit.
2. Remettre `APP_PURGE_TEST_ACCOUNTS` = `false`, supprimer `APP_TEST_ACCOUNTS_PASSWORD` et `APP_TRIAL_ACCOUNTS_PASSWORD`. Déployer.

**Vérification.** Dans l'espace DSI, le contrôle « Aucun compte de test présent » est conforme.

---

## 9. En cas de problème

| Symptôme | Cause probable | Correction |
|---|---|---|
| Déploiement du backend en échec, sonde en 404 | adresse de sonde sans `/v1`, ou dossier racine non défini | étape 1 : **Root Directory** et **Healthcheck Path** |
| Site en 502 sur toutes les pages | domaine public du frontend dirigé vers un autre port | `club-frontend` → **Networking** : port `8080` |
| Pages affichées, mais `/api/…` en 500 | `API_URL` absente ou mal écrite (sans `http://`) | étape 1, variables du frontend |
| Pages affichées, mais `/api/…` en 502 | backend arrêté, ou port différent de celui d'`API_URL` | état du backend ; `PORT` = `8080` |
| Connexion refusée avec un message d'origine non autorisée | `CORS_ALLOWED_ORIGINS` différente de l'adresse du site | adresse exacte, avec `https://`, sans barre finale |
| Liens des courriels vers une mauvaise adresse | `APP_FRONTEND_URL` incorrecte | même valeur que l'adresse du site |
| Fichiers perdus après un redéploiement | pas de volume, ou volume monté ailleurs | étape 5 |

Pour revenir à une version précédente : service concerné → **Deployments** → menu **⋮** d'un déploiement réussi → **Redeploy**. Si la version en cause comportait une migration de base, la restauration de la dernière sauvegarde peut être nécessaire ([deploiement.md](deploiement.md), section « Retour arrière »).

Les journaux d'exécution se lisent dans **Deploy Logs** ; chaque requête y porte un identifiant, renvoyé au navigateur dans l'en-tête `X-Request-Id`, qui permet de retrouver une erreur signalée par un utilisateur ([exploitation.md](exploitation.md)).
