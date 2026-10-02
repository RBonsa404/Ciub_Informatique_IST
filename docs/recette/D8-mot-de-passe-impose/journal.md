# Journal de recette : Changement de mot de passe imposé

Identifiant : D8-mot-de-passe-impose. Route : `/connexion`. Date : 2026-10-02.
Référence : page dérivée, sans écran dans la maquette.

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Première connexion : redirection vers le choix du mot de passe ; Aucune autre page de l’espace n’est accessible ; Mot de passe initial erroné (réponse réelle du backend) |
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

- Première connexion : redirection vers le choix du mot de passe : `initial-sombre-1440.png`, `initial-clair-1440.png`, `initial-sombre-390.png`, `initial-clair-390.png`
- Aucune autre page de l’espace n’est accessible : `verrou-sombre-1440.png`, `verrou-clair-1440.png`, `verrou-sombre-390.png`, `verrou-clair-390.png`
- Mot de passe initial erroné (réponse réelle du backend) : `validation-sombre-1440.png`, `validation-clair-1440.png`, `validation-sombre-390.png`, `validation-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Page dérivée | aucun écran dans la maquette | carte reprise de l’écran 21 (réinitialisation du mot de passe) | dérivation (section 8.7.9) |

## États

- Formulaire : validation par champ, refus du même mot de passe, erreur du serveur sous le champ.
- Succès : indicateur levé, retour à l’accueil du rôle.
- L’indicateur de changement obligatoire est à créer côté serveur (Phase 3) ; la recette l’ajoute à la réponse réelle de connexion.
