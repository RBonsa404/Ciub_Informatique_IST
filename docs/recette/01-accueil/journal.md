# Journal de recette : Accueil

Identifiant : 01-accueil. Route : `/`. Date : 2026-10-02.
Référence : écran `01-accueil` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (backend et base de recette) ; Aucun événement ni actualité : sections masquées ; Chargement ; Service injoignable : sections masquées |
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

- Contenu réel (backend et base de recette) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Aucun événement ni actualité : sections masquées : `base-vide-sombre-1440.png`, `base-vide-clair-1440.png`, `base-vide-sombre-390.png`, `base-vide-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : sections masquées : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Bandeau « Ensemble vers l’innovation », devise « Apprendre • Partager • Innover » | présents | retirés tant que le club ne les a pas validés (C.1) | retrait |
| Texte d’accroche | texte de démonstration | contenu de la page d’information « accueil » géré par l’administration ; masqué s’il est vide | assumé |
| Visuel de droite | logo, nom et devise | logo et nom | retrait partiel |
| « IST » du titre en thème sombre | bleu royal (contraste 2,8:1) | bleu éclairci | corrigé (10.2.3) |
| Cartes d’événement et d’actualité | non cliquables | titre cliquable vers le détail | assumé |

## États

- Chargement : squelettes, aucune valeur provisoire.
- Vide ou erreur : la section est masquée (annexe C.2).
- Contenu : deux prochains événements et quatre dernières actualités publiés.
