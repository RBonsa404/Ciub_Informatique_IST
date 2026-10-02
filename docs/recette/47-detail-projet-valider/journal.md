# Journal de recette : Détail d’un projet à valider

Identifiant : 47-detail-projet-valider. Route : `/espace/gestion/projets/:id`. Date : 2026-10-02.
Référence : écran `47-detail-projet-valider` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (proposition en attente) ; Rejet sans motif : message sous le champ ; Approbation : modale de confirmation (non confirmée) ; Projet déjà décidé (projet réel validé) ; Projet introuvable (réponse réelle du backend) ; Chargement |
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

- Contenu réel (proposition en attente) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Rejet sans motif : message sous le champ : `rejet-sans-motif-sombre-1440.png`, `rejet-sans-motif-clair-1440.png`, `rejet-sans-motif-sombre-390.png`, `rejet-sans-motif-clair-390.png`
- Approbation : modale de confirmation (non confirmée) : `approbation-sombre-1440.png`, `approbation-clair-1440.png`, `approbation-sombre-390.png`, `approbation-clair-390.png`
- Projet déjà décidé (projet réel validé) : `decide-sombre-1440.png`, `decide-clair-1440.png`, `decide-sombre-390.png`, `decide-clair-390.png`
- Projet introuvable (réponse réelle du backend) : `introuvable-sombre-1440.png`, `introuvable-clair-1440.png`, `introuvable-sombre-390.png`, `introuvable-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| Description | texte fictif | description, objectifs, technologies et catégorie réels | assumé (section 1) |
| « Fichiers joints » avec poids | deux fichiers | liens réels du projet (dépôt, documentation) s’ils existent | assumé (aucun stockage de fichier) |
| Participants | pastilles et « Équipe de 3 étudiants » | membres réels du projet, nommés | assumé |
| Motif du rejet | champ facultatif sur une ligne | obligatoire pour un rejet, communiqué à l’auteur | assumé (UC-20) |
| Approuver, rejeter | action immédiate | confirmation préalable | assumé |
| Projet déjà décidé | non prévu | la décision prise est affichée à la place des boutons | dérivation |

## États

- Chargement : squelettes.
- Introuvable : message dédié.
- Erreur : message et « Réessayer ».
- Décision : validation du motif, confirmation, notification et retour à la liste.
- La décision réelle est prouvée par le script de peuplement, qui appelle le même point d’accès.
