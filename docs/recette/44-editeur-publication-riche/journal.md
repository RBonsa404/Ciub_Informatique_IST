# Journal de recette : Éditeur d’actualité

Identifiant : 44-editeur-publication-riche. Route : `/espace/gestion/actualites/nouvelle`. Date : 2026-10-01.
Référence : écran `44-editeur-publication-riche` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Création : éditeur initial (catégories réelles) ; Insertion de blocs et image de couverture ; Champs obligatoires vides ; Modification : éditeur prérempli (brouillon réel) ; Modification : enregistrement réel du brouillon (backend), retour à la liste ; Actualité introuvable (réponse réelle du backend) ; Modification : chargement |
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

- Création : éditeur initial (catégories réelles) : `creation-sombre-1440.png`, `creation-clair-1440.png`, `creation-sombre-390.png`, `creation-clair-390.png`
- Insertion de blocs et image de couverture : `blocs-sombre-1440.png`, `blocs-clair-1440.png`, `blocs-sombre-390.png`, `blocs-clair-390.png`
- Champs obligatoires vides : `validation-sombre-1440.png`, `validation-clair-1440.png`, `validation-sombre-390.png`, `validation-clair-390.png`
- Modification : éditeur prérempli (brouillon réel) : `edition-sombre-1440.png`, `edition-clair-1440.png`, `edition-sombre-390.png`, `edition-clair-390.png`
- Modification : enregistrement réel du brouillon (backend), retour à la liste : `enregistrement-sombre-1440.png`, `enregistrement-clair-1440.png`, `enregistrement-sombre-390.png`, `enregistrement-clair-390.png`
- Actualité introuvable (réponse réelle du backend) : `introuvable-sombre-1440.png`, `introuvable-clair-1440.png`, `introuvable-sombre-390.png`, `introuvable-clair-390.png`
- Modification : chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| Composition par blocs glisser-déposer | six blocs (image, vidéo, texte, citation, galerie, bouton) | texte structuré : paragraphe, titre de section, citation, insérés d’un clic ; image de couverture par adresse web | dérivation (D-02) |
| « Date de publication » | champ de date | retiré : la date est fixée par le serveur à la publication | retrait (modèle existant) |
| « Épingler en haut du feed » | case à cocher | retirée | retrait (D-01) |
| Visibilité | « Tout le monde » ou « Membres IST uniquement » | même choix, proposé si le module des publications internes est ouvert | assumé (champ à créer côté serveur) |
| Catégorie | liste fixe | catégories réelles du serveur | assumé (section 1) |
| Résumé | absent | champ facultatif, affiché dans les listes | assumé (modèle existant) |

## États

- Création : éditeur immédiat.
- Modification : squelette, introuvable, erreur.
- Validation : message par champ, erreurs du serveur.
- Succès : notification et retour à la liste.
