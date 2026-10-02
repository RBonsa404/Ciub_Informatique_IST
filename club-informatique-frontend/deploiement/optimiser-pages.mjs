// Après la construction : prépare chaque page HTML pour un premier affichage sans requête bloquante.
//   1. La feuille de style et le script du thème sont inscrits dans la page (deux requêtes de moins avant l'affichage).
//   2. Dans les pages pré-rendues, déjà lisibles, l'application n'est chargée qu'après le premier affichage.
// Les deux scripts en ligne sont constants : leur empreinte est écrite dans la politique de sécurité du contenu,
// qui n'admet aucun autre script en ligne.
// Usage : node deploiement/optimiser-pages.mjs     (après « ng build »)
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..', 'dist', 'club-informatique-frontend', 'browser');

const pages = [];
const parcourir = (dossier) => {
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) parcourir(chemin);
    else if (nom.endsWith('.html')) pages.push(chemin);
  }
};
parcourir(site);

const theme = readFileSync(join(site, 'theme-init.js'), 'utf8').trim();
// Chargement différé : les lots de l'application, listés dans la page, sont demandés juste après le premier affichage.
const chargeur =
  "requestAnimationFrame(function(){setTimeout(function(){var lots=JSON.parse(document.getElementById('lots-application').textContent);" +
  "for(var i=1;i<lots.length;i++){var lien=document.createElement('link');lien.rel='modulepreload';lien.href=lots[i];document.head.appendChild(lien)}" +
  "var script=document.createElement('script');script.type='module';script.src=lots[0];document.body.appendChild(script)})});";
const empreinte = (script) => `'sha256-${createHash('sha256').update(script).digest('base64')}'`;

let preRendues = 0;
for (const page of pages) {
  let html = readFileSync(page, 'utf8');
  const feuille = html.match(/<link rel="stylesheet" href="(styles-[^"]+\.css)"[^>]*>/);
  const principal = html.match(/<script src="(main-[^"]+\.js)" type="module"><\/script>/);
  if (!html.includes('<script src="theme-init.js"></script>') || !feuille || !principal) {
    throw new Error(`page inattendue (script du thème, feuille de style ou script principal absents) : ${page}`);
  }
  const styles = readFileSync(join(site, feuille[1]), 'utf8');
  html = html.replace('<script src="theme-init.js"></script>', () => `<script>${theme}</script>`).replace(feuille[0], () => `<style>${styles}</style>`);

  // Page pré-rendue : son contenu est déjà dans <app-root>.
  if (/<app-root[^>]*>\s*</.test(html) && !/<app-root[^>]*>\s*<\/app-root>/.test(html)) {
    const lots = [principal[1]];
    html = html.replace(/<link rel="modulepreload" href="([^"]+)">/g, (_, lot) => {
      lots.push(lot);
      return '';
    });
    html = html.replace(principal[0], () => `<script type="application/json" id="lots-application">${JSON.stringify(lots)}</script><script>${chargeur}</script>`);
    preRendues++;
  }
  writeFileSync(page, html);
}

const enTetes = readFileSync(join(here, 'en-tetes.conf'), 'utf8');
const directive = /script-src 'self'( 'sha256-[^']+')*;/;
if (!directive.test(enTetes)) throw new Error('directive script-src introuvable dans en-tetes.conf');
writeFileSync(join(site, '..', 'en-tetes.conf'), enTetes.replace(directive, `script-src 'self' ${empreinte(theme)} ${empreinte(chargeur)};`));
console.log(`optimiser-pages : ${pages.length} pages, dont ${preRendues} pré-rendues`);
