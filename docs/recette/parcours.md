# Parcours utilisateur complets (section 12)

Date : 2026-10-02. Produit par `node e2e/parcours.mjs`.

Pile réelle : base PostgreSQL vierge au départ (migrations appliquées au démarrage), backend construit (fichier JAR),
courriels capturés par le serveur de test, frontend de production construit et servi par Nginx sur `http://localhost:4300` (image du déploiement).
Démarrage du backend sur base vierge, migrations comprises : 18.6 s.

Chaque parcours est joué dans un navigateur neuf. Les comptes des rôles Formateur, Responsable, Administrateur et DSI sont les comptes de test
(marqués « test », domaine `.invalid`) ; le Visiteur devient un membre réel par l’inscription ; le Super Admin est celui de l’amorçage.
Par parcours : captures numérotées et trace Playwright dans `docs/recette/parcours/<nom>/` (fichiers non versionnés, reproductibles par la commande ci-dessus).

## Verdict : conforme

| Parcours | Largeur | Étapes réussies | Verdict |
|---|---|---|---|
| 12.10 Base vide : tous les écrans sans aucun contenu | 1280 px | 10 sur 10 | conforme |
| 12.2 Visiteur | 1280 px | 14 sur 14 | conforme |
| 12.4 Formateur | 1280 px | 11 sur 11 | conforme |
| 12.5 Responsable du Club | 1280 px | 11 sur 11 | conforme |
| 12.3 Membre | 1280 px | 11 sur 11 | conforme |
| 12.6 Administrateur | 1280 px | 9 sur 9 | conforme |
| 12.8 DSI | 1280 px | 3 sur 3 | conforme |
| 12.11 Appareils : parcours principaux à 360 pixels | 360 px | 9 sur 9 | conforme |
| 12.11 Appareils : parcours principaux à 768 pixels | 768 px | 9 sur 9 | conforme |
| 12.9 Cas négatifs | 1280 px | 10 sur 10 | conforme |
| 12.7 Super Admin : amorçage, réglages, retrait des comptes de test | 1280 px | 11 sur 11 | conforme |

## 12.10 Base vide : tous les écrans sans aucun contenu

Dossier : `docs/recette/parcours/base-vide/` (trace : `trace.zip`). Verdict : conforme.

| Nº | Étape | Résultat | Capture |
|---|---|---|---|
| 1 | La base ne contient aucun contenu : toutes les listes publiques du serveur sont vides | conforme | `01.png` |
| 2 | Écrans publics parcourus sur base vide, sans erreur de console | conforme : 15 écrans | `02.png` |
| 3 | Écrans du rôle « membre » parcourus sur base vide, sans erreur de console | conforme : 10 écrans | `03.png` |
| 4 | Écrans du rôle « formateur » parcourus sur base vide, sans erreur de console | conforme : 4 écrans | `04.png` |
| 5 | Écrans du rôle « responsable » parcourus sur base vide, sans erreur de console | conforme : 9 écrans | `05.png` |
| 6 | Écrans du rôle « admin » parcourus sur base vide, sans erreur de console | conforme : 7 écrans | `06.png` |
| 7 | Écrans du rôle « superadmin » parcourus sur base vide, sans erreur de console | conforme : 1 écrans | `07.png` |
| 8 | Écrans du rôle « dsi » parcourus sur base vide, sans erreur de console | conforme : 1 écrans | `08.png` |
| 9 | Chaque nombre affiché vient d’une réponse du serveur ou d’un texte fixe justifié | conforme : 47 écrans relevés | `09.png` |
| 10 | Accueil sur base vide : les sections sans donnée sont masquées | conforme | `10.png` |

## 12.2 Visiteur

Dossier : `docs/recette/parcours/visiteur/` (trace : `trace.zip`). Verdict : conforme.

