# Suivi de progression

Dernière mise à jour : 1er octobre 2026

## Phases
| Phase | Statut | Validation utilisateur |
|---|---|---|
| 0. Reconnaissance | terminée | validée le 1er octobre 2026 |
| 1. Frontend d'après la maquette | en cours (socle) | |
| 2. Analyse et besoins backend | à faire | |
| 3. Reprise du backend | à faire | |
| 4. Intégration | à faire | |
| 5. Parcours utilisateur | à faire | |
| 6. Finalisation et fusion | à faire | |

## Preuves de la Phase 0
| Élément | Preuve |
|---|---|
| Dépôt cloné, branche `refonte/frontend-v2` | `git branch --show-current` |
| Captures de la maquette | 204 images dans `docs/maquette-ref/`, `rapport-capture.json` (aucune erreur de console ; débordement horizontal sur les 68 captures à 390 px) |
| Styles calculés | `docs/maquette-ref/styles-calcules.json` (54 sélecteurs, deux thèmes) |
| Tests du backend existant | `mvn -B test` : 17 tests, 0 échec ; couverture 12,9 % des lignes |
| Livrables | `inventaire-pages.md`, `architecture-navigation.md`, `audit-backend.md`, `ecarts-maquette.md`, `decisions.md`, `informations-a-fournir.md` |

## Preuves du socle (Phase 1)
Voir `docs/recette/socle/journal.md` et `docs/recette/socle/rapport.json`.

## Pages
Ordre de construction de la Phase 1. Identifiants : voir `docs/inventaire-pages.md`.

