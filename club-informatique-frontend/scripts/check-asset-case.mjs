// Garde de casse des fichiers : noms d'assets en minuscules sans espace ni accent,
// références exactes dans le code, aucune collision de casse dans l'index Git.
// À exécuter en CI sur une machine Linux (système de fichiers sensible à la casse).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const errors = [];

const walk = (dir, filter, acc = []) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, filter, acc);
    else if (filter(name)) acc.push(path);
  }
  return acc;
};
const posix = (p) => p.split('\\').join('/');

// 1. Noms des assets
const assets = walk(publicDir, () => true).map((p) => posix(relative(publicDir, p)));
for (const asset of assets) {
  if (!/^[a-z0-9._\/-]+$/.test(asset)) errors.push(`nom d'asset non conforme (minuscules, chiffres, tiret, point) : public/${asset}`);
}

// 2. Références depuis le code : le fichier doit exister avec la casse exacte
const assetSet = new Set(assets);
const sources = [...walk(join(root, 'src'), (n) => /\.(ts|html|css)$/.test(n)), join(root, 'src', 'index.html')];
const refPattern = /["'(=\s]\/?((?:img|icons|fonts)\/[A-Za-z0-9._\/-]+\.[A-Za-z0-9]+|favicon\.ico|manifest\.webmanifest|theme-init\.js)/g;
for (const file of new Set(sources)) {
  const content = readFileSync(file, 'utf8');
  for (const match of content.matchAll(refPattern)) {
    const ref = match[1];
    if (!assetSet.has(ref)) {
      const sameIgnoringCase = assets.find((a) => a.toLowerCase() === ref.toLowerCase());
      errors.push(
        `${posix(relative(root, file))} référence « ${ref} » ` + (sameIgnoringCase ? `mais le fichier s'appelle « ${sameIgnoringCase} » (casse différente)` : 'qui n\u2019existe pas dans public/'),
      );
    }
  }
}

// 3. Collisions de casse dans l'index Git
if (existsSync(join(root, '..', '.git'))) {
  const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);
  const seen = new Map();
  for (const path of tracked) {
    const key = path.toLowerCase();
    if (seen.has(key) && seen.get(key) !== path) errors.push(`collision de casse dans l'index Git : ${seen.get(key)} et ${path}`);
    seen.set(key, path);
  }
}

if (errors.length > 0) {
  console.error(`check-asset-case : ${errors.length} problème(s)`);
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}
console.log(`check-asset-case : ${assets.length} assets et ${sources.length} fichiers sources vérifiés, aucun problème.`);
