# Journal de recette : Configuration du système et sauvegardes

Identifiant : 56-configuration-systeme-sauvegardes. Route : `/espace/systeme`. Date : 2026-10-02.
Référence : écran `56-configuration-systeme-sauvegardes` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Réglages réels ; sauvegardes selon le contrat d’API ; Valeurs hors bornes ; Enregistrement réel des réglages (backend) ; Mode maintenance : modale de confirmation (non confirmée) ; Backend actuel : état des sauvegardes absent (erreur 500, message dans le panneau) ; Chargement ; Service injoignable |
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

- Réglages réels ; sauvegardes selon le contrat d’API : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Valeurs hors bornes : `validation-sombre-1440.png`, `validation-clair-1440.png`, `validation-sombre-390.png`, `validation-clair-390.png`
- Enregistrement réel des réglages (backend) : `enregistrement-sombre-1440.png`, `enregistrement-clair-1440.png`, `enregistrement-sombre-390.png`, `enregistrement-clair-390.png`
- Mode maintenance : modale de confirmation (non confirmée) : `maintenance-sombre-1440.png`, `maintenance-clair-1440.png`, `maintenance-sombre-390.png`, `maintenance-clair-390.png`
- Backend actuel : état des sauvegardes absent (erreur 500, message dans le panneau) : `backend-actuel-sombre-1440.png`, `backend-actuel-clair-1440.png`, `backend-actuel-sombre-390.png`, `backend-actuel-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| « Expiration JWT (minutes) » | champ modifiable | retiré : réglage de sécurité fixé par variable d’environnement | retrait (6.11) |
| Réglages | nom, expiration, maintenance, inscriptions | nom, tentatives avant verrouillage, durée du verrouillage, maintenance ; inscriptions si le serveur gère ce réglage | assumé (modèle existant) |
| « Créer un snapshot SQL immédiat » | bouton | retiré : sauvegarde par tâche planifiée hors application | retrait (D-09) |
| Archives « backup_auto_…sql », « 14.2 Mo », téléchargement | liste fixe | date, taille et résultat réels des dernières sauvegardes ; aucun téléchargement | assumé (D-09, section 1) |
| Mode maintenance | case à cocher | confirmation avant activation | assumé |

## États

- Réglages : squelettes, erreur avec « Réessayer », validation par champ, notification de succès.
- Sauvegardes : squelettes, vide, message si l’état est indisponible, contenu.
