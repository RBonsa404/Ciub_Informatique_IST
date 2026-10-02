# Besoins backend relevés sur le frontend livré

Date : 2 octobre 2026. Source : relecture page par page du frontend de la branche `refonte/frontend-v2` (61 pages, `docs/PROGRESSION.md`) et recette de chaque page contre le backend existant (`docs/recette/`).

Le contrat détaillé (paramètres, schémas d'entrée et de sortie, codes d'erreur) est dans `docs/api-contract.openapi.yaml` ; ce document en donne la lecture par page et le compare à l'existant. Les chemins sont ceux du contrat cible, relatifs à `/api/v1`. Quand le chemin actuel diffère, il est indiqué entre parenthèses.

## 1. Lecture des tableaux

- **Existant** : `réel` (fonctionne et a été vu sur la base de recette), `partiel` (fonctionne mais incomplet ou fautif, avec le renvoi au bogue de `docs/audit-backend.md`), `simulé` (renvoie une valeur fabriquée), `absent`.
- **Effort** : `faible` (moins d'une demi-journée : paramètre, champ, correction ciblée), `moyen` (une demi-journée à deux jours : point d'accès avec règles, migration et tests), `élevé` (plus de deux jours : module nouveau ou transversal).
- **Rôles** : V visiteur, M Membre, F Formateur, R Responsable du Club, A Administrateur, SA Super Admin, D DSI. Un Formateur et un Responsable héritent du Membre ; un Super Admin de l'Administrateur.
- Toutes les erreurs suivent la RFC 9457 (`Probleme` dans le contrat) : 400 validation avec erreurs de champ, 401 session absente, 403 droits insuffisants, 404 introuvable, 409 conflit, 429 limitation de débit.

## 2. Besoins transversaux

| Besoin | Constat sur l'existant | Existant | Effort |
|---|---|---|---|
| Format d'erreur RFC 9457, codes stables, messages en français, erreurs de champ dans `errors` | format propre au projet, 429 écrit à la main, mot de passe renvoyé dans l'erreur (B-07, B-21) ; route inconnue en 500 (B-33) | partiel | moyen |
| Pagination uniforme `content`, `page`, `size`, `totalElements`, `totalPages` ; tri et filtres documentés | format Spring Data brut ; listes non paginées ; recherche obligatoire sinon 500 (B-30) | partiel | moyen |
| Dates en ISO 8601 UTC | `LocalDateTime` sans fuseau (B-22) | partiel | moyen |
| Session : jeton d'accès court en mémoire, rafraîchissement par cookie HttpOnly avec rotation, révocation et détection de réutilisation | jeton de rafraîchissement dans le corps ; 500 sans jeton ; pas de révocation au changement de mot de passe (B-28) | partiel | élevé |
| Autorisations par rôle et par propriété de la ressource | aucun contrôle de propriété (B-10) ; contenus non publiés lisibles (B-08, B-36) ; devoirs sans authentification (B-02) | partiel | élevé |
| Comptes de test marqués, exclus de toute statistique, retirables en une commande | aucun marquage (B-39) | absent | moyen |
| Amorçage du premier Super Admin réel et changement de mot de passe imposé | compte amorcé par migration, inutilisable et publié (B-01, B-31) | absent | moyen |
| Courriel réel et asynchrone (vérification, réinitialisation, invitation, contact, notifications) | aucun envoi ; jeton de réinitialisation journalisé (B-06) | absent | élevé |
| Stockage de fichiers contrôlé (`POST /fichiers`, `GET /fichiers/{id}`) | adresses web saisies à la main | absent | élevé |
| Journal d'audit alimenté par les actions sensibles | trois actions seulement (B-26) ; entité exposée (B-23) | partiel | moyen |
| Limitation de débit par compte et par adresse, verrouillage progressif | cinq requêtes par quart d'heure par adresse et par chemin, succès compris (B-34) ; compteur non remis à zéro (B-15) | partiel | moyen |
| Compteurs d'inscrits et de places calculés en base | toujours zéro (B-35) | simulé | faible |
| Libellés de référence en français correct | sans accents (B-38) | partiel | faible |

## 3. Authentification (écrans 18 à 21, D2, D8)

