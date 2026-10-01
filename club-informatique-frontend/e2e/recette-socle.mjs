// Recette du socle : captures, débordement horizontal, console, accessibilité (axe)
// et comparaison des styles calculés avec ceux relevés sur la maquette.
// Usage : node e2e/recette-socle.mjs [urlDeBase]   (serveur de développement démarré)
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const base = process.argv[2] ?? 'http://localhost:4200';
const out = join(here, '..', '..', 'docs', 'recette', 'socle');
const reference = JSON.parse(readFileSync(join(here, '..', '..', 'docs', 'maquette-ref', 'styles-calcules.json'), 'utf8'));

const ROUTES = [
  { id: 'design', path: '/__design' },
  { id: 'gabarit-public', path: '/__design/public' },
  { id: 'gabarit-public-connecte', path: '/__design/public-connecte' },
  { id: 'gabarit-authentification', path: '/__design/authentification' },
  { id: 'gabarit-espace', path: '/__design/espace' },
  { id: 'gabarit-erreur', path: '/__design/erreur' },
];
const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920];
const SHOT_WIDTHS = [390, 1440];

// Propriétés comparées à la maquette (tolérance d'un pixel sur les longueurs).
const PROPS = [
  'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'color', 'backgroundColor',
  'backgroundImage', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderTopColor',
  'borderBottomColor', 'borderTopLeftRadius', 'boxShadow', 'backdropFilter', 'gap',
];
// Sélecteurs dont l'écart avec le rendu de la maquette est voulu et consigné (docs/ecarts-maquette.md).
const INST = 'instance mesurée dimensionnée en ligne dans la maquette (la règle de classe est identique)';
const EXPECTED = {
  '.modal-card': 'E-07 : styles absents du rendu de la maquette au-delà de 768 px',
  '.toast': 'E-07',
  '.tab-btn': 'E-07',
  '.tab-btn.active': 'E-07',
  '.brand-title-sub': 'E-19 : ambre remplacé par le jeton d’accent ambre du thème (contraste en thème clair)',
  '.mobile-menu-toggle': 'cible tactile portée de 42 à 44 px',
  '.sidebar-link': 'numéro d’écran de démonstration retiré : disposition simplifiée',
  '.sidebar-link.active': 'idem',
  h1: 'la maquette mesure le titre de l’accueil, dimensionné en ligne',
  h2: 'idem', h3: 'idem', h4: 'idem', p: 'idem',
  '.btn': 'premier bouton de la page différent', '.btn-primary': 'idem', '.btn-secondary': 'idem', '.btn-sm': 'idem',
  '.container': 'largeur dépendante du contenu', '.glass-card': 'la maquette mesure une carte dimensionnée en ligne',
  '.nav-link': 'couleur de l’entrée active selon la page mesurée',
  '.badge-danger': 'E-22 : couleur du texte ajustée pour le contraste',
  '.badge-neutral': 'E-22 : idem en thème clair',
  '.brand-logo-img': 'E-22 : couleur de lien héritée, sans effet sur une image',
  '.brand-title-main': 'E-04 : interligne resserré, sous-titre sur deux lignes',
  '.btn-outline': INST,
  '.btn-lg': INST,
  '.btn-amber': INST,
  '.badge': INST,
  '.badge-primary': INST,
  '.badge-amber': INST,
  '.badge-success': INST,
  '.glass-panel': INST,
  '.form-label': INST,
  '.dashboard-topbar': INST,
  '.skeleton': INST,
  '.form-select': INST,
  '.form-input': INST,
  '.form-textarea': INST,
  '.user-avatar': INST,
  '.btn-icon': 'E-23 : interligne unifié entre boutons et liens d’action',
  '.btn-danger': 'E-21 et E-23 : fond assombri pour le contraste, interligne unifié',
};

// Les écarts « attendus » restent listés dans le rapport pour relecture.
const px = (v) => (typeof v === 'string' && /^-?[\d.]+px$/.test(v) ? parseFloat(v) : null);
const same = (a, b) => {
  if (a === b) return true;
  const pa = px(a), pb = px(b);
  if (pa !== null && pb !== null) return Math.abs(pa - pb) <= 1;
  return String(a).replace(/\s+/g, '') === String(b).replace(/\s+/g, '');
};

const browser = await chromium.launch();
const report = { date: new Date().toISOString(), base, overflow: [], console: [], axe: [], styles: {} };
const collected = { dark: {}, light: {} };