| Nº | Étape | Résultat | Capture |
|---|---|---|---|
| 1 | Accueil : la page s’affiche avec l’en-tête, le pied de page et un seul logo dans l’en-tête | conforme | `01.png` |
| 2 | Pages publiques et légales, par les liens de l’en-tête et du pied de page | conforme : 11 pages ouvertes | `02.png` |
| 3 | Thème : bascule, puis persistance après rechargement | conforme : thème dark conservé | `03.png` |
| 4 | Contact : message envoyé, courriel reçu par le club, accusé de réception reçu par l’expéditeur | conforme : courriel au club « Message de contact : Demande d’information murk3swj » ; accusé « Nous avons bien reçu votre message » | `04.png` |
| 5 | Le message apparaît dans l’espace d’administration, à l’écran des messages de contact | conforme | `05.png` |
| 6 | Inscription : filière en saisie libre, consentement explicite, écran « Vérifiez votre boîte de réception » | conforme | `06.png` |
| 7 | Connexion refusée tant que l’adresse n’est pas vérifiée | conforme | `07.png` |
| 8 | Vérification de l’adresse par le lien reçu par courriel | conforme | `08.png` |
| 9 | Connexion : arrivée sur le tableau de bord du membre, aucun jeton dans le stockage du navigateur | conforme | `09.png` |
| 10 | Profil : consultation, modification de la filière et de la présentation, valeurs relues sur le profil | conforme | `10.png` |
| 11 | Déconnexion : retour au site, l’espace n’est plus accessible | conforme | `11.png` |
| 12 | Mot de passe oublié : demande, courriel reçu, nouveau mot de passe enregistré | conforme | `12.png` |
| 13 | Le lien de réinitialisation ne sert qu’une fois | conforme | `13.png` |
| 14 | L’ancien mot de passe est refusé, le nouveau ouvre la session | conforme | `14.png` |

## 12.4 Formateur

Dossier : `docs/recette/parcours/formateur/` (trace : `trace.zip`). Verdict : conforme.

| Nº | Étape | Résultat | Capture |
|---|---|---|---|
| 1 | Connexion du formateur : arrivée sur son tableau de bord | conforme | `01.png` |
| 2 | Création d’un cours en brouillon : il n’apparaît pas au catalogue public | conforme | `02.png` |
| 3 | Planification de deux séances | conforme | `03.png` |
| 4 | Dépôt d’un support (fichier PDF) depuis le détail du cours | conforme | `04.png` |
| 5 | Publication du cours : il apparaît au catalogue public | conforme | `05.png` |
| 6 | Modification du cours : la fiche publique reprend la nouvelle valeur | conforme | `06.png` |
| 7 | Un membre s’inscrit à la première séance depuis la fiche publique (second navigateur) | conforme : inscription confirmée, support téléchargé à l’identique | `07.png` |
| 8 | Le formateur consulte ses inscrits et pointe les présences de la séance | conforme | `08.png` |
| 9 | Retrait d’une séance (avec confirmation) | conforme | `09.png` |
| 10 | Retrait d’une formation du catalogue : un cours publié est dépublié et disparaît de la page publique | conforme | `10.png` |
| 11 | Un formateur ne modifie pas le cours d’un autre : refus du serveur | conforme : seul un formateur crée un cours (403 pour le responsable) | `11.png` |

## 12.5 Responsable du Club

Dossier : `docs/recette/parcours/responsable/` (trace : `trace.zip`). Verdict : conforme.

| Nº | Étape | Résultat | Capture |
|---|---|---|---|
| 1 | Connexion du responsable : arrivée sur le tableau de bord de gestion | conforme | `01.png` |
| 2 | Événement : création et publication, visible à la page publique | conforme | `02.png` |
| 3 | Événement : modification du lieu | conforme | `03.png` |
| 4 | Événement : suppression avec confirmation, retrait de la page publique | conforme | `04.png` |
| 5 | Publication publique avec image de couverture déposée : visible sur le site, image servie à tous | conforme | `05.png` |
| 6 | Publication réservée aux membres : absente du site public, présente dans les publications des membres | conforme | `06.png` |
| 7 | Publication : retrait puis nouvelle publication depuis la liste | conforme | `07.png` |
| 8 | Bureau : ajout de deux membres, modification d’une fonction, retrait d’un membre ; page publique sans photo | conforme | `08.png` |
| 9 | Inscriptions : événement complet, liste d’attente, promotion par le responsable | conforme : promotion automatique à la libération de la place | `09.png` |
| 10 | Projets : une proposition est approuvée, une autre rejetée avec motif ; l’auteur est notifié | conforme | `10.png` |
| 11 | Notification globale : envoi avec confirmation, reçue par les membres | conforme | `11.png` |

## 12.3 Membre

Dossier : `docs/recette/parcours/membre/` (trace : `trace.zip`). Verdict : conforme.

