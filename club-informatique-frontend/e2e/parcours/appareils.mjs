// Appareils (12.11) : reprise des parcours principaux à 360 et 768 pixels de large. Après chaque étape, la page ne doit
// présenter aucun débordement horizontal ; la navigation passe par les menus repliés des petits écrans.
import { BASE, MOT_DE_PASSE } from './pile.mjs';
import { adresseNeuve, aller, attendu, calme, chemin, COMPTES, confirmer, connecter, contient, courrielPour, dansJours, imageDEssai, lienDuCourriel, lire, menu, notification, sansDebordement, texte } from './outils.mjs';
import { ouvrirPagePublique } from './visiteur.mjs';

const champ = (page, libelle) => page.getByLabel(new RegExp(`^\\s*${libelle}(\\s*\\*)?\\s*$`));

export async function parcoursAppareil({ page, etape: etapeBrute }, etat) {
  const compte = { email: adresseNeuve('awa.ouattara'), motDePasse: MOT_DE_PASSE };
  /** Chaque étape se termine par le contrôle du débordement horizontal de la page affichée. */
  const etape = (nom, action, options) =>
    etapeBrute(nom, async () => {
      const detail = await action();
      await sansDebordement(page);
      return detail;
    }, options);

  await etape('Visiteur : accueil, puis pages publiques par le menu de l’en-tête et le pied de page', async () => {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await calme(page);
    await sansDebordement(page);
    for (const [libelle, route, zone] of [['Formations', '/formations', 'en-tête'], ['Événements', '/evenements', 'en-tête'], ['Actualités', '/actualites', 'en-tête'], ['Contact', '/contact', 'en-tête'], ['Bureau', '/bureau', 'pied de page'], ['Politique de confidentialité', '/confidentialite', 'pied de page']]) {
      await ouvrirPagePublique(page, libelle, zone);
      attendu(chemin(page) === route, `« ${libelle} » devait mener à ${route}, et non à ${chemin(page)}`);
      await sansDebordement(page);
    }
  });

  await etape('Visiteur : détail d’une formation et d’une actualité', async () => {
    await page.goto(`${BASE}/formations/${etat.cours.slug}`, { waitUntil: 'networkidle' });
    await calme(page);
    attendu(await contient(page, etat.cours.titre), 'la fiche de la formation doit s’afficher');
    await sansDebordement(page);
    await page.goto(`${BASE}/actualites/${etat.actualite.slug}`, { waitUntil: 'networkidle' });
    await calme(page);
    attendu(await contient(page, etat.actualite.titre), 'l’article doit s’afficher');
  });

  await etape('Inscription, vérification de l’adresse par courriel, connexion', async () => {
    await page.goto(`${BASE}/inscription`, { waitUntil: 'networkidle' });
    await champ(page, 'Nom').fill('Ouattara');
    await champ(page, 'Prénom').fill('Awa');
    await champ(page, 'Adresse électronique').fill(compte.email);
    await champ(page, 'Filière d’études').fill('Réseaux et télécommunications');
    await champ(page, 'Mot de passe').fill(compte.motDePasse);
    await champ(page, 'Confirmation du mot de passe').fill(compte.motDePasse);
    await page.getByRole('checkbox').check();
    await sansDebordement(page);
    await page.getByRole('button', { name: 'S’inscrire' }).click();
    await page.getByRole('heading', { name: /boîte de réception/ }).waitFor();
    await sansDebordement(page);
    await page.goto(BASE + lienDuCourriel(await courrielPour(compte.email, 'Confirmez votre adresse'), 'verification-adresse'), { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: /Adresse\s+vérifiée/ }).waitFor();
    await sansDebordement(page);
    await connecter(page, compte.email, compte.motDePasse);
    attendu(chemin(page) === '/espace/membre', 'la connexion doit mener au tableau de bord du membre');
  });

  await etape('Membre : inscription à une formation depuis sa fiche, puis « Mes inscriptions » par le menu de l’espace', async () => {
    await aller(page, `/formations/${etat.cours.slug}`);
    await page.getByRole('button', { name: /Participer|liste d’attente/ }).first().click();
    await notification(page, /Votre inscription est confirmée\.|Vous êtes inscrit sur la liste d’attente\./);
    await calme(page);
    await sansDebordement(page);
    await aller(page, '/espace/membre');
    await menu(page, 'Mes inscriptions');
    attendu(await contient(page, etat.cours.titre), 'l’inscription doit être listée');
  });

  await etape('Membre : notifications lues, profil modifié avec photo', async () => {
    await menu(page, 'Notifications');
    await page.getByRole('button', { name: 'Tout marquer comme lu' }).click();
    await notification(page, 'Toutes vos notifications sont marquées comme lues.');
    await sansDebordement(page);
    await calme(page);
    await menu(page, 'Mon profil');
    await sansDebordement(page);
    await page.getByRole('link', { name: 'Modifier le profil' }).click();
    await calme(page);
    await page.locator('input[type="file"]').setInputFiles({ name: 'portrait.png', mimeType: 'image/png', buffer: await imageDEssai(page) });
    await notification(page, 'Votre photo de profil est enregistrée.');
    await page.getByLabel(/Présentation/).fill('Étudiante en réseaux, membre du club depuis cette année.');
    await sansDebordement(page);
    await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();
    await page.waitForURL((url) => url.pathname === '/espace/profil');
    await calme(page);
    attendu(await contient(page, 'membre du club depuis cette année'), 'le profil doit afficher la présentation enregistrée');
  });

  await etape('Membre : paramètres, puis déconnexion par le menu de l’espace', async () => {
    await menu(page, 'Paramètres');
    await sansDebordement(page);
    const ouvrir = page.getByRole('button', { name: 'Ouvrir le menu de l’espace' });
    if (await ouvrir.isVisible()) await ouvrir.click();
    await page.getByRole('button', { name: 'Déconnexion' }).click();
    await page.waitForURL((url) => url.pathname === '/');
  });

  await etape('Formateur : mes cours, détail d’un cours, feuille d’émargement', async () => {
    await connecter(page, COMPTES.formateur);
    await sansDebordement(page);
    await menu(page, 'Mes cours');
    await sansDebordement(page);
    await aller(page, `/espace/formateur/cours/${etat.cours.id}`);
    attendu(await contient(page, etat.cours.titre), 'le détail du cours doit s’afficher');
    await sansDebordement(page);
    await page.getByRole('link', { name: /^Émargement/ }).first().click();
    await calme(page);
    attendu((await page.locator('tbody tr').count()) >= 1, 'les inscrits doivent être listés sur la feuille d’émargement');
  });

  await etape('Responsable : tableau de bord, création d’un événement, inscriptions', async () => {
    const titre = `Permanence ${page.viewportSize().width} ${Date.now().toString(36)}`;
    await connecter(page, COMPTES.responsable);
    await sansDebordement(page);
    await menu(page, 'Événements');
    await sansDebordement(page);
    await page.getByRole('button', { name: 'Nouvel événement' }).click();
    await page.getByLabel(/Titre de l’événement/).fill(titre);
    await page.getByLabel(/^\s*Lieu/).fill('Salle des clubs, IST');
    await page.getByLabel(/^\s*Début/).fill(dansJours(9, 15));
    await page.getByLabel(/^\s*Fin/).fill(dansJours(9, 17));
    await page.getByLabel(/^\s*Description/).fill('Permanence du bureau. Événement créé par la reprise des parcours sur petit écran.');
    await sansDebordement(page);
    await page.getByRole('button', { name: 'Enregistrer l’événement' }).click();
    await notification(page, 'L’événement est créé.');
    await calme(page);
    await sansDebordement(page);
    await page.getByRole('button', { name: `Supprimer ${titre}` }).click();
    await confirmer(page, 'Supprimer');
    await notification(page, 'L’événement est supprimé.');
    await calme(page);
    await menu(page, 'Inscriptions');
  });

  await etape('Administrateur : tableau de bord, liste des comptes (tableau défilant), journal d’audit', async () => {
    await connecter(page, COMPTES.admin);
    await sansDebordement(page);
    await menu(page, 'Utilisateurs');
    attendu((await page.locator('tbody tr').count()) >= 6, 'les comptes doivent être listés');
    await sansDebordement(page);
    await menu(page, 'Journal d’audit');
    await sansDebordement(page);
    await menu(page, 'Statistiques');
    const stats = await lire(COMPTES.admin, '/admin/statistiques');
    attendu(await contient(page, String(stats.totalMembres)), 'les statistiques doivent afficher les totaux du serveur');
  });
}
