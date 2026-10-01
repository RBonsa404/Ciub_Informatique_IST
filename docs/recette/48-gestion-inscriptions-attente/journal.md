# Journal de recette : Inscriptions et listes d’attente

Identifiant : 48-gestion-inscriptions-attente. Route : `/espace/gestion/inscriptions`. Date : 2026-10-01.
Référence : écran `48-gestion-inscriptions-attente` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel : séance complète avec liste d’attente ; Aucune activité choisie ; Recherche sans résultat ; Activité sans inscrit ; Chargement des inscrits ; Service injoignable |
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

- Contenu réel : séance complète avec liste d’attente : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Aucune activité choisie : `selection-sombre-1440.png`, `selection-clair-1440.png`, `selection-sombre-390.png`, `selection-clair-390.png`
- Recherche sans résultat : `recherche-sombre-1440.png`, `recherche-clair-1440.png`, `recherche-sombre-390.png`, `recherche-clair-390.png`
- Activité sans inscrit : `vide-sombre-1440.png`, `vide-clair-1440.png`, `vide-sombre-390.png`, `vide-clair-390.png`
- Chargement des inscrits : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| Choix de l’activité | liste de trois titres | événements et séances de formation réels, regroupés ; l’activité choisie figure dans l’adresse | assumé |
| Compteurs « Inscrits 24 », « En attente 6 » | valeurs fixes | effectifs réels de l’activité choisie, affichés après chargement | assumé (section 1) |
| « Exporter CSV » | bouton inactif | export réel des inscrits affichés (nom, adresse, statut, date) | assumé (D-06) |
| Sous-titre « promouvez automatiquement » | présent | promotion manuelle par le Responsable | assumé (UC-21) |
| Filière des inscrits | présente | affichée seulement si le serveur la fournit | assumé |

## États

- Activités : squelette, vide, erreur.
- Inscrits : invitation à choisir, squelettes, vide, erreur avec « Réessayer », contenu.
- Recherche : filtre immédiat sur la liste chargée, messages propres à chaque colonne.
