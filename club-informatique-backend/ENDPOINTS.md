# Matrice de Traçabilité des Endpoints — Backend Club Informatique IST

Toutes les routes sont préfixées par le contexte applicatif `/api`.

---

## 1. Authentification, Session & Sécurité (UC-05, UC-06, UC-08, UC-27)

| Cas d'Usage | Méthode | Route | Accès / Rôle | Description |
|---|---|---|---|---|
| **UC-05** | `POST` | `/api/auth/register` | Public | Inscription d'un nouvel étudiant au club |
| **UC-06** | `POST` | `/api/auth/login` | Public (Rate-limited) | Connexion (email, mot de passe, code 2FA optionnel) |
| **UC-06** | `POST` | `/api/auth/refresh` | Public | Renouvellement de l'access token via refresh token |
| **UC-06** | `POST` | `/api/auth/logout` | Authentifié | Déconnexion et révocation de session |
| **UC-08** | `POST` | `/api/auth/forgot-password` | Public (Rate-limited) | Demande de lien/token de réinitialisation |
| **UC-08** | `POST` | `/api/auth/reset-password` | Public | Réinitialisation du mot de passe avec le token |
| **UC-27** | `POST` | `/api/auth/2fa/setup` | Authentifié | Initialisation de la double authentification TOTP |
| **UC-27** | `POST` | `/api/auth/2fa/verify` | Authentifié | Validation du code TOTP et activation définitive |
| **UC-27** | `POST` | `/api/auth/2fa/disable` | Authentifié | Désactivation de la 2FA avec code TOTP |

---

## 2. Profil & Utilisateurs (UC-07, UC-23, UC-24)

| Cas d'Usage | Méthode | Route | Accès / Rôle | Description |
|---|---|---|---|---|
| **UC-07** | `GET` | `/api/users/me` | Authentifié | Consultation du profil connecté |
| **UC-07** | `PUT` | `/api/users/me` | Authentifié | Modification des coordonnées et biographie |
| **UC-07** | `PUT` | `/api/users/me/password` | Authentifié | Changement sécurisé de mot de passe |
| **UC-23** | `GET` | `/api/admin/users` | ADMIN, SUPER_ADMIN | Liste paginée de tous les utilisateurs |
| **UC-23** | `GET` | `/api/admin/users/{id}` | ADMIN, SUPER_ADMIN | Détail complet d'un utilisateur |
| **UC-23** | `POST` | `/api/admin/users` | ADMIN, SUPER_ADMIN | Création manuelle d'un compte utilisateur |
| **UC-23** | `PUT` | `/api/admin/users/{id}` | ADMIN, SUPER_ADMIN | Modification des informations utilisateur |
| **UC-23** | `DELETE` | `/api/admin/users/{id}` | ADMIN, SUPER_ADMIN | Suppression logique (soft delete / suspension) |
| **UC-23** | `PATCH` | `/api/admin/users/{id}/status` | ADMIN, SUPER_ADMIN | Modification du statut (ACTIF, SUSPENDU, etc.) |
| **UC-24** | `PUT` | `/api/admin/users/{id}/roles` | ADMIN, SUPER_ADMIN | Attribution et mise à jour des rôles d'un compte |
| **UC-24** | `GET` | `/api/admin/roles` | ADMIN, SUPER_ADMIN | Liste des rôles configurés |
| **UC-24** | `GET` | `/api/admin/roles/{id}` | ADMIN, SUPER_ADMIN | Détail d'un rôle |
| **UC-24** | `POST` | `/api/admin/roles` | ADMIN, SUPER_ADMIN | Création d'un nouveau rôle |
| **UC-24** | `PUT` | `/api/admin/roles/{id}/permissions` | ADMIN, SUPER_ADMIN | Configuration des permissions d'un rôle |
| **UC-24** | `GET` | `/api/admin/permissions` | ADMIN, SUPER_ADMIN | Liste de toutes les permissions système |

---

## 3. Catégories (UC-25, UC-02)

