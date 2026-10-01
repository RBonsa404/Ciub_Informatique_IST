// Garde « aucune donnée inventée » : échoue si un gabarit ou un composant affiche un littéral numérique.
// Analyse le texte visible des gabarits Angular (fichiers .html et gabarits en ligne des fichiers .ts).
// Motifs refusés : tout nombre affiché, « 12+ », « 80 % », « 3k », « 2M ».
// Exceptions documentées : voir ALLOWED ci-dessous et le marqueur « stats-ok: <motif> » sur la ligne concernée.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src', 'app');

// Dossiers exclus : page interne de recette, absente de la production.
const EXCLUDED_DIRS = ['pages/design'];

// Littéraux numériques autorisés dans le texte visible (constantes non statistiques).
const ALLOWED = [
  /\b40[34]\b/, // codes d'erreur HTTP nommant une page (403, 404)
  /\b500\b/,
  /\+226(?:[\s\u00a0]?\d{2}){4}/, // numéros de téléphone du club
  /\bn°\s?001-2021\/AN\b/i, // référence de la loi sur les données personnelles
];

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(html|ts)$/.test(name) && !/\.spec\.ts$/.test(name)) files.push(path);
  }
})(src);

/** Extrait les gabarits : fichier .html entier, ou contenu des propriétés template d'un fichier .ts. */
function templatesOf(path, content) {
  if (path.endsWith('.html')) return [{ text: content, offset: 0 }];
  const result = [];
  const re = /template:\s*`((?:[^`\\]|\\.)*)`/g;
  let match;
  while ((match = re.exec(content))) result.push({ text: match[1], offset: match.index });
  return result;
}

/**
 * Ne conserve que le texte affiché : retire commentaires, interpolations, balises (attributs compris,
 * guillemets respectés) et blocs de contrôle (parenthèses équilibrées). Les sauts de ligne sont préservés.
 */
function visibleText(template) {
  const blank = (s) => s.replace(/[^\n]/g, ' ');
  let out = '';
  let i = 0;
  const n = template.length;
  while (i < n) {
    const rest = template.slice(i);
    if (rest.startsWith('<!--')) {
      const end = template.indexOf('-->', i);
      const stop = end === -1 ? n : end + 3;
      out += blank(template.slice(i, stop));
      i = stop;
    } else if (rest.startsWith('{{')) {
      const end = template.indexOf('}}', i);
      const stop = end === -1 ? n : end + 2;
      out += blank(template.slice(i, stop));
      i = stop;
    } else if (/^<[a-zA-Z\/]/.test(rest)) {
      let j = i + 1;
      let quote = null;
      while (j < n && (quote || template[j] !== '>')) {
        const c = template[j];
        if (quote) { if (c === quote) quote = null; }
        else if (c === '"' || c === "'") quote = c;
        j++;
      }
      out += blank(template.slice(i, j + 1));
      i = j + 1;
    } else if (/^@(if|else if|for|switch|case|defer|let|else|empty|default|placeholder|loading|error)\b/.test(rest)) {
      let j = i + rest.match(/^@(?:else if|[a-z]+)/)[0].length;
      while (j < n && template[j] === ' ') j++;
      if (template[j] === '(') {
        let depth = 0;
        do {
          if (template[j] === '(') depth++;
          else if (template[j] === ')') depth--;
          j++;
        } while (j < n && depth > 0);
      }
      out += blank(template.slice(i, j));
      i = j;
    } else {
      out += template[i];
      i++;
    }
  }
  return out.replace(/&[a-z]+;|&#\d+;/g, ' ');
}

if (process.argv.includes('--self-test')) {
  const fixture = readFileSync(join(root, 'scripts', 'check-no-hardcoded-stats.fixture.txt'), 'utf8');
  const found = visibleText(fixture.split('\n').slice(3).join('\n'))
    .split('\n')
    .filter((line) => /\d/.test(line))
    .map((line) => line.trim());
  const expected = ['Plus de 150 membres', '98 %', '12+'];
  const ok = JSON.stringify(found) === JSON.stringify(expected);
  console.log(ok ? 'auto-test de la garde : conforme (3 littéraux détectés, expressions et interpolations ignorées)' : `auto-test en échec : ${JSON.stringify(found)}`);
  process.exit(ok ? 0 : 1);
}

const violations = [];
for (const path of files) {
  const rel = relative(root, path).split('\\').join('/');
  if (EXCLUDED_DIRS.some((dir) => rel.includes(dir))) continue;
  const content = readFileSync(path, 'utf8');
  const sourceLines = content.split('\n');
  for (const { text, offset } of templatesOf(path, content)) {
    const startLine = content.slice(0, offset).split('\n').length;
    visibleText(text)
      .split('\n')
      .forEach((line, index) => {
        let candidate = line;
        for (const allowed of ALLOWED) candidate = candidate.replace(new RegExp(allowed.source, allowed.flags + 'g'), ' ');
        if (!/\d/.test(candidate)) return;
        const lineNumber = startLine + index;
        if (/stats-ok:/.test(sourceLines[lineNumber - 1] ?? '') || /stats-ok:/.test(sourceLines[lineNumber - 2] ?? '')) return;
        violations.push(`${rel}:${lineNumber}  ${line.trim().slice(0, 100)}`);
      });
  }
}

if (violations.length > 0) {
  console.error(`Littéraux numériques affichés (${violations.length}) : toute valeur doit provenir de l'API.`);
  for (const v of violations) console.error('  ' + v);
  process.exit(1);
}
console.log(`check-no-hardcoded-stats : ${files.length} fichiers analysés, aucun littéral numérique affiché.`);
