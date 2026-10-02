# Journal de recette : Feuille d’émargement

Identifiant : 39-feuille-presence. Route : `/espace/formateur/cours/:id/sessions/:sessionId/presences`. Date : 2026-10-02.
Référence : écran `39-feuille-presence` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (inscrits confirmés de la séance) ; Pointage et enregistrement réels (backend) ; Aucun inscrit ; Chargement ; Service injoignable |
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

- Contenu réel (inscrits confirmés de la séance) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Pointage et enregistrement réels (backend) : `enregistrement-sombre-1440.png`, `enregistrement-clair-1440.png`, `enregistrement-sombre-390.png`, `enregistrement-clair-390.png`
- Aucun inscrit : `vide-sombre-1440.png`, `vide-clair-1440.png`, `vide-sombre-390.png`, `vide-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| « QR Code Étudiant », « Export PDF » | présents | retirés (absents du CDC) ; action « Tous présents » pour un pointage rapide | retrait |
| Compteurs | valeurs fixes | calculés sur la feuille affichée : présents, absents, excusés, non pointés | assumé (section 1) |
| Statuts | présent, absent, retard justifié | présent, absent, excusé (statuts du modèle) | assumé |
| Action par ligne | bouton « Basculer » | liste de choix du statut, enregistrement groupé | assumé (trois statuts) |
| Colonne « Filière » | présente | affichée seulement si le serveur fournit la filière des inscrits | assumé |
| « Heure d’émargement (QR Code / Manuel) » | présente | « Dernier pointage » : date réelle d’enregistrement | assumé |
| Signature « Certifié IST-DSI #8841-A » et horodatage | présents | retirés ; date réelle du dernier enregistrement | retrait (mention fictive) |

## États

- Chargement : squelettes.
- Vide : aucun inscrit, lien de retour au cours.
- Erreur : message et « Réessayer ».
- Contenu : tableau défilant horizontalement sur petit écran ; bouton d’enregistrement inactif sans modification.
