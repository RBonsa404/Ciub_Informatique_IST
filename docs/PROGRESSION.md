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

## Pages
Ordre de construction de la Phase 1. Identifiants : voir `docs/inventaire-pages.md`.

| ID | Page | Route | Rôles | Thème clair | Thème sombre | Responsive | États | Anti-stats | A11y | Tests | Recette visuelle | Backend relié | Visible en navigation | Statut |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| S0 | Socle, en-tête, pied de page, /__design | `/__design` | — | | | | | | | | | | | à faire |
| 18 | Inscription | `/inscription` | V | | | | | | | | | | | à faire |
| 19 | Connexion | `/connexion` | V | | | | | | | | | | | à faire |
| 20 | Mot de passe oublié | `/mot-de-passe-oublie` | V | | | | | | | | | | | à faire |
| 21 | Réinitialisation | `/reinitialisation` | V | | | | | | | | | | | à faire |
| D2 | Vérification de l'adresse | `/verification-adresse` | V | | | | | | | | | | | à faire |
| 01 | Accueil | `/` | tous | | | | | | | | | | | à faire |
| 02 | Présentation | `/presentation` | tous | | | | | | | | | | | à faire |
| 03 | Bureau | `/bureau` | tous | | | | | | | | | | | à faire |
| 04 | Actualités, liste | `/actualites` | tous | | | | | | | | | | | à faire |
| 05 | Actualité, détail | `/actualites/:slug` | tous | | | | | | | | | | | à faire |
| 06 | Événements, liste | `/evenements` | tous | | | | | | | | | | | à faire |
| 07 | Événement, détail | `/evenements/:slug` | tous | | | | | | | | | | | à faire |
| 08 | Projets, vitrine | `/projets` | tous | | | | | | | | | | | à faire |
| 09 | Projet, détail | `/projets/:slug` | tous | | | | | | | | | | | à faire |
| 10 | Formations, liste | `/formations` | tous | | | | | | | | | | | à faire |
| 11 | Formation, détail | `/formations/:slug` | tous | | | | | | | | | | | à faire |
| 12 | Ressources publiques | `/ressources` | tous | | | | | | | | | | | à faire |
| 13 | Contact | `/contact` | tous | | | | | | | | | | | à faire |
| 14 | Conditions d'utilisation | `/conditions-utilisation` | tous | | | | | | | | | | | à faire |
| 15 | Confidentialité | `/confidentialite` | tous | | | | | | | | | | | à faire |
| D1 | Mentions légales | `/mentions-legales` | tous | | | | | | | | | | | à faire |
| 16 | Erreur 404 | `**` | tous | | | | | | | | | | | à faire |
| 17 | Erreur générique | `état` | tous | | | | | | | | | | | à faire |
| D3 | Accès refusé | `état` | tous | | | | | | | | | | | à faire |
| 22 | Tableau de bord Membre | `/espace/membre` | M | | | | | | | | | | | à faire |
| 25 | Profil | `/espace/profil` | connecté | | | | | | | | | | | à faire |
| 26 | Profil, édition | `/espace/profil/modifier` | connecté | | | | | | | | | | | à faire |
| 27 | Paramètres | `/espace/parametres` | connecté | | | | | | | | | | | à faire |
| 28 | Mes inscriptions | `/espace/inscriptions` | M | | | | | | | | | | | à faire |
| 29 | Supports et devoirs | `/espace/supports` | M | | | | | | | | | | | à faire |
| 30 | Support, détail | `/espace/supports/:type/:id` | M | | | | | | | | | | | à faire |
| 36 | Mes cours | `/espace/formateur/cours` | F | | | | | | | | | | | à faire |
| 35 | Tableau de bord Formateur | `/espace/formateur` | F | | | | | | | | | | | à faire |
| 37 | Cours, création et édition | `/espace/formateur/cours/nouveau` | F | | | | | | | | | | | à faire |
| 38 | Cours, détail | `/espace/formateur/cours/:id` | F | | | | | | | | | | | à faire |
| 39 | Feuille de présence | `/espace/formateur/sessions/:id/presences` | F, R | | | | | | | | | | | à faire |
| 40 | Publication devoir ou ressource | `/espace/formateur/cours/:id/publier` | F | | | | | | | | | | | à faire |
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
- GitHub CLI absent du poste (nécessaire pour la pull request en Phase 6, ou ouverture depuis l'interface web).
