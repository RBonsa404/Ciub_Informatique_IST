// Parcours utilisateur complets (section 12 du cahier d'exécution), sur la pile réelle : base PostgreSQL vierge, backend
// construit, courriels capturés, frontend de production construit et servi par Nginx.
// Usage : node e2e/parcours.mjs [--sans-construction]
// Résultat : docs/recette/parcours.md, et par parcours docs/recette/parcours/<nom>/ (captures, trace Playwright).
// Lire une trace : npx playwright show-trace docs/recette/parcours/<nom>/trace.zip
import { chromium } from '@playwright/test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parcoursAdministrateur, parcoursDsi, parcoursSuperAdmin } from './parcours/administration.mjs';
import { parcoursAppareil } from './parcours/appareils.mjs';
import { parcoursBaseVide } from './parcours/base-vide.mjs';
import { parcoursFormateur } from './parcours/formateur.mjs';
import { parcoursMembre } from './parcours/membre.mjs';
import { parcoursNegatifs } from './parcours/negatifs.mjs';
import { parcours } from './parcours/outils.mjs';
import { BASE, arreterBackend, arreterFrontend, attendreFrontend, baseVierge, demarrerBackend, demarrerFrontend, viderCourriels } from './parcours/pile.mjs';
import { parcoursResponsable } from './parcours/responsable.mjs';
import { parcoursVisiteur } from './parcours/visiteur.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const sortie = join(here, '..', '..', 'docs', 'recette', 'parcours');
const reconstruire = !process.argv.includes('--sans-construction');

rmSync(sortie, { recursive: true, force: true });
mkdirSync(sortie, { recursive: true });

console.log('Préparation de la pile : base vierge, backend, frontend de production…');
baseVierge();
await viderCourriels();
const demarrage = await demarrerBackend({ comptesDeTest: true });
demarrerFrontend({ reconstruire });
await attendreFrontend();

const browser = await chromium.launch();
const etat = {};
const resultats = [];
let releveBaseVide = [];
const lancer = async (definition, corps) => {
  const resultat = await parcours(browser, sortie, definition, corps);
  resultats.push(resultat);
  return resultat;
};

try {
  await lancer({ id: 'base-vide', titre: '12.10 Base vide : tous les écrans sans aucun contenu' }, async (c) => {
    releveBaseVide = await parcoursBaseVide(c);
  });
  await lancer({ id: 'visiteur', titre: '12.2 Visiteur' }, (c) => parcoursVisiteur(c, etat));
  await lancer({ id: 'formateur', titre: '12.4 Formateur' }, (c) => parcoursFormateur(c, etat));
  await lancer({ id: 'responsable', titre: '12.5 Responsable du Club' }, (c) => parcoursResponsable(c, etat));
  await lancer({ id: 'membre', titre: '12.3 Membre' }, (c) => parcoursMembre(c, etat));
  await lancer({ id: 'administrateur', titre: '12.6 Administrateur' }, (c) => parcoursAdministrateur(c, etat));
  await lancer({ id: 'dsi', titre: '12.8 DSI' }, (c) => parcoursDsi(c, etat));
  await lancer({ id: 'appareil-360', titre: '12.11 Appareils : parcours principaux à 360 pixels', largeur: 360, hauteur: 740 }, (c) => parcoursAppareil(c, etat));
  await lancer({ id: 'appareil-768', titre: '12.11 Appareils : parcours principaux à 768 pixels', largeur: 768, hauteur: 1024 }, (c) => parcoursAppareil(c, etat));
  await lancer({ id: 'cas-negatifs', titre: '12.9 Cas négatifs' }, (c) => parcoursNegatifs(c, etat));
  // Le Super Admin part d'un backend relancé avec ses réglages ordinaires, quoi qu'aient laissé les cas négatifs.
  await demarrerBackend({ comptesDeTest: true });
  await lancer({ id: 'super-admin', titre: '12.7 Super Admin : amorçage, réglages, retrait des comptes de test' }, (c) => parcoursSuperAdmin(c, etat));
} finally {
  await browser.close();
  await arreterBackend();
  arreterFrontend();
}

const conforme = resultats.every((r) => r.ok);
const lignes = [
  '# Parcours utilisateur complets (section 12)',
  '',
  `Date : ${new Date().toISOString().slice(0, 10)}. Produit par \`node e2e/parcours.mjs\`.`,
  '',
  'Pile réelle : base PostgreSQL vierge au départ (migrations appliquées au démarrage), backend construit (fichier JAR),',
  `courriels capturés par le serveur de test, frontend de production construit et servi par Nginx sur \`${BASE}\` (image du déploiement).`,
  `Démarrage du backend sur base vierge, migrations comprises : ${(demarrage.demarrage / 1000).toFixed(1)} s.`,
  '',
  'Chaque parcours est joué dans un navigateur neuf. Les comptes des rôles Formateur, Responsable, Administrateur et DSI sont les comptes de test',
  '(marqués « test », domaine `.invalid`) ; le Visiteur devient un membre réel par l’inscription ; le Super Admin est celui de l’amorçage.',
  'Par parcours : captures numérotées et trace Playwright dans `docs/recette/parcours/<nom>/` (fichiers non versionnés, reproductibles par la commande ci-dessus).',
  '',
  `## Verdict : ${conforme ? 'conforme' : 'NON CONFORME'}`,
  '',
  '| Parcours | Largeur | Étapes réussies | Verdict |',
  '|---|---|---|---|',
  ...resultats.map((r) => `| ${r.titre} | ${r.largeur} px | ${r.etapes.filter((e) => e.ok).length} sur ${r.etapes.length} | ${r.ok ? 'conforme' : 'ÉCHEC'} |`),
  '',
];
for (const r of resultats) {
  lignes.push(`## ${r.titre}`, '', `Dossier : \`docs/recette/parcours/${r.id}/\` (trace : \`trace.zip\`). Verdict : ${r.ok ? 'conforme' : 'ÉCHEC'}.`, '', '| Nº | Étape | Résultat | Capture |', '|---|---|---|---|');
  for (const e of r.etapes) lignes.push(`| ${e.numero} | ${e.nom} | ${e.ok ? 'conforme' : 'ÉCHEC'}${e.detail ? ` : ${e.detail.replace(/\|/g, '/')}` : ''} | ${e.capture ? `\`${e.capture}\`` : ''} |`);
  lignes.push('');
}
if (releveBaseVide.length) {
  lignes.push('## Relevé de la base vide : nombres affichés par écran', '', 'Un nombre affiché est admis s’il figure dans une réponse du serveur reçue par l’écran ou dans un texte fixe justifié (`e2e/parcours/base-vide.mjs`).', '', '| Écran | Rôle | Nombres affichés | Sans origine |', '|---|---|---|---|');
  for (const e of releveBaseVide) lignes.push(`| \`${e.route}\` | ${e.role} | ${e.affiches.length ? e.affiches.join(', ') : 'aucun'} | ${e.sansOrigine.length ? e.sansOrigine.join(', ') : 'aucun'} |`);
  lignes.push('');
}
writeFileSync(join(sortie, '..', 'parcours.md'), lignes.join('\n'));
console.log(`\nVerdict : ${conforme ? 'conforme' : 'NON CONFORME'} — ${resultats.filter((r) => r.ok).length} parcours sur ${resultats.length}`);
process.exit(conforme ? 0 : 1);
