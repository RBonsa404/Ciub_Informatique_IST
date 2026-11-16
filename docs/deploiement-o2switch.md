# Tutoriel de mise en ligne : o2switch + Render + Supabase

Ce tutoriel met la plateforme du Club Informatique de l'IST en ligne, étape par étape, sans abonnement supplémentaire. Chaque étape se termine par une **vérification** : ne passez à la suivante que lorsqu'elle est verte.

Aucun mot de passe ni aucune clé n'est écrit dans ce document ni dans le dépôt : ils se saisissent uniquement dans les tableaux de bord (cPanel, Render, Supabase) et se conservent dans un gestionnaire de mots de passe (Bitwarden, Google Password Manager…).

Durée totale : environ 2 heures, dont une bonne part d'attente (construction, certificats, propagation DNS).

---

## 0. Comprendre l'ensemble

```
                    Visiteur
                       │
        https://informatique.ist-club.bf  (site, o2switch)
                       │  appels d'API
                       ▼
        https://api.ist-club.bf  (backend Spring Boot, Render)
              │                         │
              ▼                         ▼
   Base PostgreSQL (Supabase)   https://fichiers.ist-club.bf  (coffre à fichiers, o2switch)
                                        │
                                        ▼
                         ~/stockage-club  (photos, PDF, Word, PowerPoint…)
```

