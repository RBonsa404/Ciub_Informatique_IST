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
| (pas d'adresse publique) | Envoi des courriels automatiques | Brevo, offre gratuite | aucun |
| `ist-club.bf` (et `www.`) | Redirige vers le site | o2switch | `ist-club.bf` |
| `api.ist-club.bf` | Le backend (comptes, actualités, formations…) | Render, offre gratuite | aucun |
| `fichiers.ist-club.bf` | Coffre à fichiers, utilisé seulement par le backend | o2switch | `fichiers.ist-club.bf/public` |
| (pas d'adresse publique) | Base de données | Supabase, offre gratuite | aucun |
| `…@informatique.ist-club.bf` | Messagerie du club (le domaine `ist-club.bf` reste disponible pour d'autres clubs) | o2switch | aucun |

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
├── render/variables-render.env                               → variables du backend (à compléter, puis supprimer)
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

Il s'agit de **sous-domaines** de `ist-club.bf` : rien n'est acheté. Selon la version de cPanel, le menu s'appelle :
- **Sous-domaines** (ancienne présentation) : champ « Sous-domaine » = `informatique` (puis `fichiers`), liste « Domaine » = `ist-club.bf` ;
- **Domaines** > **Créer un domaine** (nouvelle présentation) : saisir le nom complet ; cPanel reconnaît un sous-domaine de `ist-club.bf`, et il faut décocher « Partager la racine du document ».

| Sous-domaine | Racine du document |
|---|---|
| `informatique.ist-club.bf` | `informatique.ist-club.bf` |
| `fichiers.ist-club.bf` | `fichiers.ist-club.bf/public` |

cPanel propose une racine automatiquement : la corriger si elle diffère du tableau (en particulier le `/public` du second).

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

## 5. Messagerie : boîtes o2switch et envoi par Brevo

Deux services différents :
- **recevoir** les courriels (messages du formulaire de contact, correspondance du club) : boîtes o2switch ;
- **envoyer** les courriels automatiques du site (confirmation d'inscription, mot de passe oublié, notifications) : **Brevo**, service d'envoi gratuit (300 courriels par jour).

Pourquoi Brevo : l'offre gratuite de Render interdit les connexions sortantes sur les ports 465 et 587, ceux du serveur d'envoi d'o2switch. Brevo accepte le port **2525**, autorisé par Render.

### 5.1 Les boîtes o2switch

cPanel > **Comptes de messagerie** > **Créer**, pour chacune :
- Domaine : choisir **`informatique.ist-club.bf`** dans la liste (et non `ist-club.bf`) ;
- Nom d'utilisateur : `contact`, puis `ne-pas-repondre` ;
- Mot de passe : **Générer**, puis l'enregistrer dans le gestionnaire ;
- **Créer**.

| Adresse | Rôle |
|---|---|
| `contact@informatique.ist-club.bf` | adresse publique du club ; reçoit les messages du formulaire de contact |
| `ne-pas-repondre@informatique.ist-club.bf` | expéditeur des courriels automatiques du site ; reçoit les éventuelles réponses et retours d'erreur |

Puis cPanel > **Délivrabilité des e-mails** : sur la ligne `informatique.ist-club.bf`, si SPF ou DKIM n'est pas valide, **Gérer** > **Installer l'enregistrement suggéré**.

Webmail : cPanel > Comptes de messagerie > **Check Email** sur la ligne de l'adresse (choisir Roundcube si un choix est proposé). Nom affiché : Paramètres > Identités > Nom d'affichage « Club Informatique de l'IST ».

### 5.2 Le compte Brevo

1. brevo.com > **S'inscrire gratuitement**. Utiliser l'adresse `contact@informatique.ist-club.bf` (le courriel de confirmation arrive dans son webmail). Renseigner le profil demandé (organisation : Club Informatique de l'IST). Choisir l'offre **Free**.
2. **Authentifier le domaine d'envoi** : menu du compte (en haut à droite) > **Expéditeurs, domaines et IP dédiées** (Senders, Domains & Dedicated IPs) > onglet **Domaines** > **Ajouter un domaine** : `informatique.ist-club.bf`. Choisir l'authentification manuelle (« Authenticate the domain yourself »).
3. Brevo affiche plusieurs enregistrements DNS (un code Brevo en TXT, une ou deux clés DKIM, un DMARC). Pour **chacun** : cPanel > **Zone Editor** > ligne `ist-club.bf` > **Gérer** > **+ Ajouter un enregistrement**, puis recopier exactement le **Type**, le **Nom** (cPanel attend le nom complet, terminé par `ist-club.bf.`) et la **Valeur** donnés par Brevo. Enregistrer.
   - S'il existe déjà un enregistrement **DMARC** (`_dmarc.informatique.ist-club.bf`), ne pas en créer un second.
   - Les enregistrements SPF et DKIM installés par cPanel à l'étape 5.1 restent en place : ils servent aux envois depuis le webmail.
4. Revenir sur Brevo > **Authentifier** (ou « Vérifier »). La propagation prend de quelques minutes à quelques heures : réessayer plus tard si besoin, jusqu'à l'état **Authentifié**.
5. **Expéditeur** : même page, onglet **Expéditeurs** > **Ajouter un expéditeur** : nom `Club Informatique de l'IST`, adresse `ne-pas-repondre@informatique.ist-club.bf`. Valider avec le code reçu dans le webmail de cette adresse.
6. **Identifiants SMTP** : menu du compte > **SMTP et API** > onglet **SMTP** :
   - relever l'**Identifiant** (Login), de la forme `xxxxxx@smtp-brevo.com` ;
   - **Générer une nouvelle clé SMTP**, la nommer `render`, et l'enregistrer aussitôt dans le gestionnaire (elle ne s'affiche qu'une fois).

Les paramètres d'envoi sont alors : serveur `smtp-relay.brevo.com`, port `2525`, identifiant et clé SMTP ci-dessus.

**Vérification** : le domaine apparaît « Authentifié » et l'expéditeur « Vérifié » dans Brevo ; vous avez l'identifiant et la clé SMTP.

---

## 6. Backend : Render

Render construit le backend à partir du dépôt GitHub, dans un conteneur Docker, et le met en ligne. Compter 30 minutes, dont 10 d'attente pour la première construction.

### 6.1 Avant de commencer : rassembler les valeurs

Ouvrir le fichier `deploiement-o2switch/render/variables-render.env` avec le Bloc-notes (clic droit > Ouvrir avec > Bloc-notes). Il contient déjà toutes les variables. Remplacer chaque `A_REMPLIR` par la valeur indiquée dans le commentaire au-dessus :

| Variable | Valeur |
|---|---|
| `SPRING_DATASOURCE_PASSWORD` | mot de passe de la base Supabase (étape 2) |
| `JWT_SECRET` | première clé de l'étape 1 |
| `STORAGE_RELAIS_CLE` | clé du coffre, identique à celle de `config-stockage-club.php` (étape 4) |
| `MAIL_USERNAME` | identifiant SMTP Brevo, `…@smtp-brevo.com` (étape 5.2) |
| `MAIL_PASSWORD` | clé SMTP Brevo (étape 5.2) |
| `APP_BOOTSTRAP_ADMIN_EMAIL` | adresse du premier Super Admin, par exemple `president@informatique.ist-club.bf` |
| `APP_BOOTSTRAP_ADMIN_PASSWORD` | mot de passe provisoire de **12 caractères au moins**, à changer à la première connexion |

Règles de saisie : coller la valeur juste après le `=`, sans espace, sans guillemet ni apostrophe, et sans espace en fin de ligne. Enregistrer le fichier (Ctrl + S).

Les autres lignes (adresse de la base, adresses du site et du coffre, serveur Brevo…) sont déjà remplies : ne pas les modifier.

### 6.2 Créer le compte Render

1. Aller sur **https://dashboard.render.com/register**.
2. Cliquer sur **GitHub** et se connecter avec le compte GitHub qui possède le dépôt `Ciub_Informatique_IST`. Accepter l'autorisation demandée par Render.
3. Compléter les informations demandées (nom, usage). Si une carte bancaire est demandée, l'offre Free n'est pas débitée ; la documentation de Render indique qu'aucun paiement n'est nécessaire pour les ressources gratuites.

### 6.3 Créer le service web

1. Tableau de bord Render > bouton **+ New** (en haut à droite) > **Web Service**.
2. Source : onglet **Git Provider**. La liste des dépôts GitHub s'affiche.
   - Si `Ciub_Informatique_IST` n'y figure pas : lien **Configure account** (ou « Configure GitHub ») > GitHub s'ouvre > section **Repository access** > **Only select repositories** > choisir `Ciub_Informatique_IST` > **Save**. Revenir sur Render : le dépôt apparaît.
3. Cliquer sur **Connect** à côté de `Ciub_Informatique_IST`.
4. Remplir le formulaire, champ par champ :

| Champ | Valeur | Remarque |
|---|---|---|
| **Name** | `club-informatique-api` | donne l'adresse provisoire `club-informatique-api.onrender.com` (Render ajoute un suffixe si le nom est pris) |
| **Project** | laisser vide ou par défaut | |
| **Language** | **Docker** | obligatoire : le backend est construit par son `Dockerfile` |
| **Branch** | `deploiement/o2switch-render` | branche qui contient le coffre à fichiers |
| **Region** | **Frankfurt (EU Central)** | la plus proche de la base Supabase (Irlande) et d'o2switch (France) |
| **Root Directory** | `club-informatique-backend` | dossier du backend dans le dépôt |
| **Dockerfile Path** | `./Dockerfile` | chemin dans le dossier ci-dessus ; si Render propose `club-informatique-backend/Dockerfile`, garder sa proposition |
| **Instance Type** | **Free** (512 MB, 0.1 CPU) | |

5. Section **Environment Variables** : cliquer sur **Add from .env**. Coller **tout le contenu** du fichier `variables-render.env` rempli (Ctrl + A, Ctrl + C dans le Bloc-notes, puis Ctrl + V dans Render). Render découpe le texte en variables ; les lignes commençant par `#` sont ignorées. Valider (**Add variables**).

   Contrôle : la liste compte **21 variables** ; aucune valeur ne vaut `A_REMPLIR`.

6. Section **Advanced** (cliquer pour la déplier) :
   - **Health Check Path** : `/api/v1/actuator/health/liveness` ;
   - **Auto-Deploy** : **On Commit** (valeur par défaut) ;
   - ne rien mettre dans *Docker Command*, *Pre-Deploy Command*, *Secret Files*, *Disk*.
7. Cliquer sur **Create Web Service** (ou **Deploy Web Service**).

### 6.4 Suivre la construction et le démarrage

Render ouvre la page du service sur l'onglet **Logs**. Déroulement normal :

| Moment | Ce que montrent les journaux | Durée |
|---|---|---|
| Récupération du code | `Cloning from https://github.com/…` puis `Checking out commit …` | quelques secondes |
| Construction | lignes Docker (`load build definition from Dockerfile`, `RUN mvn …`), téléchargement des dépendances Maven | 5 à 10 minutes la première fois |
| Envoi de l'image | `Pushing image to registry…`, `Upload succeeded` | 1 minute |
| Démarrage | journaux de Spring Boot (au format JSON en production) ; migrations Flyway (`Migrating schema "public" to version …`) ; ligne « Stockage des fichiers : coffre à fichiers de l'hébergement web, joignable » ; puis `Started …` | 30 secondes à 1 minute |
| Mise en ligne | `Your service is live` ; l'état en haut de page passe à **Live** (vert) | |

Au premier démarrage, le backend crée toutes les tables dans Supabase et le compte Super Admin.

Tester ensuite, dans le navigateur, l'adresse affichée en haut de la page du service suivie du chemin de santé :

```
https://club-informatique-api.onrender.com/api/v1/actuator/health/liveness
```

Réponse attendue : `{"status":"UP"}`.

### 6.5 Si le déploiement échoue

L'état passe à **Failed** ; ouvrir l'onglet **Events** puis le déploiement en échec pour lire son journal. Chercher le premier message d'erreur :

| Message | Cause | Solution |
|---|---|---|
| `failed to read dockerfile` / `Dockerfile not found` | chemin du Dockerfile | Settings > Build & Deploy > **Dockerfile Path** : essayer `club-informatique-backend/Dockerfile` (ou l'inverse : `./Dockerfile`) |
| `password authentication failed for user` | utilisateur ou mot de passe de la base | vérifier `SPRING_DATASOURCE_USERNAME` (avec `postgres.` devant) et `SPRING_DATASOURCE_PASSWORD` |
| `Connection refused`, `Network is unreachable`, `UnknownHost` | adresse de la base | `SPRING_DATASOURCE_URL` doit contenir `pooler.supabase.com:5432` |
| `Tenant or user not found` | utilisateur sans l'identifiant du projet | `SPRING_DATASOURCE_USERNAME` = `postgres.doxxiasmhwaepxmzntzk` |
| `JWT_SECRET` obligatoire ou trop court | clé absente ou tronquée | recoller la clé de l'étape 1 |
| « coffre à fichiers injoignable » | clé ou certificat du coffre | refaire le test 4.3 sans `-k` ; comparer `STORAGE_RELAIS_CLE` et `config-stockage-club.php` |
| « Super Admin non créé : le mot de passe initial doit compter au moins 12 caractères » | mot de passe provisoire trop court | allonger `APP_BOOTSTRAP_ADMIN_PASSWORD` |
| `OutOfMemoryError` ou redémarrages en boucle | mémoire de l'offre gratuite | **Manual Deploy** > **Restart service** ; si cela se répète, transmettre le journal |
| `Timed out` sur le health check | démarrage trop lent | **Manual Deploy** > **Deploy latest commit** ; le démarrage prend normalement moins d'une minute |

Modifier une variable : menu de gauche **Environment** > crayon (**Edit**) à côté de la variable > nouvelle valeur > **Save Changes** > **Save and deploy** (redémarre avec les nouvelles valeurs, sans reconstruire).

Relancer : menu **Manual Deploy** (en haut à droite) : **Deploy latest commit** (reconstruire), **Clear build cache & deploy** (reconstruire de zéro), **Restart service** (redémarrer sans reconstruire).

**Vérification** : état **Live**, et `{"status":"UP"}` sur l'adresse `onrender.com`.

### 6.6 Après la mise en ligne

- Les journaux restent consultables 7 jours (menu **Logs**, bouton **Live tail** pour le direct).
- Chaque envoi de code sur la branche `deploiement/o2switch-render` déclenche un nouveau déploiement ; si le nouveau ne démarre pas, Render garde l'ancien en service.
- Limites de l'offre gratuite : mise en veille après 15 minutes sans requête (évitée à l'étape 9), 750 heures par mois, disque effacé à chaque redémarrage (sans conséquence : les fichiers sont dans le coffre o2switch, les données dans Supabase).

---

## 7. Relier `api.ist-club.bf` à Render

### 7.1 Déclarer le domaine chez Render

Page du service > menu de gauche **Settings** > descendre jusqu'à **Custom Domains** > **+ Add Custom Domain** > saisir `api.ist-club.bf` > **Save**.

Render affiche la ligne du domaine avec l'état « Pending » (ou « DNS update needed ») et la **cible** à utiliser, de la forme `club-informatique-api.onrender.com`. La copier.

### 7.2 Créer l'enregistrement DNS chez o2switch

cPanel > **Zone Editor** (Éditeur de zone) > ligne `ist-club.bf` > **Gérer** > **+ Ajouter un enregistrement** (flèche à côté de « Add Record », puis « Add CNAME Record » selon la version) :

| Champ | Valeur |
|---|---|
| Nom | `api.ist-club.bf.` (avec le point final ; cPanel le complète souvent tout seul) |
| TTL | laisser la valeur proposée |
| Type | **CNAME** |
| Enregistrement / Cible | la cible copiée chez Render, par exemple `club-informatique-api.onrender.com` |

**Save Record**. Ne pas créer d'enregistrement `A` ni `AAAA` pour `api`.

### 7.3 Vérifier

1. Contrôle de la propagation, dans PowerShell :

   ```powershell
   nslookup api.ist-club.bf 1.1.1.1
   ```

   La réponse doit mentionner `onrender.com`. Sinon, attendre quelques minutes.
2. Render > Settings > Custom Domains > bouton **Verify** à côté de `api.ist-club.bf`. L'état passe à **Verified**, puis Render émet le certificat HTTPS (« Certificate issued »), en quelques minutes.

**Vérification** : `https://api.ist-club.bf/api/v1/actuator/health/liveness` répond `{"status":"UP"}`, avec un cadenas. Une erreur 502 peut apparaître une ou deux minutes juste après la vérification : recharger.

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

Toute adresse de `ist-club.bf` renvoie alors vers la même page de `https://informatique.ist-club.bf`, tandis que `/webmail` et `/cpanel` continuent de fonctionner (de même sur `informatique.ist-club.bf`).

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
5. Formulaire de contact : le message arrive dans `contact@informatique.ist-club.bf`.
6. Inscription d'un compte d'essai : le courriel de confirmation arrive (vérifier aussi les spams).
7. Render > Environment : **supprimer** `APP_BOOTSTRAP_ADMIN_EMAIL` et `APP_BOOTSTRAP_ADMIN_PASSWORD`.

Si un courriel automatique n'arrive pas : Brevo > **Statistiques** > **E-mails transactionnels** > **Journaux** indique s'il a été envoyé, refusé ou classé en spam ; les journaux Render mentionnent les erreurs d'authentification SMTP (identifiant ou clé SMTP à revoir).

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
| Identifiant et clé SMTP Brevo | Render (`MAIL_USERNAME`, `MAIL_PASSWORD`) | Brevo > SMTP et API ; gestionnaire |
| Répertoire personnel o2switch | `config-stockage-club.php` | cPanel > Informations générales |
| Cible CNAME de l'API | Éditeur de zone | Render > Settings > Custom Domains |

---

## 13. Comptes du club

### 13.1 Comptes créés automatiquement

Au démarrage, le backend crée les comptes réels du club qui n'existent pas encore, tous en `@informatique.ist-club.bf` :

| Adresse | Titulaire | Rôles |
|---|---|---|
| `president@` | Abdoul Rachid BONSA | membre, bureau, administrateur, Super Admin |
| `vice-president@` | Prince Henri Junior PAMOUSSO | membre, bureau, administrateur |
| `secretariat@` | Hannifah OUEDRAOGO | membre, bureau |
| `tresorerie@` | Fode Sandrine KI | membre, bureau |
| `formation@` | Giles Christ-Orient SALOU | membre, bureau, formateur |
| `projets@` | Tony Darel ZONGO | membre, bureau |
| `communication@` | Davy Arnaud OUARE | membre, bureau |
| `partenariats@` | Ramatou SIDIBE | membre, bureau |
| `dsi@` | DSI du club | DSI |
| `sawadogof@`, `sawadogom@` | assistants DSI | DSI |

Mise en place :
1. cPanel > **Comptes de messagerie** : créer chacune de ces boîtes (domaine `informatique.ist-club.bf`). Sans boîte, le titulaire ne recevra ni notification, ni lien « mot de passe oublié ».
2. Render > **Environment** : ajouter `APP_INITIAL_ACCOUNTS_PASSWORD` = mot de passe provisoire commun (12 caractères au moins), **Save and deploy**.
3. Transmettre à chaque titulaire, en privé, son adresse et le mot de passe provisoire. À la première connexion, le site impose de choisir un mot de passe personnel.
4. Une fois tous les comptes utilisés, **supprimer** `APP_INITIAL_ACCOUNTS_PASSWORD` de Render. Un compte existant n'est jamais modifié par ce mécanisme ; les noms et prénoms se corrigent depuis le profil ou l'administration.

### 13.2 Retirer les comptes de test

Render > Environment : `APP_PURGE_TEST_ACCOUNTS` = `true`, **Save and deploy**. Au démarrage, le backend retire les comptes marqués « test » et leurs données. Remettre ensuite la variable à `false` (ou la supprimer). Les autres comptes indésirables se désactivent depuis l'administration (Utilisateurs > statut).

### 13.3 Utiliser les boîtes du club dans Outlook ou sur téléphone

cPanel > Comptes de messagerie > **Connect Devices** sur la ligne de l'adresse : relever les « Paramètres SSL/TLS sécurisés ». Dans Outlook (ou l'application Mail, Gmail…) : ajouter un compte, choisir **IMAP**, puis :
- serveur entrant : celui indiqué, port **993**, SSL/TLS ;
- serveur sortant (SMTP) : celui indiqué, port **465**, SSL/TLS, authentification requise ;
- identifiant : l'adresse complète ; mot de passe : celui de la boîte.

---

## 14. Être trouvé sur Google et partager le site

### 14.1 Google Search Console (indispensable)

1. search.google.com/search-console > **Ajouter une propriété** > type **Domaine** : `ist-club.bf`.
2. Google affiche un enregistrement **TXT** (`google-site-verification=…`) : cPanel > Zone Editor > `ist-club.bf` > + Ajouter un enregistrement **TXT**, nom `ist-club.bf.`, valeur copiée chez Google. Revenir sur Google > **Valider**.
3. Menu **Sitemaps** : envoyer `https://informatique.ist-club.bf/sitemap.xml`.
4. Menu **Inspection de l'URL** : saisir `https://informatique.ist-club.bf/` > **Demander l'indexation**. Recommencer pour `/presentation`, `/bureau`, `/formations`.

Faire de même sur Bing Webmaster Tools (bing.com/webmasters, bouton « Importer depuis Google Search Console »).

### 14.2 Ce qui fait remonter le site

- Des liens vers le site depuis des sites déjà connus : page de l'IST (demander un lien vers le club), profils LinkedIn, Facebook et TikTok du club (champ « site web »), descriptions des vidéos et des publications.
- Des actualités régulières sur le site (chaque article est une nouvelle page indexée).
- Le nom « Club Informatique de l'IST » écrit de la même façon partout.

Le positionnement prend de quelques jours à quelques semaines après l'indexation.

### 14.3 Miniature de partage

Le site fournit une image d'aperçu (1200 × 630). Si un ancien partage s'affiche sans miniature, l'aperçu a été mémorisé avant la mise en ligne complète :
- Facebook : developers.facebook.com/tools/debug > coller l'adresse > **Récupérer à nouveau** ;
- LinkedIn : linkedin.com/post-inspector > coller l'adresse > **Inspect** ;
- WhatsApp : partager l'adresse avec une variante (par exemple `https://informatique.ist-club.bf/?v=2`).
