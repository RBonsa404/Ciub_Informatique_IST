# Journal de recette : Composition du bureau

Identifiant : D5-composition-bureau. Route : `/espace/gestion/bureau`. Date : 2026-10-02.
Référence : page dérivée, sans écran dans la maquette.

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu selon le contrat d’API (point d’accès à créer) ; Ajout : validation du formulaire ; Retrait : modale de confirmation (non confirmée) ; Bureau non encore saisi ; Chargement ; Backend actuel : point d’accès absent (erreur 500, état d’erreur affiché) |
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

- Contenu selon le contrat d’API (point d’accès à créer) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Ajout : validation du formulaire : `ajout-sombre-1440.png`, `ajout-clair-1440.png`, `ajout-sombre-390.png`, `ajout-clair-390.png`
- Retrait : modale de confirmation (non confirmée) : `retrait-sombre-1440.png`, `retrait-clair-1440.png`, `retrait-sombre-390.png`, `retrait-clair-390.png`
- Bureau non encore saisi : `vide-sombre-1440.png`, `vide-clair-1440.png`, `vide-sombre-390.png`, `vide-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Backend actuel : point d’accès absent (erreur 500, état d’erreur affiché) : `backend-actuel-sombre-1440.png`, `backend-actuel-clair-1440.png`, `backend-actuel-sombre-390.png`, `backend-actuel-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Page dérivée | aucun écran dans la maquette | tableau et formulaire repris des écrans 43 et 45 ; aucune photo, filière en saisie libre | dérivation (sections 8.7.2 et 12.5) |

## États

- Chargement : squelettes.
- Vide : message et bouton d’ajout.
- Erreur : message et « Réessayer ».
- Formulaire : validation par champ, erreurs du serveur, notification de succès.
- Aucun membre n’est inventé : la liste reste vide tant que le club ne l’a pas saisie (annexe E).