| Adresse | Rôle | Hébergeur | Dossier o2switch |
|---|---|---|---|
| `informatique.ist-club.bf` | Le site que voient les visiteurs | o2switch | `informatique.ist-club.bf` |
| `ist-club.bf` (et `www.`) | Redirige vers le site | o2switch | `ist-club.bf` |
| `api.ist-club.bf` | Le backend (comptes, actualités, formations…) | Render, offre gratuite | aucun |
| `fichiers.ist-club.bf` | Coffre à fichiers, utilisé seulement par le backend | o2switch | `fichiers.ist-club.bf/public` |
| (pas d'adresse publique) | Base de données | Supabase, offre gratuite | aucun |
| `…@ist-club.bf` | Messagerie du club | o2switch | aucun |

Pourquoi ce découpage :
- o2switch exécute PHP, Node.js, Python et Ruby, mais **pas Java** : le backend tourne donc chez Render.
- La base PostgreSQL d'o2switch n'accepte pas les connexions venant de l'extérieur : la base est chez Supabase. Elle ne contient que du texte (comptes, contenus, références des fichiers) : les 500 Mo gratuits suffisent largement.
- Les **fichiers** (jusqu'à 10 Mo chacun) sont rangés sur o2switch, dans un dossier hors du web, via le coffre à fichiers : l'espace disque d'o2switch est déjà payé.
- Le site et l'API sont sur le même domaine `ist-club.bf` : la connexion des membres fonctionne sans réglage particulier.

### Les fichiers à envoyer (préparés dans le dossier `deploiement-o2switch`)

```
deploiement-o2switch/
├── informatique.ist-club.bf/site-informatique-ist-club.zip   → le site
├── ist-club.bf/.htaccess                                      → la redirection du domaine
└── fichiers.ist-club.bf/
    ├── config-stockage-club.php                               → réglages du coffre (à compléter)
    └── public/  index.php, .htaccess, .user.ini               → le coffre
```

Les fichiers commençant par un point (`.htaccess`, `.user.ini`) sont **cachés** par défaut, dans Windows comme dans cPanel : pensez à afficher les fichiers cachés.

---

## 1. Préparer deux clés secrètes

Il faut deux longues chaînes aléatoires : une pour les sessions (`JWT_SECRET`), une pour le coffre (`STORAGE_RELAIS_CLE`). Dans **PowerShell** (menu Démarrer > PowerShell), coller cette commande et appuyer sur Entrée, **deux fois** :

```powershell
$b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); -join ($b | ForEach-Object { $_.ToString('x2') })
```

Chaque exécution affiche 96 caractères (chiffres et lettres de a à f). Enregistrer la première sous le nom « Club – JWT_SECRET » et la seconde sous « Club – clé du coffre » dans le gestionnaire de mots de passe.

**Vérification** : deux clés différentes, de 96 caractères, enregistrées.

---

## 2. Base de données : Supabase

1. Aller sur supabase.com, « Start your project », s'inscrire (le plus simple : « Continue with GitHub »).
2. « New project » :
   - Name : `club-informatique` ;
   - Database Password : « Generate a password », puis l'enregistrer (« Club – mot de passe base Supabase ») ;
   - Region : une région d'Europe (Paris ou Frankfurt) ;
   - plan Free. Valider et attendre 1 à 2 minutes.
3. Une fois le projet prêt, cliquer sur **Connect** (en haut de la page, à côté du nom du projet), puis choisir **Session pooler** (« Shared pooler », mode session). Ce mode est obligatoire : Render ne sait pas joindre l'autre mode (IPv6).
4. Relever, sans les modifier :
   - **host** : de la forme `aws-1-eu-west-3.pooler.supabase.com` (le chiffre du début ne se devine pas) ;
   - **port** : `5432` ;
   - **user** : `postgres.` suivi de l'identifiant du projet.
5. Composer l'adresse de connexion pour le backend :

   ```
   jdbc:postgresql://HOST:5432/postgres?sslmode=require
   ```

   en remplaçant `HOST` par l'hôte relevé. L'enregistrer avec l'utilisateur (« Club – connexion base »).

Les tables sont créées automatiquement au premier démarrage du backend : rien à importer.

Le stockage de fichiers de Supabase ne sert pas : les fichiers vont sur o2switch.

**Vérification** : vous avez l'adresse `jdbc:postgresql://…`, l'utilisateur `postgres.…` et le mot de passe.

---

## 3. o2switch : sous-domaines, certificats, version de PHP

### 3.1 Créer les sous-domaines

Pour chacun des deux sous-domaines : cPanel > **Domaines** > **Créer un domaine**.

| Domaine | « Partager la racine du document » | Racine du document |
|---|---|---|
| `informatique.ist-club.bf` | **décoché** | `informatique.ist-club.bf` |
| `fichiers.ist-club.bf` | **décoché** | `fichiers.ist-club.bf/public` |

La racine du document est le dossier dont le contenu est visible sur le web. Pour le coffre, c'est le sous-dossier `public` : son dossier parent `fichiers.ist-club.bf` reste invisible du web et accueillera le fichier de réglages contenant la clé.

Cliquer sur **Soumettre** à chaque fois.

`api.ist-club.bf` ne se crée **pas** ici : ce n'est pas un dossier o2switch, il pointera vers Render (étape 7).

### 3.2 Certificats HTTPS

cPanel > **Statut SSL/TLS** : cocher `ist-club.bf`, `www.ist-club.bf`, `informatique.ist-club.bf` et `fichiers.ist-club.bf`, puis **Exécuter AutoSSL**. Compter quelques minutes ; recharger la page jusqu'à voir des cadenas verts.

### 3.3 Version de PHP du coffre

cPanel > **Sélectionner une version de PHP** (ou « MultiPHP Manager ») : pour `fichiers.ist-club.bf`, choisir **PHP 8.2 ou plus récent** (le coffre en a besoin).

**Vérification** : cPanel > Domaines liste `informatique.ist-club.bf` et `fichiers.ist-club.bf` avec les bonnes racines ; les cadenas sont verts.

---

## 4. o2switch : le coffre à fichiers

### 4.1 Trouver son répertoire personnel

Page d'accueil de cPanel, panneau de droite « Informations générales » : relever le **Répertoire personnel**, de la forme `/home/abcd1234`.

### 4.2 Déposer le coffre

1. cPanel > **Gestionnaire de fichiers** ; en haut à droite, **Paramètres** > cocher **Afficher les fichiers cachés (dotfiles)** > Enregistrer.
2. Ouvrir le dossier `fichiers.ist-club.bf/public`. Le vider s'il contient des fichiers d'exemple (après les avoir regardés).
3. **Charger** les trois fichiers de `deploiement-o2switch/fichiers.ist-club.bf/public` : `index.php`, `.htaccess`, `.user.ini`.
4. Remonter d'un niveau, dans `fichiers.ist-club.bf`, et **charger** `config-stockage-club.php`.
5. Clic droit sur `config-stockage-club.php` > **Edit**, et remplacer :
   - `A_REMPLACER` par la **clé du coffre** (étape 1) ;
   - `/home/IDENTIFIANT/stockage-club` par votre répertoire personnel suivi de `/stockage-club` (exemple : `/home/abcd1234/stockage-club`).

   Enregistrer. Le dossier `stockage-club` se crée tout seul au premier usage, à la racine du compte, hors de toute adresse web.
6. Clic droit sur `config-stockage-club.php` > **Change Permissions** : `600` (lecture et écriture par le propriétaire seulement).

### 4.3 Tester le coffre

Dans PowerShell, en remplaçant `LA_CLE` par la clé du coffre :

```powershell
curl.exe -s -H "X-Cle-Stockage: LA_CLE" "https://fichiers.ist-club.bf/?action=sante"
```

Réponse attendue : `ok`.

Puis sans la clé :

```powershell
curl.exe -s "https://fichiers.ist-club.bf/?action=sante"
```

Réponse attendue : `refuse`.

| Réponse obtenue | Cause | Solution |
|---|---|---|
| `configuration absente` | `config-stockage-club.php` n'est pas dans le dossier parent de `public` | le déplacer dans `fichiers.ist-club.bf` (étape 4.2.4) |
| `configuration incomplete` | clé trop courte ou dossier vide | revoir l'étape 4.2.5 |
| `refuse` alors que la clé est fournie | clé mal recopiée (espace, guillemet) | recopier la clé dans le fichier et dans la commande |
| `dossier de stockage impossible a creer` | chemin du dossier erroné | vérifier `/home/…` (étape 4.1) |
| page d'erreur 500 sans texte | PHP trop ancien | étape 3.3 |
| erreur 403 ou 406 sur une page o2switch | pare-feu ModSecurity | cPanel > **ModSecurity** : désactiver pour `fichiers.ist-club.bf` |

**Vérification** : `ok` avec la clé, `refuse` sans.

---

## 5. o2switch : messagerie

1. cPanel > **Comptes de messagerie** > **Créer** :
   - `contact@ist-club.bf` : adresse publique du club, reçoit les messages du formulaire de contact ;
   - `ne-pas-repondre@ist-club.bf` : utilisée par le site pour envoyer les courriels automatiques.

   Mot de passe : bouton **Générer**, puis l'enregistrer.
2. Sur la ligne `ne-pas-repondre@`, **Connect Devices** (« Configurer le client de messagerie ») : relever, dans « Paramètres SSL/TLS sécurisés », le **serveur sortant (SMTP)** et son port.
3. cPanel > **Délivrabilité des e-mails** : pour `ist-club.bf`, SPF et DKIM doivent être valides ; sinon **Gérer** > **Installer l'enregistrement suggéré**.
4. Nom affiché : dans le webmail (Roundcube) de chaque boîte, Paramètres > Identités > Nom d'affichage « Club Informatique de l'IST ». Les courriels automatiques du site portent déjà ce nom.

**Vérification** : un courriel envoyé depuis le webmail de `contact@` vers un compte Gmail arrive en boîte de réception (pas en spam).

---

## 6. Backend : Render

### 6.1 Le code sur GitHub

Render construit le backend à partir du dépôt GitHub. La branche choisie doit contenir le mode de stockage `relais` (coffre à fichiers) et la configuration o2switch du site. Vérifier sur GitHub que la branche existe avant de continuer.

### 6.2 Créer le service

1. render.com > **Get Started** > s'inscrire avec **GitHub**. Si Render demande une carte bancaire, l'offre Free n'est pas débitée.
2. **New +** > **Web Service** > **Git Provider** : autoriser Render à lire le dépôt du club (bouton « Configure account » si le dépôt n'apparaît pas, puis sélectionner le dépôt).
3. Réglages :

| Champ | Valeur |
|---|---|
| Name | `club-informatique-api` |
| Language | **Docker** |
| Branch | la branche vérifiée à l'étape 6.1 |
| Region | **Frankfurt (EU Central)** |
| Root Directory | `club-informatique-backend` |
| Dockerfile Path | `./Dockerfile` |
| Instance Type | **Free** |

4. **Environment Variables** > « Add Environment Variable », une ligne par variable :

| Variable | Valeur |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `SPRING_DATASOURCE_URL` | l'adresse `jdbc:postgresql://…` de l'étape 2 |
| `SPRING_DATASOURCE_USERNAME` | `postgres.…` (étape 2) |
| `SPRING_DATASOURCE_PASSWORD` | mot de passe de la base Supabase |
| `DB_POOL_MAX` | `5` |
| `JWT_SECRET` | première clé de l'étape 1 |
| `CORS_ALLOWED_ORIGINS` | `https://informatique.ist-club.bf` |
| `APP_FRONTEND_URL` | `https://informatique.ist-club.bf` |
| `STORAGE_TYPE` | `relais` |
| `STORAGE_RELAIS_URL` | `https://fichiers.ist-club.bf/` |
| `STORAGE_RELAIS_CLE` | clé du coffre (étape 1), identique à celle de `config-stockage-club.php` |
| `MAIL_HOST` | serveur SMTP relevé à l'étape 5.2 |
| `MAIL_PORT` | `587` |
| `MAIL_USERNAME` | `ne-pas-repondre@ist-club.bf` |
| `MAIL_PASSWORD` | mot de passe de `ne-pas-repondre@` |
| `MAIL_SMTP_AUTH` | `true` |
| `MAIL_SMTP_STARTTLS` | `true` |
| `MAIL_FROM` | `ne-pas-repondre@ist-club.bf` |
| `CONTACT_EMAIL` | `contact@ist-club.bf` |
| `APP_BOOTSTRAP_ADMIN_EMAIL` | adresse du premier Super Admin (par exemple celle du président) |
| `APP_BOOTSTRAP_ADMIN_PASSWORD` | mot de passe provisoire, à changer à la première connexion |

5. **Advanced** > **Health Check Path** : `/api/v1/actuator/health/liveness`. Laisser **Auto-Deploy** activé.
6. **Deploy Web Service**.

### 6.3 Suivre le premier déploiement

L'onglet **Logs** défile : construction Maven (5 à 10 minutes la première fois), puis démarrage. Le déploiement est réussi lorsque :
- le journal contient `Started` (démarrage de Spring Boot) ;
- une ligne indique « coffre à fichiers de l'hébergement web, joignable » ;
- l'état du service passe à **Live**.

Ouvrir alors dans le navigateur `https://club-informatique-api.onrender.com/api/v1/actuator/health/liveness` (l'adresse exacte figure en haut de la page du service) : réponse `{"status":"UP"}`.

| Message dans les journaux | Cause | Solution |
|---|---|---|
| `password authentication failed` | utilisateur ou mot de passe de base erroné | revoir `SPRING_DATASOURCE_USERNAME` (avec `postgres.` devant) et le mot de passe |
| `Connection refused`, `Network is unreachable` | adresse de connexion directe au lieu du pooler | reprendre l'hôte « Session pooler » (étape 2.3) |
| `JWT_SECRET` ou « secret » obligatoire | variable absente | étape 6.2.4 |
| « coffre à fichiers injoignable » | adresse ou clé du coffre | refaire le test 4.3 ; comparer les deux clés |
| `OutOfMemoryError` | mémoire de l'offre gratuite | relancer (« Manual Deploy » > « Restart ») ; si cela se répète, me transmettre le journal |

Après toute modification de variable, Render redéploie automatiquement.

**Vérification** : `{"status":"UP"}` sur l'adresse `onrender.com`.

---

## 7. Relier `api.ist-club.bf` à Render

1. Render > service > **Settings** > **Custom Domains** > **Add Custom Domain** : `api.ist-club.bf`. Render affiche une cible de la forme `club-informatique-api.onrender.com`.
2. cPanel > **Zone Editor** (Éditeur de zone) > ligne `ist-club.bf` > **Gérer** > **Ajouter un enregistrement** :
   - Type : **CNAME** ;
   - Nom : `api.ist-club.bf.` (cPanel complète souvent tout seul) ;
   - Enregistrement : la cible donnée par Render.

   Enregistrer.
3. Revenir sur Render, **Verify**. Le certificat HTTPS s'émet ensuite automatiquement (de quelques minutes à quelques heures).

Contrôle de la propagation, dans PowerShell :

```powershell
nslookup api.ist-club.bf
```

La réponse doit mentionner `onrender.com`.

**Vérification** : `https://api.ist-club.bf/api/v1/actuator/health/liveness` répond `{"status":"UP"}`, avec un cadenas.

---

## 8. Le site

### 8.1 Construction (déjà faite pour la première mise en ligne)

L'archive `informatique.ist-club.bf/site-informatique-ist-club.zip` est prête. Pour la reconstruire après une modification du site :

```bash
cd club-informatique-frontend
npm ci
npm run build:o2switch
```

Puis compresser **le contenu** de `dist/club-informatique-frontend/browser` (pas le dossier lui-même, et fichier `.htaccess` compris).

### 8.2 Envoi

1. Gestionnaire de fichiers > dossier `informatique.ist-club.bf` ; le vider s'il contient des fichiers d'exemple.
2. **Charger** `site-informatique-ist-club.zip`, puis clic droit > **Extract** dans ce même dossier.
3. Vérifier la présence, à la racine du dossier, de `index.html`, `index.csr.html`, `.htaccess` et des dossiers `presentation`, `bureau`… Supprimer ensuite l'archive.

### 8.3 Redirection du domaine principal

1. Dossier `ist-club.bf` : regarder son contenu ; retirer les fichiers d'exemple éventuels.
2. Y **charger** le `.htaccess` de `deploiement-o2switch/ist-club.bf`.

Toute adresse de `ist-club.bf` renvoie alors vers la même page de `https://informatique.ist-club.bf`, tandis que `/webmail` et `/cpanel` continuent de fonctionner.

**Vérification** :
- `https://informatique.ist-club.bf` affiche l'accueil ;
- `http://ist-club.bf/bureau` mène à `https://informatique.ist-club.bf/bureau` ;
- la page Bureau affiche les membres (données venant de l'API).

---

## 9. Garder le backend éveillé

L'offre gratuite de Render endort le backend après 15 minutes sans visite ; le réveil prend jusqu'à une minute. Une tâche planifiée d'o2switch l'en empêche.

cPanel > **Tâches Cron** > « Ajouter une nouvelle tâche Cron » :
- Paramètres courants : **Toutes les 10 minutes** (`*/10 * * * *`) ;
- Commande :

```bash
curl -fsS -o /dev/null https://api.ist-club.bf/api/v1/actuator/health/liveness
```

Les 750 heures gratuites mensuelles de Render couvrent un service allumé en permanence (31 jours = 744 heures).

**Vérification** : après 30 minutes sans visite, le site répond immédiatement.

---

## 10. Recette finale

1. Ouvrir `https://informatique.ist-club.bf`, touche F12 > onglet **Console** : aucune erreur rouge mentionnant « CORS » ou « Content Security Policy ».
2. Se connecter avec le Super Admin (étape 6.2.4), changer le mot de passe demandé, recharger la page : la session est conservée.
3. Déposer une photo de profil, recharger : la photo s'affiche. Dans le Gestionnaire de fichiers, le dossier `stockage-club/<année>/<mois>` contient un fichier.
4. Publier une ressource PDF ou PowerPoint (moins de 10 Mo), puis l'ouvrir.
5. Formulaire de contact : le message arrive dans `contact@ist-club.bf`.
6. Inscription d'un compte d'essai : le courriel de confirmation arrive (vérifier aussi les spams).
7. Render > Environment : **supprimer** `APP_BOOTSTRAP_ADMIN_EMAIL` et `APP_BOOTSTRAP_ADMIN_PASSWORD`.

Si les courriels n'arrivent pas et que les journaux Render mentionnent un délai dépassé vers le serveur SMTP, l'offre gratuite de Render bloque probablement le port 587 : créer un compte gratuit chez un service d'envoi qui accepte le port 2525 (Brevo, par exemple), puis remplacer `MAIL_HOST`, `MAIL_PORT` (`2525`), `MAIL_USERNAME` et `MAIL_PASSWORD` par ses paramètres. Ajouter l'enregistrement SPF qu'il indique dans l'Éditeur de zone.

---

## 11. Mises à jour

| Modification | Que faire |
|---|---|
| Backend | Envoyer le code sur la branche suivie par Render : le redéploiement est automatique (environ 5 minutes). |
| Site | `npm run build:o2switch`, compresser le contenu de `dist/club-informatique-frontend/browser`, remplacer le contenu du dossier `informatique.ist-club.bf` (étape 8.2). |
| Clé du coffre | Changer la clé dans `config-stockage-club.php` **et** dans `STORAGE_RELAIS_CLE` sur Render. |
| Sauvegarde des fichiers | Les sauvegardes automatiques d'o2switch couvrent `stockage-club`. Pour une copie manuelle : Gestionnaire de fichiers > `stockage-club` > Compress > télécharger l'archive. |
| Sauvegarde de la base | Supabase > Database > Backups (sauvegardes quotidiennes sur l'offre gratuite, conservées peu de temps) ; pour une copie durable : `pg_dump` avec l'adresse du pooler. |

---

## 12. Aide-mémoire des valeurs

| Valeur | Où elle sert | Où la retrouver |
|---|---|---|
| `JWT_SECRET` | Render | gestionnaire de mots de passe |
| Clé du coffre | Render (`STORAGE_RELAIS_CLE`) et `config-stockage-club.php` | gestionnaire de mots de passe |
| Hôte, utilisateur, mot de passe de la base | Render (`SPRING_DATASOURCE_*`) | Supabase > Connect > Session pooler ; gestionnaire |
| Mot de passe de `ne-pas-repondre@` | Render (`MAIL_PASSWORD`) | gestionnaire |
| Répertoire personnel o2switch | `config-stockage-club.php` | cPanel > Informations générales |
| Cible CNAME de l'API | Éditeur de zone | Render > Settings > Custom Domains |
