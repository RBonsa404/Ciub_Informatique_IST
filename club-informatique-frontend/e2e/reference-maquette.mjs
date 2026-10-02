// Capture l'en-tête et le pied de page de la maquette (écrans 58 et 59) pour la comparaison côte à côte.
// Usage : node e2e/reference-maquette.mjs <chemin du dossier de la maquette>
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const maquette = process.argv[2];
if (!maquette) throw new Error('chemin de la maquette requis');
const out = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'recette', 'socle', 'maquette');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
for (const theme of ['dark', 'light']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme });
  await ctx.addInitScript((t) => localStorage.setItem('ci_ist_theme', t), theme);
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(join(maquette, 'pages', 'composants', '58-header.html')).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const suffix = theme === 'dark' ? 'sombre' : 'clair';
  await page.locator('.site-header').screenshot({ path: join(out, `entete-${suffix}.png`) });
  await page.locator('.site-footer').screenshot({ path: join(out, `pied-de-page-${suffix}.png`) });
  await ctx.close();
}
await browser.close();
console.log('références de la maquette capturées dans', out);
