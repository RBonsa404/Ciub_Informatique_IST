# Journal de recette : Sécurité des comptes

Identifiant : D7-securite-comptes. Route : `/espace/admin/securite`. Date : 2026-10-02.
Référence : page dérivée, sans écran dans la maquette.

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (aucune alerte en base de recette) ; Alertes selon le contrat d’API ; Chargement ; Service injoignable |
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

- Contenu réel (aucune alerte en base de recette) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Alertes selon le contrat d’API : `alertes-sombre-1440.png`, `alertes-clair-1440.png`, `alertes-sombre-390.png`, `alertes-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Page dérivée | aucun écran dans la maquette | cartes reprises de l’écran 50 ; aucune interface de double authentification | dérivation (UC-27, règle 6.6) |

## États

- Chargement : squelettes.
- Vide : message.
- Erreur : message et « Réessayer ».
- Contenu : alertes de la plus grave à la moins grave ; déverrouillage et suspension depuis la fiche du compte.