| ID | Page | Route | Rôles | Thème clair | Thème sombre | Responsive | États | Anti-stats | A11y | Tests | Recette visuelle | Backend relié | Visible en navigation | Statut |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| S0 | Socle, en-tête, pied de page, /__design | `/__design` | — | fait | fait | fait (7 largeurs, 0 débordement) | composants fournis | verte | axe : 0 violation | 32 verts | `docs/recette/socle/journal.md` | sans objet | sans objet | terminé, en attente de validation (point d'arrêt 2) |
| 18 | Inscription | `/inscription` | V | fait | fait | fait (7 largeurs) | initial, validation, attente, erreur, succès | verte | axe : 0 | verts | docs/recette/18-inscription | existant (inscription réelle prouvée) ; vérification d'adresse à créer | oui (en-tête, module authentification) | terminé (Phase 1) |
| 19 | Connexion | `/connexion` | V | fait | fait | fait (7 largeurs) | initial, validation, attente, échec, session expirée, succès | verte | axe : 0 | verts | docs/recette/19-connexion | existant (connexion et refus réels prouvés) ; cookie de rafraîchissement à créer | oui (en-tête, module authentification) | terminé (Phase 1) |
| 20 | Mot de passe oublié | `/mot-de-passe-oublie` | V | fait | fait | fait (7 largeurs) | initial, attente, envoyé, erreur | verte | axe : 0 | verts | docs/recette/20-mot-de-passe-oublie | existant mais simulé (aucun courriel) | depuis la connexion | terminé (Phase 1) |
| 21 | Réinitialisation | `/reinitialisation` | V | fait | fait | fait (7 largeurs) | initial, robustesse, jeton refusé, lien incomplet | verte | axe : 0 | verts | docs/recette/21-reinitialisation | existant mais simulé (jeton en mémoire) | contextuel (lien reçu par courriel) | terminé (Phase 1) |
| D2 | Vérification de l'adresse | `/verification-adresse` | V | fait | fait | fait (7 largeurs) | chargement, succès, lien invalide, erreur | verte | axe : 0 | couvert par la recette | docs/recette/D2-verification-adresse | à créer (POST /auth/verification) | contextuel (lien reçu par courriel) | terminé (Phase 1) |
| 01 | Accueil | `/` | tous | fait | fait | fait (7 largeurs) | chargement, vide et erreur (sections masquées), contenu | verte | axe : 0 | verts | docs/recette/01-accueil | existant ; contenu réel vu (contournement B-30 côté outil de recette) | oui | terminé (Phase 1) |
| 02 | Présentation | `/presentation` | tous | fait | fait | fait (7 largeurs) | chargement, vide, erreur, contenu | verte | axe : 0 | verts | docs/recette/02-presentation | existant (contenu amorcé à purger) | oui | terminé (Phase 1) |
| 03 | Bureau | `/bureau` | tous | fait | fait | fait (7 largeurs) | chargement, vide, erreur, contenu | verte | axe : 0 | couvert par la recette | docs/recette/03-bureau | à créer (GET /bureau) | pied de page et page Présentation | terminé (Phase 1) |
| 04 | Actualités, liste | `/actualites` | tous | fait | fait | fait (7 largeurs) | chargement, vide, erreur, contenu, recherche sans résultat | verte | axe : 0 | verts | docs/recette/04-actualites-liste | existant, en erreur sans paramètre de recherche (B-30) | oui | terminé (Phase 1) |
| 05 | Actualité, détail | `/actualites/:slug` | tous | fait | fait | fait (7 largeurs) | chargement, introuvable, erreur, contenu | verte | axe : 0 | couvert par la recette | docs/recette/05-actualite-detail | existant (brouillons exposés, B-08) | depuis la liste | terminé (Phase 1) |
| 06 | Événements, liste | `/evenements` | tous | fait | fait | fait (7 largeurs) | chargement, vide, erreur, contenu | verte | axe : 0 | couvert par la recette | docs/recette/06-evenements-liste | existant, B-30 | oui | terminé (Phase 1) |
| 07 | Événement, détail | `/evenements/:slug` | tous | fait | fait | fait (7 largeurs) | chargement, introuvable, erreur, contenu ; inscription et annulation réelles | verte | axe : 0 | verts (action d'inscription) | docs/recette/07-evenement-detail | existant (inscription réelle prouvée) | depuis la liste | terminé (Phase 1) |
| 08 | Projets, vitrine | `/projets` | tous | fait | fait | fait (7 largeurs) | chargement, vide, erreur, contenu | verte | axe : 0 | couvert par la recette | docs/recette/08-projets-vitrine | existant, B-30 | oui | terminé (Phase 1) |
| 09 | Projet, détail | `/projets/:slug` | tous | fait | fait | fait (7 largeurs) | chargement, introuvable, erreur, contenu | verte | axe : 0 | couvert par la recette | docs/recette/09-projet-detail | existant (propositions exposées, B-08) | depuis la liste | terminé (Phase 1) |
| 10 | Formations, liste | `/formations` | tous | fait | fait | fait (7 largeurs) | chargement, vide, erreur, contenu | verte | axe : 0 | couvert par la recette | docs/recette/10-formations-liste | existant, B-30 | oui | terminé (Phase 1) |
| 11 | Formation, détail | `/formations/:slug` | tous | fait | fait | fait (7 largeurs) | chargement, introuvable, erreur, contenu ; sessions : chargement, vide, contenu | verte | axe : 0 | verts (action d'inscription) | docs/recette/11-formation-detail | existant | depuis la liste | terminé (Phase 1) |
| 12 | Ressources publiques | `/ressources` | tous | fait | fait | fait (7 largeurs) | chargement, vide, erreur, contenu | verte | axe : 0 | couvert par la recette | docs/recette/12-ressources | existant (simple URL ; stockage à créer), B-30 | pied de page | terminé (Phase 1) |
| 13 | Contact | `/contact` | tous | fait | fait | fait (7 largeurs) | initial, validation, attente, envoyé, erreur | verte | axe : 0 | verts | docs/recette/13-contact | existant (enregistrement réel prouvé) ; courriels et anti-spam à créer | oui | terminé (Phase 1) |
| 14 | Conditions d'utilisation | `/conditions-utilisation` | tous | fait | fait | fait (7 largeurs) | statique | verte | axe : 0 | verts | docs/recette/14-conditions-utilisation | sans objet | pied de page | terminé ; relecture du club requise |
| 15 | Confidentialité | `/confidentialite` | tous | fait | fait | fait (7 largeurs) | statique | verte | axe : 0 | verts | docs/recette/15-confidentialite | sans objet | pied de page | terminé ; relecture du club requise |
| D1 | Mentions légales | `/mentions-legales` | tous | fait | fait | fait (7 largeurs) | statique | verte | axe : 0 | verts | docs/recette/D1-mentions-legales | sans objet | pied de page | terminé ; relecture du club requise |
| 16 | Erreur 404 | `**` | tous | fait | fait | fait (7 largeurs) | statique | verte (code d'erreur en liste blanche) | axe : 0 | couvert par la recette | docs/recette/16-erreur-404 | sans objet | contextuel | terminé (Phase 1) |
| 17 | Erreur générique | `état` | tous | fait | fait | fait (7 largeurs) | statique | verte | axe : 0 | couvert par la recette | docs/recette/17-erreur-service | sans objet | contextuel | terminé (Phase 1) |
| D3 | Accès refusé | `état` | tous | fait | fait | fait (7 largeurs) | visiteur, utilisateur connecté | verte | axe : 0 | couvert par la recette | docs/recette/D3-acces-refuse | sans objet | contextuel | terminé (Phase 1) |
| 22 | Tableau de bord Membre | `/espace/membre` | M | fait | fait | fait (7 largeurs) | chargement, vide, erreur, contenu | verte | axe : 0 | verts | docs/recette/22-tdb-membre | existant (inscriptions et notifications réelles vues) ; lieu de l'activité à ajouter à l'inscription | oui (barre latérale, rôle Membre) | terminé (Phase 1) |
| 25 | Profil | `/espace/profil` | connecté | fait | fait | fait (7 largeurs) | chargement, erreur, contenu | verte | axe : 0 | verts | docs/recette/25-profil-vue | existant (profil réel vu) | oui (barre latérale et menu du compte) | terminé (Phase 1) |
| 26 | Profil, édition | `/espace/profil/modifier` | connecté | fait | fait | fait (7 largeurs) | chargement, erreur, validation, succès | verte | axe : 0 | verts | docs/recette/26-profil-edition | existant (enregistrement réel prouvé) | contextuel (bouton du profil) | terminé (Phase 1) |
| 27 | Paramètres | `/espace/parametres` | connecté | fait | fait | fait (7 largeurs) | chargement, erreur, contenu, validation, confirmation | verte | axe : 0 | verts | docs/recette/27-parametres-compte | mot de passe : existant (refus réel prouvé) ; préférences, export et suppression du compte à créer | oui (barre latérale) | terminé (Phase 1) |
| 28 | Mes inscriptions | `/espace/inscriptions` | M | fait | fait | fait (7 largeurs) | chargement, vide, erreur, contenu, filtre, confirmation | verte | axe : 0 | verts | docs/recette/28-mes-inscriptions | existant (liste réelle vue) ; filtres type et statut, identifiants d'adresse et lieu à ajouter | oui (barre latérale, rôle Membre) | terminé (Phase 1) |
| 29 | Supports et devoirs | `/espace/supports` | M | fait | fait | fait (7 largeurs) | chargement, vide, erreur, contenu | verte | axe : 0 | verts | docs/recette/29-supports-devoirs-liste | existant (contenu réel vu) ; accès à conditionner à l'inscription (B-02), formationId à ajouter à l'inscription | oui (barre latérale, rôle Membre) | terminé (Phase 1) |
| 30 | Support, détail | `/espace/supports/:type/:id` | M | fait | fait | fait (7 largeurs) | chargement, introuvable, erreur, contenu (support, devoir) | verte | axe : 0 | couvert par la recette | docs/recette/30-supports-devoirs-detail | existant (contenu réel vu) ; contrôle d'accès et stockage de fichiers à créer | contextuel (depuis la liste) | terminé (Phase 1) |
| 36 | Mes cours | `/espace/formateur/cours` | F | fait | fait | fait (7 largeurs) | chargement, vide, erreur, contenu, filtre | verte | axe : 0 | verts | docs/recette/36-gestion-cours-liste | existant (liste réelle vue) ; filtre de publication et restriction au formateur à ajouter | oui (barre latérale, rôle Formateur) | terminé (Phase 1) |
| 35 | Tableau de bord Formateur | `/espace/formateur` | F | fait | fait | fait (7 largeurs) | chargement, vide, erreur, contenu | verte | axe : 0 | verts | docs/recette/35-tdb-formateur | existant (cours et séances réels vus) ; liste à restreindre au formateur, nombre d'inscrits faux (B-35) | oui (barre latérale, rôle Formateur) | terminé (Phase 1) |
| 37 | Cours, création et édition | `/espace/formateur/cours/nouveau` | F | fait | fait | fait (7 largeurs) | chargement, introuvable, validation, succès | verte | axe : 0 | verts | docs/recette/37-creation-edition-cours | existant (modification réelle prouvée) ; contrôle de propriété à créer (B-10) | contextuel (boutons de la liste et du détail) | terminé (Phase 1) |
| 38 | Cours, détail | `/espace/formateur/cours/:id` | F | fait | fait | fait (7 largeurs) | chargement, introuvable, erreur, contenu, validation, confirmation | verte | axe : 0 | verts | docs/recette/38-cours-detail | existant (contenu réel vu) ; B-35, B-10 | contextuel (depuis la liste) | terminé (Phase 1) |
| 39 | Feuille de présence | `/espace/formateur/cours/:id/sessions/:sessionId/presences` | F | fait | fait | fait (7 largeurs) | chargement, vide, erreur, contenu, enregistrement | verte | axe : 0 | verts | docs/recette/39-feuille-presence | existant (pointage réel prouvé) ; filière des inscrits à ajouter | contextuel (depuis une séance) | terminé (Phase 1) |
| 40 | Publication devoir ou ressource | `/espace/formateur/cours/:id/publier` | F | fait | fait | fait (7 largeurs) | chargement, introuvable, validation, succès | verte | axe : 0 | verts | docs/recette/40-publication-devoir-ressource | existant (mêmes appels que le peuplement de recette) ; stockage de fichiers à créer | contextuel (depuis le détail du cours) | terminé (Phase 1) |
| 45 | Gestion des événements | `/espace/gestion/evenements` | R | | | | | | | | | | | à faire |
| 48 | Inscriptions et listes d'attente | `/espace/gestion/inscriptions` | R | | | | | | | | | | | à faire |
| 43 | Gestion des actualités | `/espace/gestion/actualites` | R | | | | | | | | | | | à faire |
| 44 | Éditeur de publication | `/espace/gestion/actualites/:id` | R | | | | | | | | | | | à faire |
| 23 | Publications (selon D-01) | `/espace/publications` | M | | | | | | | | | | | à faire |
| 24 | Publication, détail (selon D-01) | `/espace/publications/:slug` | M | | | | | | | | | | | à faire |
| 33 | Centre de notifications | `/espace/notifications` | connecté | | | | | | | | | | | à faire |
| 49 | Notification globale | `/espace/gestion/notifications` | R | | | | | | | | | | | à faire |
| 31 | Proposer un projet | `/espace/projets/proposer` | M | | | | | | | | | | | à faire |
| 32 | Mes projets | `/espace/projets` | M | | | | | | | | | | | à faire |
| 41 | Projets suivis | `/espace/formateur/projets` | F | | | | | | | | | | | à faire |
| 46 | Projets à valider | `/espace/gestion/projets` | R | | | | | | | | | | | à faire |
| 47 | Projet à valider, détail | `/espace/gestion/projets/:id` | R | | | | | | | | | | | à faire |
| 42 | Tableau de bord Responsable | `/espace/gestion` | R | | | | | | | | | | | à faire |
| D5 | Composition du bureau | `/espace/gestion/bureau` | R | | | | | | | | | | | à faire |
| D4 | Messages de contact | `/espace/admin/messages` | A, SA, R | | | | | | | | | | | à faire |
| 50 | Tableau de bord Administrateur | `/espace/admin` | A, SA | | | | | | | | | | | à faire |
| 51 | Utilisateurs | `/espace/admin/utilisateurs` | A, SA | | | | | | | | | | | à faire |
| 52 | Utilisateur, détail | `/espace/admin/utilisateurs/:id` | A, SA | | | | | | | | | | | à faire |
| 53 | Rôles et permissions | `/espace/admin/roles` | A, SA | | | | | | | | | | | à faire |
| 54 | Catégories | `/espace/admin/categories` | A, SA | | | | | | | | | | | à faire |
| 55 | Statistiques | `/espace/admin/statistiques` | A, SA | | | | | | | | | | | à faire |
| D7 | Sécurité des comptes | `/espace/admin/securite` | A, SA | | | | | | | | | | | à faire |
| D6 | Journal d'audit | `/espace/admin/journal` | A, SA | | | | | | | | | | | à faire |
| 56 | Configuration et sauvegardes | `/espace/systeme` | SA | | | | | | | | | | | à faire |
| D8 | Mot de passe imposé | `/espace/mot-de-passe` | SA | | | | | | | | | | | à faire |
| 57 | Supervision technique | `/espace/dsi` | D | | | | | | | | | | | à faire |

## Modules backend
| Module | Audit | Bogues corrigés | Conception reprise | Tests | OpenAPI | Statut |
|---|---|---|---|---|---|---|
| Fondations transversales (sécurité, erreurs, courriel, stockage, comptes de test, amorçage) | fait | | | | | à faire |
| Authentification et comptes | fait | | | | | à faire |
| Contenus publics (pages, bureau, actualités, catégories, ressources, contact) | fait | | | | | à faire |
| Espace Membre et formation | fait | | | | | à faire |
| Événements et publications | fait | | | | | à faire |
| Notifications | fait | | | | | à faire |
| Projets | fait | | | | | à faire |
| Gestion et administration | fait | | | | | à faire |
| Tableaux de bord et statistiques | fait | | | | | à faire |

## Décisions en attente de l'utilisateur
D-01 à D-13 : propositions appliquées par défaut depuis la validation de la Phase 0, révisables (`docs/decisions.md`, section 5). Informations du club : voir `docs/informations-a-fournir.md`.

## Blocages
- Mesures de la section 6.12 (crochet `commit-msg`, exclusions locales, attribution) non automatisées : opération refusée par le contrôle d'autorisations de l'environnement. Mesure compensatoire : contrôle manuel à chaque commit (`docs/decisions.md`, section 6).
- Lot initial du frontend à 323,81 kio bruts : avertissement du budget de 300 kio (non bloquant), à réduire lors de la passe de performance.
- GitHub CLI absent du poste (nécessaire pour la pull request en Phase 6, ou ouverture depuis l'interface web).
