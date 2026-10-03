# Frontend : site et espace de gestion du Club Informatique de l'IST

![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Vitest](https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest&logoColor=white)
![Nginx](https://img.shields.io/badge/Servi_par-Nginx-009639?logo=nginx&logoColor=white)

Application Angular qui porte le site public et l'espace connecté de chaque rôle. Le design reproduit la maquette de référence du club ; toutes les données affichées proviennent de l'API.

## Sommaire

- [Points clés](#points-clés)
- [Démarrer en local](#démarrer-en-local)
- [Commandes](#commandes)
- [Recette de bout en bout](#recette-de-bout-en-bout)
- [Construction et image de production](#construction-et-image-de-production)
- [Organisation du code](#organisation-du-code)
- [Règles de développement](#règles-de-développement)

## Points clés

| Sujet | Mise en œuvre |
|---|---|
| Rendu | Angular 22 sans zone.js, signaux, composants autonomes, chargement différé par espace |
| Styles | Tailwind CSS 4 et jetons de design (`src/styles/tokens.css`) ; thèmes clair et sombre ; de 360 à 1920 pixels de large |
| Pages publiques | onze pages à adresse fixe pré-rendues à la construction : affichage immédiat, référencement, partage |
| Session | jeton d'accès en mémoire ; rafraîchissement par cookie `HttpOnly` ; renouvellement transparent |
| Accès | gardes de route par rôle et par module ; navigation construite depuis un registre unique |
| Accessibilité | contrôles axe-core et Lighthouse : 100 en accessibilité sur les pages publiques mesurées |
| Sécurité | CSP stricte avec empreintes des scripts en ligne, HSTS, `X-Frame-Options`, `Referrer-Policy` |

## Démarrer en local

Prérequis : Node.js 24 et npm 11. Le backend doit tourner sur `http://localhost:8080` (voir le [README du backend](../club-informatique-backend/README.md)).

```bash
npm ci
```

```bash
npm start
```

Le site s'ouvre sur http://localhost:4200. Le serveur de développement relaie `/api` vers le backend local ([`proxy.conf.json`](proxy.conf.json)) : aucune adresse d'API n'est écrite dans l'application.

En développement, tous les modules sont visibles et la page interne `/__design` présente les composants de base. Elle est absente de la production.

## Commandes

| Commande | Rôle |
|---|---|
| `npm start` | serveur de développement, rechargement à chaud |
| `npm test` | tests unitaires (Vitest) |
| `npm run check` | gardes : aucun chiffre écrit en dur dans les gabarits, casse des noms de fichiers |
| `npm run build` | construction de production dans `dist/`, avec pré-rendu des pages publiques |
| `npm run build:dev` | construction de développement |
| `npm run assets:icons` | favicon, icônes, manifeste et image de partage à partir de `branding/logo.png` |
| `npm run assets:sprite` | sprite d'icônes à partir de `scripts/icons.json` |
| `npm run assets:fonts` | copie des polices locales et génération de `src/styles/fonts.css` |

## Recette de bout en bout

Les scripts de `e2e/` pilotent un navigateur (Playwright) sur une pile locale complète. Ils demandent Docker et deux conteneurs : `ci-ist-pg` (PostgreSQL 16, port 5433) et `ci-ist-mail` (Mailpit, ports 1025 et 8025). Ils ne visent que des bases locales.

| Commande | Vérifie |
|---|---|
| `node e2e/backend-recette.mjs` | démarre le backend de recette sur la base locale |
| `node e2e/seed-recette.mjs` | peuple la base de recette (un compte par rôle, contenus) |
| `node e2e/recette-page.mjs <page>` | une page : deux thèmes, sept largeurs, console, accessibilité ; journal dans `docs/recette/<page>/` |
| `node e2e/integration.mjs` | par module : lecture, refus d'un visiteur, refus d'un rôle insuffisant, erreur restituée |
| `node e2e/parcours.mjs` | parcours complets de chaque rôle, sur base vierge et image de production |
| `node e2e/lighthouse.mjs` | performance, accessibilité, bonnes pratiques et référencement des pages publiques |

L'option `--base <adresse>` des scripts de recette désigne le frontend visé (serveur de développement ou image de production). Les résultats consolidés sont dans [`docs/recette/`](../docs/recette/).

## Construction et image de production

Le [`Dockerfile`](Dockerfile) enchaîne :

1. `npm run check`, puis `npm run build` (construction et pré-rendu) ;
2. `deploiement/optimiser-pages.mjs` : inscrit dans chaque page la feuille de style et le script du thème, et calcule leurs empreintes pour la CSP ;
3. une image Nginx qui sert les pages, relaie `/api` vers le backend et génère `robots.txt` et `sitemap.xml` pour le domaine servi.

```bash
docker build -t club-frontend .
```

```bash
docker run --rm -p 8081:8080 -e API_URL=http://host.docker.internal:8080 club-frontend
```

| Variable | Description |
|---|---|
| `API_URL` | adresse du backend, sans barre finale ; en ligne, son adresse interne (`http://club-backend.railway.internal:8080`) |
| `PORT` | port d'écoute de Nginx, `8080` par défaut ; fourni par l'hébergeur |

Nginx compresse les réponses, met en cache pour un an les fichiers à empreinte, revalide systématiquement les pages et répond `ok` sur `/sante` (sonde de l'hébergeur). Configuration : [`deploiement/nginx.conf.template`](deploiement/nginx.conf.template) et [`deploiement/en-tetes.conf`](deploiement/en-tetes.conf).

## Organisation du code

```
src/
├── app/
│   ├── core/            configuration, modules, authentification, accès à l'API, intercepteurs,
│   │                    gardes, navigation, métadonnées de page, thème
│   ├── shared/ui/       composants de base (boutons, champs, dialogues, états, fichiers)
│   ├── shared/layout/   marque, en-tête, pied de page, menu de compte, bascule de thème
│   ├── layouts/         gabarits : public, authentification, espace connecté, erreur
│   └── pages/           pages du produit, par espace (public, auth, member, trainer, management, admin, system, errors)
├── environments/        configuration par environnement, dont les indicateurs de modules
└── styles/              jetons de design, base, composants transposés de la maquette
```

## Règles de développement

- **Aucune donnée inventée.** Pas de chiffre, de nom, de texte de contenu ni d'image de démonstration dans les gabarits : tout vient de l'API, et une donnée absente donne un état vide. `npm run check` bloque la construction en cas d'écart.
- **Navigation par registre.** Une entrée n'apparaît que si son module est activé et que le rôle l'autorise ([`src/app/core/navigation/nav-registry.ts`](src/app/core/navigation/nav-registry.ts)). Les droits réels restent appliqués par le backend.
- **Session.** Le jeton d'accès reste en mémoire ; seul le cookie `HttpOnly` survit au rechargement.
- **Fichiers.** Noms en minuscules, sans espace ni accent.
- **Interface.** En français, avec vouvoiement ; deux thèmes vérifiés pour chaque écran.
