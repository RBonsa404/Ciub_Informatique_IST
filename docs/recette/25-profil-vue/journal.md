# Journal de recette : Profil, consultation

Identifiant : 25-profil-vue. Route : `/espace/profil`. Date : 2026-10-02.
Référence : écran `25-profil-vue` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (compte de recette) ; Chargement ; Service injoignable |
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

- Contenu réel (compte de recette) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille « 5 » | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (aucune recherche globale au CDC) |
| Titre | « Mon Profil Membre » | « Mon profil » (page commune à tous les rôles) | assumé |
| Badge | « Membre Actif » | statut réel du compte | assumé |
| Sous-titre | filière et nom de l’établissement | filière saisie par l’utilisateur | assumé |
| Grille d’informations | courriel, téléphone, adhésion, localisation | courriel, numéro de membre, date d’adhésion, rôle (données réelles du compte) | assumé (minimisation, BNF-09) |
| Panneau « Compétences & Domaines d’intérêt » | présent | retiré | retrait (D-04) |

## États

- Chargement : squelette de la carte.
- Erreur : message et action « Réessayer ».
- Contenu : informations réelles du compte ; mention explicite si la présentation est vide.
