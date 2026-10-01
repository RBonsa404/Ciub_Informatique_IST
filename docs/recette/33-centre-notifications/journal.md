# Journal de recette : Centre de notifications

Identifiant : 33-centre-notifications. Route : `/espace/notifications`. Date : 2026-10-01.
Référence : écran `33-centre-notifications` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (notifications du compte de recette) ; Filtre par type sans résultat ; Aucune notification ; Chargement ; Service injoignable ; Marquage réel comme lue (backend) : plus aucune notification non lue |
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

- Contenu réel (notifications du compte de recette) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Filtre par type sans résultat : `filtre-sombre-1440.png`, `filtre-clair-1440.png`, `filtre-sombre-390.png`, `filtre-clair-390.png`
- Aucune notification : `vide-sombre-1440.png`, `vide-clair-1440.png`, `vide-sombre-390.png`, `vide-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`
- Marquage réel comme lue (backend) : plus aucune notification non lue : `lecture-sombre-1440.png`, `lecture-clair-1440.png`, `lecture-sombre-390.png`, `lecture-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| Filtres « Tout (4) », « Non lues (2) », « Mentionnés (0) », « Système (1) » | compteurs fixes | « Tout » et « Non lues » avec le nombre réel de non lues ; le type se choisit dans la liste | assumé (section 1) ; « Mentionnés » retiré (fil social exclu) |
| Types de la liste | Annonces, Événements, Projets | types du modèle : annonces, inscriptions, projets, rappels, système | assumé |
| Pictogrammes | emoji | icônes de la famille du produit | corrigé (E-01) |
| Date | « Il y a 1h » | date et heure réelles | assumé |
| Actions par notification | aucune | « Marquer comme lue » et « Ouvrir » si la notification porte un lien interne | assumé (UC-13) |
| Mention « Activez les notifications… » | présente | retirée (aucune notification poussée au CDC) | retrait |

## États

- Chargement : squelettes.
- Vide : message propre au filtre.
- Erreur : message et « Réessayer ».
- Contenu : pagination côté serveur, pastille de la barre mise à jour après lecture.
