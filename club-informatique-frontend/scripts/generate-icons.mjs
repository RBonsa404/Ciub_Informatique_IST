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

// Logo d'interface au format WebP (léger) : 88 et 176 px pour l'en-tête (44 px affichés), 220 px pour les grands visuels.
const webp = (size) => sharp(source).resize(size, size, { fit: 'contain', background: '#FFFFFF' }).webp({ quality: 86 });
await webp(88).toFile(join(img, 'logo-88.webp'));
await webp(176).toFile(join(img, 'logo-176.webp'));
await webp(220).toFile(join(img, 'logo-220.webp'));

// Image de partage 1200 x 630 (aperçus de lien) : logo à gauche, nom du club et activités à droite, sur fond Bleu Nuit Circuit
const LOGO_PARTAGE = 380;
const logoShare = await sharp(source).resize(LOGO_PARTAGE, LOGO_PARTAGE).png().toBuffer();
const mask = Buffer.from(`<svg width="${LOGO_PARTAGE}" height="${LOGO_PARTAGE}"><rect width="${LOGO_PARTAGE}" height="${LOGO_PARTAGE}" rx="44" ry="44"/></svg>`);
const rounded = await sharp(logoShare).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
const POLICE = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const texte = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="1200" height="8" fill="#FBBF24"/>
  <g fill="none" stroke="#38BDF8" stroke-opacity="0.18" stroke-width="2">
    <path d="M1200 90 H1060 L1010 140 H930"/><circle cx="924" cy="140" r="6"/>
    <path d="M1200 560 H1090 L1040 510 H980"/><circle cx="974" cy="510" r="6"/>
  </g>
  <text x="530" y="250" font-family="${POLICE}" font-size="66" font-weight="700" fill="#FFFFFF">Club Informatique</text>
  <text x="530" y="330" font-family="${POLICE}" font-size="66" font-weight="700" fill="#FFFFFF">de l’<tspan fill="#FBBF24">IST</tspan></text>
  <rect x="532" y="362" width="96" height="5" rx="2.5" fill="#38BDF8"/>
  <text x="530" y="420" font-family="${POLICE}" font-size="30" fill="#CBD5E1">Formations, ateliers, projets et événements</text>
  <text x="530" y="470" font-family="${POLICE}" font-size="24" fill="#94A3B8">Institut Supérieur de Technologie · Ouagadougou</text>
</svg>`);
await sharp({ create: { width: 1200, height: 630, channels: 4, background: BLEU_NUIT } })
  .composite([
    { input: rounded, left: 90, top: Math.round((630 - LOGO_PARTAGE) / 2) },
    { input: texte, left: 0, top: 0 },
  ])
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
