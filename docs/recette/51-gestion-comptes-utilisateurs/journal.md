# Journal de recette : Gestion des comptes utilisateurs

Identifiant : 51-gestion-comptes-utilisateurs. Route : `/espace/admin/utilisateurs`. Date : 2026-10-02.
Référence : écran `51-gestion-comptes-utilisateurs` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (comptes de la base de recette) ; Recherche par adresse (recherche réelle du serveur) ; Invitation : validation du formulaire ; Aucun compte ; Chargement ; Service injoignable |
| Thèmes | clair et sombre |
| Largeurs | 360, 390, 768, 1024, 1280, 1440, 1920 px |
| Débordement horizontal | 0 |
| Messages de console inattendus | 0 |
| Violations axe (WCAG 2.2 AA) | 0 |

### Débordements
Aucun.

### Console et contrôles
Aucun.

### Accessibilité
Aucun.

## Captures

- Contenu réel (comptes de la base de recette) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Recherche par adresse (recherche réelle du serveur) : `recherche-sombre-1440.png`, `recherche-clair-1440.png`, `recherche-sombre-390.png`, `recherche-clair-390.png`
- Invitation : validation du formulaire : `invitation-sombre-1440.png`, `invitation-clair-1440.png`, `invitation-sombre-390.png`, `invitation-clair-390.png`
- Aucun compte : `vide-sombre-1440.png`, `vide-clair-1440.png`, `vide-sombre-390.png`, `vide-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| Rôle attribué | un seul rôle par compte | tous les rôles réels du compte, du plus élevé au moins élevé | assumé (modèle existant) |
| « Inviter un utilisateur » | bouton inactif | formulaire : la personne invitée choisit elle-même son mot de passe par un lien à usage unique reçu par courriel | assumé (8.7.9) |
| Filière | saisie libre | saisie libre | conforme (6.5) |

## États

- Chargement : squelettes.
- Vide : message (ou message de recherche).
- Erreur : message et « Réessayer ».
- Contenu : pagination côté serveur, recherche différée.
