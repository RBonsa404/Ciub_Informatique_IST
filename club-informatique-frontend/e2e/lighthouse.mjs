// Mesures Lighthouse des pages publiques, sur le frontend de production (image Nginx) : profil mobile, réseau lent simulé.
// Usage : node e2e/lighthouse.mjs [--base http://localhost:4300] [--passes 3]     Résultat : docs/recette/performance.md
// Lighthouse est lancé par npx (aucune dépendance ajoutée au projet) et pilote le navigateur sans interface installé
// par Playwright, ouvert une fois pour toutes les mesures. Chaque page est mesurée plusieurs fois ; la médiane est retenue.
// Une page volontairement exclue de l'indexation (connexion, inscription) n'est pas jugée sur la note SEO.
import { chromium } from '@playwright/test';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = (nom, defaut) => (args.includes(nom) ? args[args.indexOf(nom) + 1] : defaut);
const base = option('--base', 'http://localhost:4300');
const passes = Number(option('--passes', '3'));
const PAGES = ['/', '/presentation', '/bureau', '/actualites', '/evenements', '/formations', '/projets', '/ressources', '/contact', '/connexion', '/inscription', '/confidentialite'];
const NON_INDEXEES = new Set(['/connexion', '/inscription']);
const SEUILS = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 95 };
const PORT_DE_PILOTAGE = 9333;
const dossier = mkdtempSync(join(tmpdir(), 'lighthouse-'));

/** Exécutable du navigateur sans interface de Playwright (dossier voisin de celui du navigateur complet). */
function navigateurSansInterface() {
  const racine = join(dirname(chromium.executablePath()), '..', '..');
  for (const version of readdirSync(racine).filter((d) => d.startsWith('chromium_headless_shell-')).sort().reverse()) {
    for (const plateforme of readdirSync(join(racine, version))) {
      for (const nom of ['chrome-headless-shell.exe', 'chrome-headless-shell']) {
        const chemin = join(racine, version, plateforme, nom);
        if (existsSync(chemin)) return chemin;
      }
    }
  }
  throw new Error('navigateur sans interface introuvable : exécutez « npx playwright install chromium »');
}

const navigateur = spawn(navigateurSansInterface(), [`--remote-debugging-port=${PORT_DE_PILOTAGE}`, `--user-data-dir=${join(dossier, 'profil')}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let pret = false;
for (let essai = 0; essai < 40 && !pret; essai++) {
  try {
    pret = (await fetch(`http://127.0.0.1:${PORT_DE_PILOTAGE}/json/version`)).ok;
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}
if (!pret) throw new Error('le navigateur de mesure ne répond pas');

const mediane = (valeurs) => [...valeurs].sort((a, b) => a - b)[Math.floor(valeurs.length / 2)];
const secondes = (ms) => `${(ms / 1000).toFixed(1).replace('.', ',')} s`;

const lignes = [];
let conforme = true;
try {
  for (const [index, chemin] of PAGES.entries()) {
    const rapports = [];
    for (let passe = 0; passe < passes; passe++) {
      const sortie = join(dossier, `page-${index}-${passe}.json`);
      execFileSync(
        process.platform === 'win32' ? 'npx.cmd' : 'npx',
        ['--yes', 'lighthouse', base + chemin, '--quiet', '--output=json', `--output-path=${sortie}`, '--only-categories=performance,accessibility,best-practices,seo', `--port=${PORT_DE_PILOTAGE}`],
        { stdio: ['ignore', 'ignore', 'inherit'], shell: process.platform === 'win32' },
      );
      rapports.push(JSON.parse(readFileSync(sortie, 'utf8')));
    }
    const note = (categorie) => mediane(rapports.map((r) => Math.round((r.categories[categorie]?.score ?? 0) * 100)));
    const mesure = (id) => mediane(rapports.map((r) => r.audits[id]?.numericValue ?? 0));
    const notes = Object.fromEntries(Object.keys(SEUILS).map((c) => [c, note(c)]));
    const nonIndexee = NON_INDEXEES.has(chemin);
    const ok = Object.entries(SEUILS).every(([c, seuil]) => notes[c] >= seuil || (c === 'seo' && nonIndexee));
    if (!ok) conforme = false;
    const cls = mesure('cumulative-layout-shift').toFixed(3).replace('.', ',');
    lignes.push(
      `| \`${chemin}\` | ${notes.performance} | ${notes.accessibility} | ${notes['best-practices']} | ${nonIndexee ? `${notes.seo} (page non indexée)` : notes.seo} | ${secondes(mesure('first-contentful-paint'))} | ${secondes(mesure('largest-contentful-paint'))} | ${cls} | ${Math.round(mesure('total-blocking-time'))} ms | ${ok ? 'conforme' : 'sous le seuil'} |`,
    );
    console.log(`${chemin} : ${JSON.stringify(notes)} FCP ${secondes(mesure('first-contentful-paint'))} LCP ${secondes(mesure('largest-contentful-paint'))} TBT ${Math.round(mesure('total-blocking-time'))} ms`);
  }
} finally {
  navigateur.kill();
}

writeFileSync(
  join(here, '..', '..', 'docs', 'recette', 'performance.md'),
  `# Mesures Lighthouse des pages publiques

Date : ${new Date().toISOString().slice(0, 10)}. Produit par \`node e2e/lighthouse.mjs\`.
Cible : frontend de production (image Nginx du déploiement) sur \`${base}\`, backend et base de recette locaux.
Profil : mobile, réseau lent simulé et processeur ralenti quatre fois (réglages par défaut de Lighthouse) ; médiane de ${passes} mesures par page.
Seuils : Performance 90 ; Accessibilité, Bonnes pratiques et SEO 95 (LCP inférieur ou égal à 2,5 s, CLS inférieur ou égal à 0,1).
Les pages de connexion et d'inscription sont volontairement exclues de l'indexation : leur note SEO n'est pas jugée.

| Page | Performance | Accessibilité | Bonnes pratiques | SEO | FCP | LCP | CLS | Temps de blocage | Verdict |
|---|---|---|---|---|---|---|---|---|---|
${lignes.join('\n')}

Verdict : ${conforme ? 'conforme' : 'au moins une page sous un seuil'}.

Ces mesures sont locales (poste de développement, HTTP/1.1 sans chiffrement) : elles sont à refaire sur le site en ligne après le déploiement.
`,
);
process.exit(conforme ? 0 : 1);
