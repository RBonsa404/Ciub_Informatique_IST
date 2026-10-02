// Parcours du Visiteur (12.2) : pages publiques et légales, thème, contact, inscription, vérification de l'adresse,
// connexion, profil, déconnexion, réinitialisation du mot de passe avec lien à usage unique.
import { join } from 'node:path';
import { ADRESSE_DU_CLUB, BASE, MOT_DE_PASSE } from './pile.mjs';
import { adresseNeuve, attendu, calme, chemin, COMPTES, connecter, contient, courrielPour, lienDuCourriel, lire, menu, sansDebordement, texte } from './outils.mjs';

const champ = (page, libelle) => page.getByLabel(new RegExp(`^\\s*${libelle}(\\s*\\*)?\\s*$`));

const PAGES_PUBLIQUES = [
  ['Présentation', '/presentation', 'en-tête'],
  ['Formations', '/formations', 'en-tête'],
  ['Événements', '/evenements', 'en-tête'],
  ['Projets', '/projets', 'en-tête'],
  ['Actualités', '/actualites', 'en-tête'],
  ['Contact', '/contact', 'en-tête'],
  ['Bureau', '/bureau', 'pied de page'],
  ['Ressources', '/ressources', 'pied de page'],
  ['Mentions légales', '/mentions-legales', 'pied de page'],
  ['Politique de confidentialité', '/confidentialite', 'pied de page'],
  ['Conditions d’utilisation', '/conditions-utilisation', 'pied de page'],
];

/** Premier élément visible parmi ceux que désigne le sélecteur. */
async function visible(selecteur) {
  for (const element of await selecteur.all()) if (await element.isVisible()) return element;
  return null;
}

/** Ouvre une page publique par son lien de navigation ; sur petit écran, le menu de l'en-tête est d'abord déplié. */
export async function ouvrirPagePublique(page, libelle, zone) {
  if (zone === 'en-tête') {
    const liens = page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: libelle, exact: true });
    let lien = await visible(liens);
    if (!lien) {
      await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
      await page.waitForTimeout(350);
      lien = await visible(liens);
    }
    if (!lien) throw new Error(`lien « ${libelle} » introuvable dans la navigation principale`);
    await lien.click();
  } else {
    await page.getByRole('contentinfo').getByRole('link', { name: libelle, exact: true }).first().click();
  }
  await calme(page);
}

