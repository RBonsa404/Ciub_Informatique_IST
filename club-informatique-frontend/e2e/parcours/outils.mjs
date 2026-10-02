// Outils communs aux parcours utilisateur : étapes tracées, connexion par le formulaire réel, courriels, appels directs à l'API
// (réservés à la vérification de ce que l'interface a réellement produit).
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { API, BASE, COURRIELS, MOT_DE_PASSE } from './pile.mjs';

/** Comptes d'essai créés par le backend (APP_SEED_TEST_ACCOUNTS) : un par rôle, domaine réservé « .invalid ». */
export const COMPTES = {
  membre: 'aminata.sawadogo@recette.invalid',
  formateur: 'issouf.ouedraogo@recette.invalid',
  responsable: 'rasmata.kabore@recette.invalid',
  admin: 'boukary.zongo@recette.invalid',
  superadmin: 'salimata.compaore@recette.invalid',
  dsi: 'adama.traore@recette.invalid',
};

/** Fichiers d'essai : contenus minimaux dont les premiers octets portent la signature du type annoncé. */
/** Image PNG réelle : une capture de 96 pixels de côté de la page affichée. */
export const imageDEssai = (page) => page.screenshot({ clip: { x: 0, y: 0, width: 96, height: 96 }, type: 'png' });
export const PDF = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n', 'latin1');
export const EXECUTABLE = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]);

const unique = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
/** Adresse neuve sur un domaine réservé que la boîte de capture reçoit. */
export const adresseNeuve = (prefixe) => `${prefixe}.${unique()}@club.test`;

/** Date et heure locales au format du champ « datetime-local », à tant de jours d'aujourd'hui. */
export function dansJours(jours, heure, minutes = 0) {
  const d = new Date();
  d.setDate(d.getDate() + jours);
  d.setHours(heure, minutes, 0, 0);
  const deux = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}T${deux(d.getHours())}:${deux(d.getMinutes())}`;
}

// ---------------------------------------------------------------- Courriels

/** Dernier courriel reçu par une adresse (objet contenant le texte), lu dans la boîte de capture ; attend sa réception. */
export async function courrielPour(adresse, objet = '', attente = 20000) {
  const limite = Date.now() + attente;
  while (Date.now() < limite) {
    const liste = await (await fetch(`${COURRIELS}/search?query=${encodeURIComponent(`to:${adresse}`)}`)).json();
    const message = (liste.messages ?? []).find((m) => m.Subject.includes(objet));
    if (message) return (await fetch(`${COURRIELS}/message/${message.ID}`)).json();
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`aucun courriel « ${objet} » reçu par ${adresse}`);
}

export async function aucunCourrielPour(adresse, objet = '', attente = 2500) {
  await new Promise((resolve) => setTimeout(resolve, attente));
  const liste = await (await fetch(`${COURRIELS}/search?query=${encodeURIComponent(`to:${adresse}`)}`)).json();
  return !(liste.messages ?? []).some((m) => m.Subject.includes(objet));
}

/** Lien du site (chemin et paramètres) contenu dans le texte d'un courriel. */
export function lienDuCourriel(courriel, chemin) {
  const lien = courriel.Text.match(new RegExp(`https?://\\S+/${chemin}\\?jeton=\\S+`));
  if (!lien) throw new Error(`lien « ${chemin} » absent du courriel « ${courriel.Subject} »`);
  const url = new URL(lien[0]);
  if (url.origin !== BASE) throw new Error(`le lien du courriel pointe vers ${url.origin} au lieu de ${BASE}`);
  return url.pathname + url.search;
}

// ---------------------------------------------------------------- API (vérifications)

const jetons = new Map();
export async function jeton(email, motDePasse = MOT_DE_PASSE) {
  const cle = `${email}|${motDePasse}`;
  if (!jetons.has(cle)) {
    const response = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, motDePasse }) });
    if (!response.ok) throw new Error(`connexion de ${email} refusée par l'API : ${response.status}`);
    jetons.set(cle, (await response.json()).accessToken);
  }
  return jetons.get(cle);
}
export const oublierJetons = () => jetons.clear();

/** Appel direct à l'API : { status, json }. « compte » : adresse, ou [adresse, mot de passe], ou null pour un visiteur. */
export async function api(compte, methode, chemin, corps) {
  const [email, motDePasse] = Array.isArray(compte) ? compte : [compte, MOT_DE_PASSE];
  const headers = { ...(corps === undefined ? {} : { 'Content-Type': 'application/json' }), ...(email ? { Authorization: `Bearer ${await jeton(email, motDePasse)}` } : {}) };
  const response = await fetch(API + chemin, { method: methode, headers, body: corps === undefined ? undefined : JSON.stringify(corps) });
  const texte = await response.text();
  let json = null;
  try {
    json = texte ? JSON.parse(texte) : null;
  } catch {
    // Réponse non JSON : seul le code de statut compte.
  }
  return { status: response.status, json, texte, headers: response.headers };
}

export async function lire(compte, chemin) {
  const reponse = await api(compte, 'GET', chemin);
  if (reponse.status !== 200) throw new Error(`GET ${chemin} : ${reponse.status}`);
  return reponse.json;
}

// ---------------------------------------------------------------- Navigateur

/** Redevient un visiteur : ni cookie de session, ni indice de session passée dans le navigateur. */
export async function sansSession(page) {
  await page.context().clearCookies();
  if (page.url().startsWith(BASE)) await page.evaluate(() => localStorage.removeItem('ci_ist_session'));
}

