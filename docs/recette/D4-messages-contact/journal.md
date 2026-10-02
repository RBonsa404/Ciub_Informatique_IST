# Journal de recette : Messages de contact

Identifiant : D4-messages-contact. Route : `/espace/admin/messages`. Date : 2026-10-02.
Référence : page dérivée, sans écran dans la maquette.

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (messages reçus par le formulaire public) ; Filtre « Traités » (filtre réel du serveur) ; Aucun message ; Chargement ; Service injoignable |
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

- Contenu réel (messages reçus par le formulaire public) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Filtre « Traités » (filtre réel du serveur) : `filtre-sombre-1440.png`, `filtre-clair-1440.png`, `filtre-sombre-390.png`, `filtre-clair-390.png`
- Aucun message : `vide-sombre-1440.png`, `vide-clair-1440.png`, `vide-sombre-390.png`, `vide-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Page dérivée | aucun écran dans la maquette | cartes reprises du centre de notifications (écran 33) | dérivation (section 8.8.1) |
| État « archivé » | prévu par l’inventaire | non repris : le modèle ne connaît que « nouveau » et « traité » | à arbitrer en Phase 2 |

## États

- Chargement : squelettes.
- Vide : message propre au filtre.
- Erreur : message et « Réessayer ».
- Contenu : pagination et filtre côté serveur ; réponse par courriel, marquage comme traité.
