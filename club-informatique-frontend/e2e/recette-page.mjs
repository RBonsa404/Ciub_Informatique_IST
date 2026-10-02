// Recette d'une page : captures par scénario (deux thèmes, bureau et mobile), débordement horizontal
// aux sept largeurs de référence, console, accessibilité (axe), puis génération du journal.
// Usage : node e2e/recette-page.mjs <id> [<id>…] [--base http://localhost:4200]
// Les scénarios sont décrits dans e2e/pages/<groupe>.mjs. Les réponses d'API interceptées par un scénario
// ne servent qu'à provoquer un état (chargement, vide, erreur) pendant la recette ; aucune n'est livrée.
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { aller, connecter, priseEnMain } from './pages/_outils.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const baseIndex = args.indexOf('--base');
const base = baseIndex >= 0 ? args[baseIndex + 1] : 'http://localhost:4200';
const ids = args.filter((a, i) => !a.startsWith('--') && (baseIndex < 0 || i !== baseIndex + 1));

const registry = {};
for (const file of readdirSync(join(here, 'pages'))) {
  if (!file.endsWith('.mjs') || file.startsWith('_')) continue;
  const mod = await import(pathToFileURL(join(here, 'pages', file)).href);
  Object.assign(registry, mod.PAGES);
}

const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920];
const docs = join(here, '..', '..', 'docs');
const browser = await chromium.launch();
let failed = false;

for (const id of ids.length ? ids : Object.keys(registry)) {
  const spec = registry[id];
  if (!spec) throw new Error(`page inconnue : ${id}`);
  const out = join(docs, 'recette', id);
  mkdirSync(out, { recursive: true });
  const result = { overflow: [], console: [], axe: [], shots: [] };

  // Référence de la maquette, copiée à côté des captures pour la comparaison côte à côte.
  if (spec.maquette) {
    for (const theme of ['sombre', 'clair']) {
      const ref = join(docs, 'maquette-ref', theme, '1440', `${spec.maquette}.png`);
      if (existsSync(ref)) copyFileSync(ref, join(out, `maquette-${theme}.png`));
    }
  }

  for (const theme of ['dark', 'light']) {
    const themeName = theme === 'dark' ? 'sombre' : 'clair';
    for (const width of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: 'reduce', locale: 'fr-FR' });
      await ctx.addInitScript((t) => localStorage.setItem('ci_ist_theme', t), theme);
      const page = await ctx.newPage();
      const messages = [];
      page.on('console', (m) => {
        if (['error', 'warning'].includes(m.type())) messages.push(`${m.type()} : ${m.text().slice(0, 180)}`);
      });
      page.on('pageerror', (e) => messages.push(`exception : ${String(e).slice(0, 180)}`));

      for (const scenario of spec.scenarios) {
        // Les captures et l'analyse axe se font à 1 440 et 390 px ; les autres largeurs ne vérifient que le débordement de l'état principal.
        const full = width === 1440 || width === 390;
        if (!full && scenario !== spec.scenarios[0]) continue;
        messages.length = 0;
        await page.unrouteAll({ behavior: 'ignoreErrors' });
        const path = typeof scenario.path === 'function' ? await scenario.path() : (scenario.path ?? spec.path);
        const role = scenario.role ?? spec.role;
        if (role) {
          // Page de l'espace connecté : connexion réelle, puis navigation interne (la session vit en mémoire).
          await connecter(page, base, role);
          // La page d'accueil du rôle finit de charger avant le scénario : ses messages de console n'en font pas partie.
          await page.waitForTimeout(300);
          await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 15000 });
          await page.waitForLoadState('networkidle');
          messages.length = 0;
          if (scenario.before) await scenario.before(page, { base, theme, width });
          // Si la page visée est l'accueil du rôle, déjà affichée, on la quitte d'abord : elle doit être
          // reconstruite pour que le scénario (réponses interceptées) s'applique réellement.
          if (new URL(page.url()).pathname === path.split('?')[0]) await aller(page, '/acces-refuse', false);
          await aller(page, path, (scenario.waitUntil ?? 'networkidle') === 'networkidle');
        } else {
          // Scénario de visiteur : la session qu'un scénario précédent aurait ouverte (cookie, indice de session) ne doit pas subsister.
          await page.context().clearCookies();
          if (page.url().startsWith(base)) await page.evaluate(() => localStorage.removeItem('ci_ist_session'));
          if (scenario.before) await scenario.before(page, { base, theme, width });
          await page.goto(base + path, { waitUntil: scenario.waitUntil ?? 'networkidle' });
          await priseEnMain(page);
        }
        await page.evaluate(() => document.fonts.ready);
        if (scenario.run) await scenario.run(page, { base, theme, width });
        await page.waitForTimeout(250);

        const dims = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
        if (dims.s > dims.c) result.overflow.push(`${scenario.id} ${themeName} ${width} px : ${dims.s} > ${dims.c}`);
        const expected = scenario.expectedConsole ?? [];
        const unexpected = messages.filter((m) => !expected.some((e) => m.includes(e)));
        if (unexpected.length) result.console.push(`${scenario.id} ${themeName} ${width} px : ${unexpected.join(' | ')}`);

        if (full) {
          const name = `${scenario.id}-${themeName}-${width}.png`;
          await page.screenshot({ path: join(out, name), fullPage: true });
          result.shots.push(name);
          const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
          for (const v of axe.violations) {
            result.axe.push(`${scenario.id} ${themeName} ${width} px : ${v.id} (${v.impact}) ${v.nodes.map((n) => n.target.join(' ')).join(' | ').slice(0, 200)}`);
          }
        }
        if (scenario.check) {
          const problem = await scenario.check(page, { base, theme, width });
          if (problem) result.console.push(`${scenario.id} ${themeName} ${width} px : contrôle en échec : ${problem}`);
        }
      }
      await ctx.close();
    }
  }

  const ok = result.overflow.length === 0 && result.console.length === 0 && result.axe.length === 0;
  if (!ok) failed = true;
  const list = (items) => (items.length ? items.map((i) => `- ${i}`).join('\n') : 'Aucun.');
  const journal = `# Journal de recette : ${spec.titre}

Identifiant : ${id}. Route : \`${spec.path}\`. Date : ${new Date().toISOString().slice(0, 10)}.
Référence : ${spec.maquette ? `écran \`${spec.maquette}\` de la maquette (\`maquette-sombre.png\`, \`maquette-clair.png\`)` : 'page dérivée, sans écran dans la maquette'}.

