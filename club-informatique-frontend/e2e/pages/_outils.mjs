// Outils communs aux scénarios de recette.
export const API = process.env.RECETTE_API ?? 'http://localhost:8080/api';
export const PASSWORD = process.env.RECETTE_MOT_DE_PASSE ?? 'Recette@2026';

export const COMPTES = {
  membre: 'aminata.sawadogo@recette.invalid',
  formateur: 'issouf.ouedraogo@recette.invalid',
  responsable: 'salif.kabore@recette.invalid',
  admin: 'abdoul.compaore@recette.invalid',
  superadmin: 'mariam.zongo@recette.invalid',
  dsi: 'boukary.tapsoba@recette.invalid',
};

const LISTES = ['actualites', 'evenements', 'formations', 'projets', 'ressources/publiques'];

/**
 * Contournement du bogue B-30 du backend existant : sans paramètre « search », les listes publiques
 * répondent 500. La requête est transmise au backend réel avec un paramètre vide ; la réponse n'est pas modifiée.
 */
export async function listesReelles(page) {
  await page.route(
    (url) => LISTES.some((l) => url.pathname === `/api/${l}`) && !url.searchParams.has('search'),
    (route) => {
      const url = new URL(route.request().url());
      url.searchParams.set('search', '');
      return route.continue({ url: url.toString() });
    },
  );
}

/** Réponse vide conforme au contrat de pagination. */
export const pageVide = { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 };

export const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

/** État de chargement : la requête reste sans réponse. */
export const enAttente = (page, motif) => page.route(motif, () => {});
/** État d'erreur : le service est injoignable. */
export const injoignable = (page, motif) => page.route(motif, (route) => route.abort());
export const CONSOLE_PANNE = ['Failed to load resource', 'ERR_FAILED'];

/** Premier élément publié d'une liste, lu sur le backend réel. */
export async function premier(liste, tri = '') {
  const response = await fetch(`${API}/${liste}?search=${tri}`);
  const data = await response.json();
  return data.content[0];
}

/** Ouvre une session par le formulaire de connexion réel. */
export async function connecter(page, base, role) {
  await page.goto(base + '/connexion', { waitUntil: 'networkidle' });
  await page.getByLabel(/Adresse électronique/).fill(COMPTES[role]);
  await page.getByLabel(/^\s*Mot de passe/).fill(PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL((url) => url.pathname.startsWith('/espace'));
}

/** Navigation interne sans rechargement (la session est conservée en mémoire). */
export async function aller(page, chemin, attendreReseau = true) {
  await page.evaluate((path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, chemin);
  // L'état « networkidle » est déjà atteint après une navigation interne : on attend la fin des zones en chargement.
  await page.waitForTimeout(attendreReseau ? 300 : 700);
  if (attendreReseau) {
    await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  }
}

/** Jeton d'un compte de recette, pour lire sur le backend réel l'identifiant d'un élément à afficher. */
export async function jeton(role) {
  const response = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: COMPTES[role], motDePasse: PASSWORD }) });
  return (await response.json()).accessToken;
}

export async function lire(chemin, role) {
  const response = await fetch(API + chemin, { headers: { Authorization: `Bearer ${await jeton(role)}` } });
  return response.json();
}

export const ECARTS_COMMUNS = [
  ['Barre de prototype, numéros d’écran', 'présents', 'retirés', 'retrait (démonstration)'],
  ['Pictogrammes', 'emoji et tracés au trait', 'famille unique au trait', 'corrigé (E-01)'],
  ['Contenus', 'textes, noms, dates et chiffres d’illustration', 'données renvoyées par l’API', 'assumé (section 1)'],
];
