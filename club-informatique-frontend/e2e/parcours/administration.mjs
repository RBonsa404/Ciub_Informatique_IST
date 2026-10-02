// Parcours de l'Administrateur (12.6), de la DSI (12.8) et du Super Admin (12.7).
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE, MOT_DE_PASSE, MOT_DE_PASSE_INITIAL, PREMIER_ADMIN, demarrerBackend, enBase } from './pile.mjs';
import { adresseNeuve, aller, api, attendu, calme, chemin, COMPTES, confirmer, connecter, contient, courrielPour, lienDuCourriel, lire, menu, notification, oublierJetons, texte } from './outils.mjs';

const champ = (page, libelle) => page.getByLabel(new RegExp(`^\\s*${libelle}(\\s*\\*)?\\s*$`));

// ---------------------------------------------------------------- Administrateur

export async function parcoursAdministrateur({ page, etape }, etat) {
  const membre = etat.membre;
  const invite = { email: adresseNeuve('salif.nikiema'), prenom: 'Salif', nom: 'Nikiéma', motDePasse: 'Invite@2026-Salif' };
  const compteDuMembre = async () => (await lire(COMPTES.admin, `/admin/users?search=${encodeURIComponent(membre.email)}`)).content[0];

  await etape('Connexion de l’administrateur : tableau de bord d’administration', async () => {
    await connecter(page, COMPTES.admin);
    attendu(chemin(page) === '/espace/admin', `accueil du rôle attendu, et non ${chemin(page)}`);
  });

  await etape('Utilisateurs : recherche d’un compte, ouverture de sa fiche', async () => {
    await menu(page, 'Utilisateurs');
    await page.getByLabel('Rechercher un compte').fill(membre.email);
    await page.waitForTimeout(900);
    await calme(page);
    attendu((await page.locator('tbody tr').count()) === 1, 'la recherche par adresse doit renvoyer un seul compte');
    await page.getByRole('link', { name: /^Éditer/ }).click();
    await calme(page);
    attendu(await contient(page, membre.email), 'la fiche doit afficher l’adresse du compte');
  });

  await etape('Compte : modification de la filière, attribution du rôle Formateur', async () => {
    await page.getByLabel(/Filière/).fill('Génie logiciel, 3e année');
    await page.getByRole('checkbox', { name: 'Formateur', exact: true }).check();
    for (const reserve of ['Super Admin', 'DSI']) {
      const case_ = page.getByRole('checkbox', { name: reserve, exact: true });
      attendu((await case_.count()) === 0 || (await case_.isDisabled()), `un administrateur ne doit pas pouvoir attribuer le rôle ${reserve}`);
    }
    await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();
    await notification(page, 'Le compte et ses rôles sont mis à jour.');
    const compte = await compteDuMembre();
    attendu(compte.filiere === 'Génie logiciel, 3e année' && compte.roles.includes('FORMATEUR'), `filière et rôle attendus : ${JSON.stringify(compte.roles)}`);
    const refus = await api(COMPTES.admin, 'PUT', `/admin/users/${compte.id}/roles`, { roles: ['MEMBRE', 'SUPER_ADMIN'] });
    attendu(refus.status === 403, `l’attribution du rôle Super Admin par un administrateur devait être refusée (403), et non ${refus.status}`);
    oublierJetons();
    attendu((await api([membre.email, membre.motDePasse], 'GET', '/gestion/formations')).status === 200, 'le nouveau rôle doit ouvrir les droits du formateur');
  });

  await etape('Compte : suspension (la connexion est refusée), puis réactivation', async () => {
    await calme(page);
    await page.getByRole('button', { name: 'Suspendre' }).click();
    await confirmer(page, 'Suspendre');
    await notification(page, 'Le compte est suspendu.');
    const refus = await fetch(`${BASE}/api/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: membre.email, motDePasse: membre.motDePasse }) });
    attendu(refus.status === 403 && (await refus.json()).code === 'COMPTE_SUSPENDU', 'un compte suspendu ne doit plus pouvoir se connecter');
    await calme(page);
    await page.getByRole('button', { name: 'Réactiver' }).click();
    await confirmer(page, 'Réactiver');
    await notification(page, 'Le compte est réactivé.');
    await calme(page);
    // Retour au seul rôle de membre pour la suite des parcours.
    await page.getByRole('checkbox', { name: 'Formateur', exact: true }).uncheck();
    await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();
    await notification(page, 'Le compte et ses rôles sont mis à jour.');
    oublierJetons();
    attendu((await api([membre.email, membre.motDePasse], 'GET', '/users/me')).status === 200, 'le compte réactivé doit pouvoir se reconnecter');
  });

  await etape('Invitation : la personne invitée reçoit un lien, choisit son mot de passe et accède à l’espace de son rôle', async () => {
    await calme(page);
    await aller(page, '/espace/admin/utilisateurs');
    await page.getByRole('button', { name: 'Inviter un utilisateur' }).click();
    await champ(page, 'Prénom').fill(invite.prenom);
    await champ(page, 'Nom').fill(invite.nom);
    await champ(page, 'Adresse électronique').fill(invite.email);
    await page.locator('form').getByRole('combobox', { name: /Rôle/ }).selectOption('RESPONSABLE_CLUB');
    await page.getByRole('button', { name: 'Envoyer l’invitation' }).click();
    await notification(page, 'L’invitation est envoyée.');
    const lien = lienDuCourriel(await courrielPour(invite.email, 'Invitation'), 'reinitialisation');

    const contexteInvite = await page.context().browser().newContext({ locale: 'fr-FR', viewport: page.viewportSize() });
    try {
      const invitePage = await contexteInvite.newPage();
      await invitePage.goto(BASE + lien, { waitUntil: 'networkidle' });
      await champ(invitePage, 'Nouveau mot de passe').fill(invite.motDePasse);
      await champ(invitePage, 'Confirmation du mot de passe').fill(invite.motDePasse);
      await invitePage.getByRole('button', { name: 'Enregistrer' }).click();
      await invitePage.waitForURL((url) => url.pathname === '/connexion');
      await connecter(invitePage, invite.email, invite.motDePasse);
      attendu(chemin(invitePage) === '/espace/gestion', `la personne invitée comme responsable doit arriver sur l’espace de gestion, et non ${chemin(invitePage)}`);
    } finally {
      await contexteInvite.close();
    }
    etat.invite = invite;
  });

  await etape('Messages de contact : le message du visiteur est consulté puis marqué comme traité', async () => {
    await menu(page, 'Messages de contact');
    const carte = page.getByRole('listitem').filter({ hasText: etat.objetDuMessage });
    attendu((await carte.count()) === 1, 'le message du visiteur doit être listé');
    await carte.getByRole('button', { name: /^Marquer comme traité/ }).click();
    await notification(page, 'Le message est marqué comme traité.');
    await calme(page);
    await page.getByRole('button', { name: 'Traités' }).click();
    await calme(page);
    attendu(await contient(page, etat.objetDuMessage), 'le message traité doit figurer sous le filtre « Traités »');
  });

  await etape('Journal d’audit : les actions sensibles du parcours y figurent ; filtres par compte et par résultat', async () => {
    await menu(page, 'Journal d’audit');
    const journal = (await lire(COMPTES.admin, '/admin/security/audit-logs?size=100')).content;
    const actions = new Set(journal.map((e) => e.action));
    for (const action of ['CONNEXION', 'ROLES_MODIFIES', 'STATUT_MODIFIE', 'INVITATION']) {
      attendu(actions.has(action), `le journal doit contenir une entrée « ${action} » (présentes : ${[...actions].join(', ')})`);
    }
    attendu((await page.locator('tbody tr').count()) >= 5, 'les entrées du journal doivent être listées');
    await page.getByLabel('Résultat').selectOption('ECHEC');
    await calme(page);
    const echecs = (await lire(COMPTES.admin, '/admin/security/audit-logs?statut=ECHEC&size=20')).totalElements;
    attendu((await page.locator('tbody tr').count()) === Math.min(echecs, 20), `le filtre « Échec » doit afficher les ${echecs} entrées en échec du serveur`);
    await page.getByLabel('Résultat').selectOption({ index: 0 });
    await page.locator('#filtre-compte').fill(membre.email);
    await page.waitForTimeout(900);
    await calme(page);
    const lignes = await page.locator('tbody tr').allInnerTexts();
    attendu(lignes.length >= 1 && lignes.every((l) => l.includes(membre.email)), 'le filtre par compte ne doit garder que les entrées de ce compte');
  });

  await etape('Catégories : création puis suppression', async () => {
    const nom = `Cybersécurité ${Date.now().toString(36)}`;
    await menu(page, 'Catégories');
    await page.getByRole('button', { name: 'Nouvelle catégorie' }).click();
    await champ(page, 'Nom').fill(nom);
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await notification(page, 'La catégorie est créée.');
    attendu((await lire(null, '/categories')).some((c) => c.nom === nom), 'la catégorie créée doit être renvoyée par le serveur');
    await calme(page);
    await page.getByRole('listitem').filter({ hasText: nom }).getByRole('button', { name: /^Supprimer/ }).click();
    await confirmer(page, 'Supprimer');
    await notification(page, 'La catégorie est supprimée.');
    attendu(!(await lire(null, '/categories')).some((c) => c.nom === nom), 'la catégorie supprimée ne doit plus être renvoyée');
  });

  await etape('Les écrans du Super Admin et de la DSI sont refusés à l’administrateur', async () => {
    for (const route of ['/espace/systeme', '/espace/dsi']) {
      await aller(page, route);
      attendu(chemin(page) === '/acces-refuse', `${route} devait être refusé à l’administrateur`);
    }
    attendu((await api(COMPTES.admin, 'GET', '/admin/system/config')).status === 403 && (await api(COMPTES.admin, 'GET', '/dsi/conformite')).status === 403, 'le serveur doit refuser ces accès (403)');
  });
}

// ---------------------------------------------------------------- DSI

export async function parcoursDsi({ page, etape }) {
  await etape('Connexion de la DSI : supervision technique', async () => {
    await connecter(page, COMPTES.dsi);
    attendu(chemin(page) === '/espace/dsi', `accueil du rôle attendu, et non ${chemin(page)}`);
  });

  await etape('État technique : chaque contrôle calculé par le serveur est affiché avec son résultat', async () => {
    const conformite = await lire(COMPTES.dsi, '/dsi/conformite');
    const contenu = await texte(page);
    for (const verification of conformite.verifications) {
      attendu(contenu.includes(verification.libelle), `contrôle non affiché : ${verification.libelle}`);
    }
    attendu(contenu.includes(conformite.versionBackend) && contenu.includes(conformite.versionJava), 'les versions renvoyées par le serveur doivent être affichées');
    const nonConformes = conformite.verifications.filter((v) => !v.conforme).length;
    attendu(nonConformes === 0 || contenu.toLowerCase().includes('non conforme'), 'un contrôle non conforme doit être signalé');
    return `${conformite.verifications.length} contrôles, dont ${nonConformes} non conformes sur la pile locale (comptes de test présents, cookie non sécurisé hors HTTPS)`;
  });

  await etape('Journal consulté par la DSI ; les écrans d’administration lui sont refusés', async () => {
    attendu((await page.locator('tbody tr').count()) >= 1, 'les entrées du journal doivent être listées');
    for (const route of ['/espace/admin', '/espace/systeme', '/espace/gestion']) {
      await aller(page, route);
      attendu(chemin(page) === '/acces-refuse', `${route} devait être refusé à la DSI`);
    }
    attendu((await api(COMPTES.dsi, 'GET', '/admin/users')).status === 403, 'le serveur doit refuser la gestion des comptes à la DSI');
    return 'aucune demande de support ni de maintenance au cahier des charges : rien à gérer au-delà de la consultation';
  });
}

// ---------------------------------------------------------------- Super Admin

const decompte = (requete) => Number(enBase(requete));

export async function parcoursSuperAdmin({ page, etape }, etat) {
  const nouveau = 'Admin@2026-Premier';
  const admin = [PREMIER_ADMIN, nouveau];

  await etape('Amorçage vérifié en base : un seul Super Admin réel, créé au démarrage, mot de passe à changer', async () => {
    const ligne = enBase(`SELECT u.test, u.changement_mot_de_passe_requis, u.statut FROM utilisateur u WHERE u.email = '${PREMIER_ADMIN}'`);
    attendu(ligne === 'f|t|ACTIF', `compte d’amorçage attendu : réel, actif, changement requis (lu : ${ligne})`);
    const reels = decompte("SELECT COUNT(*) FROM utilisateur u JOIN utilisateur_role ur ON ur.utilisateur_id = u.id JOIN role r ON r.id = ur.role_id WHERE r.nom = 'ROLE_SUPER_ADMIN' AND u.test = false AND u.deleted_at IS NULL");
    attendu(reels === 1, `un seul Super Admin réel attendu : ${reels}`);
  });

  await etape('Première connexion : changement de mot de passe imposé, aucune autre page ni requête n’est permise', async () => {
    await connecter(page, PREMIER_ADMIN, MOT_DE_PASSE_INITIAL, /^\/espace\/mot-de-passe$/);
    await aller(page, '/espace/admin/utilisateurs');
    attendu(chemin(page) === '/espace/mot-de-passe', 'la navigation devait être refusée tant que le mot de passe n’est pas changé');
    const refus = await api([PREMIER_ADMIN, MOT_DE_PASSE_INITIAL], 'GET', '/admin/users');
    attendu(refus.status === 403 && refus.json?.code === 'CHANGEMENT_MOT_DE_PASSE_REQUIS', `le serveur devait refuser la requête : ${refus.status} ${refus.json?.code}`);
  });

  await etape('Choix du mot de passe : l’initial erroné est refusé, puis le changement réussit', async () => {
    await champ(page, 'Mot de passe initial').fill('Inexact@2026');
    await champ(page, 'Nouveau mot de passe').fill(nouveau);
    await champ(page, 'Confirmation du nouveau mot de passe').fill(nouveau);
    await page.getByRole('button', { name: 'Enregistrer et continuer' }).click();
    await page.getByText('Le mot de passe initial est incorrect.').waitFor();
    await champ(page, 'Mot de passe initial').fill(MOT_DE_PASSE_INITIAL);
    await page.getByRole('button', { name: 'Enregistrer et continuer' }).click();
    await notification(page, /Votre mot de passe est enregistré/);
    await page.waitForURL((url) => url.pathname !== '/espace/mot-de-passe');
    await calme(page);
    attendu(enBase(`SELECT changement_mot_de_passe_requis FROM utilisateur WHERE email = '${PREMIER_ADMIN}'`) === 'f', 'l’obligation de changement doit être levée en base');
    oublierJetons();
    attendu((await api(admin, 'GET', '/admin/users')).status === 200, 'le nouveau mot de passe doit ouvrir tous les droits');
    await courrielPour(PREMIER_ADMIN, 'mot de passe a été modifié');
  }, { erreursAttendues: ['400'] });

  await etape('Réglages : le seuil de verrouillage modifié est réellement appliqué par le serveur', async () => {
    if (chemin(page) === '/connexion') await connecter(page, PREMIER_ADMIN, nouveau);
    await menu(page, 'Configuration et sauvegardes');
    await page.getByLabel(/Tentatives de connexion avant verrouillage/).fill('3');
    await page.getByRole('button', { name: 'Enregistrer les réglages' }).click();
    await notification(page, 'Les réglages sont enregistrés.');
    const cible = etat.invite.email;
    const tenter = (motDePasse) => fetch(`${BASE}/api/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: cible, motDePasse }) });
    for (let essai = 0; essai < 3; essai++) attendu((await tenter('Faux@2026-essai')).status === 401, 'un mot de passe erroné doit être refusé');
    attendu((await tenter(etat.invite.motDePasse)).status === 423, 'après trois échecs, le compte doit être verrouillé (423), même avec le bon mot de passe');
    await calme(page);
    await page.getByLabel(/Tentatives de connexion avant verrouillage/).fill('5');
    await page.getByRole('button', { name: 'Enregistrer les réglages' }).click();
    await notification(page, 'Les réglages sont enregistrés.');
  });

  await etape('Compte verrouillé : signalé parmi les alertes de sécurité, déverrouillé depuis sa fiche', async () => {
    await calme(page);
    await menu(page, 'Sécurité des comptes');
    attendu(await contient(page, etat.invite.email), 'le compte verrouillé doit figurer parmi les alertes');
    const compte = (await lire(admin, `/admin/users?search=${encodeURIComponent(etat.invite.email)}`)).content[0];
    await aller(page, `/espace/admin/utilisateurs/${compte.id}`);
    await page.getByRole('button', { name: 'Déverrouiller' }).click();
    await notification(page, 'Le compte est déverrouillé.');
    const session = await fetch(`${BASE}/api/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: etat.invite.email, motDePasse: etat.invite.motDePasse }) });
    attendu(session.status === 200, `le compte déverrouillé doit pouvoir se connecter : ${session.status}`);
  });

  await etape('Rôles du plus haut niveau : le Super Admin attribue le rôle Administrateur et le rôle DSI', async () => {
    await calme(page);
    await page.getByRole('checkbox', { name: 'Administrateur', exact: true }).check();
    attendu(await page.getByRole('checkbox', { name: 'DSI', exact: true }).isEnabled(), 'le Super Admin doit pouvoir attribuer le rôle DSI');
    await page.getByRole('checkbox', { name: 'DSI', exact: true }).check();
    await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();
    await notification(page, 'Le compte et ses rôles sont mis à jour.');
    const compte = (await lire(admin, `/admin/users?search=${encodeURIComponent(etat.invite.email)}`)).content[0];
    attendu(compte.roles.includes('ADMIN') && compte.roles.includes('DSI'), `rôles attendus : ${JSON.stringify(compte.roles)}`);
  });

  await etape('Mode maintenance : activé avec confirmation, le site répond 503 aux visiteurs ; puis désactivé', async () => {
    await calme(page);
    await aller(page, '/espace/systeme');
    await page.getByRole('checkbox', { name: 'Activer le mode maintenance' }).check();
    await page.getByRole('button', { name: 'Enregistrer les réglages' }).click();
    await confirmer(page, 'Activer');
    await notification(page, 'Les réglages sont enregistrés.');
    const visiteur = await api(null, 'GET', '/formations');
    attendu(visiteur.status === 503 && visiteur.json?.code === 'MAINTENANCE', `un visiteur doit recevoir 503 pendant la maintenance : ${visiteur.status}`);
    attendu((await api(admin, 'GET', '/admin/system/config')).status === 200, 'le Super Admin doit garder l’accès pendant la maintenance');
    await calme(page);
    await page.getByRole('checkbox', { name: 'Activer le mode maintenance' }).uncheck();
    await page.getByRole('button', { name: 'Enregistrer les réglages' }).click();
    await notification(page, 'Les réglages sont enregistrés.');
    attendu((await api(null, 'GET', '/formations')).status === 200, 'le site doit être rétabli après la maintenance');
  });

  await etape('Sauvegardes : l’écran affiche le résultat réel d’une sauvegarde faite par le script d’exploitation', async () => {
    const script = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'club-informatique-backend', 'scripts', 'sauvegarde.sh');
    execFileSync('docker', ['cp', script, 'ci-ist-pg:/tmp/sauvegarde.sh'], { stdio: 'pipe' });
    execFileSync('docker', ['exec', '-e', 'PGUSER=postgres', '-e', 'PGDATABASE=club_parcours', '-e', 'DOSSIER_SAUVEGARDES=/tmp/sauvegardes-parcours', 'ci-ist-pg', 'sh', '/tmp/sauvegarde.sh'], { stdio: 'pipe' });
    await calme(page);
    await aller(page, '/espace/admin');
    await aller(page, '/espace/systeme');
    const sauvegardes = await lire(admin, '/admin/system/sauvegardes');
    attendu(sauvegardes.length >= 1 && sauvegardes[0].statut === 'REUSSIE', 'la sauvegarde réelle doit être enregistrée');
    attendu((await texte(page)).toLowerCase().includes('réussie'), 'l’écran doit afficher le résultat de la sauvegarde');
  });

  await etape('Retrait des comptes de test : exécuté, vérifié en base ; les comptes réels et leur contenu subsistent', async () => {
    const avant = { test: decompte('SELECT COUNT(*) FROM utilisateur WHERE test = true'), reels: decompte('SELECT COUNT(*) FROM utilisateur WHERE test = false AND deleted_at IS NULL') };
    attendu(avant.test === 6, `six comptes de test attendus avant le retrait : ${avant.test}`);
    await demarrerBackend({ purge: true });
    oublierJetons();
    const apres = { test: decompte('SELECT COUNT(*) FROM utilisateur WHERE test = true'), reels: decompte('SELECT COUNT(*) FROM utilisateur WHERE test = false AND deleted_at IS NULL') };
    attendu(apres.test === 0, `plus aucun compte de test ne doit rester : ${apres.test}`);
    attendu(apres.reels === avant.reels, `les comptes réels doivent subsister : ${avant.reels} puis ${apres.reels}`);
    const refus = await fetch(`${BASE}/api/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: COMPTES.admin, motDePasse: MOT_DE_PASSE }) });
    attendu(refus.status === 401, `un compte de test retiré ne doit plus pouvoir se connecter : ${refus.status}`);
    attendu(!(await lire(null, '/formations?size=50')).content.some((f) => f.titre === etat.cours.titre), 'les contenus créés par les comptes de test doivent être retirés');
    attendu((await api([etat.membre.email, etat.membre.motDePasse], 'GET', '/users/me')).status === 200, 'un compte réel doit rester utilisable');
    attendu(decompte("SELECT COUNT(*) FROM audit_log WHERE action = 'PURGE_COMPTES_DE_TEST'") >= 1, 'le retrait doit être inscrit au journal d’audit');
    return `${avant.test} comptes de test retirés, ${apres.reels} comptes réels conservés`;
  });

  await etape('Retrait rejoué : comptes de test recréés puis retirés de nouveau, sans effet sur les comptes réels', async () => {
    await demarrerBackend({ comptesDeTest: true });
    attendu(decompte('SELECT COUNT(*) FROM utilisateur WHERE test = true') === 6, 'les six comptes de test doivent être recréés');
    const reels = decompte('SELECT COUNT(*) FROM utilisateur WHERE test = false AND deleted_at IS NULL');
    await demarrerBackend({ purge: true });
    attendu(decompte('SELECT COUNT(*) FROM utilisateur WHERE test = true') === 0, 'le second retrait doit de nouveau tout retirer');
    attendu(decompte('SELECT COUNT(*) FROM utilisateur WHERE test = false AND deleted_at IS NULL') === reels, 'les comptes réels ne doivent pas être touchés');
    oublierJetons();
  });

  await etape('Après le retrait, le Super Admin réel administre toujours la plateforme', async () => {
    await connecter(page, PREMIER_ADMIN, nouveau);
    await menu(page, 'Utilisateurs');
    const lignes = await page.locator('tbody tr').allInnerTexts();
    attendu(lignes.length >= 2 && !lignes.some((l) => l.includes('recette.invalid')), 'la liste des comptes ne doit plus contenir aucun compte de test');
    const stats = await lire(admin, '/admin/statistiques');
    attendu(stats.totalMembres === decompte('SELECT COUNT(*) FROM utilisateur WHERE test = false AND deleted_at IS NULL'), 'le total des comptes doit correspondre à la base');
  });

  etat.premierAdmin = { email: PREMIER_ADMIN, motDePasse: nouveau };
}
