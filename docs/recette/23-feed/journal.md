# Journal de recette : Publications du club

Identifiant : 23-feed. Route : `/espace/publications`. Date : 2026-10-02.
Référence : écran `23-feed` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (annonces réservées aux membres de la base de recette) ; Aucune publication ; Chargement ; Service injoignable |
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

- Contenu réel (annonces réservées aux membres de la base de recette) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Aucune publication : `vide-sombre-1440.png`, `vide-clair-1440.png`, `vide-sombre-390.png`, `vide-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| Nature de la page | fil social (mentions « J’aime », commentaires) | annonces internes en lecture seule | dérivation (D-01, CDC) |
| Filtres « Toutes (12) », « Annonces »… | présents | retirés ; la catégorie figure sur chaque annonce | retrait (section 1) |
| Bandeau illustré et emoji | présents | retirés | retrait (6.4) |
| Fonction de l’auteur, pastille de certification | présentes | nom de l’auteur et date de publication | assumé (donnée absente) |

## États

- Chargement : squelettes.
- Vide : message.
- Erreur : message et « Réessayer ».
- Contenu : pagination côté serveur.
