# Journal de recette : socle du frontend

Date : 1er octobre 2026. Périmètre : jetons, thèmes, polices, icônes, composants de base, quatre gabarits, page interne `/__design`.

## Commandes et résultats

| Vérification | Commande | Résultat |
|---|---|---|
| Garde anti-statistiques (auto-test) | `node scripts/check-no-hardcoded-stats.mjs --self-test` | conforme : 3 littéraux détectés dans le gabarit fautif, expressions et interpolations ignorées |
| Garde anti-statistiques | `npm run check:stats` | 45 fichiers analysés, aucun littéral numérique affiché |
| Casse des fichiers | `npm run check:casse` | 30 assets et 60 fichiers sources vérifiés, aucun problème |
| Tests unitaires | `ng test --watch=false` | 4 fichiers, 32 tests, 0 échec |
| Construction de production | `ng build` | réussie ; lot initial de 323,81 kio bruts (85,75 kio transférés) : avertissement du budget de 300 kio, sous le seuil d'erreur de 500 kio |
| Page `/__design` en production | recherche dans `dist/` | absente (aucune occurrence) |
| Requêtes vers un CDN | recherche d'URL externes dans le CSS construit | aucune ; polices servies depuis `/fonts` |
| Recette automatisée | `node e2e/recette-socle.mjs` | voir ci-dessous ; rapport complet dans `rapport.json` |

Les tests unitaires ont été lancés depuis un lecteur virtuel (`subst`), l'outil de test ne trouvant aucun fichier lorsque le chemin du projet contient des parenthèses (« Nouveau dossier (10) »). Sans effet en CI.

## Recette automatisée

Six écrans (`/__design` et les gabarits public, public connecté, authentification, espace, erreur), deux thèmes, sept largeurs (360, 390, 768, 1 024, 1 280, 1 440, 1 920 px).

| Contrôle | Résultat |
|---|---|
| Débordement horizontal | 0 sur 84 combinaisons |
| Erreurs et avertissements de console | 0 |
| Accessibilité (axe, WCAG 2.2 AA), 24 analyses à 390 et 1 440 px | 0 violation, tous niveaux confondus |
| Focus restitué après fermeture de la modale par Échap | oui, dans les deux thèmes (bouton « Ouvrir la modale ») |
| Tiroir mobile | ouverture, piège de focus et fermeture par Échap vérifiés à 390 px |
| Styles calculés comparés à la maquette (50 sélecteurs, 20 propriétés, tolérance d'un pixel) | thème sombre : 18 identiques ; thème clair : 16 identiques ; aucun écart non expliqué |

Les écarts de styles restants sont tous classés dans `rapport.json` :

- instances de la maquette dimensionnées par un attribut `style` (la règle de classe est identique) : boutons, badges, cartes, champs, titres ;
- corrections consignées dans `docs/ecarts-maquette.md` : E-04 (en-tête), E-07 (modale, onglets, notification), E-19 à E-23 (contrastes, interligne des boutons).

## Captures

| Élément | Maquette | Socle |
|---|---|---|
| En-tête, thème sombre | `maquette/entete-sombre.png` | `sombre/entete-public-1440.png` |
| En-tête, thème clair | `maquette/entete-clair.png` | `clair/entete-public-1440.png` |
| Pied de page, thème sombre | `maquette/pied-de-page-sombre.png` | `sombre/pied-de-page-1440.png` |
| Pied de page, thème clair | `maquette/pied-de-page-clair.png` | `clair/pied-de-page-1440.png` |
| Composants | écrans 58 à 66 dans `docs/maquette-ref/` | `sombre/design-1440.png`, `clair/design-1440.png`, variantes à 390 px |
| Gabarits | écrans 01, 19, 22 | `gabarit-*-1440.png` et `gabarit-*-390.png` dans chaque thème |
| Modale | écran 64 | `sombre/modale-1440.png`, `clair/modale-1440.png` |
| Tiroir mobile | écran 60 | `sombre/tiroir-390.png`, `clair/tiroir-390.png` |

## Écarts constatés sur l'en-tête et le pied de page

| Élément | Maquette | Socle | Classement |
|---|---|---|---|
| Hauteur de l'en-tête | 136 px (nom sur cinq lignes) | 78 px | corrigé (E-04) |
| Entrées de navigation | huit, dont « Bureau » | sept ; « Bureau » accessible depuis Présentation et le pied de page | à valider (D-13) |
| Bascule de thème | bouton avec texte « Mode Clair » débordant | bouton à icône seule, nom accessible | corrigé (E-05) |
| Actions | « Connexion », « Rejoindre » | « Connexion », « Inscription » | assumé (section 7.3) |
| Navigation réduite | à partir de 768 px, panneau déroulant | tiroir latéral en deçà de 1 280 px | dérivation (E-03, E-24) |
| Colonne « Espaces » du pied de page | liens vers les tableaux de bord et les pages d'erreur | remplacée par « Informations légales » | assumé (section 7.4) |
| Slogan et texte de présentation du pied de page | « Excellence & Innovation », paragraphe descriptif | absents tant que le club ne les a pas fournis | retrait (E.1, E.4, C.1) |
| Glyphes sociaux | tracés au trait génériques | glyphes de plateformes remplis, même bouton de 40 px | corrigé (E-02) |
| Motif circuit en thème sombre | quasi invisible (trait noir) | trait cyan à 12 % d'opacité, valeur du jeton | à valider (E-20) |

## Points ouverts

1. Lot initial au-dessus du seuil d'avertissement de 300 kio (323,81 kio) : à réduire lors de la passe de performance, sans bloquer.
2. Écarts E-20 et D-13 soumis à validation visuelle au point d'arrêt 2.
3. Rendu pré-généré des routes publiques : décision reportée à la construction des pages publiques (section 5.8).
