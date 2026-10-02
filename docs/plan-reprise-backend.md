# Plan de reprise du backend

Date : 2 octobre 2026. Sources : `docs/audit-backend.md` (état de l'existant, bogues B-01 à B-39), `docs/besoins-backend.md` (besoins par page), `docs/api-contract.openapi.yaml` (contrat cible), sections 8.3, 8.7 et 9 du cahier d’exécution.

Ce plan est à valider au point d'arrêt 3. Aucun code du backend n'a été modifié à ce stade.

## 1. Point de départ

- Spring Boot 3.5.3, Java 17, PostgreSQL, Flyway (V1 schéma, V2 données de référence), JWT ; architecture en couches saine (contrôleur, service, dépôt, DTO, mappage).
- 108 points d'accès, 21 tables, 17 tests unitaires, aucun test d'intégration, 12,9 % de lignes couvertes.
- 39 bogues consignés, dont 9 critiques (B-01 à B-07, B-30, B-31) ; quatre points d'accès simulés (réglages, sauvegarde, conformité, double authentification) et des statistiques publiques faussées.
- Le frontend livré s'appuie sur 106 opérations : 86 existent, 20 sont à créer.

## 2. Conception cible

### 2.1. Architecture et modules

L'architecture en couches est conservée. Un paquet par domaine, chacun avec `controller`, `service`, `repository`, `entity`, `dto`, `mapper` :

| Module | Contenu | Évolution |
|---|---|---|
| `common` | sécurité, erreurs, pagination, horloge, audit, limitation de débit, configuration | repris en profondeur |
| `auth` | connexion, inscription, vérification d'adresse, rafraîchissement, réinitialisation, invitation | repris |
| `user` | profil, préférences, export, suppression, administration des comptes, rôles | complété |
| `contenu` (`page`, `bureau`, `categorie`, `actualite`, `ressource`, `contact`) | contenus publics et leur gestion | `bureau` créé ; visibilité des actualités |
| `evenement`, `formation`, `inscription` | événements, formations, séances, devoirs, inscriptions, présences | règles de propriété, quotas, compteurs |
| `projet` | proposition, décision, suivi | motif persistant, accès réservé |
| `notification` | notifications persistées, création par événement métier, diffusion | complété |
| `fichier` | `StorageService` (volume local ou stockage objet), métadonnées, contrôle des types | créé |
| `courriel` | envoi asynchrone, gabarits en français | créé |
| `admin` | statistiques, indicateurs, sécurité, journal, réglages, sauvegardes, conformité | simulations supprimées |

### 2.2. Conventions

- **Routes** : préfixe `/api/v1` ; ressources au pluriel ; listes de gestion sous `/gestion/…` ; actions d'administration sous `/admin/…`. Les chemins déjà cohérents et utilisés par le frontend sont conservés pour limiter les régressions.
- **Verbes et codes** : `POST` création (201) ou action (204), `PUT` remplacement, `PATCH` changement d'état avec corps explicite, `DELETE` 204 ; 400, 401, 403, 404, 409, 413, 415, 429 selon le contrat. Une route inconnue répond 404.
- **Erreurs** : RFC 9457 (`application/problem+json`) avec `code` stable, `detail` en français et `errors` par champ ; aucune valeur rejetée ni trace d'exécution dans la réponse.
- **Pagination** : enveloppe unique `content`, `page`, `size`, `totalElements`, `totalPages` ; taille bornée à 200 ; tris limités à une liste blanche par ressource.
- **Dates** : `Instant` ou `OffsetDateTime` en UTC, sérialisées en ISO 8601 avec fuseau ; colonnes `TIMESTAMPTZ` (migration de conversion).
- **DTO** : un DTO de lecture et un DTO de saisie par ressource, noms du contrat ; aucune entité exposée ; mappage centralisé ; validations Bean Validation avec messages en français.
- **Transactions** : `@Transactional` au niveau service ; lecture seule par défaut ; verrou sur la séance ou l'événement pour l'inscription.
- **Sécurité** : règles par rôle dans la configuration, règles de propriété dans les services ; hiérarchie des rôles déclarée une fois.

### 2.3. Ruptures de compatibilité assumées

| Avant | Après | Motif |
|---|---|---|
| `/api/…` | `/api/v1/…` | versionnement (section 9.3) |
| `/{ressource}/admin/all` (cinq ressources) | `/gestion/{ressource}` | cohérence (B-25) |
| `/contact/admin`, `/contact/admin/{id}/traite` | `/gestion/messages`, `/gestion/messages/{id}/traite` | cohérence (B-25) |
| `PATCH /actualites/{id}/publication` sans corps (bascule) | corps `{ "publie": true }` | état explicite, opération idempotente |
| `PATCH /admin/users/{id}/status?statut=` | corps `{ "statut": … }` | état dans le corps |
| jeton de rafraîchissement dans le corps | cookie HttpOnly, `Secure`, `SameSite=Strict`, chemin `/api/v1/auth` | section 8.7.3 |
| rôles `ROLE_MEMBRE` dans les réponses | `MEMBRE` | contrat |
| pagination Spring Data brute, dates sans fuseau, format d'erreur propre | enveloppe uniforme, ISO 8601 UTC, RFC 9457 | section 9.2 |
| `POST /admin/system/backup`, `PUT /admin/security/2fa/{userId}`, `/auth/2fa/…`, `/statistiques/publiques`, `/projets/{id}/membres` public | supprimés | simulations, règle 6.6, B-09, B-19 |

Les changements correspondants du frontend sont listés dans `docs/besoins-backend.md`, section 11.

### 2.4. Migrations

Nouvelles migrations uniquement, à partir de V3 ; `repair()` automatique retiré de la configuration Flyway.

| Migration | Objet |
|---|---|
| V3 | neutralisation du compte amorcé par V2 (B-01, B-31) ; colonne `test` et `changement_mot_de_passe_requis` sur `utilisateur` |
| V4 | conversion des horodatages en `TIMESTAMPTZ` |
| V5 | jetons hachés : vérification d'adresse, réinitialisation, invitation, rafraîchissement |
| V6 | corrections de référence : libellés accentués, purge des pages et catégories inventées (B-38) |
| V7 | `membre_bureau`, `fichier`, `preference_utilisateur`, `parametre_systeme`, `sauvegarde` |
| V8 | `actualite.visibilite`, `projet.motif_decision`, contraintes d'unicité partielles (courriel des comptes non supprimés), index manquants |

Les données de test sont créées par un mécanisme séparé (`APP_SEED_TEST_ACCOUNTS=true`), jamais par migration.

### 2.5. Tests

- Pour chaque bogue : un test qui échoue, la correction, le test conservé (section 8.3.1).
- Tests d'intégration sur PostgreSQL réel par Testcontainers (déjà déclaré, inutilisé) : pour chaque point d'accès, cas nominal, validation, refus d'accès.
- Tests unitaires de la logique métier (quotas, liste d'attente, hiérarchie des rôles, verrouillage).
- Couverture mesurée par JaCoCo dans le build ; cible du CDC : plus de 80 % sur les services.
- Vérification du contrat : la documentation OpenAPI produite par le serveur est comparée à `docs/api-contract.openapi.yaml` dans la CI.

## 3. Bogues à corriger

Les 39 bogues de `docs/audit-backend.md` (section G.8) sont repris tels quels. Répartition par lot :

| Lot | Bogues |
|---|---|
| Fondations | B-01, B-04, B-05, B-07, B-21, B-22, B-23, B-25, B-26, B-29, B-30, B-31, B-32, B-33, B-34, B-38, B-39 |
| Authentification et comptes | B-03, B-06, B-13, B-14, B-15, B-16, B-17, B-20, B-27, B-28 |
| Contenus publics | B-08 (actualités, événements), B-19, B-24 |
| Espace Membre et formation | B-02, B-10 (formations, séances, devoirs, ressources, présences), B-18, B-35 (séances) |
| Événements et publications | B-11, B-35 (événements) |
| Projets | B-08 (projets), B-09, B-10 (suivi), B-12, B-36, B-37 |

Bogues suspectés, à confirmer par un test pendant la reprise : dépassement de capacité sous inscriptions concurrentes (B-11) ; promotion automatique de la liste d'attente à l'annulation ; suppression d'une catégorie encore utilisée ; suppression d'une formation ou d'un événement ayant des inscrits.

## 4. Ordre des travaux

Chaque lot comprend : tests des bogues, migrations, code, tests unitaires et d'intégration, mise à jour du contrat, puis intégration du frontend correspondant en Phase 4. L'estimation est en jours de travail effectif ; elle suppose les décisions de la section 6 prises.

| Lot | Contenu principal | Estimation |
|---|---|---|
| 1. Fondations transversales | `/api/v1`, erreurs RFC 9457, pagination, dates UTC, CORS en liste blanche, en-têtes de sécurité, secret JWT obligatoire, routes techniques fermées, limitation de débit, journal d'audit, comptes de test marqués et retirables, amorçage du Super Admin, courriel asynchrone avec capture locale, stockage de fichiers, Testcontainers et JaCoCo | 5 à 6 jours |
| 2. Authentification et comptes | vérification d'adresse, cookie de rafraîchissement avec rotation, réinitialisation à jeton haché, invitation, changement de mot de passe imposé, préférences, export, suppression, hiérarchie des rôles, verrouillage et déverrouillage | 3 à 4 jours |
| 3. Contenus publics | bureau, page d'accueil, visibilité des contenus non publiés, catégories, ressources, contact protégé et notifié, iCalendar, cache conditionnel | 2 jours |
| 4. Espace Membre et formation | accès conditionné à l'inscription, propriété des formations, conflits de planning, compteurs en base, présences vérifiées | 2 à 3 jours |
| 5. Événements et publications | quota sous concurrence, promotion de la liste d'attente, visibilité des actualités, publications internes, bornes de date | 2 jours |
| 6. Notifications | création par les événements métier, filtres, préférences, rappels de séance | 1 à 2 jours |
| 7. Projets | mes projets, motif persistant, accès réservé, compteurs | 1 à 2 jours |
| 8. Gestion et administration | messages, comptes (recherche, filtres), rôles, journal filtrable | 2 jours |
| 9. Tableaux de bord et statistiques | indicateurs et statistiques en SQL hors comptes de test, réglages persistants et effectifs, état des sauvegardes, conformité calculée | 2 à 3 jours |
| Performance et exploitation | mesures avant et après (hachage, démarrage, pool, index, N+1), santé, journaux structurés, sauvegarde et restauration testées | 2 jours |

Total estimé : 22 à 28 jours de travail effectif pour la Phase 3. Critères de sortie : section 8.3.5 du cahier d’exécution.

## 5. Risques

| Risque | Parade |
|---|---|
| Conversion des dates et du format de pagination : régression sur toutes les pages | lot 1 mené avec la suite d'intégration et la recette automatisée existante (`e2e/recette-page.mjs`) rejouée sur chaque page |
| Cookie de rafraîchissement entre deux origines sur Railway | frontend et API servis sous la même origine par le proxy `/api` (déjà en place en développement) |
| Stockage de fichiers sur Railway (disque éphémère) | volume persistant ou stockage objet : choix à arrêter (section 6) |
| Fournisseur de courriel | offres gratuites à vérifier sur la documentation des fournisseurs au moment du lot 1 ; capture locale en développement |
| Données existantes en production | à ce jour aucune instance de production alimentée n'est connue ; à confirmer avant V3 |

## 6. Décisions attendues au point d'arrêt 3

1. **Routes** : valider le préfixe `/api/v1` et les renommages de la section 2.3.
2. **Fichiers** : valider le dépôt de fichiers pour les supports, les consignes et l'image de couverture des actualités. Pour les avatars, le frontend livré utilise des initiales (écart E-35) : confirmer ce choix ou demander le dépôt d'une photo de profil.
3. **Stockage sur Railway** : volume persistant (plus simple) ou stockage objet compatible S3.
4. **Messages de contact** : conserver deux états (nouveau, traité) ou ajouter « archivé ».
5. **Suivi des projets** : tout formateur suit tout projet validé (modèle actuel), ou affectation d'un formateur à chaque projet.
6. **Informations du club** (`docs/informations-a-fournir.md`) : courriel du premier Super Admin réel, composition du bureau, textes de présentation ; nécessaires avant la mise en ligne, non avant la Phase 3.
7. **Crochet de la section 6.12** : son installation reste à faire par vous (refusée à l'exécutant par le contrôle d'autorisations).
