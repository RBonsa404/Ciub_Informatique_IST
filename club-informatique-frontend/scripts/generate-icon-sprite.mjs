// Génère public/icons/sprite.svg à partir de la liste scripts/icons.json.
// Famille unique : Feather (grille 24, trait 2), identique aux pictogrammes de la maquette.
// Marques : Simple Icons. Pictogrammes absents de Feather : tracés repris de la maquette.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const list = JSON.parse(readFileSync(join(root, 'scripts', 'icons.json'), 'utf8'));

const inner = (svg) => svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s+/g, ' ').trim();

const symbols = [];
for (const name of list.feather) {
  const svg = readFileSync(join(root, 'node_modules', 'feather-icons', 'dist', 'icons', `${name}.svg`), 'utf8');
  symbols.push(`<symbol id="i-${name}" viewBox="0 0 24 24">${inner(svg)}</symbol>`);
}
for (const [name, body] of Object.entries(list.custom)) {
  symbols.push(`<symbol id="i-${name}" viewBox="0 0 24 24">${body}</symbol>`);
}
for (const name of list.brands) {
  const svg = readFileSync(join(root, 'node_modules', 'simple-icons', 'icons', `${name}.svg`), 'utf8');
  const body = inner(svg).replace(/<title>[\s\S]*?<\/title>/, '');
  symbols.push(`<symbol id="b-${name}" viewBox="0 0 24 24">${body}</symbol>`);
}

for (const [name, body] of Object.entries(list.brandsCustom ?? {})) {
  symbols.push(`<symbol id="b-${name}" viewBox="0 0 24 24">${body}</symbol>`);
}

const out = `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join('')}</svg>\n`;
mkdirSync(join(root, 'public', 'icons'), { recursive: true });
writeFileSync(join(root, 'public', 'icons', 'sprite.svg'), out);

const names = [...list.feather, ...Object.keys(list.custom)].sort();
const types = `// Fichier généré par scripts/generate-icon-sprite.mjs. Ne pas modifier à la main.
export const ICON_NAMES = ${JSON.stringify(names)} as const;
export type IconName = (typeof ICON_NAMES)[number];
export const BRAND_NAMES = ${JSON.stringify([...list.brands, ...Object.keys(list.brandsCustom ?? {})].sort())} as const;
export type BrandName = (typeof BRAND_NAMES)[number];
`;
writeFileSync(join(root, 'src', 'app', 'shared', 'ui', 'icon', 'icon-names.ts'), types);
console.log(`sprite : ${symbols.length} symboles, ${(out.length / 1024).toFixed(1)} kio`);
