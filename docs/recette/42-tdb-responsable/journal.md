# Journal de recette : Tableau de bord du Responsable

Identifiant : 42-tdb-responsable. Route : `/espace/gestion`. Date : 2026-10-02.
Référence : écran `42-tdb-responsable` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel : totaux, effectif et fréquentation calculés par le serveur (hors comptes de test) ; Indicateurs injoignables : tuile « Membres » et graphique retirés ; Chargement ; Service injoignable |
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

- Contenu réel : totaux, effectif et fréquentation calculés par le serveur (hors comptes de test) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Indicateurs injoignables : tuile « Membres » et graphique retirés : `indicateurs-indisponibles-sombre-1440.png`, `indicateurs-indisponibles-clair-1440.png`, `indicateurs-indisponibles-sombre-390.png`, `indicateurs-indisponibles-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| Compteurs « 12 », « 4 », « 5 », « 148 » | valeurs fixes et tendances (« +3 publiées ce mois ») | totaux réels du serveur, sans tendance ; une tuile dont la donnée est indisponible est retirée | assumé (section 1) |
| « Activité & Fréquentation globale » | barres fixes, « Moyenne : 28 étudiants / session » | inscriptions confirmées par mois selon le serveur, valeur au-dessus de chaque barre ; graphique retiré sans donnée ; moyenne retirée | assumé (section 1) |
| « Projets en attente (5) », « Événements prévus » | contenu fixe | propositions et événements réels, trois au plus | assumé |
| Tuiles | non cliquables | chaque tuile mène à la page de gestion correspondante | assumé |

## États

- Tuiles : squelette, valeur réelle, « Indisponible » en cas d’erreur ; aucune valeur provisoire.
- Graphique : squelette, vide, contenu ; retiré si la donnée manque.
- Panneaux : squelettes, vide, erreur avec « Réessayer », contenu.