| Cas d'Usage | Méthode | Route | Accès / Rôle | Description |
|---|---|---|---|---|
| **UC-02** | `GET` | `/api/categories` | Public | Liste des catégories actives |
| **UC-02** | `GET` | `/api/categories/{id}` | Public | Consultation d'une catégorie par ID |
| **UC-02** | `GET` | `/api/categories/slug/{slug}` | Public | Consultation d'une catégorie par slug |
| **UC-25** | `POST` | `/api/categories` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Création d'une catégorie thématique |
| **UC-25** | `PUT` | `/api/categories/{id}` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Modification d'une catégorie |
| **UC-25** | `DELETE` | `/api/categories/{id}` | ADMIN, SUPER_ADMIN | Suppression logique d'une catégorie |

---

## 4. Actualités & Articles (UC-02, UC-18)

| Cas d'Usage | Méthode | Route | Accès / Rôle | Description |
|---|---|---|---|---|
| **UC-02** | `GET` | `/api/actualites` | Public | Liste paginée des actualités publiées (filtre catégorie & recherche) |
| **UC-02** | `GET` | `/api/actualites/{id}` | Public | Détail d'une actualité par ID |
| **UC-02** | `GET` | `/api/actualites/slug/{slug}` | Public | Détail d'une actualité par slug |
| **UC-18** | `GET` | `/api/actualites/admin/all` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Liste de tous les articles (brouillons inclus) |
| **UC-18** | `POST` | `/api/actualites` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Rédaction et publication d'un article |
| **UC-18** | `PUT` | `/api/actualites/{id}` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Modification d'un article |
| **UC-18** | `PATCH` | `/api/actualites/{id}/publication` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Bascule état publication (brouillon / publié) |
| **UC-18** | `DELETE` | `/api/actualites/{id}` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Suppression logique d'un article |

---

## 5. Événements & Ateliers (UC-02, UC-19)

| Cas d'Usage | Méthode | Route | Accès / Rôle | Description |
|---|---|---|---|---|
| **UC-02** | `GET` | `/api/evenements` | Public | Liste paginée des événements publiés (filtre à venir/passés, catégorie, recherche) |
| **UC-02** | `GET` | `/api/evenements/{id}` | Public | Détail d'un événement par ID |
| **UC-02** | `GET` | `/api/evenements/slug/{slug}` | Public | Détail d'un événement par slug |
| **UC-19** | `GET` | `/api/evenements/admin/all` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Liste de tous les événements pour administration |
| **UC-19** | `POST` | `/api/evenements` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Création et planification d'un événement |
| **UC-19** | `PUT` | `/api/evenements/{id}` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Modification d'un événement |
| **UC-19** | `PATCH` | `/api/evenements/{id}/publication` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Bascule de l'état de publication |
| **UC-19** | `DELETE` | `/api/evenements/{id}` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Suppression logique d'un événement |

---

## 6. Formations, Sessions & Devoirs (UC-02, UC-10, UC-14, UC-16)

| Cas d'Usage | Méthode | Route | Accès / Rôle | Description |
|---|---|---|---|---|
| **UC-02** | `GET` | `/api/formations` | Public | Catalogue des formations publiées (filtre niveau, catégorie, recherche) |
| **UC-02** | `GET` | `/api/formations/{id}` | Public | Fiche détaillée d'une formation |
| **UC-02** | `GET` | `/api/formations/slug/{slug}` | Public | Fiche détaillée d'une formation par slug |
| **UC-14** | `GET` | `/api/formations/admin/all` | FORMATEUR, RESPONSABLE_CLUB, ADMIN | Liste de toutes les formations |
| **UC-14** | `POST` | `/api/formations` | FORMATEUR, RESPONSABLE_CLUB, ADMIN | Création d'une nouvelle formation |
| **UC-14** | `PUT` | `/api/formations/{id}` | FORMATEUR, RESPONSABLE_CLUB, ADMIN | Modification d'une formation |
| **UC-14** | `PATCH` | `/api/formations/{id}/publication` | FORMATEUR, RESPONSABLE_CLUB, ADMIN | Bascule publication catalogue |
| **UC-14** | `DELETE` | `/api/formations/{id}` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Suppression logique d'une formation |
| **UC-14** | `GET` | `/api/formations/{id}/sessions` | Public / Membre | Sessions planifiées d'une formation |
| **UC-14** | `POST` | `/api/formations/{id}/sessions` | FORMATEUR, RESPONSABLE_CLUB, ADMIN | Ajout d'une session de formation planifiée |
| **UC-14** | `PUT` | `/api/formations/{formId}/sessions/{sessId}` | FORMATEUR, RESPONSABLE_CLUB, ADMIN | Modification d'une session |
| **UC-14** | `DELETE` | `/api/formations/{formId}/sessions/{sessId}` | FORMATEUR, RESPONSABLE_CLUB, ADMIN | Suppression d'une session |
| **UC-10** | `GET` | `/api/formations/{id}/devoirs` | Authentifié | Consultation des devoirs/consignes de la formation |
| **UC-16** | `POST` | `/api/formations/{id}/devoirs` | FORMATEUR, RESPONSABLE_CLUB, ADMIN | Publication d'un devoir pratique |
| **UC-16** | `DELETE` | `/api/formations/{formId}/devoirs/{devoirId}` | FORMATEUR, RESPONSABLE_CLUB, ADMIN | Suppression d'un devoir |

