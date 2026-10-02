# Journal de recette : Inscription

Identifiant : 18-inscription. Route : `/inscription`. Date : 2026-10-02.
Référence : écran `18-inscription` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | État initial ; Formulaire soumis vide ; Saisie valide (filière libre normalisée) ; Inscription réelle : écran « Vérifiez votre boîte de réception », courriel de vérification reçu |
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
- Formulaire soumis vide : `validation-sombre-1440.png`, `validation-clair-1440.png`, `validation-sombre-390.png`, `validation-clair-390.png`
- Saisie valide (filière libre normalisée) : `saisie-sombre-1440.png`, `saisie-clair-1440.png`, `saisie-sombre-390.png`, `saisie-clair-390.png`
- Inscription réelle : écran « Vérifiez votre boîte de réception », courriel de vérification reçu : `succes-sombre-1440.png`, `succes-clair-1440.png`, `succes-sombre-390.png`, `succes-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Gabarit | en-tête public complet (18, 20) ou absent (19, 21) | gabarit d’authentification unique : marque, retour à l’accueil, thème | assumé (E-06) |
| Icônes de champ et d’action | emoji (œil, coche) | pictogrammes de la famille unique | corrigé (E-01) |
| Libellé « e-mail » | « Adresse e-mail » | « Adresse électronique » | assumé (langue française) |
| Champs | nom complet, adresse, filière, téléphone, mot de passe, confirmation | nom, prénom, adresse, filière, mot de passe, confirmation | assumé (CDC, D-08) ; téléphone retiré (minimisation des données) |
| Coches de validité | affichées en permanence sur quatre champs | affichées seulement pour un champ modifié et valide | corrigé |
| Case de consentement | cochée par défaut | décochée par défaut | corrigé (consentement explicite, BNF-09) |
| Colonne de marque | logo, nom, slogan et citation | logo et nom ; slogan et citation non validés (C.1) | retrait |
| Carte de droite | « Rejoignez plus de 120 étudiants… » | visuel conservé sans texte ni chiffre | retrait (donnée inventée) |
| Libellés de champ | texte indicatif seul | texte indicatif et libellé réservé aux lecteurs d’écran | corrigé (accessibilité) |
| Redirection | simulée vers le tableau de bord | écran « Vérifiez votre boîte de réception » : le compte n’est actif qu’après vérification de l’adresse | assumé |

## États

- Chargement : bouton en attente.
- Erreur : messages par champ (validation locale et erreurs renvoyées par le backend), alerte générale ; un conflit d’adresse ne confirme pas l’existence du compte.
- Succès : écran « Vérifiez votre boîte de réception » ; le courriel de vérification est réellement envoyé (lu dans la boîte de recette).
