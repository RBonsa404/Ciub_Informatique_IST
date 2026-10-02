# Journal de recette : Supports et devoirs, liste

Identifiant : 29-supports-devoirs-liste. Route : `/espace/supports`. Date : 2026-10-02.
Référence : écran `29-supports-devoirs-liste` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (formation à laquelle le membre est inscrit) ; Aucune inscription à une formation ; Chargement ; Service injoignable |
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

- Contenu réel (formation à laquelle le membre est inscrit) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Aucune inscription à une formation : `vide-sombre-1440.png`, `vide-clair-1440.png`, `vide-sombre-390.png`, `vide-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille « 5 » | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (aucune recherche globale au CDC) |
| Format et poids du fichier (« PDF • 4.2 Mo ») | présents | retirés : donnée absente côté serveur ; formation de rattachement affichée | retrait (section 1) |
| « J-3 restant » | présent | date d’échéance réelle du devoir | assumé |
| « Déposer mon devoir » | présent | « Voir le devoir » : consultation seulement | retrait (D-03) |

## États

- Chargement : squelettes de carte.
- Vide : message et lien vers les formations.
- Erreur : message et « Réessayer ».
- Contenu : devoirs par échéance, puis supports.