---

## 7. Inscriptions & Feuilles de Présence (UC-09, UC-12, UC-15, UC-21)

| Cas d'Usage | Méthode | Route | Accès / Rôle | Description |
|---|---|---|---|---|
| **UC-09** | `POST` | `/api/inscriptions/evenements/{evenementId}` | Authentifié | Inscription à un événement (gestion liste d'attente auto) |
| **UC-09** | `POST` | `/api/inscriptions/formations/{sessionId}` | Authentifié | Inscription à une session de formation |
| **UC-12** | `GET` | `/api/inscriptions/me` | Authentifié | Historique des inscriptions de l'utilisateur connecté |
| **UC-09** | `DELETE` | `/api/inscriptions/{id}` | Authentifié | Annulation d'inscription (promotion automatique du suivant en liste d'attente) |
| **UC-21** | `GET` | `/api/inscriptions/evenements/{evenementId}` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Liste des inscrits à un événement |
| **UC-21** | `GET` | `/api/inscriptions/formations/{sessionId}` | FORMATEUR, RESPONSABLE_CLUB, ADMIN | Liste des inscrits à une session |
| **UC-21** | `PUT` | `/api/inscriptions/{id}/statut` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Promotion ou modification manuelle du statut d'inscription |
| **UC-15** | `GET` | `/api/presences/sessions/{sessionId}` | FORMATEUR, RESPONSABLE_CLUB, ADMIN | Consultation de la feuille d'émargement |
| **UC-15** | `POST` | `/api/presences/sessions/{sessionId}` | FORMATEUR, RESPONSABLE_CLUB, ADMIN | Pointage groupé (PRESENT, ABSENT, EXCUSE) |

---

## 8. Projets Collaboratifs (UC-02, UC-11, UC-17, UC-20)

| Cas d'Usage | Méthode | Route | Accès / Rôle | Description |
|---|---|---|---|---|
| **UC-02** | `GET` | `/api/projets` | Public | Projets validés, en cours et terminés |
| **UC-02** | `GET` | `/api/projets/{id}` | Public | Fiche détaillée d'un projet |
| **UC-02** | `GET` | `/api/projets/slug/{slug}` | Public | Fiche détaillée d'un projet par slug |
| **UC-11** | `POST` | `/api/projets` | Authentifié (MEMBRE+) | Soumission d'une proposition de projet (statut PROPOSE) |
| **UC-20** | `GET` | `/api/projets/en-attente` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Propositions en attente d'approbation |
| **UC-20** | `PUT` | `/api/projets/{id}/validation` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Validation (-> EN_COURS) ou Rejet du projet |
| **UC-11** | `POST` | `/api/projets/{id}/membres` | Authentifié (MEMBRE+) | Rejoindre l'équipe d'un projet validé |
| **UC-17** | `GET` | `/api/projets/{id}/membres` | Public / Authentifié | Liste des contributeurs du projet |
| **UC-17** | `PUT` | `/api/projets/{id}/suivi` | FORMATEUR, RESPONSABLE_CLUB, ADMIN | Commentaires d'encadrement et pourcentage d'avancement |
| **UC-20** | `DELETE` | `/api/projets/{id}` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Suppression logique d'un projet |

---

## 9. Ressources Pédagogiques (UC-03, UC-10, UC-16)

