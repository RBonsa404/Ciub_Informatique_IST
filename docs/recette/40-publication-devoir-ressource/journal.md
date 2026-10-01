# Journal de recette : Publication d’un devoir ou d’une ressource

Identifiant : 40-publication-devoir-ressource. Route : `/espace/formateur/cours/:id/publier`. Date : 2026-10-01.
Référence : écran `40-publication-devoir-ressource` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Formulaire initial : devoir ; Type « Support de cours » ; Champs obligatoires vides et adresse invalide ; Cours introuvable (réponse réelle du backend) ; Chargement |
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

- Formulaire initial : devoir : `devoir-sombre-1440.png`, `devoir-clair-1440.png`, `devoir-sombre-390.png`, `devoir-clair-390.png`
- Type « Support de cours » : `ressource-sombre-1440.png`, `ressource-clair-1440.png`, `ressource-sombre-390.png`, `ressource-clair-390.png`
- Champs obligatoires vides et adresse invalide : `validation-sombre-1440.png`, `validation-clair-1440.png`, `validation-sombre-390.png`, `validation-clair-390.png`
- Cours introuvable (réponse réelle du backend) : `introuvable-sombre-1440.png`, `introuvable-clair-1440.png`, `introuvable-sombre-390.png`, `introuvable-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| « Module de formation associé » | liste de modules | cours de la page, en lecture seule (la publication part du détail d’un cours) | assumé |
| « Barème d’évaluation » | présent | retiré | retrait (D-03) |
| Fichier joint | zone de dépôt « jusqu’à 30 Mo » | adresse web du document, validée | retrait (stockage de fichiers à créer) |
| Visibilité | absente | case « visible sur la page publique des ressources » pour une ressource | assumé (modèle existant) |

## États

- Chargement du cours : squelette, introuvable, erreur.
- Validation : règles propres au devoir (échéance, consignes) ou à la ressource (adresse).
- Succès : notification et retour au détail du cours.
