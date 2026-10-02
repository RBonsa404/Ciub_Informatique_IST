# Journal de recette : Proposition de projet

Identifiant : 31-proposer-projet. Route : `/espace/projets/proposer`. Date : 2026-10-02.
Référence : écran `31-proposer-projet` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Formulaire initial (catégories réelles) ; Champs obligatoires vides et adresse invalide |
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

- Formulaire initial (catégories réelles) : `initial-sombre-1440.png`, `initial-clair-1440.png`, `initial-sombre-390.png`, `initial-clair-390.png`
- Champs obligatoires vides et adresse invalide : `validation-sombre-1440.png`, `validation-clair-1440.png`, `validation-sombre-390.png`, `validation-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| « Objectifs & Fonctionnalités clés » | un champ | description (obligatoire) et objectifs (facultatif), comme sur la fiche publique | assumé (modèle existant) |
| « Membres de l’équipe » | texte libre | retiré : l’équipe se compose de comptes réels, après validation | retrait (modèle existant) |
| Catégorie et dépôt du code | absents | champs facultatifs | assumé (modèle existant) |

## États

- Validation : message par champ, erreurs du serveur sous le champ.
- Succès : notification et retour à « Mes projets ».
- La création réelle est prouvée par le script de peuplement, qui appelle le même point d’accès.