| Cas d'Usage | Méthode | Route | Accès / Rôle | Description |
|---|---|---|---|---|
| **UC-03** | `GET` | `/api/ressources/publiques` | Public | Ressources pédagogiques publiques |
| **UC-03** | `GET` | `/api/ressources/{id}` | Public / Authentifié | Détail d'une ressource |
| **UC-10** | `GET` | `/api/ressources/formation/{formationId}` | Authentifié | Ressources associées à une formation |
| **UC-16** | `POST` | `/api/ressources` | FORMATEUR, RESPONSABLE_CLUB, ADMIN | Ajout d'une ressource (PDF, support, lien, vidéo) |
| **UC-16** | `PUT` | `/api/ressources/{id}` | FORMATEUR, RESPONSABLE_CLUB, ADMIN | Modification d'une ressource |
| **UC-16** | `DELETE` | `/api/ressources/{id}` | FORMATEUR, RESPONSABLE_CLUB, ADMIN | Suppression logique d'une ressource |

---

## 10. Notifications In-App (UC-13, UC-22)

| Cas d'Usage | Méthode | Route | Accès / Rôle | Description |
|---|---|---|---|---|
| **UC-13** | `GET` | `/api/notifications` | Authentifié | Liste paginée de ses notifications |
| **UC-13** | `GET` | `/api/notifications/non-lues/count` | Authentifié | Nombre de notifications non lues (badge) |
| **UC-13** | `PUT` | `/api/notifications/{id}/lue` | Authentifié | Marquer une notification comme lue |
| **UC-13** | `PUT` | `/api/notifications/lire-toutes` | Authentifié | Marquer toutes ses notifications comme lues |
| **UC-22** | `POST` | `/api/notifications/globales` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Diffusion d'un message d'information à tous les membres |

---

## 11. Formulaire de Contact (UC-04)

| Cas d'Usage | Méthode | Route | Accès / Rôle | Description |
|---|---|---|---|---|
| **UC-04** | `POST` | `/api/contact` | Public | Envoi d'un message via le formulaire |
| **UC-04** | `GET` | `/api/contact/admin` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Consultation des messages reçus |
| **UC-04** | `PUT` | `/api/contact/admin/{id}/traite` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Marquer un message comme traité |

---

## 12. Pages Informatives CMS (UC-01, UC-25)

| Cas d'Usage | Méthode | Route | Accès / Rôle | Description |
|---|---|---|---|---|
| **UC-01** | `GET` | `/api/pages/{slug}` | Public | Contenu d'une page statique (`accueil`, `presentation`, `bureau`) |
| **UC-25** | `PUT` | `/api/pages/{slug}` | ADMIN, SUPER_ADMIN | Modification du contenu textuel/Markdown d'une page |

---

## 13. Administration, Sécurité & Conformité DSI (UC-26, UC-27, UC-28, UC-29)

| Cas d'Usage | Méthode | Route | Accès / Rôle | Description |
|---|---|---|---|---|
| **UC-26** | `GET` | `/api/admin/statistiques` | RESPONSABLE_CLUB, ADMIN, SUPER_ADMIN | Tableau de bord statistiques & KPIs |
| **UC-27** | `GET` | `/api/admin/security/alerts` | ADMIN, SUPER_ADMIN | Alertes sécurité et comptes verrouillés |
| **UC-27** | `PUT` | `/api/admin/security/2fa/{userId}` | ADMIN, SUPER_ADMIN | Imposer ou révoquer la 2FA pour un utilisateur |
| **UC-27** | `GET` | `/api/admin/security/audit-logs` | ADMIN, SUPER_ADMIN | Consultation complète du journal d'audit |
| **UC-28** | `GET` | `/api/admin/system/config` | SUPER_ADMIN | Consultation des paramètres système globaux |
| **UC-28** | `PUT` | `/api/admin/system/config` | SUPER_ADMIN | Modification des paramètres système |
| **UC-28** | `POST` | `/api/admin/system/backup` | SUPER_ADMIN | Déclenchement d'une sauvegarde manuelle |
| **UC-29** | `GET` | `/api/dsi/conformite` | DSI (Lecture seule) | Tableau de bord de conformité technique et sécurité |
| **UC-29** | `GET` | `/api/dsi/conformite/logs` | DSI (Lecture seule) | Consultation des logs d'audit en lecture seule |
