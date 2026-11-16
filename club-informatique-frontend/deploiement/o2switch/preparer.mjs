// Prépare le site construit pour un hébergement Apache (o2switch) : .htaccess, robots.txt, sitemap.xml.
// Reprend les règles de deploiement/nginx.conf.template et la politique de sécurité calculée par optimiser-pages.mjs.
// Usage : npm run build:o2switch
//   dist/club-informatique-frontend/browser            → dossier du sous-domaine informatique.ist-club.bf
//   dist/club-informatique-frontend/redirection-domaine → dossier du domaine ist-club.bf (redirection vers le site)
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOTE = 'informatique.ist-club.bf';
const SITE = `https://${HOTE}`;
const API = 'https://api.ist-club.bf';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', '..', 'dist', 'club-informatique-frontend');
const site = join(dist, 'browser');

for (const requis of ['index.html', 'index.csr.html']) {
  if (!existsSync(join(site, requis))) throw new Error(`${requis} absent : lancer la construction avant ce script`);
}
const accueil = readFileSync(join(site, 'index.html'), 'utf8');
if (!accueil.includes(`${SITE}/`)) throw new Error('l’accueil ne porte pas l’adresse du site : construire avec la configuration o2switch');

// Origine provisoire restée dans les pages (aperçu de lien de la page d'entrée) : remplacée par l'adresse du site,
// comme le faisait Nginx à la volée.
const pages = [];
const parcourir = (dossier) => {
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) parcourir(chemin);
    else if (nom.endsWith('.html')) pages.push(chemin);
  }
};
parcourir(site);
for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  if (html.includes('https://origine-du-site.invalid')) writeFileSync(page, html.replaceAll('https://origine-du-site.invalid', SITE));
}

// Politique de sécurité : celle calculée à la construction, l'API étant désormais sur son sous-domaine.
const enTetes = readFileSync(join(dist, 'en-tetes.conf'), 'utf8');
const csp = enTetes.match(/Content-Security-Policy "([^"]+)"/)?.[1];
if (!csp) throw new Error('politique de sécurité introuvable dans en-tetes.conf');
const cspSite = csp.replace("connect-src 'self'", `connect-src 'self' ${API}`);

const htaccess = `# Site du Club Informatique de l'IST sur o2switch (Apache). Fichier produit par deploiement/o2switch/preparer.mjs.
Options -Indexes
DirectoryIndex index.html
DirectorySlash Off
AddDefaultCharset utf-8
AddType application/manifest+json .webmanifest
AddType text/calendar .ics
AddType application/vnd.android.package-archive .apk

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Validation des certificats (AutoSSL) : jamais redirigée.
  RewriteRule ^\\.well-known/ - [L]

  # Adresse unique : HTTPS, nom exact du site.
  RewriteCond %{HTTPS} !=on [OR]
  RewriteCond %{HTTP_HOST} !^${HOTE.replace(/\./g, '\\.')}$ [NC]
  RewriteRule ^ ${SITE}%{REQUEST_URI} [R=301,L]

  # API : servie par le backend sur son sous-domaine (photos et fichiers déposés gardent leur adresse /api/v1/...).
  RewriteRule ^api/(.*)$ ${API}/api/$1 [R=307,L]

  # Accueil : page pré-rendue.
  RewriteRule ^$ index.html [L]

  # Fichier existant : servi tel quel.
  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [L]

  # Page publique pré-rendue : dossier/index.html.
  RewriteCond %{DOCUMENT_ROOT}/$1/index.html -f
  RewriteRule ^(.+?)/?$ $1/index.html [L]

  # Toute autre adresse : page d'entrée de l'application, routée dans le navigateur.
  RewriteCond %{REQUEST_URI} !^/index\\.html$
  RewriteRule ^ index.csr.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "DENY"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
  Header always set Content-Security-Policy "${cspSite}"

  # Pages et script du thème : toujours revalidés.
  <FilesMatch "\\.html$|^theme-init\\.js$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
  # Fichiers à empreinte : un an.
  <FilesMatch "-[A-Za-z0-9_-]{8}\\.(js|css)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  # Polices, images, icônes : un mois.
  <FilesMatch "\\.(woff2|png|jpe?g|webp|svg|ico|webmanifest)$">
    Header set Cache-Control "public, max-age=2592000"
  </FilesMatch>
  # Application Android : téléchargement forcé, un jour.
  <FilesMatch "\\.apk$">
    Header set Content-Disposition "attachment"
    Header set Cache-Control "public, max-age=86400"
  </FilesMatch>
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript text/javascript application/json application/manifest+json image/svg+xml text/calendar application/xml
</IfModule>
`;

const pagesPubliques = ['/', '/presentation', '/bureau', '/actualites', '/evenements', '/formations', '/projets', '/ressources', '/application', '/contact', '/mentions-legales', '/confidentialite', '/conditions-utilisation'];
const robots = `User-agent: *\nAllow: /\nDisallow: /espace/\nDisallow: /api/\nDisallow: /connexion\nDisallow: /inscription\nSitemap: ${SITE}/sitemap.xml\n`;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pagesPubliques.map((p) => `<url><loc>${SITE}${p}</loc></url>`).join('\n')}\n</urlset>\n`;

// Domaine principal ist-club.bf : toute adresse renvoie vers la même page du site.
// Les adresses techniques de l'hébergeur (certificats, webmail, cPanel) restent servies telles quelles.
const redirection = `# Domaine ist-club.bf : redirection permanente vers ${SITE}. Fichier produit par deploiement/o2switch/preparer.mjs.
Options -Indexes
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^\\.well-known/ - [L]
  RewriteRule ^(webmail|cpanel|webdisk)(/|$) - [L]
  RewriteRule ^ ${SITE}%{REQUEST_URI} [R=301,L]
</IfModule>
<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=31536000"
</IfModule>
`;
const dossierRedirection = join(dist, 'redirection-domaine');
mkdirSync(dossierRedirection, { recursive: true });

writeFileSync(join(site, '.htaccess'), htaccess);
writeFileSync(join(site, 'robots.txt'), robots);
writeFileSync(join(site, 'sitemap.xml'), sitemap);
writeFileSync(join(dossierRedirection, '.htaccess'), redirection);
console.log(`preparer o2switch : site prêt dans ${site}, redirection du domaine dans ${dossierRedirection}`);
