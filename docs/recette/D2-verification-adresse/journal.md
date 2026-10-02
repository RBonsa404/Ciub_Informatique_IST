# Journal de recette : Vérification de l’adresse électronique

Identifiant : D2-verification-adresse. Route : `/verification-adresse?jeton=jeton-de-recette`. Date : 2026-10-02.
Référence : page dérivée, sans écran dans la maquette.

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Lien reçu par courriel après une inscription réelle : compte activé ; Jeton inconnu refusé par le backend réel ; Lien déjà utilisé : refus réel du backend ; Vérification en cours ; Service injoignable ; Lien incomplet |
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

- Lien reçu par courriel après une inscription réelle : compte activé : `succes-sombre-1440.png`, `succes-clair-1440.png`, `succes-sombre-390.png`, `succes-clair-390.png`
- Jeton inconnu refusé par le backend réel : `lien-invalide-sombre-1440.png`, `lien-invalide-clair-1440.png`, `lien-invalide-sombre-390.png`, `lien-invalide-clair-390.png`
- Lien déjà utilisé : refus réel du backend : `lien-reutilise-sombre-1440.png`, `lien-reutilise-clair-1440.png`, `lien-reutilise-sombre-390.png`, `lien-reutilise-clair-390.png`
- Vérification en cours : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`
- Lien incomplet : `sans-jeton-sombre-1440.png`, `sans-jeton-clair-1440.png`, `sans-jeton-sombre-390.png`, `sans-jeton-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Page entière | absente | dérivée de la carte de l’écran 21 | dérivation (10.1.4) |

## États

- Chargement, succès, lien invalide et erreur de service : quatre états distincts, annoncés aux lecteurs d’écran.
