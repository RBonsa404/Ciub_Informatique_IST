# Journal de recette : Gestion des actualités, liste

Identifiant : 43-gestion-actualites-liste. Route : `/espace/gestion/actualites`. Date : 2026-10-01.
Référence : écran `43-gestion-actualites-liste` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (actualités de la base de recette) ; Filtre « Brouillon » ; Publication puis retrait réels du brouillon (backend) ; Suppression : modale de confirmation (non confirmée) ; Aucune actualité ; Chargement ; Service injoignable |
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

- Contenu réel (actualités de la base de recette) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Filtre « Brouillon » : `filtre-sombre-1440.png`, `filtre-clair-1440.png`, `filtre-sombre-390.png`, `filtre-clair-390.png`
- Publication puis retrait réels du brouillon (backend) : `publication-sombre-1440.png`, `publication-clair-1440.png`, `publication-sombre-390.png`, `publication-clair-390.png`
- Suppression : modale de confirmation (non confirmée) : `suppression-sombre-1440.png`, `suppression-clair-1440.png`, `suppression-sombre-390.png`, `suppression-clair-390.png`
- Aucune actualité : `vide-sombre-1440.png`, `vide-clair-1440.png`, `vide-sombre-390.png`, `vide-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| Actions | « Modifier » | modifier, publier ou dépublier, supprimer avec confirmation | assumé (UC-18) |
| Date de publication d’un brouillon | non prévue | tiret | assumé |

## États

- Chargement : squelettes.
- Vide : message propre au filtre.
- Erreur : message et « Réessayer ».
- Contenu : tableau défilant sur petit écran, pagination côté serveur.
