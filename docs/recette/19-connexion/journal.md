# Journal de recette : Connexion

Identifiant : 19-connexion. Route : `/connexion`. Date : 2026-10-01.
Référence : écran `19-connexion` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | État initial ; Champs obligatoires manquants ; Identifiants refusés par le backend réel ; Retour après expiration de session ; Connexion réussie contre le backend réel |
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
- Champs obligatoires manquants : `validation-sombre-1440.png`, `validation-clair-1440.png`, `validation-sombre-390.png`, `validation-clair-390.png`
- Identifiants refusés par le backend réel : `echec-sombre-1440.png`, `echec-clair-1440.png`, `echec-sombre-390.png`, `echec-clair-390.png`
- Retour après expiration de session : `session-expiree-sombre-1440.png`, `session-expiree-clair-1440.png`, `session-expiree-sombre-390.png`, `session-expiree-clair-390.png`
- Connexion réussie contre le backend réel : `succes-sombre-1440.png`, `succes-clair-1440.png`, `succes-sombre-390.png`, `succes-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Gabarit | en-tête public complet (18, 20) ou absent (19, 21) | gabarit d’authentification unique : marque, retour à l’accueil, thème | assumé (E-06) |
| Icônes de champ et d’action | emoji (œil, coche) | pictogrammes de la famille unique | corrigé (E-01) |
| Libellé « e-mail » | « Adresse e-mail » | « Adresse électronique » | assumé (langue française) |
| Bloc de marque de la colonne gauche | logo, nom et slogan | retiré : la marque figure dans l’en-tête ; slogan non validé (C.1) | retrait |
| Panneau décoratif | faux code et libellé « Environnement Développeur IST » | panneau conservé, pictogramme seul | retrait partiel (texte fictif) |
| Alerte d’échec | affichée en permanence | affichée seulement après un refus réel | corrigé |
| Champs préremplis | adresse et mot de passe d’exemple | champs vides | retrait (données d’illustration) |
| Accroche | « … continuer votre apprentissage » | « … accéder à votre espace » | assumé (valable pour tous les rôles) |

## États

- Chargement : bouton en attente pendant l’appel.
- Erreur : message identique pour un compte inconnu et un mot de passe erroné ; messages distincts pour le verrouillage, le compte inactif, la limitation de débit et la panne de réseau.
- Succès : redirection vers la destination demandée si elle est interne, sinon vers `/espace` ; aucun jeton dans le stockage du navigateur (contrôlé).
