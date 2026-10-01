# Journal de recette : Support ou devoir, détail

Identifiant : 30-supports-devoirs-detail. Route : `/espace/supports/ressources/:id`. Date : 2026-10-01.
Référence : écran `30-supports-devoirs-detail` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Support réel ; Devoir réel ; Document introuvable (réponse réelle du backend) ; Chargement ; Service injoignable |
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

- Support réel : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Devoir réel : `devoir-sombre-1440.png`, `devoir-clair-1440.png`, `devoir-sombre-390.png`, `devoir-clair-390.png`
- Document introuvable (réponse réelle du backend) : `introuvable-sombre-1440.png`, `introuvable-clair-1440.png`, `introuvable-sombre-390.png`, `introuvable-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille « 5 » | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (aucune recherche globale au CDC) |
| Champs « Difficulté », « Matière », « Niveau / Public cible » | présents | retirés : données absentes du modèle ; type, formation, échéance, auteur et date de publication réels | retrait (section 1) |
| Badge « À venir » | présent | type du document | assumé |
| « Statut de remise » et « Remettre mon devoir » | présents | retirés | retrait (D-03) |
| Téléchargement | zone vide | lien réel vers le fichier s’il existe, sinon mention explicite | assumé |

## États

- Chargement : squelettes.
- Introuvable : message dédié.
- Erreur : message et « Réessayer ».
- Contenu : support ou devoir.