| Nº | Étape | Résultat | Capture |
|---|---|---|---|
| 1 | Connexion du membre : tableau de bord | conforme | `01.png` |
| 2 | Consultation des formations, des événements et des publications réservées aux membres | conforme | `02.png` |
| 3 | Inscription à une séance de formation : confirmée | conforme | `03.png` |
| 4 | Inscription à un événement complet : liste d’attente | conforme | `04.png` |
| 5 | Mes inscriptions : statuts réels, filtre, annulation de l’inscription en liste d’attente | conforme | `05.png` |
| 6 | Suivi : le support de la formation suivie est accessible et se télécharge | conforme | `06.png` |
| 7 | Notifications : non lues comptées, lecture d’une notification, puis de toutes | conforme | `07.png` |
| 8 | Photo de profil : dépôt d’une image, affichée sur le profil ; un fichier qui n’est pas une image est refusé | conforme | `08.png` |
| 9 | Proposition d’un projet : enregistrée, en attente de décision dans « Mes projets » | conforme | `09.png` |
| 10 | Paramètres : préférence de courriel modifiée ; copie des données personnelles téléchargée | conforme | `10.png` |
| 11 | Les écrans des autres rôles sont refusés, dans le navigateur comme par le serveur | conforme : 9 écrans et 5 points d’accès refusés | `11.png` |

## 12.6 Administrateur

Dossier : `docs/recette/parcours/administrateur/` (trace : `trace.zip`). Verdict : conforme.

| Nº | Étape | Résultat | Capture |
|---|---|---|---|
| 1 | Connexion de l’administrateur : tableau de bord d’administration | conforme | `01.png` |
| 2 | Utilisateurs : recherche d’un compte, ouverture de sa fiche | conforme | `02.png` |
| 3 | Compte : modification de la filière, attribution du rôle Formateur | conforme | `03.png` |
| 4 | Compte : suspension (la connexion est refusée), puis réactivation | conforme | `04.png` |
| 5 | Invitation : la personne invitée reçoit un lien, choisit son mot de passe et accède à l’espace de son rôle | conforme | `05.png` |
| 6 | Messages de contact : le message du visiteur est consulté puis marqué comme traité | conforme | `06.png` |
| 7 | Journal d’audit : les actions sensibles du parcours y figurent ; filtres par compte et par résultat | conforme | `07.png` |
| 8 | Catégories : création puis suppression | conforme | `08.png` |
| 9 | Les écrans du Super Admin et de la DSI sont refusés à l’administrateur | conforme | `09.png` |

## 12.8 DSI

Dossier : `docs/recette/parcours/dsi/` (trace : `trace.zip`). Verdict : conforme.

| Nº | Étape | Résultat | Capture |
|---|---|---|---|
| 1 | Connexion de la DSI : supervision technique | conforme | `01.png` |
| 2 | État technique : chaque contrôle calculé par le serveur est affiché avec son résultat | conforme : 9 contrôles, dont 4 non conformes sur la pile locale (comptes de test présents, cookie non sécurisé hors HTTPS) | `02.png` |
| 3 | Journal consulté par la DSI ; les écrans d’administration lui sont refusés | conforme : aucune demande de support ni de maintenance au cahier des charges : rien à gérer au-delà de la consultation | `03.png` |

## 12.11 Appareils : parcours principaux à 360 pixels

Dossier : `docs/recette/parcours/appareil-360/` (trace : `trace.zip`). Verdict : conforme.

| Nº | Étape | Résultat | Capture |
|---|---|---|---|
| 1 | Visiteur : accueil, puis pages publiques par le menu de l’en-tête et le pied de page | conforme | `01.png` |
| 2 | Visiteur : détail d’une formation et d’une actualité | conforme | `02.png` |
| 3 | Inscription, vérification de l’adresse par courriel, connexion | conforme | `03.png` |
| 4 | Membre : inscription à une formation depuis sa fiche, puis « Mes inscriptions » par le menu de l’espace | conforme | `04.png` |
| 5 | Membre : notifications lues, profil modifié avec photo | conforme | `05.png` |
| 6 | Membre : paramètres, puis déconnexion par le menu de l’espace | conforme | `06.png` |
| 7 | Formateur : mes cours, détail d’un cours, feuille d’émargement | conforme | `07.png` |
| 8 | Responsable : tableau de bord, création d’un événement, inscriptions | conforme | `08.png` |
| 9 | Administrateur : tableau de bord, liste des comptes (tableau défilant), journal d’audit | conforme | `09.png` |

