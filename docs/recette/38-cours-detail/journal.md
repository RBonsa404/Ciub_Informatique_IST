# Journal de recette : Détail d’un cours

Identifiant : 38-cours-detail. Route : `/espace/formateur/cours/:id`. Date : 2026-10-02.
Référence : écran `38-cours-detail` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (séances, supports et devoirs) ; Planification d’une séance : validation du formulaire ; Suppression d’un support : modale de confirmation (non confirmée) ; Cours introuvable (réponse réelle du backend) ; Chargement ; Service injoignable |
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

- Contenu réel (séances, supports et devoirs) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Planification d’une séance : validation du formulaire : `seance-sombre-1440.png`, `seance-clair-1440.png`, `seance-sombre-390.png`, `seance-clair-390.png`
- Suppression d’un support : modale de confirmation (non confirmée) : `suppression-sombre-1440.png`, `suppression-clair-1440.png`, `suppression-sombre-390.png`, `suppression-clair-390.png`
- Cours introuvable (réponse réelle du backend) : `introuvable-sombre-1440.png`, `introuvable-clair-1440.png`, `introuvable-sombre-390.png`, `introuvable-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| Badges d’en-tête | « Module DEV-301 », « En cours • Séance 4 sur 6 » | état de publication, niveau, catégorie | assumé (D-05) |
| Bloc de code « SecurityConfig.java » et badge « Direct Labo » | décor à texte fictif | retiré | retrait (écart déjà classé en section 3) |
| Plan des séances | séances titrées avec nombre de présents | séances réelles : date, horaire, lieu, inscrits et places, statut ; planification et suppression | assumé |
| « Supports & Fichiers » | deux fichiers à télécharger | supports et devoirs réels, lien d’ouverture, suppression avec confirmation | assumé |
| « Cohorte » : assiduité moyenne « 94.5% », devoirs rendus « 28 / 32 » | présents | retirés ; inscriptions et séances réelles | retrait (section 1, D-03) |

## États

- Chargement : squelettes.
- Introuvable : message dédié.
- Erreur : message et « Réessayer ».
- Contenu : séances, supports, devoirs ; zone des supports avec ses propres états.
