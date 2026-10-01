# Registre des décisions

Dernière mise à jour : 1er octobre 2026 (Phase 1, socle).

## 1. Sources lues et consignes du README de la maquette

Documents lus intégralement : `maquette-html/README.md`, `Cahier_des_charges_Club_Informatique.md`, `use-cases.md`, `uc-general-club-informatique.puml`, `club_informatique_diagramme_classes.drawio`, `club_informatique_diagrammes_sequence.drawio` (six diagrammes), `GUIDE_DEPLOIEMENT_RAILWAY.md`, ainsi que les 67 écrans, `tokens.css`, `main.css`, `theme.js` et `nav.js`.

Le dossier de la maquette se nomme `maquette-html` (et non `maquette.html`) ; le CDC, `use-cases.md` et les diagrammes se trouvent à côté de ce dossier et non à l'intérieur.

| Consigne du README | Effet |
|---|---|
| Palette, polices, flou de 14 px, motif circuit | conforme à la charte ; le thème sombre ajoute `#070D1E` comme fond d'application (repris) |
| Bascule de thème mémorisée dans `localStorage` | reprise (clé de préférence d'affichage uniquement, aucun jeton) |
| « Responsive de 360 à 1 920 px » | non vérifié dans les faits : variantes mobiles à dériver (`ecarts-maquette.md`, E-03) |
| Logo officiel `logo.png`, 1 254 × 1 254 px | fichier retenu (voir 4) |

Aucune consigne du README n'entre en conflit avec le cadrage du projet.

## 2. Conflits entre documents et règle appliquée

| Sujet | Document | Cadrage du projet | Règle appliquée en attendant |
|---|---|---|---|
| Authentification à deux facteurs | CDC : obligatoire pour les rôles d'administration | aucune interface 2FA | aucune interface ; fondations conservées |
| Photo des membres du bureau | CDC : photo, fonction, biographie | pas de photo | avatars neutres |
| Coût BCrypt | CDC : au moins 12 ; code : 10 | coût mesuré | mesure en Phase 3, cible 12 si la connexion reste sous 500 ms |
| Dépôt | CDC : privé | public | public ; vigilance accrue sur les secrets |
| Statistiques de visites | CDC : visites et taux de conversion | aucune donnée inventée, aucun script tiers | non affichées tant qu'aucune mesure réelle n'existe |
| Hébergement | CDC : serveur Linux ou mutualisé | Railway | Railway |
| Fil des publications | CDC : « fil d'actualité » exclu, « annonces » souhaitées ; maquette : fil social | pages « publications » citées dans l'ordre de construction | décision D-01 |

## 3. Environnement relevé

| Outil | Version | Remarque |
|---|---|---|
| Node.js | 24.18.0 | version LTS |
| npm | 11.16.0 | |
| Java | 21.0.12 sur le `PATH` ; Maven utilise le JDK 17.0.12 | le backend cible Java 17 |
| Maven | 3.9.16 | pas de Gradle (non requis) |
| Docker | 29.8.0, moteur actif | Testcontainers utilisable |
| Git | 2.55.0 | |
| GitHub CLI | absent | nécessaire en Phase 6 pour la pull request, ou ouverture depuis l'interface web |
| Playwright | 1.63.0 (Chromium) | utilisé pour les captures de référence |

## 4. Décisions techniques

| N° | Décision | Justification |
|---|---|---|
| T-01 | Angular 22 (dernière version stable : 22.2.1) | compatible avec Node 24 ; version à confirmer par `ng version` à l'initialisation |
| T-02 | Tailwind CSS 4 (4.3.3), jetons dans `@theme`, valeurs exactes de `tokens.css` | section 5.2 |
| T-03 | Icônes : famille Feather (licence MIT), importée icône par icône dans un sprite SVG local généré par script. La comparaison des tracés a reconnu 40 pictogrammes de la maquette comme strictement identiques à Feather ; deux pictogrammes absents de Feather (toque, journal) sont repris tels quels de la maquette. Marques : Simple Icons pour WhatsApp, Facebook et TikTok ; le glyphe LinkedIn, retiré de la version courante de Simple Icons, est repris de sa dernière version publiée sous licence CC0 | section 7.6.1 : reproduction à l'identique ; une famille unique couvre aussi les remplacements d'emoji |
| T-04 | Logo : `maquette-html/assets/img/logo.png` (1 254 × 1 254 px, opaque sur fond blanc), copié sous `logo.png` ; `logo.jpeg` ignoré | résolution suffisante pour l'icône de 512 px ; affiché dans un conteneur blanc comme dans la maquette |
| T-05 | Même origine : le conteneur frontend sert l'application et relaie `/api` | section 5.6 ; supprime les pré-vérifications CORS |
| T-06 | Captures de référence dans `docs/maquette-ref/` : 204 images (67 écrans et le sommaire, deux thèmes à 1 440 px, thème sombre à 390 px), 64 Mo | volume important : versionnement à confirmer (D-10) |
| T-07 | Base de données : PostgreSQL (moteur déjà en place) ; version des routes sous `/api/v1` | section 9.3 ; à confirmer en Phase 2 |
| T-09 | Angular 22.2 sans `zone.js` (mode sans zone, valeur par défaut de la version) ; `OnPush` et signaux partout ; tests unitaires avec Vitest (exécuteur par défaut du CLI) | section 5.1 ; toutes les dépendances (CDK compris) fonctionnent sans zone |
| T-10 | Rendu : application servie côté client pour le socle ; le pré-rendu statique des routes publiques sera ajouté et mesuré lors de la construction des pages publiques | section 5.8 : décision à fonder sur une mesure |
| T-11 | Script de thème externe (`theme-init.js`) chargé avant le rendu | évite le scintillement et reste compatible avec une politique CSP sans script en ligne |
| T-12 | Logo d'interface servi en 88 et 176 px générés par script à partir de `branding/logo.png` (original de 1,15 Mo non servi) | performance ; le logo n'est ni redessiné ni recadré |
| T-13 | Polices : fichiers woff2 (latin et latin étendu) copiés par script dans `public/fonts` avec des noms stables, pour permettre le préchargement des deux polices critiques | section 5.5 |
| T-14 | Recette des pages en Phase 1 : chaque page est exercée contre le backend existant et une base PostgreSQL réelle lorsque le point d'accès existe et fonctionne (connexion, inscription, demande de réinitialisation). Les états que le backend actuel ne peut pas produire (point d'accès absent ou en erreur, chargement, panne) sont provoqués par interception de la requête dans l'outil de recette (`e2e/`), avec des réponses conformes au contrat cible. Aucune de ces réponses ne figure dans le code livré (`src/`). La preuve de connexion réelle de chaque page est apportée en Phase 4 | sections 8.1.6, 10.7.3 et 11.12 |
| T-15 | Captures de recette (`docs/recette/**/*.png`) conservées hors Git comme les captures de référence : environ 6 Mo par page. Les journaux, eux, sont versionnés ; les captures se régénèrent par `node e2e/recette-page.mjs <id>` | volume |
| T-16 | Transition d'authentification : tant que le backend renvoie le jeton de rafraîchissement dans le corps de la réponse, le frontend le garde en mémoire uniquement ; la session ne survit donc pas à un rechargement de page avant la reprise du backend (cookie `HttpOnly`) | section 5.6 : aucun jeton dans un stockage du navigateur |
| T-17 | Pages légales : références vérifiées le 1er octobre 2026 sur le texte officiel de la loi n° 001-2021/AN du 30 mars 2021 (site de l'Assemblée nationale, `assembleenationale.bf`) : consentement (article 13), information (16), accès (17), opposition (20), rectification et suppression (21), oubli (22), sécurité (24), durée de conservation (25), déclaration auprès de l'autorité de contrôle (27), transfert vers un pays étranger (42), création de la Commission de l'informatique et des libertés (45). Un hébergement hors du Burkina Faso relève de l'article 42 : point à instruire par le club (C.4, C.5) | section 8.8.2 |
| T-18 | Base locale de recette : conteneur PostgreSQL 16, backend existant, six comptes d'essai (un par rôle, domaine `.invalid`) et contenus d'essai créés par l'API réelle (`e2e/seed-recette.mjs`). Les rôles des comptes d'essai sont attribués en base, le backend actuel n'offrant aucun amorçage d'administrateur | sections 10.7.3 et 8.9 |
| T-19 | Espace Membre : les inscriptions du membre portent, dans le contrat, `formationId`, `formationSlug`, `evenementSlug` et `lieu`, et acceptent les filtres `type` et `statut`. Tant que le backend ne les fournit pas, le frontend retrouve la formation par sa session dans le catalogue publié, n'affiche ni lieu ni lien de détail, et revérifie le filtre sur la page reçue | le produit reste exact avec le backend existant ; les besoins sont repris en Phase 2 |
| T-20 | Paramètres du compte : préférences de notification (`GET` et `PUT /users/me/preferences`), copie des données (`GET /users/me/export`) et suppression du compte (`POST /users/me/suppression`, confirmée par le mot de passe) sont des points d'accès à créer ; la recette les vérifie sur le contrat (T-14) et montre l'état d'erreur avec le backend actuel | UC-07, UC-13, BNF-09 et droits de la loi n° 001-2021/AN |
| T-21 | Un échec du renouvellement de session au démarrage n'affiche plus de notification d'erreur : l'utilisateur est simplement considéré comme déconnecté | le backend existant répond 500 sans jeton de rafraîchissement ; le message n'avait aucun sens pour l'utilisateur |
| T-22 | Espace Formateur : la liste des cours s'appuie sur `GET /formations/admin/all`, que le serveur doit restreindre aux cours du formateur connecté et filtrer par état de publication (`publie`). En attendant, le frontend ne retient que les cours dont le formateur est l'utilisateur et revérifie le filtre. La création réelle de cours, de séances, de devoirs et de ressources est prouvée par le script de peuplement, qui appelle les mêmes points d'accès avec les mêmes corps ; la recette n'en crée pas à chaque passage pour ne pas multiplier les données d'essai | exactitude avec le backend existant ; besoins repris en Phase 2 (B-10) |
| T-23 | Gestion des événements : le calendrier demande les événements du mois affiché (`du`, `au`), bornes à ajouter côté serveur ; en attendant, il ne retient que ceux dont la date de début tombe dans le mois. L'export CSV des inscrits est produit dans le navigateur à partir de la liste chargée (séparateur point-virgule, cellules commençant par un caractère de formule neutralisées) | D-06 retenue ; aucune donnée ne quitte le poste du Responsable |
| T-08 | Référence visuelle des modales, onglets et notifications : valeurs de `main.css` lignes 943 à 1 104 | défaut de la maquette (E-07) |

Vérifications en ligne reportées à la phase qui les utilise : textes de la loi n° 001-2021/AN et autorité de contrôle (Phase 1, pages légales) ; offres gratuites des fournisseurs de courriel transactionnel (Phase 3) ; mode zoneless et rendu pré-généré d'Angular 22 (Phase 1).

## 5. Décisions soumises à l'utilisateur

La Phase 0 a été validée le 1er octobre 2026 sans réserve exprimée sur ces points : les propositions ci-dessous sont appliquées par défaut et restent révisables sur simple demande.

| N° | Question | Proposition |
|---|---|---|
| D-01 | Écrans 23 et 24 (fil social avec mentions « J'aime », commentaires, partage) : le CDC exclut le fil d'actualité social | fil des publications internes en lecture seule (annonces réservées aux membres), sans réactions ni commentaires |
| D-02 | Éditeur de publication par blocs glisser-déposer (écran 44) | éditeur de texte structuré avec image de couverture, même mise en page |
| D-03 | Remise et évaluation des devoirs (écrans 29, 30, 35) | hors périmètre : consultation et téléchargement seulement |
| D-04 | Champs de profil GitHub, LinkedIn, compétences | non repris (minimisation des données, BNF-09) |
| D-05 | Champs de cours « Code module », « Filières recommandées », « Volume horaire », syllabus | reprendre durée, niveau, prérequis, capacité et lieu (CDC) ; syllabus en pièce jointe ; pas de code module |
| D-06 | Export CSV des inscrits et fichier iCalendar d'un événement | à retenir : fonctions simples, sans donnée inventée |
| D-07 | Matrice des permissions modifiable (écran 53) | matrice en lecture seule reflétant les droits effectifs ; attribution des rôles aux utilisateurs conservée |
| D-08 | Champs du formulaire d'inscription | nom, prénom, courriel, filière (saisie libre), mot de passe, confirmation, consentement ; date de naissance et téléphone facultatifs ou retirés selon votre choix |
| D-09 | Sauvegarde depuis l'interface (écran 56) | sauvegarde par script et tâche planifiée hors application ; l'écran affiche l'état réel de la dernière sauvegarde enregistrée |
| D-10 | Versionnement des 64 Mo de captures de référence | les conserver hors Git (dossier ignoré) et ne versionner que `styles-calcules.json` et `rapport-capture.json` |
| D-11 | Compte Super Admin créé par la migration V2 avec un mot de passe publié | changer ce mot de passe immédiatement sur toute instance déployée ; neutralisation par migration en Phase 3 |
| D-12 | Mesures de la section 6.12 non automatisées (voir 6) | contrôle manuel à chaque commit en attendant l'installation du crochet par l'utilisateur |
| D-13 | « Bureau » regroupé sous « Présentation » dans l'en-tête (sept entrées au lieu de huit) | à valider au point d'arrêt 2 sur capture |

## 6. Discrétion de l'historique (section 6.12)

| Mesure | État |
|---|---|
| Branche de travail `refonte/frontend-v2` | créée à partir de `main` (`a7eba0c`) |
| Historique existant de `main` | 20 commits, un seul auteur, aucune occurrence des motifs de l'annexe F dans les messages et les auteurs |
| Crochet `commit-msg` local | non installé : l'opération a été refusée par le contrôle d'autorisations de l'environnement d'exécution |
| Exclusions locales dans `.git/info/exclude` | non appliquées (même refus) |
| Désactivation de l'attribution automatique | non appliquée (même refus) |
| Mesure compensatoire | chaque commit est préparé par ajout explicite des chemins (jamais d'ajout global), son message est rédigé sans mention interdite, et la vérification de l'annexe F.2 est exécutée sur l'historique de la branche après chaque commit ; les fichiers de pilotage ne sont jamais ajoutés à l'index |

La recherche de l'annexe F dans les fichiers suivis de `main` renvoie des correspondances sans rapport avec le sujet (sous-chaînes dans des fichiers binaires et dans `package-lock.json` ; méthode `getAllMessages` du module de contact, dont le nom contient fortuitement l'un des motifs ; nom d'une catégorie de contenu dans la migration V2 et dans l'ancien frontend). Elles seront traitées avant la Phase 6 : l'ancien frontend disparaît en Phase 1 ; la méthode sera renommée lors de la reprise du module de contact ; la migration V2, déjà appliquée, ne peut pas être modifiée et constituera une exception documentée de la vérification finale.
