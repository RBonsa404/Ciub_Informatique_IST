# Journal de recette : Tableau de bord Membre

Identifiant : 22-tdb-membre. Route : `/espace/membre`. Date : 2026-10-01.
Référence : écran `22-tdb-membre` de la maquette (`maquette-sombre.png`, `maquette-clair.png`).

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | Contenu réel (inscriptions et notifications du compte de recette) ; Aucune activité ni notification ; Chargement ; Service injoignable |
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

- Contenu réel (inscriptions et notifications du compte de recette) : `contenu-sombre-1440.png`, `contenu-clair-1440.png`, `contenu-sombre-390.png`, `contenu-clair-390.png`
- Aucune activité ni notification : `vide-sombre-1440.png`, `vide-clair-1440.png`, `vide-sombre-390.png`, `vide-clair-390.png`
- Chargement : `chargement-sombre-1440.png`, `chargement-clair-1440.png`, `chargement-sombre-390.png`, `chargement-clair-390.png`
- Service injoignable : `erreur-sombre-1440.png`, `erreur-clair-1440.png`, `erreur-sombre-390.png`, `erreur-clair-390.png`

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
| Barre de prototype, numéros d’écran | présents | retirés | retrait (démonstration) |
| Pictogrammes | emoji et tracés au trait | famille unique au trait | corrigé (E-01) |
| Contenus | textes, noms, dates et chiffres d’illustration | données renvoyées par l’API | assumé (section 1) |
| Barre supérieure | champ de recherche globale, pastille « 5 » | fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte | assumé (aucune recherche globale au CDC) |
| Titre | « Bienvenue, Aminata ! » suivi d’un emoji | « Bienvenue, <prénom> » sans emoji | corrigé (6.4) |
| Bouton « Nouvelle activité » | lien vers la proposition de projet | « Proposer un projet », affiché si le module des projets est ouvert | assumé |
| Cartes d’accès rapide | « Mes cours », « Mes sessions », « Devenir ressource », « Projets / Clubs » | « Mes cours », « Événements », « Supports et devoirs », « Mes projets », chacune liée à une page existante et filtrée par module | assumé |
| « Mes prochaines activités » | trois activités d’illustration | inscriptions réelles à venir du membre (cinq au plus) | assumé (section 1) |
| « Activités récentes » | flux social (publications, commentaires, arrivées) | « Dernières notifications » réelles du membre | remplacé (CDC : fil social exclu, D-01) |

## États

- Chargement : squelettes dans chaque panneau, aucune valeur provisoire.
- Vide : message et lien vers les formations.
- Erreur : message et action « Réessayer » par panneau.
- Contenu : inscriptions à venir et dernières notifications.
