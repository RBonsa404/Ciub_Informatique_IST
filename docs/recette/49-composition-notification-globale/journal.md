# Journal de recette : Notification globale

Identifiant : 49-composition-notification-globale. Route : `/espace/gestion/notifications`. Date : 2026-10-01.
Référence : écran `49-composition-notification-globale` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Formulaire initial ; Aperçu en direct ; Champs obligatoires vides et lien invalide ; Envoi : modale de confirmation (non confirmée) |
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

- Formulaire initial : `initial-sombre-1440.png`, `initial-clair-1440.png`, `initial-sombre-390.png`, `initial-clair-390.png`
- Aperçu en direct : `apercu-sombre-1440.png`, `apercu-clair-1440.png`, `apercu-sombre-390.png`, `apercu-clair-390.png`
- Champs obligatoires vides et lien invalide : `validation-sombre-1440.png`, `validation-clair-1440.png`, `validation-sombre-390.png`, `validation-clair-390.png`
- Envoi : modale de confirmation (non confirmée) : `confirmation-sombre-1440.png`, `confirmation-clair-1440.png`, `confirmation-sombre-390.png`, `confirmation-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| « Type » | liste (annonce, événement, alerte) | retiré : une notification globale est une annonce | retrait (modèle existant) |
| « Audience ciblée » avec effectifs « (148) », « (12) » | liste à compteurs fixes | mention : tous les membres actifs | retrait (section 1) ; ciblage absent du CDC |
| « Programmer » | bouton | retiré : envoi immédiat seulement | retrait (UC-22) |
| Lien associé | absent | champ facultatif (chemin interne du site) | assumé (modèle existant) |
| Envoi | immédiat | confirmation préalable : une notification envoyée ne peut pas être retirée | assumé |

## États

- Validation : message par champ.
- Confirmation avant envoi.
- Succès : notification, formulaire vidé.
- L’envoi réel est prouvé par le script de peuplement, qui appelle le même point d’accès.
