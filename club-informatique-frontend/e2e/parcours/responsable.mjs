// Parcours du Responsable du Club (12.5) : événements, publications, composition du bureau, inscriptions et liste d'attente,
// validation des projets, notification globale.
import { join } from 'node:path';
import { aller, api, attendu, basculer, calme, chemin, COMPTES, confirmer, connecter, dansJours, imageDEssai, lire, menu, notification, texte } from './outils.mjs';

export async function parcoursResponsable({ page, etape, dossier }, etat) {
  const suffixe = Date.now().toString(36);
  const evenement = { titre: `Atelier de rentrée ${suffixe}` };
  const aSupprimer = `Rencontre annulée ${suffixe}`;
  const publique = `Ouverture des ateliers ${suffixe}`;
  const reservee = `Permanences du bureau ${suffixe}`;
  const titresPublics = async (liste) => (await lire(null, `/${liste}?size=50`)).content.map((e) => e.titre);

  await etape('Connexion du responsable : arrivée sur le tableau de bord de gestion', async () => {
    await connecter(page, COMPTES.responsable);
    attendu(chemin(page) === '/espace/gestion', `accueil du rôle attendu, et non ${chemin(page)}`);
  });

  const saisirEvenement = async (titre, capacite) => {
    await page.getByRole('button', { name: 'Nouvel événement' }).click();
    await page.getByLabel(/Titre de l’événement/).fill(titre);
    await page.getByLabel(/^\s*Lieu/).fill('Salle des clubs, IST');
    await page.getByLabel(/^\s*Début/).fill(dansJours(7, 15));
    await page.getByLabel(/^\s*Fin/).fill(dansJours(7, 18));
    await page.getByLabel(/Capacité maximale/).fill(capacite);
    await page.getByLabel(/^\s*Description/).fill('Présentation des activités du semestre et inscription aux ateliers. Événement du parcours de recette.');
    await basculer(page, /Publier l’événement/, true);
    await page.getByRole('button', { name: 'Enregistrer l’événement' }).click();
    await notification(page, 'L’événement est créé.');
    await calme(page);
  };

  await etape('Événement : création et publication, visible à la page publique', async () => {
    await menu(page, 'Événements');
    await saisirEvenement(evenement.titre, '1');
    attendu((await titresPublics('evenements')).includes(evenement.titre), 'l’événement publié doit figurer dans la liste publique');
    await aller(page, '/evenements');
    attendu((await texte(page)).includes(evenement.titre), 'l’événement publié doit figurer à la page publique');
    evenement.id = (await lire(COMPTES.responsable, '/gestion/evenements?size=50')).content.find((e) => e.titre === evenement.titre).id;
  });

  await etape('Événement : modification du lieu', async () => {
    await aller(page, '/espace/gestion/evenements');
    await page.getByRole('button', { name: `Modifier ${evenement.titre}` }).click();
    await page.getByLabel(/^\s*Lieu/).fill('Amphithéâtre de l’IST');
    await page.getByRole('button', { name: 'Enregistrer l’événement' }).click();
    await notification(page, 'L’événement est mis à jour.');
    await calme(page);
    attendu((await lire(null, '/evenements?size=50')).content.find((e) => e.titre === evenement.titre).lieu === 'Amphithéâtre de l’IST', 'le lieu modifié doit être enregistré');
  });

  await etape('Événement : suppression avec confirmation, retrait de la page publique', async () => {
    await saisirEvenement(aSupprimer, '');
    await page.getByRole('button', { name: `Supprimer ${aSupprimer}` }).click();
    await confirmer(page, 'Supprimer');
    await notification(page, 'L’événement est supprimé.');
    attendu(!(await titresPublics('evenements')).includes(aSupprimer), 'l’événement supprimé ne doit plus être public');
  });

  await etape('Publication publique avec image de couverture déposée : visible sur le site, image servie à tous', async () => {
    await menu(page, 'Actualités');
    await page.getByRole('link', { name: 'Nouvelle actualité' }).click();
    await calme(page);
    await page.getByLabel(/^\s*Titre/).fill(publique);
    await page.getByLabel(/Résumé/).fill('Les inscriptions aux ateliers du semestre sont ouvertes.');
    await page.getByRole('textbox', { name: /Contenu/ }).fill('Les inscriptions aux ateliers du semestre sont ouvertes aux membres du club.\n\n# Comment s’inscrire\n\nDepuis la page de chaque formation, une fois connecté.');
    await page.locator('input[type="file"]').setInputFiles({ name: 'couverture.png', mimeType: 'image/png', buffer: await imageDEssai(page) });
    await page.getByText('couverture.png', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Publier', exact: true }).click();
    await notification(page, 'L’actualité est publiée.');
    await calme(page);
    const article = (await lire(null, '/actualites?size=50')).content.find((a) => a.titre === publique);
    attendu(!!article, 'l’actualité publiée doit figurer dans la liste publique');
    attendu(/\/fichiers\/[0-9a-f-]{36}$/.test(article.image ?? ''), 'l’actualité doit désigner l’image déposée');
    const image = await fetch(new URL(article.image, page.url()).href);
    attendu(image.status === 200 && (image.headers.get('content-type') ?? '').startsWith('image/png'), `l’image d’une actualité publique doit être servie à un visiteur : ${image.status}`);
    await aller(page, `/actualites/${article.slug}`);
    attendu((await texte(page)).includes('Comment s’inscrire'), 'l’article public doit afficher son contenu');
    etat.actualite = { titre: publique, slug: article.slug };
  });

  await etape('Publication réservée aux membres : absente du site public, présente dans les publications des membres', async () => {
    await aller(page, '/espace/gestion/actualites/nouvelle');
    await page.getByLabel(/^\s*Titre/).fill(reservee);
    await page.getByLabel(/Résumé/).fill('Les permanences du bureau reprennent chaque mercredi après-midi.');
    await page.getByRole('textbox', { name: /Contenu/ }).fill('Les permanences du bureau reprennent chaque mercredi après-midi, dans la salle des clubs.');
    await page.getByLabel(/Visibilité/).selectOption('MEMBRES');
    await page.getByRole('button', { name: 'Publier', exact: true }).click();
    await notification(page, 'L’actualité est publiée.');
    attendu(!(await titresPublics('actualites')).includes(reservee), 'une annonce réservée ne doit pas figurer dans la liste publique');
    attendu((await lire(COMPTES.membre, '/publications?size=50')).content.some((p) => p.titre === reservee), 'l’annonce doit figurer dans les publications des membres');
    etat.publication = reservee;
  });

  await etape('Publication : retrait puis nouvelle publication depuis la liste', async () => {
    await calme(page);
    await aller(page, '/espace/gestion/actualites');
    await page.getByRole('button', { name: `Dépublier ${publique}`, exact: true }).click();
    await notification(page, 'L’actualité est retirée du site.');
    await calme(page);
    attendu(!(await titresPublics('actualites')).includes(publique), 'l’actualité dépubliée ne doit plus être publique');
    await page.getByRole('button', { name: `Publier ${publique}`, exact: true }).click();
    await notification(page, 'L’actualité est publiée.');
    await calme(page);
    attendu((await titresPublics('actualites')).includes(publique), 'l’actualité republiée doit redevenir publique');
  });

  await etape('Bureau : ajout de deux membres, modification d’une fonction, retrait d’un membre ; page publique sans photo', async () => {
    await menu(page, 'Bureau');
    for (const [prenom, nom, fonction, ordre] of [['Rasmata', 'Kaboré', 'Présidente', '1'], ['Boukary', 'Nikiéma', 'Trésorier', '2']]) {
      await page.getByRole('button', { name: 'Ajouter un membre' }).first().click();
      await page.getByLabel(/^\s*Prénom/).fill(prenom);
      await page.getByLabel(/^\s*Nom/).fill(nom);
      await page.getByLabel(/^\s*Fonction/).fill(fonction);
      await page.getByLabel(/^\s*Filière/).fill('Génie logiciel');
      await page.getByLabel(/Ordre d’affichage/).fill(ordre);
      await page.getByRole('button', { name: 'Enregistrer' }).click();
      await notification(page, 'Le membre est ajouté au bureau.');
      await calme(page);
    }
    await page.getByRole('row').filter({ hasText: 'Nikiéma' }).getByRole('button', { name: /Modifier/ }).click();
    await page.getByLabel(/^\s*Fonction/).fill('Trésorier adjoint');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await notification(page, 'Le membre du bureau est mis à jour.');
    await calme(page);
    await page.getByRole('button', { name: 'Retirer Rasmata Kaboré' }).click();
    await confirmer(page, /Retirer/);
    await notification(page, 'Le membre est retiré du bureau.');
    const bureau = await lire(null, '/bureau');
    attendu(bureau.length >= 1 && bureau.some((m) => m.fonction === 'Trésorier adjoint') && !bureau.some((m) => m.fonction === 'Présidente'), 'la composition publique doit refléter les modifications');
    await aller(page, '/bureau');
    attendu((await texte(page)).includes('Trésorier adjoint'), 'la page publique du bureau doit afficher la fonction modifiée');
    attendu((await page.locator('main img').count()) === 0, 'aucune photo ne doit figurer sur les cartes du bureau');
  });

  await etape('Inscriptions : événement complet, liste d’attente, promotion par le responsable', async () => {
    // Préparation : deux membres s'inscrivent à l'événement d'une seule place (le second passe en liste d'attente).
    const premiere = await api(COMPTES.membre, 'POST', `/inscriptions/evenements/${evenement.id}`);
    const seconde = await api(COMPTES.formateur, 'POST', `/inscriptions/evenements/${evenement.id}`);
    attendu(premiere.json?.statut === 'CONFIRMEE' && seconde.json?.statut === 'LISTE_ATTENTE', `inscriptions attendues : confirmée puis liste d’attente (${premiere.status} ${premiere.json?.statut}, ${seconde.status} ${seconde.json?.statut})`);
    // Une place se libère : le premier inscrit annule.
    const annulation = await api(COMPTES.membre, 'DELETE', `/inscriptions/${premiere.json.id}`);
    attendu(annulation.status < 300, `annulation de la première inscription : ${annulation.status}`);

    await menu(page, 'Inscriptions');
    await page.getByLabel('Activité').selectOption({ label: (await page.getByLabel('Activité').locator('option').allInnerTexts()).find((o) => o.includes(evenement.titre)) });
    await calme(page);
    const inscrits = await lire(COMPTES.responsable, `/inscriptions/evenements/${evenement.id}`);
    const enAttente = inscrits.find((i) => i.statut === 'LISTE_ATTENTE');
    if (enAttente) {
      await page.getByRole('button', { name: /^Promouvoir/ }).first().click();
      await notification(page, /est confirmée\./);
    }
    const apres = await lire(COMPTES.responsable, `/inscriptions/evenements/${evenement.id}`);
    attendu(apres.some((i) => i.statut === 'CONFIRMEE') && !apres.some((i) => i.statut === 'LISTE_ATTENTE'), 'le membre en liste d’attente doit être confirmé');
    await page.screenshot({ path: join(dossier, 'inscriptions.png') });
    return enAttente ? 'promotion faite par le responsable' : 'promotion automatique à la libération de la place';
  });

  await etape('Projets : une proposition est approuvée, une autre rejetée avec motif ; l’auteur est notifié', async () => {
    const proposer = async (titre) => (await api(COMPTES.membre, 'POST', '/projets', { titre, description: 'Projet proposé par un membre pour le parcours de recette.', objectifs: 'Objectifs du projet.', technologies: 'Angular' })).json;
    const retenu = await proposer(`Annuaire des anciens ${suffixe}`);
    const ecarte = await proposer(`Jeu de plateau ${suffixe}`);
    attendu(retenu?.id && ecarte?.id, 'les deux propositions doivent être enregistrées');

    await menu(page, 'Projets à valider');
    attendu((await texte(page)).includes(retenu.titre) && (await texte(page)).includes(ecarte.titre), 'les propositions en attente doivent être listées');
    await aller(page, `/espace/gestion/projets/${retenu.id}`);
    await page.getByRole('button', { name: 'Approuver' }).click();
    await confirmer(page, 'Approuver');
    await notification(page, 'Le projet est approuvé.');
    await calme(page);

    await aller(page, `/espace/gestion/projets/${ecarte.id}`);
    await page.getByRole('button', { name: 'Rejeter' }).click();
    attendu((await texte(page)).includes('Indiquez le motif du rejet.'), 'un rejet sans motif doit être refusé');
    await page.getByLabel(/Motif du rejet/).fill('Sujet déjà traité par un autre projet du club.');
    await page.getByRole('button', { name: 'Rejeter' }).click();
    await confirmer(page, 'Rejeter');
    await notification(page, 'Le projet est rejeté.');

    const mesProjets = (await lire(COMPTES.membre, '/projets/mes-projets?size=50')).content;
    attendu(mesProjets.find((p) => p.id === ecarte.id)?.motifDecision === 'Sujet déjà traité par un autre projet du club.', 'le motif du rejet doit être communiqué à l’auteur');
    attendu((await lire(null, '/projets?size=50')).content.some((p) => p.id === retenu.id), 'le projet approuvé doit figurer au catalogue public');
    const notifications = (await lire(COMPTES.membre, '/notifications?size=50')).content.map((n) => n.type);
    attendu(notifications.includes('VALIDATION_PROJET'), 'l’auteur doit être notifié de la décision');
  });

  await etape('Notification globale : envoi avec confirmation, reçue par les membres', async () => {
    const titre = `Réunion mensuelle ${suffixe}`;
    await menu(page, 'Notification globale');
    await page.getByLabel(/Titre de la notification/).fill(titre);
    await page.getByLabel(/^\s*Message/).fill('La réunion mensuelle se tiendra jeudi à 16 h dans la salle des clubs.');
    await page.getByRole('button', { name: 'Envoyer immédiatement' }).click();
    await confirmer(page, 'Envoyer');
    await notification(page, 'La notification est envoyée aux membres.');
    attendu((await lire(COMPTES.membre, '/notifications?size=50')).content.some((n) => n.titre === titre), 'la notification doit être reçue par un membre');
    etat.annonce = titre;
  });

  etat.evenement = evenement;
}