| Page | Fonctionnalité | Contrat | Rôles | Existant | Effort |
|---|---|---|---|---|---|
| 18 Inscription | créer le compte, envoyer le lien de vérification ; réponse identique que l'adresse existe ou non ; consentement enregistré | `POST /auth/register` → 201 ; 400, 429 | V | partiel : compte créé (vu), aucune vérification d'adresse, énumération possible (B-20), collision de numéro (B-14) | moyen |
| D2 Vérification de l'adresse | activer le compte par jeton à usage unique | `POST /auth/verification` → 204 ; 400 | V | absent (500, B-33) | moyen |
| 19 Connexion | ouvrir la session, poser le cookie ; indicateur `changementMotDePasseRequis` ; refus identique pour compte inconnu ou mot de passe faux ; compte suspendu ou verrouillé signalé par un code | `POST /auth/login` → 200 `Session` ; 401, 429 | V | partiel : connexion et refus vus ; cookie et indicateur absents ; secret non base64 en 500 (B-32) | moyen |
| toutes | renouveler la session au chargement | `POST /auth/refresh` → 200 ; 401 | V | partiel (500 sans jeton) | moyen |
| toutes | fermer la session | `POST /auth/logout` → 204 | connecté | partiel (aucune révocation) | faible |
| 20 Mot de passe oublié | envoyer un lien ; réponse identique dans tous les cas | `POST /auth/forgot-password` → 204 ; 429 | V | partiel : jeton journalisé, non haché, aucun courriel (B-06) | moyen |
| 21 Réinitialisation | changer le mot de passe par jeton à usage unique et durée limitée ; fermer toutes les sessions | `POST /auth/reset-password` → 204 ; 400 | V | partiel | moyen |
| D8 Mot de passe imposé | lever l'indicateur après changement | `PUT /users/me/password` → 204 ; 400 | connecté | partiel : changement réel (refus 400 vu), indicateur absent | faible |

