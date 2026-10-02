// Preuve d'intégration par module, sur la pile réelle (backend, base de recette, frontend) : lecture, refus d'un
// visiteur, refus d'un rôle insuffisant, erreur de saisie au format RFC 9457, garde de la page dans le navigateur.
// Les écritures réussies sont prouvées par les scénarios de recette de chaque page (e2e/recette-page.mjs).
// Usage : node e2e/integration.mjs [--base http://localhost:4200]     Résultat : docs/recette/integration.md
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { API, aller, connecter, jeton, lire } from './pages/_outils.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : 'http://localhost:4200';

const jetons = {};
async function appeler(role, methode, chemin, corps) {
  if (role && !jetons[role]) jetons[role] = await jeton(role);
  const response = await fetch(API + chemin, {
    method: methode,
    headers: { ...(corps === undefined ? {} : { 'Content-Type': 'application/json' }), ...(role ? { Authorization: `Bearer ${jetons[role]}` } : {}) },
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });
  const texte = await response.text();
  let json = null;
  try {
    json = texte ? JSON.parse(texte) : null;
  } catch {
    // Réponse non JSON (fichier, calendrier) : seul le code de statut compte.
  }
  return { status: response.status, json, type: response.headers.get('content-type') ?? '' };
}

const formations = (await lire('/gestion/formations?size=50', 'formateur')).content;
const inscriptions = (await lire('/inscriptions/me?size=200', 'membre')).content.filter((i) => i.statut === 'CONFIRMEE' && i.sessionFormationId);
const suivie = formations.find((f) => (f.sessions ?? []).some((s) => inscriptions.some((i) => i.sessionFormationId === s.id)));
const evenement = (await lire('/gestion/evenements?size=1', 'responsable')).content[0];
const presentation = await (await fetch(`${API}/pages/presentation`)).json();
const propose = (await lire('/gestion/projets?statut=PROPOSE&size=1', 'responsable')).content[0];

/**
 * Par module : lecture [rôle, chemin], anonyme [méthode, chemin] (401 attendu), role [rôle, méthode, chemin, corps valide] (403 attendu :
 * la requête est bien formée, seul le rôle manque),
 * erreur [rôle, méthode, chemin, corps, statut attendu], page [rôle refusé, route] (redirection vers « accès refusé »).
 */
