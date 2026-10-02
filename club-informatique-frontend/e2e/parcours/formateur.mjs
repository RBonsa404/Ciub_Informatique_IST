// Parcours du Formateur (12.4) : créer, publier, modifier et retirer une formation et une séance ; déposer un support ;
// consulter ses inscrits et pointer les présences. Un membre s'inscrit entre-temps, dans un second navigateur.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { aller, api, attendu, basculer, calme, chemin, COMPTES, confirmer, connecter, contient, dansJours, lire, menu, notification, PDF, texte } from './outils.mjs';

export async function parcoursFormateur({ page, etape, dossier }, etat) {
  const suffixe = Date.now().toString(36);
  const cours = { titre: `Initiation à Git ${suffixe}`, id: null };
  const aRetirer = `Atelier Linux ${suffixe}`;
  const support = `Support de la séance 1 ${suffixe}`;
  const publics = async () => (await lire(null, '/formations?size=50')).content.map((f) => f.titre);

  await etape('Connexion du formateur : arrivée sur son tableau de bord', async () => {
    await connecter(page, COMPTES.formateur);
    attendu(chemin(page) === '/espace/formateur', `accueil du rôle attendu, et non ${chemin(page)}`);
  });

  await etape('Création d’un cours en brouillon : il n’apparaît pas au catalogue public', async () => {
    await menu(page, 'Mes cours');
    await page.getByRole('link', { name: 'Créer un cours' }).first().click();
    await calme(page);
    await page.getByLabel(/Intitulé du cours/).fill(cours.titre);
    await page.getByLabel(/Niveau/).selectOption('DEBUTANT');
    await page.getByLabel(/^\s*Description/).fill('Prendre en main Git pour travailler à plusieurs sur un même projet. Cours du parcours de recette.');
    await page.getByLabel(/Objectifs pédagogiques/).fill('Créer un dépôt, enregistrer des modifications, partager son travail.');
    await page.getByLabel(/Prérequis/).fill('Aucun prérequis.');
    await basculer(page, /Publier le cours/, false);
    await page.getByRole('button', { name: 'Enregistrer le cours' }).click();
    await notification(page, 'Le cours est créé.');
    await page.waitForURL((url) => /\/espace\/formateur\/cours\/\d+$/.test(url.pathname));
    await calme(page);
    cours.id = Number(chemin(page).split('/').pop());
    attendu(!(await publics()).includes(cours.titre), 'un brouillon ne doit pas figurer au catalogue public');
  });

  await etape('Planification de deux séances', async () => {
    for (const [jours, capacite] of [[5, '10'], [12, '']]) {
      await page.getByRole('button', { name: 'Planifier une séance' }).click();
      await page.getByLabel(/^\s*Début/).fill(dansJours(jours, 14));
      await page.getByLabel(/^\s*Fin/).fill(dansJours(jours, 17));
      await page.getByLabel(/^\s*Lieu/).fill('Salle informatique, IST');
      await page.getByLabel(/Capacité maximale/).fill(capacite);
      await page.getByRole('button', { name: 'Planifier la séance' }).click();
      await notification(page, 'La séance est planifiée.');
      await calme(page);
    }
    attendu((await page.getByRole('link', { name: /^Émargement/ }).count()) === 2, 'les deux séances planifiées doivent être listées');
  });

  await etape('Dépôt d’un support (fichier PDF) depuis le détail du cours', async () => {
    await page.getByRole('link', { name: 'Ajouter un support ou un devoir' }).click();
    await calme(page);
    await page.getByLabel(/Type d’élément/).selectOption('SUPPORT_COURS');
    await page.getByLabel(/Titre du devoir ou de la ressource/).fill(support);
    await page.locator('input[type="file"]').setInputFiles({ name: 'support-seance-1.pdf', mimeType: 'application/pdf', buffer: PDF });
    await page.getByText('support-seance-1.pdf', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Publier pour les inscrits' }).click();
    await notification(page, 'La ressource est publiée.');
    await page.waitForURL((url) => url.pathname === `/espace/formateur/cours/${cours.id}`);
    await calme(page);
    attendu(await contient(page, support), 'le support déposé doit figurer dans le détail du cours');
  });

  await etape('Publication du cours : il apparaît au catalogue public', async () => {
    await page.getByRole('link', { name: 'Modifier' }).click();
    await calme(page);
    await basculer(page, /Publier le cours/, true);
    await page.getByRole('button', { name: 'Enregistrer le cours' }).click();
    await notification(page, 'Le cours est mis à jour.');
    await page.waitForURL((url) => /^.espace.formateur.cours.[0-9]+$/.test(url.pathname));
    await calme(page);
    await calme(page);
    await aller(page, '/formations');
    attendu(await contient(page, cours.titre), 'le cours publié doit figurer à la page publique des formations');
  });

  await etape('Modification du cours : la fiche publique reprend la nouvelle valeur', async () => {
    await aller(page, `/espace/formateur/cours/${cours.id}/modifier`);
    await page.getByLabel(/Prérequis/).fill('Savoir utiliser un terminal.');
    await page.getByRole('button', { name: 'Enregistrer le cours' }).click();
    await notification(page, 'Le cours est mis à jour.');
    await page.waitForURL((url) => /^.espace.formateur.cours.[0-9]+$/.test(url.pathname));
    await calme(page);
    const fiche = (await lire(null, '/formations?size=50')).content.find((f) => f.titre === cours.titre);
    await aller(page, `/formations/${fiche.slug}`);
    attendu(await contient(page, 'Savoir utiliser un terminal.'), 'la fiche publique doit afficher le prérequis modifié');
    cours.slug = fiche.slug;
  });

  await etape('Un membre s’inscrit à la première séance depuis la fiche publique (second navigateur)', async () => {
    const contexteMembre = await page.context().browser().newContext({ locale: 'fr-FR', viewport: page.viewportSize(), acceptDownloads: true });
    try {
      const membre = await contexteMembre.newPage();
      await connecter(membre, COMPTES.membre);
      await aller(membre, `/formations/${cours.slug}`);
      await membre.getByRole('button', { name: /Participer/ }).first().click();
      await notification(membre, 'Votre inscription est confirmée.');
      await calme(membre);

      // Le support réservé aux inscrits devient accessible au membre, qui le télécharge.
      await menu(membre, 'Supports et devoirs');
      await membre.getByRole('listitem').filter({ hasText: support }).getByRole('link').first().click();
      await calme(membre);
      const [telechargement] = await Promise.all([membre.waitForEvent('download'), membre.getByRole('link', { name: /Ouvrir le support/ }).click()]);
      const fichier = join(dossier, 'support-telecharge.pdf');
      await telechargement.saveAs(fichier);
      attendu(readFileSync(fichier).equals(PDF), 'le fichier téléchargé par le membre doit être identique au fichier déposé');
      await membre.screenshot({ path: join(dossier, 'membre-support.png') });
    } finally {
      await contexteMembre.close();
    }
    return 'inscription confirmée, support téléchargé à l’identique';
  });

  await etape('Le formateur consulte ses inscrits et pointe les présences de la séance', async () => {
    await aller(page, `/espace/formateur/cours/${cours.id}`);
    await page.getByRole('link', { name: /^Émargement/ }).first().click();
    await calme(page);
    attendu(await contient(page, 'Sawadogo'), 'le membre inscrit doit figurer sur la feuille d’émargement');
    await page.locator('tbody select').first().selectOption('PRESENT');
    await page.getByRole('button', { name: 'Enregistrer la feuille' }).click();
    await notification(page, /est enregistré/);
    await calme(page);
    attendu(await contient(page, 'Dernier enregistrement'), 'la date du dernier enregistrement doit être affichée');
  });

  await etape('Retrait d’une séance (avec confirmation)', async () => {
    await aller(page, `/espace/formateur/cours/${cours.id}`);
    await page.getByRole('button', { name: 'Supprimer la séance 2' }).click();
    await confirmer(page, 'Supprimer');
    await notification(page, 'La suppression est effectuée.');
    await calme(page);
    attendu((await page.getByRole('link', { name: /^Émargement/ }).count()) === 1, 'une seule séance doit rester');
  });

  await etape('Retrait d’une formation du catalogue : un cours publié est dépublié et disparaît de la page publique', async () => {
    await aller(page, '/espace/formateur/cours/nouveau');
    await page.getByLabel(/Intitulé du cours/).fill(aRetirer);
    await page.getByLabel(/^\s*Description/).fill('Cours créé puis retiré du catalogue par le parcours de recette.');
    await basculer(page, /Publier le cours/, true);
    await page.getByRole('button', { name: 'Enregistrer le cours' }).click();
    await notification(page, 'Le cours est créé.');
    await page.waitForURL((url) => /\/espace\/formateur\/cours\/\d+$/.test(url.pathname));
    attendu((await publics()).includes(aRetirer), 'le cours publié doit d’abord figurer au catalogue');
    await calme(page);
    await page.getByRole('link', { name: 'Modifier' }).click();
    await calme(page);
    await basculer(page, /Publier le cours/, false);
    await page.getByRole('button', { name: 'Enregistrer le cours' }).click();
    await notification(page, 'Le cours est mis à jour.');
    await page.waitForURL((url) => /^.espace.formateur.cours.[0-9]+$/.test(url.pathname));
    await calme(page);
    attendu(!(await publics()).includes(aRetirer), 'le cours dépublié ne doit plus figurer au catalogue');
    await aller(page, '/formations');
    attendu(!(await texte(page)).includes(aRetirer), 'le cours dépublié ne doit plus figurer à la page publique');
  });

  await etape('Un formateur ne modifie pas le cours d’un autre : refus du serveur', async () => {
    const autre = await api(COMPTES.responsable, 'POST', '/formations', { titre: `Cours d’un autre ${suffixe}`, description: 'Cours créé par un autre compte.', niveau: 'DEBUTANT', publie: false });
    if (autre.status === 201 || autre.status === 200) {
      const refus = await api(COMPTES.formateur, 'PUT', `/formations/${autre.json.id}`, { titre: 'Titre détourné', description: 'Tentative de modification.', niveau: 'DEBUTANT', publie: false });
      attendu(refus.status === 403, `la modification du cours d’un autre devait être refusée (403), et non ${refus.status}`);
      return 'modification refusée (403)';
    }
    attendu(autre.status === 403, `création par un rôle non formateur : 403 attendu, et non ${autre.status}`);
    return 'seul un formateur crée un cours (403 pour le responsable)';
  });

  etat.cours = cours;
  etat.support = support;
}
