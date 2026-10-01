# Journal de recette : Gestion des cours, liste

Identifiant : 36-gestion-cours-liste. Route : `/espace/formateur/cours`. Date : 2026-10-01.
Référence : écran `36-gestion-cours-liste` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (cours du formateur de recette) ; Filtre « Brouillons » (aucun brouillon en base de recette) ; Aucun cours ; Chargement ; Service injoignable |
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

- Contenu réel (cours du formateur de recette) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Filtre « Brouillons » (aucun brouillon en base de recette) : `filtre-sombre-1440.png`, `filtre-clair-1440.png`, `filtre-sombre-390.png`, `filtre-clair-390.png`
- Aucun cours : `vide-sombre-1440.png`, `vide-clair-1440.png`, `vide-sombre-390.png`, `vide-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| Titre et sous-titre | « Gestion des cours & ateliers », « Sessions 2025-2026 » | « Gestion des cours » et description de la page | assumé |
| Filtres | « Tous (3) », « En cours (2) », « À venir (1) », « Archivés (4) » | « Tous », « Publiés », « Brouillons » : états réels du modèle, sans compteur | assumé (section 1) |
| Badge | « Formation Active », « En cours », « Planifié » | « Publié » ou « Brouillon » | assumé |
| Inscrits et progression | valeurs fixes | inscriptions réelles cumulées et séances tenues sur séances planifiées | assumé (section 1) |
| Bouton « Émargement » | sur la carte | par séance, dans le détail du cours | assumé |

## États

- Chargement : squelettes de carte.
- Vide : message propre au filtre et lien de création.
- Erreur : message et « Réessayer ».
- Contenu : pagination côté serveur.
