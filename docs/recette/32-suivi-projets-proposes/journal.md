# Journal de recette : Suivi de mes projets proposés

Identifiant : 32-suivi-projets-proposes. Route : `/espace/projets`. Date : 2026-10-02.
Référence : écran `32-suivi-projets-proposes` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu selon le contrat d’API, à partir des projets réels du membre ; Aucun projet proposé ; Chargement ; Backend actuel : point d’accès absent (erreur 400, état d’erreur affiché) |
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

- Contenu selon le contrat d’API, à partir des projets réels du membre : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Aucun projet proposé : `vide-sombre-1440.png`, `vide-clair-1440.png`, `vide-sombre-390.png`, `vide-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Backend actuel : point d’accès absent (erreur 400, état d’erreur affiché) : `backend-actuel-sombre-1440.png`, `backend-actuel-clair-1440.png`, `backend-actuel-sombre-390.png`, `backend-actuel-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| Liste des projets | seul l’état vide est dessiné | cartes dérivées de l’écran 41 : titre, date, catégorie, avancement, statut, motif d’un rejet | dérivation |
| Filtre de statut | « En attente », « Validé & En cours », « Terminé » | statuts du modèle, rejet compris | assumé |
| Catégories | liste fixe | catégories réelles du serveur | assumé (section 1) |
| Bouton « Filtres avancés » et illustration à emoji | présents | retirés | retrait (6.4) |

## États

- Chargement : squelettes.
- Vide : message et bouton de proposition (ou message de filtre).
- Erreur : message et « Réessayer ».
- Contenu : pagination et tri côté serveur.
