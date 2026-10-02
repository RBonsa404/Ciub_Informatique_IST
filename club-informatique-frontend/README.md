# Frontend du Club Informatique de l'IST

Application Angular et Tailwind CSS. Le design reproduit la maquette HTML de référence ; les données affichées proviennent exclusivement de l'API.

## Prérequis

Node.js 24 (LTS) et npm 11.

## Commandes

| Commande | Rôle |
|---|---|
| `npm ci` | installer les dépendances |
| `npm start` | serveur de développement sur `http://localhost:4200` (tous les modules visibles, page `/__design` disponible) |
| `npm run build` | construction de production dans `dist/` ; les pages publiques à adresse fixe y sont pré-rendues |
| `npm test` | tests unitaires |
| `npm run check` | gardes : aucun littéral numérique affiché, casse des fichiers |
| `npm run assets:icons` | favicon, icônes, manifeste et image de partage à partir de `branding/logo.png` |
| `npm run assets:sprite` | sprite d'icônes à partir de `scripts/icons.json` |
| `npm run assets:fonts` | copie des polices locales et génération de `src/styles/fonts.css` |
| `node e2e/recette-page.mjs <page>` | recette d'une page (captures, débordement, console, accessibilité) sur la pile locale ; `--base` désigne le frontend visé |
| `node e2e/integration.mjs` | preuve d'intégration par module |
| `node e2e/parcours.mjs` | parcours complets de chaque rôle sur base vierge et image de production |
| `node e2e/lighthouse.mjs` | mesures Lighthouse des pages publiques sur l'image de production |
| `docker build -t ci-ist-front .` | image de production (Nginx) |
| `node e2e/recette-socle.mjs` | recette du socle (captures, débordement, console, accessibilité, styles) ; serveur de développement démarré |

## Organisation

| Dossier | Contenu |
|---|---|
| `src/styles/` | jetons de design (`tokens.css`), base, composants transposés de la maquette |
| `src/app/core/` | configuration, modules fonctionnels, authentification, accès à l'API, intercepteurs, gardes, navigation, métadonnées de page, thème |
| `src/app/shared/ui/` | composants de base |
| `src/app/shared/layout/` | marque, en-tête, pied de page, menu de compte, bascule de thème |
| `src/app/layouts/` | gabarits public, authentification, espace connecté, erreur |
| `src/app/pages/` | pages du produit ; `design/` est une page interne absente de la production |
| `src/environments/` | configuration par environnement, dont les indicateurs de modules |

## Règles

- Aucun chiffre, nom, texte de contenu ni image de démonstration dans les gabarits : toute donnée vient de l'API ; une donnée absente donne un état vide.
- Une entrée de navigation n'apparaît que si son module est activé et que le rôle de l'utilisateur l'autorise (`src/app/core/navigation/nav-registry.ts`).
- Le jeton d'accès reste en mémoire ; le jeton de rafraîchissement voyage dans un cookie `HttpOnly`.
- Noms d'assets en minuscules, sans espace ni accent.
