# Journal de recette : Gestion des événements

Identifiant : 45-gestion-evenements. Route : `/espace/gestion/evenements`. Date : 2026-10-02.
Référence : écran `45-gestion-evenements` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (événements de la base de recette) ; Création : validation du formulaire ; Modification : enregistrement réel (backend) ; Suppression : modale de confirmation (non confirmée) ; Aucun événement ; Chargement ; Service injoignable |
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

- Contenu réel (événements de la base de recette) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Création : validation du formulaire : `creation-sombre-1440.png`, `creation-clair-1440.png`, `creation-sombre-390.png`, `creation-clair-390.png`
- Modification : enregistrement réel (backend) : `modification-sombre-1440.png`, `modification-clair-1440.png`, `modification-sombre-390.png`, `modification-clair-390.png`
- Suppression : modale de confirmation (non confirmée) : `suppression-sombre-1440.png`, `suppression-clair-1440.png`, `suppression-sombre-390.png`, `suppression-clair-390.png`
- Aucun événement : `vide-sombre-1440.png`, `vide-clair-1440.png`, `vide-sombre-390.png`, `vide-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| Calendrier | mois fixe « Septembre / Octobre 2026 », jours surlignés fictifs | mois courant, navigation entre les mois, jours des événements réels | assumé (section 1) |
| « Gérer inscrits (24) » | valeur fixe | nombre réel d’inscrits renvoyé par le serveur | assumé |
| Badge | « À venir », « Passé », « Complet » | mêmes états, déduits des données, et « Brouillon » | assumé |
| Formulaire | toujours affiché, quatre champs | affiché à la création ou à la modification ; début, fin, description et catégorie ajoutés (champs obligatoires du modèle) | assumé |
| « Inscription ouverte », « Liste d’attente activée » | cases à cocher | interrupteur « Publier l’événement » ; la liste d’attente découle de la capacité | assumé (modèle existant) |
| Actions par événement | « Gérer inscrits » seulement | gérer les inscrits, modifier, supprimer avec confirmation | assumé (UC-19) |

## États

- Liste : squelettes, vide, erreur, contenu paginé côté serveur.
- Calendrier : squelette, erreur avec « Réessayer », mention si aucun événement dans le mois.
- Formulaire : validation par champ, erreurs du serveur, notification de succès.