const MODULES = {
  'contenu-public': { lecture: [null, '/pages/presentation'], anonyme: ['PUT', '/pages/presentation'], role: ['membre', 'PUT', '/pages/presentation', { titre: presentation.titre, contenu: presentation.contenu }], erreur: ['admin', 'PUT', '/pages/presentation', {}, 400] },
  actualites: { lecture: [null, '/actualites'], anonyme: ['GET', '/gestion/actualites'], role: ['membre', 'GET', '/gestion/actualites'], erreur: ['responsable', 'POST', '/actualites', {}, 400], page: ['membre', '/espace/gestion/actualites'] },
  evenements: { lecture: [null, '/evenements'], anonyme: ['GET', '/gestion/evenements'], role: ['formateur', 'GET', '/gestion/evenements'], erreur: ['responsable', 'POST', '/evenements', {}, 400], page: ['formateur', '/espace/gestion/evenements'] },
  formations: { lecture: [null, '/formations'], anonyme: ['GET', '/gestion/formations'], role: ['membre', 'POST', '/formations', { titre: 'Essai de droits', description: 'Requête valide envoyée par un rôle insuffisant.', niveau: 'DEBUTANT', publie: false }], erreur: ['formateur', 'POST', '/formations', {}, 400], page: ['membre', '/espace/formateur/cours'] },
  projets: { lecture: ['membre', '/projets/mes-projets'], anonyme: ['GET', '/projets/mes-projets'], role: ['membre', 'GET', '/gestion/projets'], erreur: ['responsable', 'PUT', `/projets/${propose.id}/validation`, { statut: 'REJETE' }, 400], page: ['membre', '/espace/gestion/projets'] },
  ressources: { lecture: [null, '/ressources/publiques'], anonyme: ['POST', '/ressources'], role: ['membre', 'POST', '/ressources', { titre: 'Essai de droits', type: 'LIEN_EXTERNE', urlFichier: 'https://exemple.invalid/essai', estPublique: false }], erreur: ['formateur', 'POST', '/ressources', {}, 400] },
  contact: { lecture: ['responsable', '/gestion/messages'], anonyme: ['GET', '/gestion/messages'], role: ['membre', 'GET', '/gestion/messages'], erreur: [null, 'POST', '/contact', {}, 400], page: ['membre', '/espace/admin/messages'] },
  bureau: { lecture: [null, '/bureau'], anonyme: ['POST', '/bureau'], role: ['membre', 'POST', '/bureau', { nom: 'Essai', prenom: 'Droits', fonction: 'Essai de droits', ordre: 9 }], erreur: ['responsable', 'POST', '/bureau', {}, 400], page: ['membre', '/espace/gestion/bureau'] },
  authentification: { lecture: ['membre', '/users/me'], anonyme: ['POST', '/auth/refresh'], erreur: [null, 'POST', '/auth/register', {}, 400] },
  profil: { lecture: ['membre', '/users/me'], anonyme: ['GET', '/users/me'], erreur: ['membre', 'PUT', '/users/me', {}, 400] },
  inscriptions: { lecture: ['membre', '/inscriptions/me'], anonyme: ['GET', '/inscriptions/me'], role: ['membre', 'GET', `/inscriptions/evenements/${evenement.id}`], erreur: ['membre', 'POST', '/inscriptions/evenements/999999', undefined, 404], page: ['membre', '/espace/gestion/inscriptions'] },
  supports: { lecture: ['membre', `/ressources/formation/${suivie.id}`], anonyme: ['GET', `/ressources/formation/${suivie.id}`], role: ['dsi', 'GET', `/ressources/formation/${suivie.id}`], erreur: ['membre', 'GET', '/ressources/999999', undefined, 404] },
  notifications: { lecture: ['membre', '/notifications'], anonyme: ['GET', '/notifications'], role: ['membre', 'POST', '/notifications/globales', { titre: 'Essai de droits', message: 'Requête valide envoyée par un rôle insuffisant.' }], erreur: ['responsable', 'POST', '/notifications/globales', {}, 400], page: ['membre', '/espace/gestion/notifications'] },
  'publications-membres': { lecture: ['membre', '/publications'], anonyme: ['GET', '/publications'], erreur: ['membre', 'GET', '/publications/slug/element-inexistant', undefined, 404] },
  'gestion-club': { lecture: ['responsable', '/gestion/indicateurs'], anonyme: ['GET', '/gestion/indicateurs'], role: ['formateur', 'GET', '/gestion/indicateurs'], page: ['formateur', '/espace/gestion'] },
  administration: { lecture: ['admin', '/admin/users'], anonyme: ['GET', '/admin/users'], role: ['responsable', 'GET', '/admin/users'], erreur: ['admin', 'POST', '/admin/users/invitations', {}, 400], page: ['responsable', '/espace/admin/utilisateurs'] },
  statistiques: { lecture: ['admin', '/admin/statistiques'], anonyme: ['GET', '/admin/statistiques'], role: ['responsable', 'GET', '/admin/statistiques'], page: ['responsable', '/espace/admin/statistiques'] },
  systeme: { lecture: ['superadmin', '/admin/system/config'], anonyme: ['GET', '/admin/system/config'], role: ['admin', 'GET', '/admin/system/config'], erreur: ['superadmin', 'PUT', '/admin/system/config', { nomPlateforme: '' }, 400], page: ['admin', '/espace/systeme'] },
  conformite: { lecture: ['dsi', '/dsi/conformite'], anonyme: ['GET', '/dsi/conformite'], role: ['admin', 'GET', '/dsi/conformite'], page: ['admin', '/espace/dsi'] },
};

const browser = await chromium.launch();
const sessions = {};
async function pageDe(role) {
  if (!sessions[role]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'fr-FR' });
    const page = await ctx.newPage();
    await connecter(page, base, role);
    sessions[role] = page;
  }
  return sessions[role];
}

const lignes = [];
let echecs = 0;
const verdict = (ok, texte) => {
  if (!ok) echecs++;
  return `${ok ? 'conforme' : 'ÉCHEC'} : ${texte}`;
};
const probleme = (r) => typeof r.json?.status === 'number' && typeof r.json?.code === 'string' && r.type.includes('application/problem+json');