## 12.11 Appareils : parcours principaux à 768 pixels

Dossier : `docs/recette/parcours/appareil-768/` (trace : `trace.zip`). Verdict : conforme.

| Nº | Étape | Résultat | Capture |
|---|---|---|---|
| 1 | Visiteur : accueil, puis pages publiques par le menu de l’en-tête et le pied de page | conforme | `01.png` |
| 2 | Visiteur : détail d’une formation et d’une actualité | conforme | `02.png` |
| 3 | Inscription, vérification de l’adresse par courriel, connexion | conforme | `03.png` |
| 4 | Membre : inscription à une formation depuis sa fiche, puis « Mes inscriptions » par le menu de l’espace | conforme | `04.png` |
| 5 | Membre : notifications lues, profil modifié avec photo | conforme | `05.png` |
| 6 | Membre : paramètres, puis déconnexion par le menu de l’espace | conforme | `06.png` |
| 7 | Formateur : mes cours, détail d’un cours, feuille d’émargement | conforme | `07.png` |
| 8 | Responsable : tableau de bord, création d’un événement, inscriptions | conforme | `08.png` |
| 9 | Administrateur : tableau de bord, liste des comptes (tableau défilant), journal d’audit | conforme | `09.png` |

## 12.9 Cas négatifs

Dossier : `docs/recette/parcours/cas-negatifs/` (trace : `trace.zip`). Verdict : conforme.

| Nº | Étape | Résultat | Capture |
|---|---|---|---|
| 1 | Page protégée sans session : renvoi à la connexion, puis retour à la page demandée | conforme | `01.png` |
| 2 | Mauvais rôle : la page est refusée dans le navigateur et la requête par le serveur | conforme | `02.png` |
| 3 | Champs invalides : refusés dans le formulaire sans appel au serveur, et par le serveur lui-même | conforme | `03.png` |
| 4 | Doublons : seconde inscription avec une adresse existante (réponse identique, aucun second compte), double inscription à une activité | conforme : réponse identique à l’inscription, courriel « déjà un compte », 409 pour la double inscription | `04.png` |
| 5 | Téléversement refusé : type (extension, puis contenu réel) et taille | conforme | `05.png` |
| 6 | Rotation du jeton de rafraîchissement : chaque renouvellement le remplace ; un ancien jeton rejoué ferme la session | conforme | `06.png` |
| 7 | Jeton d’accès expiré : renouvelé sans interruption ; sans cookie de session, retour à la connexion | conforme | `07.png` |
| 8 | Limitation de débit : au-delà du quota, la connexion et le formulaire de contact répondent 429 et l’interface l’explique | conforme | `08.png` |
| 9 | Protection anti-spam du contact : champ piège et saisie trop rapide sont écartés sans enregistrement | conforme : réponses 204 et 204, aucun enregistrement | `09.png` |
| 10 | Coupure du backend : état d’erreur avec « Réessayer », puis reprise au retour du service | conforme | `10.png` |

## 12.7 Super Admin : amorçage, réglages, retrait des comptes de test

Dossier : `docs/recette/parcours/super-admin/` (trace : `trace.zip`). Verdict : conforme.

| Nº | Étape | Résultat | Capture |
|---|---|---|---|
| 1 | Amorçage vérifié en base : un seul Super Admin réel, créé au démarrage, mot de passe à changer | conforme | `01.png` |
| 2 | Première connexion : changement de mot de passe imposé, aucune autre page ni requête n’est permise | conforme | `02.png` |
| 3 | Choix du mot de passe : l’initial erroné est refusé, puis le changement réussit | conforme | `03.png` |
| 4 | Réglages : le seuil de verrouillage modifié est réellement appliqué par le serveur | conforme | `04.png` |
| 5 | Compte verrouillé : signalé parmi les alertes de sécurité, déverrouillé depuis sa fiche | conforme | `05.png` |
| 6 | Rôles du plus haut niveau : le Super Admin attribue le rôle Administrateur et le rôle DSI | conforme | `06.png` |
| 7 | Mode maintenance : activé avec confirmation, le site répond 503 aux visiteurs ; puis désactivé | conforme | `07.png` |
| 8 | Sauvegardes : l’écran affiche le résultat réel d’une sauvegarde faite par le script d’exploitation | conforme | `08.png` |
| 9 | Retrait des comptes de test : exécuté, vérifié en base ; les comptes réels et leur contenu subsistent | conforme : 6 comptes de test retirés, 5 comptes réels conservés | `09.png` |
| 10 | Retrait rejoué : comptes de test recréés puis retirés de nouveau, sans effet sur les comptes réels | conforme | `10.png` |
| 11 | Après le retrait, le Super Admin réel administre toujours la plateforme | conforme | `11.png` |