export async function parcoursVisiteur({ page, etape, dossier }, etat) {
  const compte = { email: adresseNeuve('mariam.sanou'), prenom: 'Mariam', nom: 'Sanou', motDePasse: MOT_DE_PASSE };
  const expediteur = adresseNeuve('fatoumata.traore');
  const objet = `Demande d’information ${Date.now().toString(36)}`;

  await etape('Accueil : la page s’affiche avec l’en-tête, le pied de page et un seul logo dans l’en-tête', async () => {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await calme(page);
    attendu((await page.getByRole('heading', { level: 1 }).count()) === 1, 'un titre principal unique est attendu');
    const logos = await page.locator('header img').evaluateAll((images) => images.filter((image) => image.getClientRects().length > 0).length);
    attendu(logos === 1, `un seul logo visible est attendu dans l’en-tête : ${logos}`);
    await sansDebordement(page);
  });

  await etape('Pages publiques et légales, par les liens de l’en-tête et du pied de page', async () => {
    for (const [libelle, route, zone] of PAGES_PUBLIQUES) {
      await ouvrirPagePublique(page, libelle, zone);
      attendu(chemin(page) === route, `le lien « ${libelle} » devait mener à ${route}, et non à ${chemin(page)}`);
      attendu((await page.getByRole('heading', { level: 1 }).count()) === 1, `titre principal absent sur ${route}`);
      await sansDebordement(page);
    }
    return `${PAGES_PUBLIQUES.length} pages ouvertes`;
  });

  await etape('Thème : bascule, puis persistance après rechargement', async () => {
    const theme = () => page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    const avant = await theme();
    await page.getByRole('button', { name: /Passer au thème/ }).first().click();
    const apres = await theme();
    attendu(apres !== avant, 'le thème devait changer');
    await page.reload({ waitUntil: 'networkidle' });
    attendu((await theme()) === apres, 'le thème choisi devait être conservé après rechargement');
    return `thème ${apres} conservé`;
  });

  await etape('Contact : message envoyé, courriel reçu par le club, accusé de réception reçu par l’expéditeur', async () => {
    await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' });
    await page.getByLabel(/Nom complet/).fill('Fatoumata Traoré');
    await page.getByLabel(/Adresse électronique/).fill(expediteur);
    await page.getByLabel(/Objet/).fill(objet);
    await page.getByLabel(/^\s*Message/).fill('Bonjour, je souhaite connaître les conditions d’adhésion au club. Message du parcours de recette.');
    await page.getByRole('checkbox').check();
    // Délai minimal de remplissage exigé par la protection anti-spam.
    await page.waitForTimeout(3200);
    await page.getByRole('button', { name: 'Envoyer' }).click();
    await page.getByRole('status').waitFor();
    const notification = await courrielPour(ADRESSE_DU_CLUB, objet);
    attendu(notification.Text.includes('conditions d’adhésion'), 'le courriel du club doit reprendre le message');
    attendu((notification.ReplyTo ?? []).some((a) => a.Address === expediteur), 'la réponse au courriel doit aller à l’expéditeur');
    const accuse = await courrielPour(expediteur, '');
    return `courriel au club « ${notification.Subject} » ; accusé « ${accuse.Subject} »`;
  });

  await etape('Le message apparaît dans l’espace d’administration, à l’écran des messages de contact', async () => {
    const contexteAdmin = await page.context().browser().newContext({ locale: 'fr-FR', viewport: page.viewportSize() });
    try {
      const admin = await contexteAdmin.newPage();
      await connecter(admin, COMPTES.admin);
      await menu(admin, 'Messages de contact');
      const liste = await texte(admin);
      attendu(liste.includes(objet) && liste.includes('Fatoumata Traoré'), 'le message envoyé doit figurer à l’écran des messages de contact');
      await admin.screenshot({ path: join(dossier, 'messages-de-contact.png') });
    } finally {
      await contexteAdmin.close();
    }
    const messages = await lire(COMPTES.admin, '/gestion/messages?size=50');
    attendu(messages.content.some((m) => m.sujet === objet && m.email === expediteur), 'le message doit être enregistré en base avec son objet et son expéditeur');
    etat.objetDuMessage = objet;
  });

  await etape('Inscription : filière en saisie libre, consentement explicite, écran « Vérifiez votre boîte de réception »', async () => {
    await page.goto(`${BASE}/inscription`, { waitUntil: 'networkidle' });
    const filiere = champ(page, 'Filière d’études');
    attendu((await filiere.evaluate((el) => el.tagName)) === 'INPUT', 'la filière doit être un champ de saisie libre');
    await champ(page, 'Nom').fill(compte.nom);
    await champ(page, 'Prénom').fill(compte.prenom);
    await champ(page, 'Adresse électronique').fill(compte.email);
    await filiere.fill('Génie logiciel, 2e année');
    await champ(page, 'Mot de passe').fill(compte.motDePasse);
    await champ(page, 'Confirmation du mot de passe').fill(compte.motDePasse);
    attendu(!(await page.getByRole('checkbox').isChecked()), 'le consentement doit être décoché par défaut');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'S’inscrire' }).click();
    await page.getByRole('heading', { name: /boîte de réception/ }).waitFor();
  });

  await etape('Connexion refusée tant que l’adresse n’est pas vérifiée', async () => {
    await page.goto(`${BASE}/connexion`, { waitUntil: 'networkidle' });
    await champ(page, 'Adresse électronique').fill(compte.email);
    await champ(page, 'Mot de passe').fill(compte.motDePasse);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await page.getByRole('alert').first().waitFor();
    attendu((await page.getByRole('alert').innerText()).includes('pas encore vérifiée'), 'le refus doit expliquer que l’adresse n’est pas vérifiée');
  }, { erreursAttendues: ['403'] });

  await etape('Vérification de l’adresse par le lien reçu par courriel', async () => {
    const courriel = await courrielPour(compte.email, 'Confirmez votre adresse');
    await page.goto(BASE + lienDuCourriel(courriel, 'verification-adresse'), { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: /Adresse\s+vérifiée/ }).waitFor();
    await page.getByRole('link', { name: 'Se connecter' }).click();
    await page.waitForURL((url) => url.pathname === '/connexion');
    attendu((await page.getByRole('status').innerText()).includes('vérifiée'), 'la connexion doit confirmer que l’adresse est vérifiée');
  });

  await etape('Connexion : arrivée sur le tableau de bord du membre, aucun jeton dans le stockage du navigateur', async () => {
    await champ(page, 'Adresse électronique').fill(compte.email);
    await champ(page, 'Mot de passe').fill(compte.motDePasse);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await page.waitForURL((url) => url.pathname === '/espace/membre');
    await calme(page);
    const stockage = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
    attendu(!/eyJ|accessToken|refreshToken/.test(stockage), 'aucun jeton ne doit figurer dans le stockage du navigateur');
    attendu(await contient(page, compte.prenom), 'le tableau de bord doit saluer le membre par son prénom');
  });

  await etape('Profil : consultation, modification de la filière et de la présentation, valeurs relues sur le profil', async () => {
    await menu(page, 'Mon profil');
    const profil = await texte(page);
    attendu(profil.includes(compte.email) && profil.includes('Génie logiciel, 2e année'), 'le profil doit afficher les informations saisies à l’inscription');
    await page.getByRole('link', { name: 'Modifier le profil' }).click();
    await calme(page);
    await page.getByLabel(/Filière/).fill('Réseaux et télécommunications');
    await page.getByLabel(/Présentation/).fill('Étudiante intéressée par le développement web et les réseaux.');
    await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();
    await page.waitForURL((url) => url.pathname === '/espace/profil');
    await calme(page);
    const modifie = await texte(page);
    attendu(modifie.includes('Réseaux et télécommunications') && modifie.includes('développement web'), 'le profil doit afficher les valeurs modifiées');
  });

  await etape('Déconnexion : retour au site, l’espace n’est plus accessible', async () => {
    const ouvrir = page.getByRole('button', { name: 'Ouvrir le menu de l’espace' });
    if (await ouvrir.isVisible()) await ouvrir.click();
    await page.getByRole('button', { name: 'Déconnexion' }).click();
    await page.waitForURL((url) => url.pathname === '/');
    await page.goto(`${BASE}/espace/profil`, { waitUntil: 'networkidle' });
    attendu(chemin(page) === '/connexion', 'un visiteur doit être renvoyé à la connexion');
  }, { erreursAttendues: ['401'] });

  const nouveau = 'Nouveau@2026-Mariam';
  let lien;
  await etape('Mot de passe oublié : demande, courriel reçu, nouveau mot de passe enregistré', async () => {
    await page.goto(`${BASE}/mot-de-passe-oublie`, { waitUntil: 'networkidle' });
    await champ(page, 'Adresse électronique').fill(compte.email);
    await page.getByRole('button', { name: 'Envoyer le lien' }).click();
    await page.getByRole('status').waitFor();
    lien = lienDuCourriel(await courrielPour(compte.email, 'Réinitialisation'), 'reinitialisation');
    await page.goto(BASE + lien, { waitUntil: 'networkidle' });
    await champ(page, 'Nouveau mot de passe').fill(nouveau);
    await champ(page, 'Confirmation du mot de passe').fill(nouveau);
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await page.waitForURL((url) => url.pathname === '/connexion');
    await page.getByRole('status').waitFor();
  });

  await etape('Le lien de réinitialisation ne sert qu’une fois', async () => {
    await page.goto(BASE + lien, { waitUntil: 'networkidle' });
    await champ(page, 'Nouveau mot de passe').fill('Autre@2026-Mariam');
    await champ(page, 'Confirmation du mot de passe').fill('Autre@2026-Mariam');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await page.getByRole('alert').first().waitFor();
  }, { erreursAttendues: ['400'] });

  await etape('L’ancien mot de passe est refusé, le nouveau ouvre la session', async () => {
    await page.goto(`${BASE}/connexion`, { waitUntil: 'networkidle' });
    await champ(page, 'Adresse électronique').fill(compte.email);
    await champ(page, 'Mot de passe').fill(compte.motDePasse);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await page.getByRole('alert').first().waitFor();
    await connecter(page, compte.email, nouveau);
    attendu(chemin(page) === '/espace/membre', 'le nouveau mot de passe doit ouvrir la session');
    etat.membre = { ...compte, motDePasse: nouveau };
  }, { erreursAttendues: ['401'] });
}
