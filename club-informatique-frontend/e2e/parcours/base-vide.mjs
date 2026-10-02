// Base vide (12.10) : tous les écrans sont parcourus sur une base sans aucun contenu (seuls existent les comptes d'essai
// et le Super Admin d'amorçage). Chaque nombre affiché doit venir d'une réponse du serveur reçue par l'écran, ou d'un
// texte fixe justifié ci-dessous ; tout autre nombre serait une donnée inventée.
import { join } from 'node:path';
import { BASE } from './pile.mjs';
import { COMPTES, aller, attendu, calme, connecter, lire, sansSession } from './outils.mjs';

const ECRANS = [
  [null, ['/', '/presentation', '/bureau', '/actualites', '/evenements', '/projets', '/formations', '/ressources', '/contact', '/connexion', '/inscription', '/mot-de-passe-oublie', '/mentions-legales', '/confidentialite', '/conditions-utilisation']],
  ['membre', ['/espace/membre', '/espace/publications', '/espace/inscriptions', '/espace/supports', '/espace/projets', '/espace/projets/proposer', '/espace/notifications', '/espace/profil', '/espace/profil/modifier', '/espace/parametres']],
  ['formateur', ['/espace/formateur', '/espace/formateur/cours', '/espace/formateur/cours/nouveau', '/espace/formateur/projets']],
  ['responsable', ['/espace/gestion', '/espace/gestion/actualites', '/espace/gestion/actualites/nouvelle', '/espace/gestion/evenements', '/espace/gestion/projets', '/espace/gestion/inscriptions', '/espace/gestion/bureau', '/espace/gestion/notifications', '/espace/admin/messages']],
  ['admin', ['/espace/admin', '/espace/admin/utilisateurs', '/espace/admin/roles', '/espace/admin/categories', '/espace/admin/statistiques', '/espace/admin/securite', '/espace/admin/journal']],
  ['superadmin', ['/espace/systeme']],
  ['dsi', ['/espace/dsi']],
];

/** Listes publiques : sur une base vide, le serveur ne renvoie rien et l'écran doit le dire. */
const LISTES_PUBLIQUES = { '/actualites': '/actualites', '/evenements': '/evenements', '/projets': '/projets', '/formations': '/formations', '/ressources': '/ressources/publiques' };

const jours = Array.from({ length: 31 }, (_, i) => i + 1);
const annee = new Date().getFullYear();
/**
 * Nombres portés par des textes fixes de l'interface (aucun ne décrit l'activité du club).
 * Coordonnées réelles du club (section 4.4), règles de saisie rappelées à l'utilisateur, références de textes de loi,
 * grille du calendrier.
 */
const TEXTES_FIXES = {
  '/contact': [226, 64, 93, 15, 57, 75, 54, 52, 59, 55, 63, 37, 24],
  '/espace/profil/modifier': [2, 500],
  '/espace/formateur/cours/nouveau': [500],
  '/espace/gestion/evenements': [...jours, annee],
  '/espace/gestion/actualites/nouvelle': [10, 500],
  '/mentions-legales': null,
  '/confidentialite': null,
  '/conditions-utilisation': null,
};

const nombres = (texte) => new Set((texte.match(/\d+/g) ?? []).map(Number));

export async function parcoursBaseVide({ page, contexte, etape, dossier }) {
  const releve = [];
  const sansOrigineParEcran = [];

  await etape('La base ne contient aucun contenu : toutes les listes publiques du serveur sont vides', async () => {
    for (const chemin of Object.values(LISTES_PUBLIQUES)) {
      const liste = await lire(null, `${chemin}?size=1`);
      attendu(liste.totalElements === 0, `la liste ${chemin} devait être vide : ${liste.totalElements}`);
    }
    attendu((await lire(null, '/bureau')).length === 0 && (await lire(null, '/categories')).length === 0, 'le bureau et les catégories doivent être vides');
  });

  for (const [role, routes] of ECRANS) {
    await etape(`Écrans ${role ? `du rôle « ${role} »` : 'publics'} parcourus sur base vide, sans erreur de console`, async () => {
      if (role) await connecter(page, COMPTES[role]);
      else await sansSession(page);
      for (const route of routes) {
        const lectures = [];
        const collecter = (response) => {
          if (response.url().includes('/api/v1/')) lectures.push(response.text().catch(() => ''));
        };
        if (role) await aller(page, '/acces-refuse');
        page.on('response', collecter);
        if (role) {
          await aller(page, route);
        } else {
          await page.goto(BASE + route, { waitUntil: 'networkidle' });
          await calme(page);
        }
        page.off('response', collecter);
        // Le corps de chaque réponse est attendu en entier avant la comparaison.
        const recus = await Promise.all(lectures);
        // Un pourcentage de répartition est calculé par l'écran à partir des décomptes du serveur : il est vérifié à part.
        const brut = await page.locator('main').first().innerText();
        const pourcentages = [...brut.matchAll(/(\d+)\s*\((\d+)\s*%\)/g)].map((m) => [Number(m[1]), Number(m[2])]);
        for (const [valeur, pourcentage] of pourcentages) {
          attendu(valeur === 0 ? pourcentage === 0 : pourcentage > 0 && pourcentage <= 100, `pourcentage incohérent sur ${route} : ${valeur} (${pourcentage} %)`);
        }
        const texte = brut.replace(/\((\d+)\s*%\)/g, '');
        const fixes = TEXTES_FIXES[route];
        const duServeur = nombres(recus.join(' '));
        const affiches = [...nombres(texte)];
        const sansOrigine = fixes === null ? [] : affiches.filter((n) => !duServeur.has(n) && !(fixes ?? []).includes(n));
        releve.push({ route, role: role ?? 'visiteur', affiches, sansOrigine });
        if (sansOrigine.length) sansOrigineParEcran.push(`${route} : ${sansOrigine.join(', ')}`);
        if (LISTES_PUBLIQUES[route]) attendu((await page.locator('main a[href^="' + route + '/"]').count()) === 0, `${route} ne doit afficher aucun élément sur une base vide`);
        await page.screenshot({ path: join(dossier, `${(role ?? 'visiteur')}${route.replace(/\//g, '_') || '_accueil'}.png`), fullPage: true });
      }
      return `${routes.length} écrans`;
    });
  }

  await etape('Chaque nombre affiché vient d’une réponse du serveur ou d’un texte fixe justifié', async () => {
    attendu(sansOrigineParEcran.length === 0, `nombres affichés sans origine : ${sansOrigineParEcran.join(' ; ')}`);
    return `${releve.length} écrans relevés`;
  });

  await etape('Accueil sur base vide : les sections sans donnée sont masquées', async () => {
    await sansSession(page);
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await calme(page);
    attendu((await page.locator('main section').count()) === 1, 'seule la section d’en-tête doit rester quand il n’y a ni événement ni actualité');
  });

  return releve;
}