for (const [module, m] of Object.entries(MODULES)) {
  const cellules = [];

  const lecture = await appeler(m.lecture[0], 'GET', m.lecture[1]);
  cellules.push(verdict(lecture.status === 200, `GET ${m.lecture[1]} (${m.lecture[0] ?? 'visiteur'}) → ${lecture.status}`));

  const anonyme = await appeler(null, m.anonyme[0], m.anonyme[1], m.anonyme[0] === 'GET' ? undefined : {});
  cellules.push(verdict(anonyme.status === 401 && probleme(anonyme), `${m.anonyme[0]} ${m.anonyme[1]} → ${anonyme.status} ${anonyme.json?.code ?? ''}`));

  if (m.role) {
    const refus = await appeler(m.role[0], m.role[1], m.role[2], m.role[3]);
    cellules.push(verdict(refus.status === 403 && probleme(refus), `${m.role[1]} ${m.role[2]} (${m.role[0]}) → ${refus.status} ${refus.json?.code ?? ''}`));
  } else {
    cellules.push('sans objet (ouvert à tout compte connecté)');
  }

  if (m.erreur) {
    const erreur = await appeler(m.erreur[0], m.erreur[1], m.erreur[2], m.erreur[3]);
    const champs = m.erreur[4] === 400 && m.erreur[3] && Object.keys(m.erreur[3]).length === 0 ? Array.isArray(erreur.json?.errors) && erreur.json.errors.length > 0 : true;
    cellules.push(verdict(erreur.status === m.erreur[4] && probleme(erreur) && champs, `${m.erreur[1]} ${m.erreur[2]} (${m.erreur[0] ?? 'visiteur'}) → ${erreur.status} ${erreur.json?.code ?? ''}${Array.isArray(erreur.json?.errors) ? `, ${erreur.json.errors.length} champ(s) signalé(s)` : ''}`));
  } else {
    cellules.push('sans objet (lecture seule)');
  }

  if (m.page) {
    const page = await pageDe(m.page[0]);
    await aller(page, m.page[1], false);
    const chemin = new URL(page.url()).pathname;
    cellules.push(verdict(chemin === '/acces-refuse', `${m.page[1]} (${m.page[0]}) → ${chemin}`));
  } else {
    cellules.push('sans objet (aucune page réservée à un rôle)');
  }
  lignes.push(`| ${module} | ${cellules.join(' | ')} |`);
  console.log(module, cellules.some((c) => c.startsWith('ÉCHEC')) ? 'ÉCHEC' : 'conforme');
  for (const c of cellules.filter((x) => x.startsWith('ÉCHEC'))) console.log('   ' + c);
}

// Un visiteur qui ouvre une page de l'espace est renvoyé à la connexion, la destination étant conservée.
const ctx = await browser.newContext({ locale: 'fr-FR' });
const visiteur = await ctx.newPage();
await visiteur.goto(base + '/espace/profil', { waitUntil: 'networkidle' });
const retour = new URL(visiteur.url());
const garde = verdict(retour.pathname === '/connexion' && retour.searchParams.get('retour') === '/espace/profil', `visiteur sur /espace/profil → ${retour.pathname}${retour.search}`);
console.log('garde de session', garde);
await browser.close();

const sortie = join(here, '..', '..', 'docs', 'recette');
mkdirSync(sortie, { recursive: true });
writeFileSync(
  join(sortie, 'integration.md'),
  `# Intégration frontend et backend : preuve par module

Date : ${new Date().toISOString().slice(0, 10)}. Pile : backend réel, base PostgreSQL de recette, courriels capturés, frontend servi sur \`${base}\`.
Produit par \`node e2e/integration.mjs\`. Les écritures réussies, les états vide et de chargement sont prouvés page par page dans les journaux de \`docs/recette/<page>/journal.md\`.

| Module | Lecture | Refus d'un visiteur (401) | Refus d'un rôle insuffisant (403) | Erreur restituée (RFC 9457) | Garde de la page |
|---|---|---|---|---|---|
${lignes.join('\n')}

Garde de session : ${garde}.

Verdict : ${echecs === 0 ? 'conforme' : `${echecs} contrôle(s) en échec`}.
`,
);
process.exit(echecs === 0 ? 0 : 1);
