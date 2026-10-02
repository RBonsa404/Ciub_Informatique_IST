# Journal de recette : Journal d’audit

Identifiant : D6-journal-audit. Route : `/espace/admin/journal`. Date : 2026-10-02.
Référence : page dérivée, sans écran dans la maquette.

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (journal alimenté par les actions de la recette) ; Journal vide ; Filtre « Échec » (filtre réel du serveur) ; Chargement ; Service injoignable |
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

- Contenu réel (journal alimenté par les actions de la recette) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Journal vide : `vide-sombre-1440.png`, `vide-clair-1440.png`, `vide-sombre-390.png`, `vide-clair-390.png`
- Filtre « Échec » (filtre réel du serveur) : `filtre-sombre-1440.png`, `filtre-clair-1440.png`, `filtre-sombre-390.png`, `filtre-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Page dérivée | aucun écran dans la maquette | tableau repris de l’écran 51 | dérivation (sections 8.7.2 et 12.6) |

## États

- Chargement : squelettes.
- Vide : message (ou message de filtre).
- Erreur : message et « Réessayer ».
- Contenu : pagination côté serveur, filtres par compte et par résultat.
