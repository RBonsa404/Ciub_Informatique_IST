// Génère le favicon, les icônes d'application, le manifeste et l'image de partage
// par simple redimensionnement du logo officiel (branding/logo.png). Aucun redessin.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pngToIco from 'png-to-ico';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'branding', 'logo.png');
const icons = join(root, 'public', 'icons');
const img = join(root, 'public', 'img');
mkdirSync(icons, { recursive: true });
mkdirSync(img, { recursive: true });

const BLEU_NUIT = '#0B1E3F';
const resize = (size) => sharp(source).resize(size, size, { fit: 'contain', background: '#FFFFFF' }).png({ compressionLevel: 9 });

const meta = await sharp(source).metadata();
if (meta.width !== meta.height) console.warn(`logo non carré (${meta.width}x${meta.height}) : centré sans déformation`);

// Favicon multi-tailles et icônes
const icoBuffers = await Promise.all([16, 32, 48].map((s) => resize(s).toBuffer()));
writeFileSync(join(root, 'public', 'favicon.ico'), await pngToIco(icoBuffers));
await resize(32).toFile(join(icons, 'favicon-32.png'));
await resize(180).toFile(join(icons, 'apple-touch-icon.png'));
await resize(192).toFile(join(icons, 'icon-192.png'));
await resize(512).toFile(join(icons, 'icon-512.png'));

// Logo d'interface (44 px affichés, densités 1x et 2x)
await resize(88).toFile(join(img, 'logo-88.png'));
await resize(176).toFile(join(img, 'logo-176.png'));

// Image de partage 1200 x 630 : logo redimensionné, centré sur fond Bleu Nuit Circuit
const logoShare = await sharp(source).resize(420, 420).png().toBuffer();
const mask = Buffer.from('<svg width="420" height="420"><rect width="420" height="420" rx="48" ry="48"/></svg>');
const rounded = await sharp(logoShare).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: BLEU_NUIT } })
  .composite([{ input: rounded, gravity: 'centre' }])
  .png({ compressionLevel: 9 })
  .toFile(join(img, 'partage.png'));

const manifest = {
  name: 'Club Informatique de l’IST',
  short_name: 'Club Info IST',
  lang: 'fr',
  start_url: '/',
  display: 'standalone',
  background_color: '#070D1E',
  theme_color: '#0B1E3F',
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
};
writeFileSync(join(root, 'public', 'manifest.webmanifest'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`icônes générées à partir de ${meta.width}x${meta.height}`);
