# Journal de recette : Paramètres du compte

Identifiant : 27-parametres-compte. Route : `/espace/parametres`. Date : 2026-10-01.
Référence : écran `27-parametres-compte` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu (préférences selon le contrat d’API) ; Changement de mot de passe : mot de passe actuel erroné (réponse réelle du backend) ; Suppression du compte : confirmation par mot de passe puis modale (non confirmée) ; Chargement des préférences ; Backend actuel : préférences absentes (erreur 500, état d’erreur dans le panneau) |
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

- Contenu (préférences selon le contrat d’API) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Changement de mot de passe : mot de passe actuel erroné (réponse réelle du backend) : `mot-de-passe-sombre-1440.png`, `mot-de-passe-clair-1440.png`, `mot-de-passe-sombre-390.png`, `mot-de-passe-clair-390.png`
- Suppression du compte : confirmation par mot de passe puis modale (non confirmée) : `suppression-sombre-1440.png`, `suppression-clair-1440.png`, `suppression-sombre-390.png`, `suppression-clair-390.png`
- Chargement des préférences : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Backend actuel : préférences absentes (erreur 500, état d’erreur dans le panneau) : `backend-actuel-sombre-1440.png`, `backend-actuel-clair-1440.png`, `backend-actuel-sombre-390.png`, `backend-actuel-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille « 5 » | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (aucune recherche globale au CDC) |
| Pictogramme d’en-tête | emoji | icône de la famille du produit | corrigé (E-01) |
| « Changer mot de passe » | notification simulée | formulaire réel dans le panneau (mot de passe actuel, nouveau, confirmation) | assumé (UC-07) |
| Langue | liste « Français / English » | mention « Français » (seule langue du produit) | retrait partiel (6.8) |
| « Notifications Push » | présent | retiré (aucun canal de ce type au CDC) | retrait |
| Panneau « Ma progression » (66 %) | présent | retiré : aucun indicateur de ce type côté serveur | retrait (section 1) |
| Panneau « Confidentialité » (visibilité des projets) | présent | remplacé par « Mes données » : copie des données personnelles | assumé (loi n° 001-2021/AN, droit d’accès) |
| Suppression du compte | boîte de dialogue du navigateur, action annulée | mot de passe puis modale de confirmation | assumé (BNF-09) |
| Numérotation des panneaux | six panneaux numérotés | cinq panneaux numérotés | assumé |

## États

- Préférences : squelette, erreur avec « Réessayer », contenu.
- Mot de passe : validation par champ, erreur du serveur sous le champ, notification de succès.
- Suppression : double confirmation.
