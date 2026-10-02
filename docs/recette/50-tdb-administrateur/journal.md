# Journal de recette : Tableau de bord de l’Administrateur

Identifiant : 50-tdb-administrateur. Route : `/espace/admin`. Date : 2026-10-02.
Référence : écran `50-tdb-administrateur` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (totaux du serveur, journal réel vide) ; Journal alimenté selon le contrat d’API ; Chargement ; Service injoignable |
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

- Contenu réel (totaux du serveur, journal réel vide) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Journal alimenté selon le contrat d’API : `journal-sombre-1440.png`, `journal-clair-1440.png`, `journal-sombre-390.png`, `journal-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| Compteurs | « 148 », « +18 ce mois », « 94% assiduité », « 99.98% », « 1.4 Go » | totaux réels du serveur : comptes, comptes actifs, formations, messages à traiter ; disponibilité et stockage retirés (non mesurés) | assumé et retrait (section 1) |
| « Dernières actions critiques de sécurité » | entrées fictives (adresse IP, « 2FA Activé », sauvegarde) | cinq dernières entrées réelles du journal d’audit ; état vide honnête | assumé (6.6 : aucune mention de double authentification) |
| « Maintenance Système », « Sauvegardes & Snapshots BD » | accessibles à l’Administrateur | « Configuration du système » proposée au seul Super Admin | assumé (rôles du CDC) |
| « Gestion des utilisateurs (148) » | compteur dans le bouton | sans compteur | retrait (section 1) |

## États

- Totaux : squelettes sans valeur, erreur avec « Réessayer », contenu.
- Journal : squelettes, vide, erreur, contenu.
