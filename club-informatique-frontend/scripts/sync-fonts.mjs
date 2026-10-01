// Copie les polices woff2 nécessaires (latin et latin étendu) vers public/fonts
// et génère src/styles/fonts.css. Aucune requête vers un CDN de polices.
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Graisses réellement utilisées par la maquette (relevé des polices chargées).
const families = [
  { pkg: 'inter', name: 'Inter', weights: [400, 500, 600, 700] },
  { pkg: 'poppins', name: 'Poppins', weights: [500, 600, 700, 800] },
  { pkg: 'jetbrains-mono', name: 'JetBrains Mono', weights: [400] },
];
const ranges = {
  latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
};

mkdirSync(join(root, 'public', 'fonts'), { recursive: true });
let css = '/* Fichier généré par scripts/sync-fonts.mjs. Ne pas modifier à la main. */\n';
let count = 0;
for (const f of families) {
  for (const w of f.weights) {
    for (const subset of ['latin-ext', 'latin']) {
      const file = `${f.pkg}-${subset}-${w}-normal.woff2`;
      copyFileSync(join(root, 'node_modules', '@fontsource', f.pkg, 'files', file), join(root, 'public', 'fonts', file));
      css += `@font-face{font-family:'${f.name}';font-style:normal;font-weight:${w};font-display:swap;src:url('/fonts/${file}') format('woff2');unicode-range:${ranges[subset]}}\n`;
      count++;
    }
  }
}
mkdirSync(join(root, 'src', 'styles'), { recursive: true });
writeFileSync(join(root, 'src', 'styles', 'fonts.css'), css);
console.log(`polices : ${count} fichiers copiés`);