for (const theme of ['dark', 'light']) {
  const dir = join(out, theme === 'dark' ? 'sombre' : 'clair');
  mkdirSync(dir, { recursive: true });
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' });
    await ctx.addInitScript((t) => localStorage.setItem('ci_ist_theme', t), theme);
    const page = await ctx.newPage();
    const messages = [];
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) messages.push(`${m.type()}: ${m.text().slice(0, 200)}`); });
    page.on('pageerror', (e) => messages.push(`exception: ${String(e).slice(0, 200)}`));
    for (const route of ROUTES) {
      messages.length = 0;
      await page.goto(base + route.path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const dims = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
      if (dims.s > dims.c) report.overflow.push(`${route.id} ${theme} ${width}px : ${dims.s} > ${dims.c}`);
      if (messages.length) report.console.push({ route: route.id, theme, width, messages: [...messages] });

      if (SHOT_WIDTHS.includes(width)) {
        await page.screenshot({ path: join(dir, `${route.id}-${width}.png`), fullPage: true });
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
        for (const v of axe.violations) {
          report.axe.push({ route: route.id, theme, width, id: v.id, impact: v.impact, nodes: v.nodes.length, exemple: v.nodes.map((n) => n.target.join(' ')).join(' | '), aide: v.help });
        }
      }
      if (width === 1440) {
        if (route.id === 'gabarit-public') {
          await page.locator('.site-header').screenshot({ path: join(dir, 'entete-public-1440.png') });
          await page.locator('.site-footer').screenshot({ path: join(dir, 'pied-de-page-1440.png') });
        }
        const styles = await page.evaluate(([sels, props]) => {
          const o = {};
          for (const s of sels) {
            const el = document.querySelector(s);
            if (!el) continue;
            const cs = getComputedStyle(el);
            o[s] = Object.fromEntries(props.map((p) => [p, cs[p]]));
          }
          return o;
        }, [Object.keys(reference[theme]), PROPS]);
        for (const [sel, v] of Object.entries(styles)) collected[theme][sel] ??= v;
      }
    }
    // États interactifs : modale et notification à la largeur de bureau, tiroir mobile.
    if (width === 1440) {
      await page.goto(base + '/__design', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Ouvrir la modale' }).click();
      await page.waitForSelector('.modal-card');
      await page.waitForTimeout(400);
      await page.screenshot({ path: join(dir, 'modale-1440.png') });
      const modal = await page.evaluate((props) => {
        const cs = getComputedStyle(document.querySelector('.modal-card'));
        return Object.fromEntries(props.map((p) => [p, cs[p]]));
      }, PROPS);
      collected[theme]['.modal-card'] = modal;
      await page.keyboard.press('Escape');
      await page.waitForSelector('.modal-card', { state: 'detached' });
      const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
      report[`focusRestitue-${theme}`] = focused;
    }
    if (width === 390) {
      await page.goto(base + '/__design/public', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
      await page.waitForSelector('.drawer-panel');
      await page.screenshot({ path: join(dir, 'tiroir-390.png') });
      await page.keyboard.press('Escape');
      await page.waitForSelector('.drawer-panel', { state: 'detached' });
    }
    await ctx.close();
  }
  // Comparaison avec la maquette
  const diffs = [];
  let compared = 0, identical = 0;
  for (const [sel, ref] of Object.entries(reference[theme])) {
    const got = collected[theme][sel];
    if (!got) { diffs.push({ selecteur: sel, statut: 'non présent dans le socle' }); continue; }
    const d = PROPS.filter((p) => !same(ref[p], got[p])).map((p) => ({ propriete: p, maquette: ref[p], socle: got[p] }));
    compared++;
    if (d.length === 0) identical++;
    else diffs.push({ selecteur: sel, statut: EXPECTED[sel] ? `écart attendu : ${EXPECTED[sel]}` : 'ÉCART À EXAMINER', ecarts: d });
  }
  report.styles[theme] = { compares: compared, identiques: identical, ecarts: diffs };
}
await browser.close();

mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'rapport.json'), JSON.stringify(report, null, 1));

const serious = report.axe.filter((v) => ['critical', 'serious'].includes(v.impact));
console.log('débordements horizontaux :', report.overflow.length, report.overflow.slice(0, 6).join(' | '));
console.log('messages de console :', report.console.length, JSON.stringify(report.console.slice(0, 3)));
console.log('axe : violations', report.axe.length, '; critiques ou sérieuses :', serious.length);
for (const v of serious.slice(0, 12)) console.log('  ', v.route, v.theme, v.width, v.id, v.nodes, v.exemple);
for (const theme of ['dark', 'light']) {
  const s = report.styles[theme];
  console.log(`styles ${theme} : ${s.identiques}/${s.compares} identiques`);
  for (const d of s.ecarts.filter((e) => e.statut === 'ÉCART À EXAMINER')) {
    console.log('  À EXAMINER', d.selecteur, d.ecarts.map((e) => `${e.propriete}: ${e.maquette} -> ${e.socle}`).join(' ; ').slice(0, 400));
  }
}
console.log('focus restitué après fermeture de la modale :', report['focusRestitue-dark'], '/', report['focusRestitue-light']);