/** Ouvre une session par le formulaire de connexion réel. */
export async function connecter(page, email, motDePasse = MOT_DE_PASSE, attendu = /^\/espace/) {
  await sansSession(page);
  await page.goto(`${BASE}/connexion`, { waitUntil: 'networkidle' });
  await page.getByLabel(/Adresse électronique/).fill(email);
  await page.getByLabel(/^\s*Mot de passe/).fill(motDePasse);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL((url) => attendu.test(url.pathname));
  await calme(page);
}

/** Attend la fin des chargements visibles (zones en attente) et du réseau. */
export async function calme(page) {
  await page.waitForTimeout(250);
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 20000 });
  await page.waitForLoadState('networkidle');
}

/** Attend la notification de succès portant ce texte, puis la ferme : une notification plus ancienne ne peut pas être prise pour elle. */
export async function notification(page, texte) {
  const toast = page.locator('.toast').filter({ hasText: texte }).last();
  await toast.waitFor();
  await toast.getByRole('button', { name: 'Fermer la notification' }).click();
  await toast.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
}

/** Navigation par un lien du menu de l'espace (barre latérale), comme le ferait l'utilisateur. */
export async function menu(page, libelle) {
  // Depuis une page publique, l'utilisateur revient d'abord dans son espace.
  if (!new URL(page.url()).pathname.startsWith('/espace')) await aller(page, '/espace');
  const ouvrir = page.getByRole('button', { name: 'Ouvrir le menu de l’espace' });
  if (await ouvrir.isVisible()) await ouvrir.click();
  await page.getByRole('navigation', { name: 'Menu de l’espace' }).getByRole('link', { name: libelle, exact: true }).click();
  await calme(page);
}

/** Navigation interne directe (adresse saisie), sans rechargement : la session reste celle de la page. */
export async function aller(page, chemin) {
  await page.evaluate((path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, chemin);
  await calme(page);
}

/** Confirme la boîte de dialogue ouverte par le bouton portant ce libellé. */
export async function confirmer(page, libelle) {
  const dialogue = page.getByRole('dialog');
  await dialogue.waitFor();
  await dialogue.getByRole('button', { name: libelle, exact: true }).click();
}

/** Met un interrupteur dans l'état voulu en cliquant sur son libellé, comme le ferait l'utilisateur. */
export async function basculer(page, nom, voulu) {
  const interrupteur = page.getByRole('switch', { name: nom });
  if ((await interrupteur.isChecked()) !== voulu) await interrupteur.locator('xpath=ancestor::label[1]').click();
  if ((await interrupteur.isChecked()) !== voulu) throw new Error(`l’interrupteur « ${nom} » devait être ${voulu ? 'activé' : 'désactivé'}`);
}

export const chemin = (page) => new URL(page.url()).pathname;
export const texte = (page, selecteur = 'main') => page.locator(selecteur).first().innerText();

/** Vérifie une condition ; le message décrit ce qui était attendu. */
export function attendu(condition, message) {
  if (!condition) throw new Error(message);
}

export async function sansDebordement(page) {
  const d = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
  attendu(d.s <= d.c, `débordement horizontal : ${d.s} > ${d.c} px sur ${chemin(page)}`);
}

// ---------------------------------------------------------------- Parcours

/**
 * Exécute un parcours : contexte de navigateur neuf, trace Playwright, capture à chaque étape, verdict.
 * Le parcours s'arrête à la première étape en échec (les suivantes en dépendent).
 */
export async function parcours(browser, sortie, { id, titre, largeur = 1280, hauteur = 860 }, corps) {
  const dossier = join(sortie, id);
  mkdirSync(dossier, { recursive: true });
  const contexte = await browser.newContext({ viewport: { width: largeur, height: hauteur }, locale: 'fr-FR', timezoneId: 'Africa/Ouagadougou', acceptDownloads: true });
  await contexte.tracing.start({ screenshots: true, snapshots: true });
  const page = await contexte.newPage();
  const console_ = [];
  page.on('console', (m) => {
    if (m.type() === 'error') console_.push(m.text().slice(0, 200));
  });
  page.on('pageerror', (e) => console_.push(`exception : ${String(e).slice(0, 200)}`));

  const etapes = [];
  let numero = 0;
  let echec = null;
  /** Étape du parcours ; « erreursAttendues » : fragments de messages de console que l'étape provoque volontairement. */
  const etape = async (nom, action, { erreursAttendues = [] } = {}) => {
    if (echec) return;
    numero++;
    console_.length = 0;
    const capture = `${String(numero).padStart(2, '0')}.png`;
    try {
      const detail = await action();
      const inattendues = console_.filter((m) => !erreursAttendues.some((e) => m.includes(e)));
      if (inattendues.length) throw new Error(`erreur de console inattendue : ${inattendues.join(' | ')}`);
      await page.screenshot({ path: join(dossier, capture) }).catch(() => {});
      etapes.push({ numero, nom, ok: true, detail: typeof detail === 'string' ? detail : '', capture });
    } catch (erreur) {
      await page.screenshot({ path: join(dossier, capture) }).catch(() => {});
      echec = String(erreur.message ?? erreur).split('\n')[0].slice(0, 400);
      etapes.push({ numero, nom, ok: false, detail: echec, capture });
    }
  };

  try {
    await corps({ page, contexte, etape, dossier });
  } catch (erreur) {
    echec ??= String(erreur.message ?? erreur).split('\n')[0].slice(0, 400);
    etapes.push({ numero: ++numero, nom: 'Déroulement du parcours', ok: false, detail: echec, capture: '' });
  }
  await contexte.tracing.stop({ path: join(dossier, 'trace.zip') });
  await contexte.close();
  const resultat = { id, titre, largeur, etapes, ok: !echec };
  console.log(`${resultat.ok ? 'conforme' : 'ÉCHEC   '} ${id} (${etapes.filter((e) => e.ok).length}/${etapes.length} étapes)${echec ? ` — ${echec}` : ''}`);
  return resultat;
}
