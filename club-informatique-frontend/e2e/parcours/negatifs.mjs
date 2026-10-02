// Cas négatifs (12.9) : page protégée sans session, mauvais rôle, jeton expiré, rotation du jeton de rafraîchissement,
// champs invalides, doublons, limitation de débit, téléversement refusé, coupure du backend.
import { API, BACKEND, BASE, MOT_DE_PASSE, arreterBackend, demarrerBackend, enBase } from './pile.mjs';
import { aller, api, attendu, calme, chemin, COMPTES, connecter, contient, courrielPour, EXECUTABLE, jeton, lire, oublierJetons, PDF, sansSession, texte } from './outils.mjs';

const champ = (page, libelle) => page.getByLabel(new RegExp(`^\\s*${libelle}(\\s*\\*)?\\s*$`));
const json = (corps) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
const cookieDeSession = (response) => (response.headers.getSetCookie().find((c) => c.startsWith('club_session=')) ?? '').split(';')[0];

export async function parcoursNegatifs({ page, contexte, etape }, etat) {
  await etape('Page protégée sans session : renvoi à la connexion, puis retour à la page demandée', async () => {
    await sansSession(page);
    await page.goto(`${BASE}/espace/inscriptions`, { waitUntil: 'networkidle' });
    const url = new URL(page.url());
    attendu(url.pathname === '/connexion' && url.searchParams.get('retour') === '/espace/inscriptions', `renvoi attendu vers la connexion avec la destination : ${url.pathname}${url.search}`);
    await champ(page, 'Adresse électronique').fill(COMPTES.membre);
    await champ(page, 'Mot de passe').fill(MOT_DE_PASSE);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await page.waitForURL((u) => u.pathname === '/espace/inscriptions');
    const anonyme = await api(null, 'GET', '/inscriptions/me');
    attendu(anonyme.status === 401 && anonyme.json?.code === 'NON_AUTHENTIFIE', `sans session, le serveur doit répondre 401 : ${anonyme.status}`);
  });

  await etape('Mauvais rôle : la page est refusée dans le navigateur et la requête par le serveur', async () => {
    await calme(page);
    await aller(page, '/espace/admin/utilisateurs');
    attendu(chemin(page) === '/acces-refuse', `un membre ne doit pas ouvrir l’administration : ${chemin(page)}`);
    const refus = await api(COMPTES.membre, 'GET', '/admin/users');
    attendu(refus.status === 403 && refus.json?.code === 'ACCES_REFUSE', `403 attendu : ${refus.status} ${refus.json?.code}`);
  });

  await etape('Champs invalides : refusés dans le formulaire sans appel au serveur, et par le serveur lui-même', async () => {
    await sansSession(page);
    let envois = 0;
    const compter = (requete) => {
      if (requete.url().endsWith('/auth/register')) envois++;
    };
    page.on('request', compter);
    await page.goto(`${BASE}/inscription`, { waitUntil: 'networkidle' });
    await champ(page, 'Nom').fill('K');
    await champ(page, 'Prénom').fill('Issouf');
    await champ(page, 'Adresse électronique').fill('adresse-sans-arobase');
    await champ(page, 'Filière d’études').fill('Génie logiciel');
    await champ(page, 'Mot de passe').fill('faible');
    await champ(page, 'Confirmation du mot de passe').fill('différent');
    await page.getByRole('button', { name: 'S’inscrire' }).click();
    await page.waitForTimeout(500);
    page.off('request', compter);
    attendu((await page.locator('.form-error:visible').count()) >= 4, 'chaque champ invalide doit porter son message');
    attendu(envois === 0, 'un formulaire invalide ne doit pas être envoyé');
    const serveur = await fetch(`${API}/auth/register`, json({ nom: 'Kaboré', prenom: 'Issouf', email: 'issouf.kabore@club.test', motDePasse: 'faible', filiere: 'Génie logiciel', consentement: true }));
    const corps = await serveur.json();
    attendu(serveur.status === 400 && corps.errors?.some((e) => e.field === 'motDePasse'), `le serveur doit refuser un mot de passe faible champ par champ : ${serveur.status}`);
    const sansConsentement = await fetch(`${API}/auth/register`, json({ nom: 'Kaboré', prenom: 'Issouf', email: 'issouf.kabore@club.test', motDePasse: MOT_DE_PASSE, filiere: 'Génie logiciel', consentement: false }));
    attendu(sansConsentement.status === 400, 'le serveur doit refuser une inscription sans consentement');
  });

  await etape('Doublons : seconde inscription avec une adresse existante (réponse identique, aucun second compte), double inscription à une activité', async () => {
    const existant = etat.membre.email;
    await page.goto(`${BASE}/inscription`, { waitUntil: 'networkidle' });
    await champ(page, 'Nom').fill('Sanou');
    await champ(page, 'Prénom').fill('Mariam');
    await champ(page, 'Adresse électronique').fill(existant);
    await champ(page, 'Filière d’études').fill('Génie logiciel');
    await champ(page, 'Mot de passe').fill(MOT_DE_PASSE);
    await champ(page, 'Confirmation du mot de passe').fill(MOT_DE_PASSE);
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'S’inscrire' }).click();
    await page.getByRole('heading', { name: /boîte de réception/ }).waitFor();
    attendu(enBase(`SELECT COUNT(*) FROM utilisateur WHERE email = '${existant}'`) === '1', 'aucun second compte ne doit être créé');
    await courrielPour(existant, 'déjà un compte');

    const evenement = (await lire(null, '/evenements?size=50')).content.find((e) => e.titre === etat.evenement.titre);
    const premiere = await api(COMPTES.responsable, 'POST', `/inscriptions/evenements/${evenement.id}`);
    const seconde = await api(COMPTES.responsable, 'POST', `/inscriptions/evenements/${evenement.id}`);
    attendu(premiere.status < 300 && seconde.status === 409, `la seconde inscription doit être refusée (409) : ${premiere.status}, ${seconde.status}`);
    const categorie = (await lire(null, '/categories'))[0];
    if (categorie) {
      const doublon = await api(COMPTES.admin, 'POST', '/categories', { nom: categorie.nom });
      attendu(doublon.status === 409, `une catégorie de même nom doit être refusée (409) : ${doublon.status}`);
    }
    return 'réponse identique à l’inscription, courriel « déjà un compte », 409 pour la double inscription';
  });

  await etape('Téléversement refusé : type (extension, puis contenu réel) et taille', async () => {
    await connecter(page, COMPTES.formateur);
    await aller(page, `/espace/formateur/cours/${etat.cours.id}/publier`);
    const depot = page.locator('input[type="file"]');
    await depot.setInputFiles({ name: 'outil.exe', mimeType: 'application/octet-stream', buffer: EXECUTABLE });
    await page.getByText('Ce type de fichier n’est pas accepté.', { exact: true }).waitFor();
    const volumineux = Buffer.alloc(10 * 1024 * 1024 + 1);
    PDF.copy(volumineux);
    await depot.setInputFiles({ name: 'volumineux.pdf', mimeType: 'application/pdf', buffer: volumineux });
    await page.getByText('Ce fichier dépasse la taille autorisée.').waitFor();
    await depot.setInputFiles({ name: 'faux.pdf', mimeType: 'application/pdf', buffer: EXECUTABLE });
    await page.getByText(/son contenu ne correspond pas à son extension/).waitFor();

    const envoyer = async (nom, contenu) => {
      const corps = new FormData();
      corps.append('fichier', new Blob([contenu]), nom);
      return fetch(`${BASE}/api/v1/fichiers`, { method: 'POST', headers: { Authorization: `Bearer ${await jeton(COMPTES.formateur)}` }, body: corps });
    };
    const tropGros = await envoyer('volumineux.pdf', volumineux);
    attendu(tropGros.status === 413, `le serveur doit refuser un fichier trop volumineux (413) : ${tropGros.status}`);
    const mauvaisType = await envoyer('faux.pdf', EXECUTABLE);
    attendu(mauvaisType.status === 415, `le serveur doit refuser un contenu qui n’est pas celui annoncé (415) : ${mauvaisType.status}`);
  }, { erreursAttendues: ['415'] });

  await etape('Rotation du jeton de rafraîchissement : chaque renouvellement le remplace ; un ancien jeton rejoué ferme la session', async () => {
    const connexion = await fetch(`${BACKEND}/api/v1/auth/login`, json({ email: COMPTES.membre, motDePasse: MOT_DE_PASSE }));
    const premier = cookieDeSession(connexion);
    attendu(premier.length > 20, 'la connexion doit poser le cookie de session');
    attendu(/HttpOnly/i.test(connexion.headers.getSetCookie().join(';')) && /SameSite=Strict/i.test(connexion.headers.getSetCookie().join(';')), 'le cookie doit être HttpOnly et SameSite=Strict');
    attendu(!JSON.stringify(await connexion.json()).includes('refresh'), 'le jeton de rafraîchissement ne doit jamais figurer dans le corps de la réponse');
    const renouveler = (cookie) => fetch(`${BACKEND}/api/v1/auth/refresh`, { method: 'POST', headers: { Cookie: cookie } });
    const renouvellement = await renouveler(premier);
    const second = cookieDeSession(renouvellement);
    attendu(renouvellement.status === 200 && second && second !== premier, 'le renouvellement doit remplacer le jeton');
    // Passé le délai de tolérance (requêtes simultanées), l'ancien jeton rejoué est une réutilisation : toute la session est fermée.
    await new Promise((resolve) => setTimeout(resolve, 11000));
    const rejeu = await renouveler(premier);
    attendu(rejeu.status === 401, `un ancien jeton rejoué doit être refusé (401) : ${rejeu.status}`);
    const apres = await renouveler(second);
    attendu(apres.status === 401, `après une réutilisation, le jeton courant doit être révoqué lui aussi (401) : ${apres.status}`);
    oublierJetons();
  });

  await etape('Jeton d’accès expiré : renouvelé sans interruption ; sans cookie de session, retour à la connexion', async () => {
    await demarrerBackend({ comptesDeTest: true, dureeJeton: 4000 });
    oublierJetons();
    await connecter(page, COMPTES.membre);
    let renouvellements = 0;
    const compter = (response) => {
      if (response.url().endsWith('/auth/refresh') && response.status() === 200) renouvellements++;
    };
    page.on('response', compter);
    await page.waitForTimeout(5000);
    await aller(page, '/espace/profil');
    attendu(await contient(page, COMPTES.membre), 'après l’expiration du jeton, la page doit se charger normalement');
    page.off('response', compter);
    attendu(renouvellements >= 1, 'le jeton expiré doit avoir été renouvelé par le cookie de session');
    // Le cookie de session disparaît (expiration) : le navigateur garde seulement le souvenir d'une session passée.
    await contexte.clearCookies();
    await page.waitForTimeout(5000);
    await aller(page, '/espace/inscriptions').catch(() => {});
    await page.waitForURL((u) => u.pathname === '/connexion', { timeout: 15000 });
    attendu((await page.getByRole('status').innerText()).includes('expiré'), 'le motif « session expirée » doit être annoncé');
  }, { erreursAttendues: ['401'] });

  await etape('Limitation de débit : au-delà du quota, la connexion et le formulaire de contact répondent 429 et l’interface l’explique', async () => {
    await demarrerBackend({ comptesDeTest: true, limites: true });
    oublierJetons();
    let dernier = 0;
    for (let essai = 0; essai < 25 && dernier !== 429; essai++) {
      dernier = (await fetch(`${BASE}/api/v1/auth/login`, json({ email: 'inconnu@club.test', motDePasse: 'Faux@2026-essai' }))).status;
    }
    attendu(dernier === 429, `la limite de débit de la connexion doit être atteinte (429) : ${dernier}`);
    await sansSession(page);
    await page.goto(`${BASE}/connexion`, { waitUntil: 'networkidle' });
    await champ(page, 'Adresse électronique').fill(COMPTES.membre);
    await champ(page, 'Mot de passe').fill(MOT_DE_PASSE);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await page.getByRole('alert').filter({ hasText: 'Trop de tentatives' }).first().waitFor();

    let contact = 0;
    for (let essai = 0; essai < 8 && contact !== 429; essai++) {
      contact = (await fetch(`${BASE}/api/v1/contact`, json({ nom: 'Fatoumata Traoré', email: 'fatoumata.traore@club.test', sujet: `Essai de débit ${essai}`, message: 'Message envoyé pour vérifier la limitation de débit.', siteWeb: '', dureeSaisieMs: 15000 }))).status;
    }
    attendu(contact === 429, `la limite de débit du contact doit être atteinte (429) : ${contact}`);
  }, { erreursAttendues: ['429'] });

  await etape('Protection anti-spam du contact : champ piège et saisie trop rapide sont écartés sans enregistrement', async () => {
    await demarrerBackend({ comptesDeTest: true });
    oublierJetons();
    const avant = Number(enBase('SELECT COUNT(*) FROM message_contact'));
    const piege = await fetch(`${API}/contact`, json({ nom: 'Robot', email: 'robot@club.test', sujet: 'Publicité', message: 'Message automatique de démonstration.', siteWeb: 'https://exemple.invalid', dureeSaisieMs: 15000 }));
    const rapide = await fetch(`${API}/contact`, json({ nom: 'Robot', email: 'robot@club.test', sujet: 'Publicité', message: 'Message automatique de démonstration.', siteWeb: '', dureeSaisieMs: 200 }));
    attendu(Number(enBase('SELECT COUNT(*) FROM message_contact')) === avant, `aucun message ne doit être enregistré (réponses ${piege.status} et ${rapide.status})`);
    return `réponses ${piege.status} et ${rapide.status}, aucun enregistrement`;
  });

  await etape('Coupure du backend : état d’erreur avec « Réessayer », puis reprise au retour du service', async () => {
    await arreterBackend();
    await sansSession(page);
    await page.goto(`${BASE}/formations`, { waitUntil: 'load' });
    await page.getByRole('button', { name: /Réessayer/ }).first().waitFor({ timeout: 20000 });
    attendu(!/\d+\s+(formation|inscrit)/i.test(await texte(page)), 'aucun chiffre ne doit être affiché quand le service est injoignable');
    await page.goto(`${BASE}/connexion`, { waitUntil: 'load' });
    await champ(page, 'Adresse électronique').fill(COMPTES.membre);
    await champ(page, 'Mot de passe').fill(MOT_DE_PASSE);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await page.getByRole('alert').first().waitFor();
    await page.goto(`${BASE}/formations`, { waitUntil: 'load' });
    await page.getByRole('button', { name: /Réessayer/ }).first().waitFor({ timeout: 20000 });
    await demarrerBackend({ comptesDeTest: true });
    oublierJetons();
    await page.getByRole('button', { name: /Réessayer/ }).first().click();
    await calme(page);
    attendu(await contient(page, etat.cours.titre), 'au retour du service, « Réessayer » doit afficher les formations');
  }, { erreursAttendues: ['502', '503', '504', 'Failed to load resource', 'ERR_'] });
}
