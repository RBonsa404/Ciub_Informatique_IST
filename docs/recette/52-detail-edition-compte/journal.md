# Journal de recette : Détail et édition d’un compte

Identifiant : 52-detail-edition-compte. Route : `/espace/admin/utilisateurs/:id`. Date : 2026-10-02.
Référence : écran `52-detail-edition-compte` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (compte du membre de recette) ; Prénom vide et aucun rôle ; Enregistrement réel (backend) ; Suspension : modale de confirmation (non confirmée) ; Son propre compte : rôles et statut non modifiables ; Compte introuvable (réponse réelle du backend) ; Chargement |
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

- Contenu réel (compte du membre de recette) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Prénom vide et aucun rôle : `validation-sombre-1440.png`, `validation-clair-1440.png`, `validation-sombre-390.png`, `validation-clair-390.png`
- Enregistrement réel (backend) : `enregistrement-sombre-1440.png`, `enregistrement-clair-1440.png`, `enregistrement-sombre-390.png`, `enregistrement-clair-390.png`
- Suspension : modale de confirmation (non confirmée) : `suspension-sombre-1440.png`, `suspension-clair-1440.png`, `suspension-sombre-390.png`, `suspension-clair-390.png`
- Son propre compte : rôles et statut non modifiables : `soi-meme-sombre-1440.png`, `soi-meme-clair-1440.png`, `soi-meme-sombre-390.png`, `soi-meme-clair-390.png`
- Compte introuvable (réponse réelle du backend) : `introuvable-sombre-1440.png`, `introuvable-clair-1440.png`, `introuvable-sombre-390.png`, `introuvable-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| « Nom complet » | un champ | prénom et nom | assumé |
| Adresse électronique | modifiable | en lecture seule : l’adresse est l’identifiant de connexion | assumé (modèle existant) |
| Rôle | liste à choix unique | cases à cocher (plusieurs rôles possibles) ; Super Admin et DSI attribuables par le seul Super Admin | assumé (UC-24) |
| « Suspendre » | action immédiate | confirmation ; « Réactiver » pour un compte suspendu ; impossible sur son propre compte | assumé |
| « Historique d’activité » | entrées fictives | entrées réelles du journal d’audit pour ce compte | assumé (section 1) |

## États

- Chargement : squelettes.
- Introuvable : message dédié.
- Erreur : message et « Réessayer ».
- Validation : message par champ et pour les rôles.
- Historique : squelettes, vide, erreur, contenu.
