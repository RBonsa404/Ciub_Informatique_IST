# Journal de recette : Réinitialisation du mot de passe

Identifiant : 21-reinitialisation. Route : `/reinitialisation?jeton=jeton-de-recette`. Date : 2026-10-02.
Référence : écran `21-reinitialisation-mot-de-passe` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Lien reçu par courriel ; Indicateur de robustesse calculé sur la saisie ; Jeton inconnu refusé par le backend réel ; Lien reçu par courriel : nouveau mot de passe enregistré, retour à la connexion, connexion avec le nouveau mot de passe ; Lien déjà utilisé : refus réel du backend ; Lien incomplet |
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

- Lien reçu par courriel : `initial-sombre-1440.png`, `initial-clair-1440.png`, `initial-sombre-390.png`, `initial-clair-390.png`
- Indicateur de robustesse calculé sur la saisie : `robustesse-sombre-1440.png`, `robustesse-clair-1440.png`, `robustesse-sombre-390.png`, `robustesse-clair-390.png`
- Jeton inconnu refusé par le backend réel : `jeton-refuse-sombre-1440.png`, `jeton-refuse-clair-1440.png`, `jeton-refuse-sombre-390.png`, `jeton-refuse-clair-390.png`
- Lien reçu par courriel : nouveau mot de passe enregistré, retour à la connexion, connexion avec le nouveau mot de passe : `succes-sombre-1440.png`, `succes-clair-1440.png`, `succes-sombre-390.png`, `succes-clair-390.png`
- Lien déjà utilisé : refus réel du backend : `lien-reutilise-sombre-1440.png`, `lien-reutilise-clair-1440.png`, `lien-reutilise-sombre-390.png`, `lien-reutilise-clair-390.png`
- Lien incomplet : `sans-jeton-sombre-1440.png`, `sans-jeton-clair-1440.png`, `sans-jeton-sombre-390.png`, `sans-jeton-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Gabarit | en-tête public complet (18, 20) ou absent (19, 21) | gabarit d’authentification unique : marque, retour à l’accueil, thème | assumé (E-06) |
| Icônes de champ et d’action | emoji (œil, coche) | pictogrammes de la famille unique | corrigé (E-01) |
| Libellé « e-mail » | « Adresse e-mail » | « Adresse électronique » | assumé (langue française) |
| Indicateur de robustesse | « Forte (4/5) » figé | calculé sur la saisie, libellé sans chiffre | corrigé |
| Libellé du visuel | « Sécurité renforcée » | visuel conservé sans texte | retrait (affirmation non étayée) |
| Encadré d’information | « … vous pourrez vous connecter immédiatement » | précise que les sessions ouvertes seront fermées | assumé (comportement réel) |

## États

- Lien incomplet : écran dédié avec renvoi vers une nouvelle demande.
- Erreur : jeton invalide, expiré ou déjà utilisé.
- Succès : retour à la connexion avec un message de confirmation.