## Résultats automatisés

| Contrôle | Résultat |
|---|---|
| Scénarios | ${spec.scenarios.map((s) => s.titre).join(' ; ')} |
| Thèmes | clair et sombre |
| Largeurs | ${WIDTHS.join(', ')} px |
| Débordement horizontal | ${result.overflow.length} |
| Messages de console inattendus | ${result.console.length} |
| Violations axe (WCAG 2.2 AA) | ${result.axe.length} |

### Débordements
${list(result.overflow)}

### Console et contrôles
${list(result.console)}

### Accessibilité
${list(result.axe)}

## Captures

${spec.scenarios.map((s) => `- ${s.titre} : \`${s.id}-sombre-1440.png\`, \`${s.id}-clair-1440.png\`, \`${s.id}-sombre-390.png\`, \`${s.id}-clair-390.png\``).join('\n')}

## Écarts avec la maquette

| Élément | Maquette | Produit | Classement |
|---|---|---|---|
${(spec.ecarts ?? []).map((e) => `| ${e.join(' | ')} |`).join('\n')}

## États

${(spec.etats ?? []).map((e) => `- ${e}`).join('\n')}
`;
  writeFileSync(join(out, 'journal.md'), journal);
  console.log(`${id} : ${ok ? 'conforme' : 'À CORRIGER'} — débordements ${result.overflow.length}, console ${result.console.length}, axe ${result.axe.length}`);
  for (const line of [...result.overflow, ...result.console, ...result.axe].slice(0, 12)) console.log('   ' + line);
}
await browser.close();
process.exit(failed ? 1 : 0);
