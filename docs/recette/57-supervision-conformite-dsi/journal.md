# Journal de recette : Supervision technique et conformité

Identifiant : 57-supervision-conformite-dsi. Route : `/espace/dsi`. Date : 2026-10-02.
Référence : écran `57-supervision-conformite-dsi` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (contrôles calculés par le serveur, journal réel) ; Journal vide ; Contrôles non conformes signalés (pile de recette : cookie non sécurisé, comptes de test présents) ; Chargement ; Service injoignable |
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

- Contenu réel (contrôles calculés par le serveur, journal réel) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Journal vide : `journal-vide-sombre-1440.png`, `journal-vide-clair-1440.png`, `journal-vide-sombre-390.png`, `journal-vide-clair-390.png`
- Contrôles non conformes signalés (pile de recette : cookie non sécurisé, comptes de test présents) : `non-conforme-sombre-1440.png`, `non-conforme-clair-1440.png`, `non-conforme-sombre-390.png`, `non-conforme-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| Tuiles « TLS 1.3 / HSTS », « 100% Conforme », « SHA-256 Validé » | valeurs fixes | versions et compteurs renvoyés par le serveur ; contrôles de conformité listés un à un avec leur résultat | assumé (section 1) |
| Badge « Conforme DSI-IST » | fixe | déduit des contrôles renvoyés : conformes ou à examiner | assumé |
| « Certificat de Conformité » | bouton | retiré : aucun certificat n’est produit par la plateforme | retrait |
| Colonne « Hash Cryptographique », emplacement géographique | présents | retirés : données absentes du journal | retrait (section 1) |
| Contrôle de double authentification | non prévu | absent : aucune double authentification dans le produit | conforme (6.6) |

## États

- Contrôles : squelettes, erreur avec « Réessayer », contenu.
- Journal : squelettes, vide, erreur, contenu paginé côté serveur.
- Les contrôles sont calculés par le serveur à chaque consultation.
