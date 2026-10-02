# Journal de recette : Gestion des catégories

Identifiant : 54-gestion-contenus-categories. Route : `/espace/admin/categories`. Date : 2026-10-02.
Référence : écran `54-gestion-contenus-categories` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (catégories du serveur) ; Création : validation du formulaire ; Suppression : modale de confirmation (non confirmée) ; Aucune catégorie ; Chargement ; Service injoignable |
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

- Contenu réel (catégories du serveur) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Création : validation du formulaire : `creation-sombre-1440.png`, `creation-clair-1440.png`, `creation-sombre-390.png`, `creation-clair-390.png`
- Suppression : modale de confirmation (non confirmée) : `suppression-sombre-1440.png`, `suppression-clair-1440.png`, `suppression-sombre-390.png`, `suppression-clair-390.png`
- Aucune catégorie : `vide-sombre-1440.png`, `vide-clair-1440.png`, `vide-sombre-390.png`, `vide-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| Compteurs « 18 articles • 3 cours » | valeurs fixes | retirés : le serveur ne fournit pas ces décomptes | retrait (section 1) |
| « Archiver » | bouton | « Supprimer » avec confirmation ; le serveur refuse si la catégorie est utilisée | assumé (modèle existant) |
| Couleur | badge coloré | repère de la couleur réelle de la catégorie, modifiable | assumé |

## États

- Chargement : squelettes.
- Vide : message.
- Erreur : message et « Réessayer ».
- Formulaire : validation, erreurs du serveur, notification de succès.
