# Journal de recette : Contact

Identifiant : 13-contact. Route : `/contact`. Date : 2026-10-01.
Référence : écran `13-contact` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | État initial ; Formulaire soumis vide ; Message envoyé au backend réel et enregistré en base ; Service injoignable |
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
- Message envoyé au backend réel et enregistré en base : `envoi-sombre-1440.png`, `envoi-clair-1440.png`, `envoi-sombre-390.png`, `envoi-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| « Nous vous répondrons dans les plus brefs délais » | présent | retiré (aucune promesse, annexe C) | retrait |
| Coordonnées | siège, courriel, « suivez-nous » | établissement, courriel, WhatsApp, téléphones, quatre réseaux réels | corrigé (section 4.4) |
| Anti-spam | absent | champ piège invisible et durée de saisie transmis au backend | dérivation (8.8.1) |
| Libellés | texte indicatif seul | libellés réservés aux lecteurs d’écran | corrigé (accessibilité) |

## États

- Validation par champ, attente, succès (accusé de réception annoncé), erreur.
