# Journal de recette : Bureau du club

Identifiant : 03-bureau. Route : `/bureau`. Date : 2026-10-01.
Référence : écran `03-bureau` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Backend actuel : point d’accès à créer, état d’erreur affiché ; Composition renseignée (réponse conforme au contrat cible) ; Bureau non renseigné ; Chargement |
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

- Backend actuel : point d’accès à créer, état d’erreur affiché : `backend-actuel-sombre-1440.png`, `backend-actuel-clair-1440.png`, `backend-actuel-sombre-390.png`, `backend-actuel-clair-390.png`
- Composition renseignée (réponse conforme au contrat cible) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Bureau non renseigné : `vide-sombre-1440.png`, `vide-clair-1440.png`, `vide-sombre-390.png`, `vide-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Membres | cinq personnes fictives | liste renvoyée par l’API ; état vide tant que le club ne l’a pas renseignée (E.5) | assumé |
| Photo | avatar neutre | avatar neutre, aucune photo | conforme (règle 6.4) |
| Emoji de fonction | présents dans les badges | retirés | corrigé (E-01) |

## États

- Chargement, vide (« Les membres du bureau ne sont pas encore renseignés. »), erreur, contenu.