## Relevé de la base vide : nombres affichés par écran

Un nombre affiché est admis s’il figure dans une réponse du serveur reçue par l’écran ou dans un texte fixe justifié (`e2e/parcours/base-vide.mjs`).

| Écran | Rôle | Nombres affichés | Sans origine |
|---|---|---|---|
| `/` | visiteur | aucun | aucun |
| `/presentation` | visiteur | aucun | aucun |
| `/bureau` | visiteur | aucun | aucun |
| `/actualites` | visiteur | aucun | aucun |
| `/evenements` | visiteur | aucun | aucun |
| `/projets` | visiteur | aucun | aucun |
| `/formations` | visiteur | aucun | aucun |
| `/ressources` | visiteur | aucun | aucun |
| `/contact` | visiteur | 226, 64, 93, 15, 57, 75, 54, 52, 59, 55, 63, 37, 24 | aucun |
| `/connexion` | visiteur | aucun | aucun |
| `/inscription` | visiteur | aucun | aucun |
| `/mot-de-passe-oublie` | visiteur | aucun | aucun |
| `/mentions-legales` | visiteur | 1, 2, 3, 4, 5, 2026, 226, 75, 54, 52, 59, 55, 63, 37, 24 | aucun |
| `/confidentialite` | visiteur | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 2026, 2021, 30, 13, 25, 42, 24, 16, 17, 20, 21, 22, 27 | aucun |
| `/conditions-utilisation` | visiteur | 1, 2, 3, 4, 5, 6, 7, 2026 | aucun |
| `/espace/membre` | membre | aucun | aucun |
| `/espace/publications` | membre | aucun | aucun |
| `/espace/inscriptions` | membre | aucun | aucun |
| `/espace/supports` | membre | aucun | aucun |
| `/espace/projets` | membre | aucun | aucun |
| `/espace/projets/proposer` | membre | aucun | aucun |
| `/espace/notifications` | membre | aucun | aucun |
| `/espace/profil` | membre | 2, 2026 | aucun |
| `/espace/profil/modifier` | membre | 2, 500 | aucun |
| `/espace/parametres` | membre | aucun | aucun |
| `/espace/formateur` | formateur | aucun | aucun |
| `/espace/formateur/cours` | formateur | aucun | aucun |
| `/espace/formateur/cours/nouveau` | formateur | 500 | aucun |
| `/espace/formateur/projets` | formateur | 0 | aucun |
| `/espace/gestion` | responsable | 0 | aucun |
| `/espace/gestion/actualites` | responsable | aucun | aucun |
| `/espace/gestion/actualites/nouvelle` | responsable | 500, 10 | aucun |
| `/espace/gestion/evenements` | responsable | 2026, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31 | aucun |
| `/espace/gestion/projets` | responsable | 0 | aucun |
| `/espace/gestion/inscriptions` | responsable | aucun | aucun |
| `/espace/gestion/bureau` | responsable | aucun | aucun |
| `/espace/gestion/notifications` | responsable | aucun | aucun |
| `/espace/admin/messages` | responsable | aucun | aucun |
| `/espace/admin` | admin | 1, 0, 2, 2026, 22, 50, 49 | aucun |
| `/espace/admin/utilisateurs` | admin | 2, 10, 2026 | aucun |
| `/espace/admin/roles` | admin | aucun | aucun |
| `/espace/admin/categories` | admin | aucun | aucun |
| `/espace/admin/statistiques` | admin | 1, 0 | aucun |
| `/espace/admin/securite` | admin | aucun | aucun |
| `/espace/admin/journal` | admin | 2, 10, 2026, 22, 50, 127, 0, 1, 49, 6 | aucun |
| `/espace/systeme` | superadmin | 1, 0 | aucun |
| `/espace/dsi` | dsi | 1, 0, 21, 12, 10, 8, 2, 2026, 22, 50, 127, 49 | aucun |