Politique de mot de passe commune au frontend : huit caractères au moins, une minuscule, une majuscule, un chiffre, un symbole quelconque (B-27 : le serveur refuse les symboles hors d'une liste fermée).

## 4. Pages publiques et légales (écrans 01 à 17)

| Page | Fonctionnalité | Contrat | Existant | Effort |
|---|---|---|---|---|
| 01 Accueil | texte d'accroche administrable ; deux prochains événements ; quatre dernières actualités | `GET /pages/accueil`, `GET /evenements?aVenir=true&size=2&sort=dateDebut,asc`, `GET /actualites?size=4` | partiel : listes réelles (B-30), page « accueil » absente (404) | faible |
| 02 Présentation | texte administrable | `GET /pages/presentation` | réel (contenu amorcé à purger : il décrit un club fictif) | faible |
| 03 Bureau | composition réelle, ordonnée, sans photo | `GET /bureau` | absent | moyen |
| 04, 05 Actualités | liste paginée avec recherche et catégorie ; détail par slug ; seules les actualités publiées et publiques | `GET /actualites`, `GET /actualites/slug/{slug}` | partiel (B-30, B-08 : brouillon lisible par slug) | faible |
| 06, 07 Événements | liste à venir, détail, places restantes exactes, export iCalendar | `GET /evenements`, `GET /evenements/slug/{slug}`, `GET /evenements/{id}/calendrier` | partiel (B-30, B-35) ; iCalendar absent | moyen |
| 08, 09 Projets | projets validés seulement ; adresses des membres non exposées | `GET /projets`, `GET /projets/slug/{slug}` | partiel (B-30, B-08, B-09) | faible |
| 10, 11 Formations | liste, détail avec séances et places exactes | `GET /formations`, `GET /formations/slug/{slug}` | partiel (B-30, B-35) | faible |
| 12 Ressources | ressources publiques, filtre par type | `GET /ressources/publiques` | partiel (B-30) | faible |
| 13 Contact | enregistrer le message, notifier le club, accuser réception ; champ piège, délai minimal, limitation de débit | `POST /contact` → 204 ; 400, 429 | partiel : enregistrement réel (vu), ni courriel ni protection | moyen |
| 14 à 17 Pages légales, erreurs | aucune donnée | — | sans objet | — |

Les statistiques publiques (`/statistiques/publiques`) ne sont affichées nulle part : le point d'accès, faussé (B-19), est à supprimer.

## 5. Espace Membre (écrans 22 à 34)

| Page | Fonctionnalité | Contrat | Rôles | Existant | Effort |
|---|---|---|---|---|---|
| 22 Tableau de bord | inscriptions à venir avec lieu ; dernières notifications ; nombre de non lues | `GET /inscriptions/me`, `GET /notifications?size=4`, `GET /notifications/non-lues/count` | M | réel ; `lieu`, `formationId` et slugs absents de l'inscription | faible |
| 25, 26 Profil | lire et modifier prénom, nom, filière libre, présentation ; `fonction` non modifiable par le membre | `GET /users/me`, `PUT /users/me` | connecté | réel (modification vue) ; B-17 | faible |
| 27 Paramètres | changer son mot de passe (sessions fermées) | `PUT /users/me/password` | connecté | réel ; B-28 | faible |
| 27 Paramètres | préférences de notification par courriel | `GET`, `PUT /users/me/preferences` | connecté | absent | moyen |
| 27 Paramètres | copie des données personnelles | `GET /users/me/export` | connecté | absent | moyen |
| 27 Paramètres | suppression du compte confirmée par mot de passe ; courriel réutilisable ensuite | `POST /users/me/suppression` → 204 | connecté | absent (B-13) | moyen |
| 28 Mes inscriptions | historique paginé, filtres `type` et `statut` ; annulation avec promotion de la liste d'attente | `GET /inscriptions/me`, `DELETE /inscriptions/{id}` | M | partiel : liste et annulation réelles ; filtres ignorés | faible |
| 07, 11 Inscription | s'inscrire ; liste d'attente si complet ; pas de dépassement en concurrence | `POST /inscriptions/evenements/{id}`, `POST /inscriptions/formations/{id}` → 201 ; 409 | M | réel (vu) ; B-11 | moyen |
| 29, 30 Supports et devoirs | supports et devoirs des formations où le membre est inscrit et confirmé ; refus sinon | `GET /ressources/formation/{id}`, `GET /formations/{id}/devoirs`, `GET /ressources/{id}` ; 403 | M | partiel : contenus réels ; accès non contrôlé (B-02, UC-10) | moyen |
| 23, 24 Publications | annonces réservées aux membres (décision D-01) | `GET /publications`, `GET /publications/slug/{slug}` | M | absent | moyen |
| 33 Notifications | liste paginée, filtres `type` et `lue`, marquage unitaire et global | `GET /notifications`, `PUT /notifications/{id}/lue`, `PUT /notifications/lire-toutes` | connecté | réel (marquage vu) ; filtres ignorés ; seule la diffusion globale crée des notifications | moyen |
| 31 Proposer un projet | créer une proposition | `POST /projets` → 201 | M | réel | faible |
| 32 Mes projets | projets de l'utilisateur, tous statuts, motif de la décision | `GET /projets/mes-projets` | M | absent (B-37) ; motif non persistant (B-12) | moyen |

## 6. Espace Formateur (écrans 35 à 41)

| Page | Fonctionnalité | Contrat | Existant | Effort |
|---|---|---|---|---|
| 35, 36 Cours | formations du formateur connecté, filtre `publie` | `GET /gestion/formations` (actuel : `/formations/admin/all`) | partiel : liste non restreinte, filtre absent | faible |
| 37 Création, édition | créer, modifier ses formations | `POST /formations`, `PUT /formations/{id}` ; 403 | partiel : modification vue ; aucune propriété (B-10) | moyen |
| 38 Détail | séances (planifier, supprimer, conflit de planning refusé), supports, devoirs, effectif exact | `POST`, `DELETE /formations/{id}/sessions…`, `GET /ressources/formation/{id}`, `GET /formations/{id}/devoirs` | partiel (B-10, B-35) ; conflit non contrôlé | moyen |
| 39 Émargement | inscrits confirmés avec filière ; pointages ; inscription vérifiée comme appartenant à la séance | `GET /inscriptions/formations/{id}`, `GET`, `POST /presences/sessions/{id}` | partiel : pointage réel (vu) ; B-18 ; filière absente | faible |
| 40 Publication | publier un devoir ou une ressource, avec fichier déposé | `POST /formations/{id}/devoirs`, `POST /ressources`, `POST /fichiers` | partiel : création réelle ; dépôt de fichier absent | élevé (stockage) |
| 41 Projets suivis | projets validés ; note de suivi et avancement | `GET /projets`, `GET /projets/{id}`, `PUT /projets/{id}/suivi` | réel (suivi vu) ; B-36 | faible |

## 7. Gestion du club (écrans 42 à 49, D4, D5)

| Page | Fonctionnalité | Contrat | Existant | Effort |
|---|---|---|---|---|
| 42 Tableau de bord | totaux des actualités et événements ; propositions en attente ; événements à venir | `GET /gestion/actualites?size=1`, `GET /gestion/evenements`, `GET /projets/en-attente` | réel | faible |
| 42 Tableau de bord | membres actifs et inscriptions confirmées par mois, hors comptes de test | `GET /gestion/indicateurs` | absent | moyen |
| 43, 44 Actualités | liste complète, filtre `publie` ; créer, modifier, publier ou retirer (état explicite), supprimer ; visibilité publique ou membres ; image déposée | `GET /gestion/actualites` (actuel : `/actualites/admin/all`), `GET`, `POST`, `PUT`, `DELETE /actualites…`, `PATCH /actualites/{id}/publication` | partiel : opérations réelles (vues) ; bascule sans état, filtre et visibilité absents | moyen |
| 45 Événements | liste complète, bornes `du` et `au` ; créer, modifier, supprimer ; compteur d'inscrits exact | `GET /gestion/evenements` (actuel : `/evenements/admin/all`), `POST`, `PUT`, `DELETE /evenements…` | partiel : modification vue ; bornes absentes ; B-35 | faible |
| 48 Inscriptions | inscrits d'un événement ou d'une séance, avec filière ; promotion sous contrôle du quota | `GET /inscriptions/evenements/{id}`, `GET /inscriptions/formations/{id}`, `PUT /inscriptions/{id}/statut` | partiel : listes réelles ; B-11 | faible |
| 46, 47 Projets | propositions en attente ; compteurs par décision ; détail réservé ; décision motivée et notifiée | `GET /projets/en-attente`, `GET /gestion/projets/compteurs`, `GET /projets/{id}`, `PUT /projets/{id}/validation` | partiel : décision réelle ; compteurs absents ; B-12, B-36 | moyen |
| 49 Notification globale | diffuser à tous les membres actifs | `POST /notifications/globales` → 204 | réel | faible |
| D5 Bureau | ajouter, modifier, retirer, ordonner | `POST`, `PUT`, `DELETE /bureau…` | absent | moyen |
| D4 Messages | liste paginée, filtre `traite`, marquage | `GET /gestion/messages`, `PUT /gestion/messages/{id}/traite` (actuel : `/contact/admin…`) | réel (vu) | faible |

## 8. Administration (écrans 50 à 55, D6, D7)

| Page | Fonctionnalité | Contrat | Existant | Effort |
|---|---|---|---|---|
| 50, 55 Totaux | totaux et répartitions calculés en base, hors comptes de test et éléments supprimés | `GET /admin/statistiques` | partiel : calcul en mémoire, comptes de test inclus (B-39) | moyen |
| 51 Comptes | liste hors comptes supprimés ; recherche, filtres `role` et `statut` | `GET /admin/users` | partiel (B-16) ; recherche non exposée | faible |
| 51 Invitation | inviter par lien à usage unique | `POST /admin/users/invitations` → 204 | absent | moyen |
| 52 Compte | modifier l'identité ; attribuer les rôles sous hiérarchie ; suspendre, réactiver (pas soi-même ni le dernier Super Admin) ; déverrouiller ; indicateur `verrouille` | `GET`, `PUT /admin/users/{id}`, `PUT …/roles`, `PATCH …/status` (corps), `POST …/deverrouillage` | partiel : modification vue ; B-03 ; déverrouillage absent | moyen |
| 53 Rôles | rôles et permissions effectives, en lecture | `GET /admin/roles`, `GET /admin/permissions` | réel ; libellés (B-38) | faible |
| 54 Catégories | créer, modifier, supprimer si inutilisée (409 sinon) | `POST`, `PUT`, `DELETE /categories…` | partiel : suppression non conditionnée | faible |
| D7 Sécurité | comptes signalés, avec identifiant du compte | `GET /admin/security/alerts` | partiel : date fausse, identifiant absent | faible |
| D6, 52 Journal | journal paginé, filtres `utilisateur` et `statut` | `GET /admin/security/audit-logs` | partiel : presque vide (B-26), entité exposée (B-23) | moyen |

## 9. Système et conformité (écrans 56, 57)

| Page | Fonctionnalité | Contrat | Existant | Effort |
|---|---|---|---|---|
| 56 Réglages | lire et modifier des réglages persistants et effectifs (nom, verrouillage, maintenance, inscriptions) | `GET`, `PUT /admin/system/config` | simulé : valeurs en mémoire, sans effet | moyen |
| 56 Sauvegardes | état des sauvegardes planifiées | `GET /admin/system/sauvegardes` | absent ; `POST /admin/system/backup` simulé, à supprimer | moyen |
| 57 Conformité | contrôles calculés et libellés, sans contrôle de double authentification | `GET /dsi/conformite` | simulé : sept contrôles codés en dur | moyen |
| 57 Journal | journal en consultation | `GET /dsi/conformite/logs` | partiel (B-23, B-26) | faible |

`PUT /admin/security/2fa/{userId}` (simulé) est à supprimer : aucune interface de double authentification n'existe (règle 6.6).

## 10. Synthèse de l'effort

| Module (ordre de la Phase 3) | Besoins | Effort dominant |
|---|---|---|
| Fondations transversales | erreurs, pagination, dates, autorisations, comptes de test, amorçage, courriel, stockage, journal, limitation de débit | élevé |
| Authentification et comptes | vérification d'adresse, cookie de rafraîchissement, réinitialisation sûre, préférences, export, suppression | élevé |
| Contenus publics | bureau, page d'accueil, corrections de visibilité, iCalendar, contact protégé | moyen |
| Espace Membre et formation | accès conditionné à l'inscription, propriété des formations, conflits de planning, compteurs | moyen |
| Événements et publications | visibilité des actualités, publications internes, bornes de date, quota en concurrence | moyen |
| Notifications | filtres, création par les événements métier (inscription, décision, rappel), préférences | moyen |
| Projets | mes projets, motif persistant, accès réservé, compteurs | moyen |
| Gestion et administration | bureau, hiérarchie des rôles, invitation, déverrouillage, journal, messages | moyen |
| Tableaux de bord et statistiques | indicateurs de gestion, statistiques en base hors comptes de test, conformité calculée, réglages persistants, sauvegardes | moyen |

Points d'accès : 106 opérations au contrat. 86 existent déjà dans le backend, sous le même chemin ou sous un chemin renommé ; 20 sont à créer (vérification d'adresse, préférences en lecture et en écriture, export, suppression du compte, lecture et écriture du bureau, iCalendar, publications internes, mes projets, compteurs des projets, indicateurs de gestion, déverrouillage, invitation, sauvegardes, dépôt et lecture de fichiers).

## 11. Changements du frontend induits par le contrat

À faire en Phase 4, module par module :

1. Préfixe `/api/v1` (une valeur de configuration).
2. Listes de gestion : `/…/admin/all` devient `/gestion/…` ; messages de contact : `/contact/admin` devient `/gestion/messages` (sept chemins dans `core/api`).
3. `PATCH /actualites/{id}/publication` et `PATCH /admin/users/{id}/status` reçoivent l'état dans le corps.
4. Compteurs des projets lus sur `/gestion/projets/compteurs`.
5. Dépôt de fichier (`POST /fichiers`) à la place des champs d'adresse web pour les supports, les consignes et l'image de couverture.
6. Retrait des adaptations transitoires : jeton de rafraîchissement en mémoire, rôles préfixés, recherche de la formation par sa séance, filtres revérifiés côté client.
