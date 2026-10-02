# Journal de recette : Statistiques d’utilisation

Identifiant : 55-statistiques-utilisation-detaillees. Route : `/espace/admin/statistiques`. Date : 2026-10-02.
Référence : écran `55-statistiques-utilisation-detaillees` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (totaux et répartitions du serveur) ; Chargement ; Service injoignable |
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

- Contenu réel (totaux et répartitions du serveur) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| « Connexions & Sessions par Semaine », « 412 sessions actives », « +32% » | graphique et valeurs fixes | retirés : le serveur ne mesure pas les connexions | retrait (section 1) |
| « Répartition par Filière » | pourcentages fixes | répartitions réelles disponibles : comptes par rôle, projets par statut | assumé (donnée par filière absente) |
| « Exporter Rapport PDF » | bouton | retiré | retrait |
| Totaux | absents | six totaux réels du serveur | assumé |

## États

- Chargement : squelettes, aucun chiffre.
- Erreur : message et « Réessayer ».
- Contenu : totaux et répartitions.
- Les comptes de test doivent être exclus par le serveur (règle 7) : à corriger en Phase 3.
