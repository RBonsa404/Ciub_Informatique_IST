# Journal de recette : Rôles et permissions

Identifiant : 53-gestion-roles-permissions. Route : `/espace/admin/roles`. Date : 2026-10-02.
Référence : écran `53-gestion-roles-permissions` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (rôles et permissions du serveur) ; Chargement ; Service injoignable |
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

- Contenu réel (rôles et permissions du serveur) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| Matrice | sept lignes de fonctionnalités, quatre rôles | permissions et rôles réels du serveur | assumé (section 1) |
| « Rétablir défaut », « Enregistrer la matrice » | boutons | retirés : matrice en lecture seule | retrait (D-07) |
| Pictogrammes « ✓ » et « ✗ » | caractères | icônes avec texte pour les lecteurs d’écran | corrigé (E-01) |

## États

- Chargement : squelette.
- Erreur : message et « Réessayer ».
- Contenu : tableau défilant sur petit écran.
