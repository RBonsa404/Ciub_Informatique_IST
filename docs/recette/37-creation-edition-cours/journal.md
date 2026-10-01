# Journal de recette : Création et édition d’un cours

Identifiant : 37-creation-edition-cours. Route : `/espace/formateur/cours/nouveau`. Date : 2026-10-01.
Référence : écran `37-creation-edition-cours` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Création : formulaire initial (catégories réelles) ; Création : champs obligatoires vides ; Édition : formulaire prérempli (cours réel) ; Édition : enregistrement réel (backend), retour au détail ; Édition : cours introuvable (réponse réelle du backend) ; Édition : chargement |
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

- Création : formulaire initial (catégories réelles) : `creation-sombre-1440.png`, `creation-clair-1440.png`, `creation-sombre-390.png`, `creation-clair-390.png`
- Création : champs obligatoires vides : `validation-sombre-1440.png`, `validation-clair-1440.png`, `validation-sombre-390.png`, `validation-clair-390.png`
- Édition : formulaire prérempli (cours réel) : `edition-sombre-1440.png`, `edition-clair-1440.png`, `edition-sombre-390.png`, `edition-clair-390.png`
- Édition : enregistrement réel (backend), retour au détail : `enregistrement-sombre-1440.png`, `enregistrement-clair-1440.png`, `enregistrement-sombre-390.png`, `enregistrement-clair-390.png`
- Édition : cours introuvable (réponse réelle du backend) : `introuvable-sombre-1440.png`, `introuvable-clair-1440.png`, `introuvable-sombre-390.png`, `introuvable-clair-390.png`
- Édition : chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| « Code Module », « Filières recommandées », « Volume horaire » | présents | retirés | retrait (D-05) |
| « Salle / Amphi », « Capacité maximale » | dans le formulaire du cours | saisis par séance, dans le détail du cours (modèle : une formation, plusieurs séances) | assumé (D-05) |
| Domaine d’apprentissage | liste fixe | catégories réelles du serveur | assumé (section 1) |
| Syllabus (dépôt de fichier) | zone de dépôt | retirée : aucun stockage de fichier ; les documents se publient comme ressources | retrait (stockage à créer) |
| « Enregistrer & Publier le cours » | un bouton | interrupteur « Publier le cours » et bouton « Enregistrer le cours » | assumé (brouillon possible) |
| Objectifs et prérequis | un seul champ « Description & Objectifs » | description, objectifs et prérequis distincts, comme sur la fiche publique | assumé |

## États

- Création : formulaire immédiat.
- Édition : squelette, introuvable, erreur avec « Réessayer ».
- Validation : message par champ, erreurs du serveur sous le champ.
- Succès : notification et retour au détail du cours.
