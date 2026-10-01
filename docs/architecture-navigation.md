# Architecture de navigation et gabarits

Référence : `docs/inventaire-pages.md` pour les identifiants de page. Rôles : Visiteur (V), Membre (M), Formateur (F), Responsable du Club (R), Administrateur (A), Super Admin (SA), DSI (D).

## 1. Politique de visibilité

Une entrée de navigation est affichée si et seulement si les trois conditions sont réunies :

1. la page appartient au produit (catégories « produit » de l'inventaire) ;
2. l'utilisateur courant détient un rôle autorisé (hiérarchie : F et R héritent de M ; SA hérite de A ; D est indépendant) ;
3. le module correspondant est déclaré opérationnel par un indicateur de fonctionnalité.

Mise en œuvre prévue :

- un registre unique des entrées de navigation (libellé, icône, route, rôles, module) alimente l'en-tête, le pied de page, la barre latérale et le plan du site ; aucune liste de liens n'est écrite ailleurs ;
- les indicateurs de fonctionnalité sont définis dans la configuration d'environnement du frontend ; tous valent « désactivé » jusqu'à la validation de l'intégration du module (Phase 4) ; pendant la Phase 1, la page interne `/__design` et un environnement de développement permettent de les activer pour la recette visuelle ;
- une route sans entrée de navigation reste protégée par une garde (authentification, rôle, module) et par le contrôle d'accès du backend, qui fait seul autorité ;
- un module désactivé répond par la page « introuvable » plutôt que par un écran vide.

Modules : `contenu-public`, `actualites`, `evenements`, `formations`, `projets`, `ressources`, `contact`, `bureau`, `authentification`, `profil`, `inscriptions`, `supports`, `notifications`, `publications-membres` (soumis à la décision D-01), `gestion-club`, `administration`, `statistiques`, `systeme`, `conformite`.

## 2. Gabarits

### 2.1. Public

En-tête (design de l'écran 58, position collante, fond vitré, flou de 20 px) :

- à gauche : logo officiel dans son conteneur blanc de 44 px, « Club Informatique » et la ligne « Institut Supérieur de Technologie » ;
- navigation principale : Accueil, Présentation, Formations, Événements, Projets, Actualités, Contact ; chaque entrée dépend de son module. « Bureau » est regroupé sous Présentation (ancre et lien interne) afin de ramener la barre à sept entrées et de supprimer le chevauchement constaté à 1 440 px (E-04) ; « Ressources » est proposé dans le pied de page et depuis la page Formations ;
- à droite : bascule de thème (bouton à icône, nom accessible), puis « Connexion » et « Inscription » pour le visiteur (le libellé « Rejoindre » de la maquette devient « Inscription », conformément à la section 7.3) ; pour l'utilisateur connecté : « Mon espace » et menu de compte (profil, déconnexion) ;
- en deçà de 1 024 px : bouton de menu et tiroir latéral accessible (piège de focus, fermeture par Échap, restitution du focus), reprenant le style de l'écran 60.

Pied de page (design de l'écran 59, grille à quatre colonnes, puis deux, puis une) :

| Colonne | Contenu |
|---|---|
| Marque | logo, nom du club, présentation factuelle d'une phrase (fournie ou validée par le club), liens sociaux (WhatsApp, LinkedIn, Facebook, TikTok) |
| Navigation | Accueil, Présentation, Bureau, Formations, Événements, Projets, Actualités, Ressources (selon modules) |
| Informations légales | Mentions légales, Politique de confidentialité, Conditions d'utilisation (remplace la colonne « Espaces » de la maquette, qui est un élément de démonstration) |
| Contact | Institut Supérieur de Technologie, Ouagadougou, Burkina Faso ; courriel en `mailto:` ; WhatsApp ; deux numéros en `tel:` ; lien vers le formulaire |

Bas de pied de page : « © <année calculée> Club Informatique de l'IST ».

### 2.2. Authentification (18, 19, 20, 21, D2)

En-tête minimal : logo et nom (retour à l'accueil), bascule de thème. Contenu : composition en deux colonnes de la maquette (message d'accueil et carte de formulaire), une colonne sur mobile. Pied de page minimal : liens légaux et copyright. La maquette utilise tantôt l'en-tête public complet (18, 20), tantôt aucun en-tête (19, 21) : le gabarit minimal unifie les quatre écrans (E-06).

### 2.3. Espace connecté

- Barre latérale de 270 px (écran 61) : marque, carte de l'utilisateur (initiales, nom, rôle principal), sections de navigation filtrées par rôle et par module, puis « Retour au site » et « Déconnexion ». Tiroir en deçà de 1 024 px.
- Barre supérieure : bouton d'ouverture du tiroir (mobile), fil d'Ariane, cloche de notifications avec compteur réel (module `notifications`), bascule de thème, menu de compte. Le champ de recherche de la maquette (22, 35) n'est pas repris tant qu'aucune recherche transversale n'existe côté backend (E-08).
- Pied de page minimal.

### 2.4. Erreur (16, 17, D3)

Sobre, sans barre latérale : illustration de la maquette, titre, message de l'annexe C, action de retour utile. Aucune durée ni statut de maintenance inventé.

### 2.5. Point d'entrée `/espace`

Redirection vers l'accueil propre au rôle le plus élevé : SA et A vers `/espace/admin`, D vers `/espace/dsi`, R vers `/espace/gestion`, F vers `/espace/formateur`, M vers `/espace/membre`. Un utilisateur cumulant plusieurs rôles voit toutes les sections auxquelles il a droit dans la barre latérale.

## 3. Menus de la barre latérale par rôle

| Section | Entrée | Route | Rôles | Module |
|---|---|---|---|---|
| Mon espace | Tableau de bord | `/espace/membre` | M, F, R | `inscriptions` |
| Mon espace | Publications | `/espace/publications` | M, F, R | `publications-membres` (D-01) |
| Mon espace | Mes inscriptions | `/espace/inscriptions` | M, F, R | `inscriptions` |
| Mon espace | Supports et devoirs | `/espace/supports` | M, F, R | `supports` |
| Mon espace | Proposer un projet | `/espace/projets/proposer` | M, F, R | `projets` |
| Mon espace | Mes projets | `/espace/projets` | M, F, R | `projets` |
| Formation | Tableau de bord formateur | `/espace/formateur` | F | `formations` |
| Formation | Mes cours | `/espace/formateur/cours` | F | `formations` |
| Formation | Projets suivis | `/espace/formateur/projets` | F | `projets` |
| Gestion du club | Tableau de bord | `/espace/gestion` | R | `gestion-club` |
| Gestion du club | Actualités | `/espace/gestion/actualites` | R | `actualites` |
| Gestion du club | Événements | `/espace/gestion/evenements` | R | `evenements` |
| Gestion du club | Projets à valider | `/espace/gestion/projets` | R | `projets` |
| Gestion du club | Inscriptions | `/espace/gestion/inscriptions` | R | `inscriptions` |
| Gestion du club | Bureau | `/espace/gestion/bureau` | R | `bureau` |
| Gestion du club | Notification globale | `/espace/gestion/notifications` | R | `notifications` |
| Administration | Tableau de bord | `/espace/admin` | A, SA | `administration` |
| Administration | Utilisateurs | `/espace/admin/utilisateurs` | A, SA | `administration` |
| Administration | Rôles et permissions | `/espace/admin/roles` | A, SA | `administration` |
| Administration | Catégories | `/espace/admin/categories` | A, SA | `administration` |
| Administration | Messages de contact | `/espace/admin/messages` | A, SA, R | `contact` |
| Administration | Statistiques | `/espace/admin/statistiques` | A, SA | `statistiques` |
| Administration | Sécurité des comptes | `/espace/admin/securite` | A, SA | `administration` |
| Administration | Journal d'audit | `/espace/admin/journal` | A, SA | `administration` |
| Système | Configuration et sauvegardes | `/espace/systeme` | SA | `systeme` |
| Conformité | Supervision technique | `/espace/dsi` | D | `conformite` |
| Compte | Notifications | `/espace/notifications` | tous | `notifications` |
| Compte | Mon profil | `/espace/profil` | tous | `profil` |
| Compte | Paramètres | `/espace/parametres` | tous | `profil` |

Les entrées de la maquette qui pointent vers une page de détail (« Détail projet », « Détail / Édition compte », « Éditeur riche », « Créer un cours », « Feuille de présence », « Publier devoir / support ») ne figurent pas dans le menu : ces pages s'atteignent depuis leur liste, par le flux normal. La DSI et les administrateurs n'héritent pas de l'espace Membre (hiérarchie de `use-cases.md`).

## 4. Matrice rôle, page, route, garde

Gardes : `invite` (redirige un utilisateur connecté vers `/espace`), `connecte`, `role(...)`, `module(...)`, `proprietaire` (contrôlé par le backend, restitué en « accès refusé »).

| Route | Pages | V | M | F | R | A | SA | D | Gardes |
|---|---|---|---|---|---|---|---|---|---|
| `/`, `/presentation`, `/bureau`, `/actualites…`, `/evenements…`, `/projets…`, `/formations…`, `/ressources`, `/contact` | 01 à 13 | oui | oui | oui | oui | oui | oui | oui | `module` |
| `/mentions-legales`, `/confidentialite`, `/conditions-utilisation` | D1, 15, 14 | oui | oui | oui | oui | oui | oui | oui | aucune |
| `/inscription`, `/connexion`, `/mot-de-passe-oublie`, `/reinitialisation`, `/verification-adresse` | 18 à 21, D2 | oui | — | — | — | — | — | — | `invite` |
| `/espace` | redirection | — | oui | oui | oui | oui | oui | oui | `connecte` |
| `/espace/profil…`, `/espace/parametres`, `/espace/notifications` | 25, 26, 27, 33 | — | oui | oui | oui | oui | oui | oui | `connecte` |
| `/espace/membre`, `/espace/inscriptions`, `/espace/supports…`, `/espace/projets…` | 22, 28 à 32 | — | oui | oui | oui | — | — | — | `role(M)`, `module` |
| `/espace/publications…` | 23, 24 | — | oui | oui | oui | — | — | — | `role(M)`, `module` (D-01) |
| `/espace/formateur…` | 35 à 41 | — | — | oui | 39 seulement | — | — | — | `role(F)`, `proprietaire` |
| `/espace/gestion…` | 42 à 49, D5 | — | — | — | oui | — | — | — | `role(R)` |
| `/espace/admin…` | 50 à 55, D6, D7 | — | — | — | — | oui | oui | — | `role(A)` |
| `/espace/admin/messages` | D4 | — | — | — | oui | oui | oui | — | `role(A, R)` |
| `/espace/systeme` | 56 | — | — | — | — | — | oui | — | `role(SA)` |
| `/espace/dsi` | 57 | — | — | — | — | — | — | oui | `role(D)`, lecture seule |
| `/__design` | 34, 58 à 66 | — | — | — | — | — | — | — | absente de la construction de production |
| `**` | 16 | oui | oui | oui | oui | oui | oui | oui | aucune |

Toutes les routes sous `/espace` portent `noindex`. Le plan du site ne liste que les routes publiques dont le module est actif.

## 5. Flux contextuels

- Réinitialisation : demande (20), courriel, lien à usage unique (21), retour à la connexion.
- Inscription : formulaire (18), courriel de vérification, activation (D2), connexion (19). Selon la règle d'adhésion à confirmer (E.10), l'activation peut en outre exiger une validation par le Responsable du Club.
- Session expirée : tentative de rafraîchissement silencieuse, puis retour à la connexion avec le message de l'annexe C et conservation de la destination.
- Premier accès du Super Admin amorcé : changement de mot de passe imposé (D8) avant tout autre écran.
