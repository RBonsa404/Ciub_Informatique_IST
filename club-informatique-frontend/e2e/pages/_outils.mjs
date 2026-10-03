// Outils communs aux scénarios de recette.
export const API = process.env.RECETTE_API ?? 'http://localhost:8080/api/v1';
/** Lecture des courriels capturés par Mailpit. */
export const COURRIELS = process.env.RECETTE_COURRIELS ?? 'http://localhost:8025/api/v1';
export const PASSWORD = process.env.RECETTE_MOT_DE_PASSE ?? 'Recette@2026';

/** Comptes de test créés par le backend (APP_SEED_TEST_ACCOUNTS) : un par rôle, sur le domaine réservé « .invalid ». */
export const COMPTES = {
  membre: 'christ-orient.salou@recette.invalid',
  formateur: 'arnaud.ouare@recette.invalid',
  responsable: 'ramatou.sidibe@recette.invalid',
  admin: 'prince.pamousso@recette.invalid',
  superadmin: 'abdoul-rachid.bonsa@recette.invalid',
  dsi: 'tony-darel.zongo@recette.invalid',
};

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
  const response = await fetch(`${API}/${liste}?size=20${tri}`);
  const data = await response.json();
  return data.content[0];
}

/** Attend qu'une page pré-rendue soit prise en main par l'application (sans effet sur une page rendue par le navigateur). */
export const priseEnMain = (page) => page.waitForFunction(() => !document.querySelector('app-root[ngh]'), null, { timeout: 20000 });

/** Ouvre une session par le formulaire de connexion réel. */
export async function connecter(page, base, role) {
  // La session survit au rechargement (cookie HttpOnly) : sans ce retrait, la page de connexion renverrait vers l'espace.
  await page.context().clearCookies();
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

const unique = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
/** Adresse neuve sur un domaine réservé qui reçoit réellement les courriels de la pile de recette (Mailpit). */
export const adresseNeuve = (prefixe) => `${prefixe}.${unique()}@club.test`;

/** Texte du dernier courriel reçu par une adresse, lu dans Mailpit ; attend sa réception (envoi asynchrone). */
export async function courrielPour(adresse, sujet = '') {
  for (let essai = 0; essai < 60; essai++) {
    const liste = await (await fetch(`${COURRIELS}/search?query=${encodeURIComponent(`to:${adresse}`)}`)).json();
    const message = (liste.messages ?? []).find((m) => m.Subject.includes(sujet));
    if (message) return (await (await fetch(`${COURRIELS}/message/${message.ID}`)).json()).Text;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`aucun courriel « ${sujet} » reçu par ${adresse}`);
}

/** Chemin interne (avec son jeton) du lien contenu dans un courriel. */
export function lienDuCourriel(texte, chemin) {
  const lien = texte.match(new RegExp(`https?://\\S+/${chemin}\\?jeton=\\S+`));
  if (!lien) throw new Error(`lien « ${chemin} » absent du courriel`);
  const url = new URL(lien[0]);
  return url.pathname + url.search;
}

async function poster(chemin, corps) {
  const response = await fetch(API + chemin, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
  if (!response.ok) throw new Error(`POST ${chemin} : ${response.status}`);
}

/** Inscrit un compte par l'API réelle ; renvoie son adresse et le lien de vérification reçu par courriel. */
export async function inscrire(prefixe = 'aminata.sawadogo') {
  const email = adresseNeuve(prefixe);
  await poster('/auth/register', { nom: 'Sawadogo', prenom: 'Aminata', email, motDePasse: PASSWORD, filiere: 'Informatique de gestion', consentement: true });
  return { email, lien: lienDuCourriel(await courrielPour(email, 'Confirmez votre adresse'), 'verification-adresse') };
}

/** Compte actif créé par le parcours réel : inscription, courriel, vérification de l'adresse. */
export async function compteActif(prefixe) {
  const { email, lien } = await inscrire(prefixe);
  await poster('/auth/verification', { jeton: new URLSearchParams(lien.split('?')[1]).get('jeton') });
  return email;
}

/** Lien de réinitialisation reçu par courriel par un compte actif neuf. */
export async function lienDeReinitialisation() {
  const email = await compteActif('issouf.kabore');
  await poster('/auth/forgot-password', { email });
  return { email, lien: lienDuCourriel(await courrielPour(email, 'Réinitialisation'), 'reinitialisation') };
}

export const ECARTS_COMMUNS = [
  ['Barre de prototype, numéros d’écran', 'présents', 'retirés', 'retrait (démonstration)'],
  ['Pictogrammes', 'emoji et tracés au trait', 'famille unique au trait', 'corrigé (E-01)'],
  ['Contenus', 'textes, noms, dates et chiffres d’illustration', 'données renvoyées par l’API', 'assumé (section 1)'],
];
