# Journal de recette : Publication, détail

Identifiant : 24-feed-detail. Route : `/espace/publications/reunion-de-preparation`. Date : 2026-10-01.
Référence : écran `24-feed-detail` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu selon le contrat d’API (point d’accès à créer) ; Publication introuvable ; Chargement ; Backend actuel : point d’accès absent (erreur 500, état d’erreur affiché) |
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

- Contenu selon le contrat d’API (point d’accès à créer) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Publication introuvable : `introuvable-sombre-1440.png`, `introuvable-clair-1440.png`, `introuvable-sombre-390.png`, `introuvable-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Backend actuel : point d’accès absent (erreur 500, état d’erreur affiché) : `backend-actuel-sombre-1440.png`, `backend-actuel-clair-1440.png`, `backend-actuel-sombre-390.png`, `backend-actuel-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| Commentaires, mentions « J’aime », partage | présents | retirés | retrait (D-01) |
| « Publications connexes » | présent | retiré | retrait (D-01) |
| Galerie et bandeau à emoji | présents | retirés | retrait (6.4) |

## États

- Chargement : squelette.
- Introuvable : message dédié.
- Erreur : message et « Réessayer ».
- Contenu : texte structuré (paragraphes, titres, citations).
