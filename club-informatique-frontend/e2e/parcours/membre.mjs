// Parcours du Membre (12.3), avec le compte réel créé par le parcours du Visiteur : formations, événements, publications,
// inscriptions, supports, notifications, photo de profil, proposition de projet, données personnelles, écrans des autres rôles refusés.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { aller, api, attendu, calme, chemin, confirmer, connecter, imageDEssai, lire, menu, notification, PDF, texte } from './outils.mjs';

const ECRANS_DES_AUTRES_ROLES = ['/espace/formateur', '/espace/formateur/cours', '/espace/gestion', '/espace/gestion/evenements', '/espace/admin', '/espace/admin/utilisateurs', '/espace/admin/messages', '/espace/systeme', '/espace/dsi'];

export async function parcoursMembre({ page, etape, dossier }, etat) {
  const membre = etat.membre;
  const compte = [membre.email, membre.motDePasse];
  const projet = `Carte interactive du campus ${Date.now().toString(36)}`;

  await etape('Connexion du membre : tableau de bord', async () => {
    await connecter(page, membre.email, membre.motDePasse);
    attendu(chemin(page) === '/espace/membre', `accueil du rôle attendu, et non ${chemin(page)}`);
  });

  await etape('Consultation des formations, des événements et des publications réservées aux membres', async () => {
    await aller(page, '/formations');
    attendu((await texte(page)).includes(etat.cours.titre), 'la formation publiée par le formateur doit être listée');
    await aller(page, '/evenements');
    attendu((await texte(page)).includes(etat.evenement.titre), 'l’événement publié par le responsable doit être listé');
    await aller(page, '/espace/membre');
    await menu(page, 'Publications');
    attendu((await texte(page)).includes(etat.publication), 'l’annonce réservée aux membres doit être listée');
    await page.getByRole('link', { name: etat.publication }).first().click();
    await calme(page);
    attendu((await texte(page)).includes('mercredi après-midi'), 'le détail de l’annonce doit afficher son contenu');
  });

  await etape('Inscription à une séance de formation : confirmée', async () => {
    await aller(page, `/formations/${etat.cours.slug}`);
    await page.getByRole('button', { name: /Participer/ }).first().click();
    await notification(page, 'Votre inscription est confirmée.');
    await calme(page);
    attendu((await page.getByRole('button', { name: 'Annuler mon inscription' }).count()) >= 1, 'l’inscription confirmée doit proposer son annulation');
  });

  await etape('Inscription à un événement complet : liste d’attente', async () => {
    const evenement = (await lire(null, '/evenements?size=50')).content.find((e) => e.titre === etat.evenement.titre);
    await aller(page, `/evenements/${evenement.slug}`);
    await page.getByRole('button', { name: 'Rejoindre la liste d’attente' }).click();
    await notification(page, 'Vous êtes inscrit sur la liste d’attente.');
    await calme(page);
  });

  await etape('Mes inscriptions : statuts réels, filtre, annulation de l’inscription en liste d’attente', async () => {
    await aller(page, '/espace/membre');
    await menu(page, 'Mes inscriptions');
    const liste = await texte(page);
    attendu(liste.includes(etat.cours.titre) && liste.includes(etat.evenement.titre), 'les deux inscriptions doivent être listées');
    await page.getByRole('button', { name: 'Liste d’attente' }).click();
    await calme(page);
    const filtree = await texte(page);
    attendu(filtree.includes(etat.evenement.titre) && !filtree.includes(etat.cours.titre), 'le filtre doit ne garder que la liste d’attente');
    await page.getByRole('button', { name: /^Annuler/ }).first().click();
    await confirmer(page, 'Annuler l’inscription');
    await notification(page, 'Votre inscription est annulée.');
    const statuts = (await lire(compte, '/inscriptions/me?size=50')).content.map((i) => i.statut).sort();
    attendu(statuts.includes('CONFIRMEE') && statuts.includes('ANNULEE') && !statuts.includes('LISTE_ATTENTE'), `statuts attendus : confirmée et annulée (${statuts.join(', ')})`);
  });

  await etape('Suivi : le support de la formation suivie est accessible et se télécharge', async () => {
    await calme(page);
    await menu(page, 'Supports et devoirs');
    await page.getByRole('listitem').filter({ hasText: etat.support }).getByRole('link').first().click();
    await calme(page);
    const [telechargement] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: /Ouvrir le support/ }).click()]);
    const fichier = join(dossier, 'support.pdf');
    await telechargement.saveAs(fichier);
    attendu(readFileSync(fichier).equals(PDF), 'le support téléchargé doit être identique au fichier déposé par le formateur');
  });

  await etape('Notifications : non lues comptées, lecture d’une notification, puis de toutes', async () => {
    const nonLues = async () => (await lire(compte, '/notifications?lue=false&size=1')).totalElements;
    const avant = await nonLues();
    attendu(avant >= 2, `au moins deux notifications non lues attendues (inscriptions, annonce) : ${avant}`);
    await aller(page, '/espace/membre');
    attendu((await page.getByRole('link', { name: new RegExp(`Notifications, ${avant} non lues?`) }).count()) === 1, 'la cloche doit annoncer le nombre réel de notifications non lues');
    await page.getByRole('link', { name: /^Notifications, / }).click();
    await calme(page);
    attendu((await texte(page)).includes(etat.annonce), 'l’annonce globale du responsable doit figurer dans les notifications');
    await page.getByRole('button', { name: /^Marquer comme lue/ }).first().click();
    await calme(page);
    attendu((await nonLues()) === avant - 1, 'une seule notification doit passer à « lue »');
    await page.getByRole('button', { name: 'Tout marquer comme lu' }).click();
    await notification(page, 'Toutes vos notifications sont marquées comme lues.');
    attendu((await nonLues()) === 0, 'plus aucune notification non lue ne doit rester');
    await page.getByRole('button', { name: /^Non lues/ }).click();
    await calme(page);
    attendu((await page.getByRole('link', { name: 'Notifications', exact: true }).count()) >= 1, 'la cloche ne doit plus annoncer de notification non lue');
  });

  await etape('Photo de profil : dépôt d’une image, affichée sur le profil ; un fichier qui n’est pas une image est refusé', async () => {
    await calme(page);
    await menu(page, 'Mon profil');
    await page.getByRole('link', { name: 'Modifier le profil' }).click();
    await calme(page);
    const image = await imageDEssai(page);
    await page.locator('input[type="file"]').setInputFiles({ name: 'document.pdf', mimeType: 'application/pdf', buffer: PDF });
    await page.getByText('Choisissez une image au format PNG, JPG ou WebP.').waitFor();
    await page.locator('input[type="file"]').setInputFiles({ name: 'portrait.png', mimeType: 'image/png', buffer: image });
    await notification(page, 'Votre photo de profil est enregistrée.');
    await page.locator('.avatar img').waitFor();
    const profil = await lire(compte, '/users/me');
    attendu(/\/fichiers\/[0-9a-f-]{36}$/.test(profil.photo ?? ''), 'le profil doit désigner la photo déposée');
    const anonyme = await fetch(new URL(profil.photo, page.url()).href);
    attendu(anonyme.status === 401, `la photo ne doit pas être servie à un visiteur : ${anonyme.status}`);
    await aller(page, '/espace/profil');
    await page.locator('.avatar img').waitFor();
    const affichee = await page.locator('.avatar img').evaluate((img) => img.complete && img.naturalWidth > 0);
    attendu(affichee, 'la photo doit être affichée sur le profil');
  });

  await etape('Proposition d’un projet : enregistrée, en attente de décision dans « Mes projets »', async () => {
    await menu(page, 'Proposer un projet');
    await page.getByLabel(/Titre du projet/).fill(projet);
    await page.getByLabel(/Technologies envisagées/).fill('Angular, Leaflet');
    await page.getByLabel(/Description et fonctionnalités clés/).fill('Une carte du campus indiquant les salles, les laboratoires et les services. Projet du parcours de recette.');
    await page.getByRole('button', { name: /Transmettre la proposition/ }).click();
    await notification(page, 'Votre proposition est transmise au bureau du club.');
    await page.waitForURL((url) => url.pathname === '/espace/projets');
    await calme(page);
    attendu((await texte(page)).includes(projet), 'la proposition doit figurer dans « Mes projets »');
    attendu((await lire(compte, '/projets/mes-projets?size=50')).content.find((p) => p.titre === projet)?.statut === 'PROPOSE', 'la proposition doit être en attente');
    attendu(!(await lire(null, '/projets?size=50')).content.some((p) => p.titre === projet), 'une proposition non validée ne doit pas être publique');
  });

  await etape('Paramètres : préférence de courriel modifiée ; copie des données personnelles téléchargée', async () => {
    await calme(page);
    await menu(page, 'Paramètres');
    const alertes = page.getByRole('checkbox', { name: 'Alertes par courriel' });
    await alertes.uncheck();
    await notification(page, 'Les alertes par courriel sont désactivées.');
    attendu((await lire(compte, '/users/me/preferences')).notificationsCourriel === false, 'la préférence doit être enregistrée');
    const [telechargement] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Télécharger mes données' }).click()]);
    const fichier = join(dossier, 'mes-donnees.json');
    await telechargement.saveAs(fichier);
    const donnees = JSON.parse(readFileSync(fichier, 'utf8'));
    attendu(donnees.profil?.email === membre.email && Array.isArray(donnees.inscriptions) && !JSON.stringify(donnees).toLowerCase().includes('motdepasse'), 'la copie doit contenir le profil et les inscriptions, jamais le mot de passe');
  });

  await etape('Les écrans des autres rôles sont refusés, dans le navigateur comme par le serveur', async () => {
    for (const route of ECRANS_DES_AUTRES_ROLES) {
      await aller(page, route);
      attendu(chemin(page) === '/acces-refuse', `${route} devait être refusé au membre, et non mener à ${chemin(page)}`);
    }
    await aller(page, '/espace/membre');
    const liens = await page.getByRole('navigation', { name: 'Menu de l’espace' }).getByRole('link').allInnerTexts();
    for (const interdit of ['Mes cours', 'Utilisateurs', 'Projets à valider', 'Configuration et sauvegardes', 'Supervision technique', 'Messages de contact']) {
      attendu(!liens.some((l) => l.trim() === interdit), `le menu du membre ne doit pas proposer « ${interdit} »`);
    }
    for (const acces of ['/admin/users', '/gestion/indicateurs', '/admin/system/config', '/dsi/conformite', '/gestion/formations']) {
      const refus = await api(compte, 'GET', acces);
      attendu(refus.status === 403, `GET ${acces} devait être refusé au membre (403), et non ${refus.status}`);
    }
    return `${ECRANS_DES_AUTRES_ROLES.length} écrans et 5 points d’accès refusés`;
  });
}
