# Journal de recette : Tableau de bord Formateur

Identifiant : 35-tdb-formateur. Route : `/espace/formateur`. Date : 2026-10-01.
Référence : écran `35-tdb-formateur` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (cours et séances du formateur de recette) ; Aucun cours ; Chargement ; Service injoignable |
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

- Contenu réel (cours et séances du formateur de recette) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Aucun cours : `vide-sombre-1440.png`, `vide-clair-1440.png`, `vide-sombre-390.png`, `vide-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille à valeur fixe | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (E-31) |
| Titre | « Bienvenue, Dr. Ouédraogo ! » suivi d’un emoji | « Bienvenue, <prénom> » sans titre honorifique ni emoji | corrigé (6.4) |
| Tuiles d’accès rapide | quatre tuiles avec compteurs fixes (« 3 modules actifs », « 8 projets suivis ») | trois tuiles sans compteur : mes cours, catalogue, projets suivis | retrait des valeurs (section 1) |
| Tuiles « Émargement » et « Publier devoir » | liens directs | actions proposées sur chaque séance et dans le détail du cours (elles dépendent d’un cours) | assumé |
| Séances à venir | deux séances d’illustration avec thème | séances réelles : rang dans le cours, date, lieu, nombre réel d’inscrits | assumé (section 1) |
| « Derniers devoirs rendus », « 6 à noter » | présents | remplacés par la liste des cours du formateur | retrait (D-03) |

## États

- Chargement : squelettes dans les deux panneaux.
- Vide : message par panneau et lien de création.
- Erreur : message et « Réessayer ».
- Contenu : cinq prochaines séances et cours du formateur.
