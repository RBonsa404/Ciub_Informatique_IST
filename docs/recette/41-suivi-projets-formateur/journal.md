# Journal de recette : Suivi des projets par le formateur

Identifiant : 41-suivi-projets-formateur. Route : `/espace/formateur/projets`. Date : 2026-10-02.
Référence : écran `41-suivi-projets-formateur` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (projets validés de la base de recette) ; Aucun projet validé ; Chargement ; Service injoignable ; Suivi d’un projet : fiche et formulaire (projet réel) ; Suivi d’un projet : enregistrement réel (backend) ; Suivi d’un projet introuvable (réponse réelle du backend) |
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

- Contenu réel (projets validés de la base de recette) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Aucun projet validé : `vide-sombre-1440.png`, `vide-clair-1440.png`, `vide-sombre-390.png`, `vide-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`
- Suivi d’un projet : fiche et formulaire (projet réel) : `suivi-sombre-1440.png`, `suivi-clair-1440.png`, `suivi-sombre-390.png`, `suivi-clair-390.png`
- Suivi d’un projet : enregistrement réel (backend) : `suivi-enregistrement-sombre-1440.png`, `suivi-enregistrement-clair-1440.png`, `suivi-enregistrement-sombre-390.png`, `suivi-enregistrement-clair-390.png`
- Suivi d’un projet introuvable (réponse réelle du backend) : `suivi-introuvable-sombre-1440.png`, `suivi-introuvable-clair-1440.png`, `suivi-introuvable-sombre-390.png`, `suivi-introuvable-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| Compteurs « 8 projets suivis », « 3 à relancer » | valeurs fixes | nombre réel de projets validés ; « à relancer » retiré (notion absente) | assumé et retrait (section 1) |
| Filtres par domaine | liste fixe de trois domaines | catégories réelles du serveur | assumé |
| Pastilles de domaine | texte dans la pastille | icône unique | assumé (6.4) |
| « Voir le projet », « Examiner le livrable » | liens vers l’écran du Responsable | « Suivre le projet » : fiche et formulaire de suivi (avancement, note) | dérivation (UC-17) |

## États

- Liste : squelettes, vide, erreur, contenu paginé côté serveur.
- Suivi : squelette, introuvable, validation, notification de succès.
