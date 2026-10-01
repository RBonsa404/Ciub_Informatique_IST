# Journal de recette : Mot de passe oublié

Identifiant : 20-mot-de-passe-oublie. Route : `/mot-de-passe-oublie`. Date : 2026-10-01.
Référence : écran `20-mot-de-passe-oublie` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | État initial ; Demande acceptée par le backend réel (adresse inconnue : même réponse) ; Service injoignable |
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

- État initial : `initial-sombre-1440.png`, `initial-clair-1440.png`, `initial-sombre-390.png`, `initial-clair-390.png`
- Demande acceptée par le backend réel (adresse inconnue : même réponse) : `envoye-sombre-1440.png`, `envoye-clair-1440.png`, `envoye-sombre-390.png`, `envoye-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Gabarit | en-tête public complet (18, 20) ou absent (19, 21) | gabarit d’authentification unique : marque, retour à l’accueil, thème | assumé (E-06) |
| Icônes de champ et d’action | emoji (œil, coche) | pictogrammes de la famille unique | corrigé (E-01) |
| Libellé « e-mail » | « Adresse e-mail » | « Adresse électronique » | assumé (langue française) |
| Bouton « Simuler la saisie du nouveau mot de passe » | présent dans la carte de succès | retiré | retrait (démonstration) |
| Badge flottant du visuel | emoji et texte « Lien sécurisé » | pictogramme d’enveloppe | corrigé (E-01) |
| Accroche | « Pas d’inquiétude ! … » | phrase factuelle | assumé (ton neutre) |

## États

- Succès : message identique que l’adresse corresponde ou non à un compte.
- Erreur : alerte avec message adapté (réseau, débit, serveur).
