# Journal de recette : Profil, édition

Identifiant : 26-profil-edition. Route : `/espace/profil/modifier`. Date : 2026-10-02.
Référence : écran `26-profil-edition` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Formulaire prérempli (compte de recette) ; Champs obligatoires vides ; Enregistrement réel (backend), retour au profil ; Photo de profil : fichier refusé avant l’envoi, puis dépôt réel d’une image (backend), affichée à la place des initiales ; Photo de profil : retrait réel, retour aux initiales ; Chargement ; Service injoignable |
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

- Formulaire prérempli (compte de recette) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Champs obligatoires vides : `validation-sombre-1440.png`, `validation-clair-1440.png`, `validation-sombre-390.png`, `validation-clair-390.png`
- Enregistrement réel (backend), retour au profil : `enregistrement-sombre-1440.png`, `enregistrement-clair-1440.png`, `enregistrement-sombre-390.png`, `enregistrement-clair-390.png`
- Photo de profil : fichier refusé avant l’envoi, puis dépôt réel d’une image (backend), affichée à la place des initiales : `photo-sombre-1440.png`, `photo-clair-1440.png`, `photo-sombre-390.png`, `photo-clair-390.png`
- Photo de profil : retrait réel, retour aux initiales : `photo-retiree-sombre-1440.png`, `photo-retiree-clair-1440.png`, `photo-retiree-sombre-390.png`, `photo-retiree-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille « 5 » | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (aucune recherche globale au CDC) |
| Encart « Profil mis à jour » | affiché en permanence | notification après un enregistrement réussi | assumé (état de démonstration) |
| « Changer la photo » | téléversement simulé, « PNG ou JPG, max 2 Mo » | dépôt réel d’une image (PNG, JPG ou WebP, 2 Mo au plus), retrait possible ; initiales à défaut de photo | conforme |
| « Nom complet » | un champ | prénom et nom, comme à l’inscription | assumé |
| Filière | saisie libre | saisie libre | conforme (6.5) |
| GitHub, LinkedIn, compétences | présents | retirés | retrait (D-04) |

## États

- Chargement : squelette du formulaire.
- Erreur de chargement : message et « Réessayer ».
- Validation : message par champ, erreurs du serveur reprises sous le champ.
- Photo : refus avant l’envoi (type, taille), refus du serveur expliqué, notification de succès.
- Succès : notification et retour au profil.
