// Scénarios de recette des pages publiques et légales.
import { CONSOLE_PANNE, ECARTS_COMMUNS, aller, connecter, enAttente, injoignable, json, pageVide, premier } from './_outils.mjs';

/** Scénarios types d'une liste : contenu réel, vide, chargement, erreur. */
function etatsDeListe(ressource, motif = `**/api/v1/${ressource}*`) {
  return [
    { id: 'contenu', titre: 'Contenu réel (backend et base de recette)' },
    { id: 'vide', titre: 'État vide', before: (page) => page.route(motif, (route) => json(route, pageVide)) },
    { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, motif) },
    { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, motif) },
  ];
}

function etatsDeDetail(ressource, liste) {
  const motif = `**/api/v1/${ressource}/slug/*`;
  const chemin = async () => `/${liste}/${(await premier(ressource)).slug}`;
  return [
    { id: 'contenu', titre: 'Contenu réel (backend et base de recette)', path: chemin },
    { id: 'introuvable', titre: 'Élément introuvable (réponse réelle du backend)', path: `/${liste}/element-inexistant`, expectedConsole: ['404'] },
    { id: 'chargement', titre: 'Chargement', path: chemin, waitUntil: 'load', before: (page) => enAttente(page, motif) },
    { id: 'erreur', titre: 'Service injoignable', path: chemin, expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, motif) },
  ];
}

const ETATS_LISTE = ['Chargement : squelettes aux dimensions des cartes.', 'Vide : message de l’annexe C.', 'Erreur : message et action « Réessayer ».', 'Contenu : données réelles, pagination côté serveur.'];

export const PAGES = {
  '01-accueil': {
    titre: 'Accueil',
    path: '/',
    maquette: '01-accueil',
    scenarios: [
      { id: 'contenu', titre: 'Contenu réel (backend et base de recette)' },
      {
        id: 'base-vide',
        titre: 'Aucun événement ni actualité : sections masquées',
        before: async (page) => {
          await page.route('**/api/v1/evenements*', (route) => json(route, pageVide));
          await page.route('**/api/v1/actualites*', (route) => json(route, pageVide));
          await page.route('**/api/v1/pages/accueil', (route) => json(route, { status: 404 }, 404));
        },
        expectedConsole: ['404'],
        check: async (page) => ((await page.locator('main section').count()) === 1 ? null : 'les sections sans donnée doivent être masquées'),
      },
      {
        id: 'chargement',
        titre: 'Chargement',
        waitUntil: 'load',
        before: async (page) => {
          await enAttente(page, '**/api/v1/evenements*');
          await enAttente(page, '**/api/v1/actualites*');
          await enAttente(page, '**/api/v1/pages/accueil');
        },
        check: async (page) => (/\b0\b/.test(await page.locator('main').innerText()) ? 'un zéro est affiché pendant le chargement' : null),
      },
      {
        id: 'erreur',
        titre: 'Service injoignable : sections masquées',
        expectedConsole: CONSOLE_PANNE,
        before: (page) => injoignable(page, '**/api/v1/**'),
        check: async (page) => ((await page.locator('main section').count()) === 1 ? null : 'les sections en erreur doivent être masquées'),
      },
    ],
    ecarts: [
      ...ECARTS_COMMUNS,
      ['Bandeau « Ensemble vers l’innovation », devise « Apprendre • Partager • Innover »', 'présents', 'retirés tant que le club ne les a pas validés (C.1)', 'retrait'],
      ['Texte d’accroche', 'texte de démonstration', 'contenu de la page d’information « accueil » géré par l’administration ; masqué s’il est vide', 'assumé'],
      ['Visuel de droite', 'logo, nom et devise', 'logo et nom', 'retrait partiel'],
      ['« IST » du titre en thème sombre', 'bleu royal (contraste 2,8:1)', 'bleu éclairci', 'corrigé (10.2.3)'],
      ['Cartes d’événement et d’actualité', 'non cliquables', 'titre cliquable vers le détail', 'assumé'],
    ],
    etats: ['Chargement : squelettes, aucune valeur provisoire.', 'Vide ou erreur : la section est masquée (annexe C.2).', 'Contenu : deux prochains événements et quatre dernières actualités publiés.'],
  },

  '02-presentation': {
    titre: 'Présentation',
    path: '/presentation',
    maquette: '02-presentation',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel, structuré en sections (texte saisi par l’administration dans la base de recette)',
        check: async (page) => ((await page.locator('main h2').count()) >= 3 ? null : 'chaque titre du contenu doit ouvrir une section'),
      },
      { id: 'vide', titre: 'Contenu non renseigné', before: (page) => page.route('**/api/v1/pages/presentation', (route) => json(route, { slug: 'presentation', titre: 'Présentation', contenu: '' })) },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, '**/api/v1/pages/presentation') },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, '**/api/v1/pages/presentation') },
    ],
    ecarts: [
      ...ECARTS_COMMUNS,
      ['Texte de présentation, vision, mission, valeurs', 'textes de démonstration', 'contenu éditable par l’administration ; chaque titre ouvre une carte', 'assumé (E.4)'],
      ['Liens sociaux', 'Facebook, X, Instagram, LinkedIn, YouTube sans adresse', 'les quatre comptes réels du club', 'corrigé (section 4.4)'],
      ['Slogans « Apprendre, partager, construire », « Plus qu’un club… »', 'présents', 'retirés (C.1)', 'retrait'],
    ],
    etats: ['Chargement, vide (« contenu en cours de mise à jour », UC-01), erreur avec « Réessayer », contenu.'],
  },

  '03-bureau': {
    titre: 'Bureau du club',
    path: '/bureau',
    maquette: '03-bureau',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Composition réelle (bureau saisi dans la base de recette)',
        check: async (page) => ((await page.locator('main').innerText()).includes('Présidente') ? null : 'les fonctions réelles du bureau doivent être affichées'),
      },
      { id: 'vide', titre: 'Bureau non renseigné', before: (page) => page.route('**/api/v1/bureau', (route) => json(route, [])) },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, '**/api/v1/bureau') },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, '**/api/v1/bureau') },
    ],
    ecarts: [
      ...ECARTS_COMMUNS,
      ['Membres', 'cinq personnes fictives', 'composition saisie par le responsable du club ; état vide tant qu’elle n’est pas renseignée (E.5)', 'assumé'],
      ['Photo', 'avatar neutre', 'avatar neutre, aucune photo', 'conforme (règle 6.4)'],
      ['Emoji de fonction', 'présents dans les badges', 'retirés', 'corrigé (E-01)'],
    ],
    etats: ['Chargement, vide (« Les membres du bureau ne sont pas encore renseignés. »), erreur, contenu.'],
  },

  '04-actualites-liste': {
    titre: 'Actualités, liste',
    path: '/actualites',
    maquette: '04-actualites-liste',
    scenarios: [
      ...etatsDeListe('actualites'),
      {
        id: 'recherche',
        titre: 'Recherche sans résultat (backend réel)',
        run: async (page) => {
          await page.getByLabel('Rechercher une actualité').fill('zzzz');
          await page.getByText('Aucun résultat pour').waitFor();
        },
      },
    ],
    ecarts: [...ECARTS_COMMUNS, ['Filtres', 'cinq libellés en dur', 'catégories réelles renvoyées par l’API', 'assumé'], ['Pagination', 'absente', 'pagination côté serveur', 'dérivation']],
    etats: [...ETATS_LISTE, 'Recherche sans résultat : message rappelant le terme saisi et bouton de réinitialisation.'],
  },

  '05-actualite-detail': {
    titre: 'Actualité, détail',
    path: '/actualites/:slug',
    maquette: '05-actualites-detail',
    scenarios: etatsDeDetail('actualites', 'actualites'),
    ecarts: [...ECARTS_COMMUNS, ['Étiquettes en bas d’article', 'trois étiquettes', 'retirées (non modélisées)', 'retrait'], ['Fonction de l’auteur', '« Présidente du Club »', 'nom de l’auteur et date de publication', 'retrait partiel']],
    etats: ['Chargement, introuvable (message dédié), erreur, contenu.'],
  },

  '06-evenements-liste': {
    titre: 'Événements, liste',
    path: '/evenements',
    maquette: '06-evenements-liste',
    scenarios: etatsDeListe('evenements'),
    ecarts: [
      ...ECARTS_COMMUNS,
      ['Événement « à la une »', 'choix éditorial', 'prochain événement dans l’ordre chronologique', 'assumé (aucune donnée de mise en avant)'],
      ['« Ajouter au calendrier »', 'bouton', 'lien vers le fichier iCalendar réel de l’événement (D-06)', 'conforme'],
    ],
    etats: ETATS_LISTE,
  },

  '07-evenement-detail': {
    titre: 'Événement, détail',
    path: '/evenements/:slug',
    maquette: '07-evenements-detail',
    scenarios: [
      ...etatsDeDetail('evenements', 'evenements'),
      {
        id: 'membre-inscription',
        titre: 'Membre connecté : inscription puis annulation réelles',
        path: '/connexion',
        run: async (page, { base, width, theme }) => {
          if (width !== 1440 || theme !== 'dark') return;
          await connecter(page, base, 'membre');
          const event = await premier('evenements');
          await aller(page, `/evenements/${event.slug}`);
          await page.getByRole('button', { name: /Participer|liste d’attente/ }).click();
          await page.getByText(/Inscription confirmée|Liste d’attente/).first().waitFor();
          await page.waitForTimeout(300);
        },
        check: async (page, { width, theme }) => {
          if (width !== 1440 || theme !== 'dark') return null;
          await page.getByRole('button', { name: 'Annuler mon inscription' }).click();
          await page.getByRole('button', { name: 'Annuler l’inscription' }).click();
          await page.getByRole('button', { name: /Participer|liste d’attente/ }).waitFor();
          return null;
        },
      },
    ],
    ecarts: [
      ...ECARTS_COMMUNS,
      ['Programme horaire, intervenants, tarif', 'présents', 'retirés (non modélisés) ; description libre', 'retrait'],
      ['Places', '« 50 places disponibles »', 'places restantes et capacité renvoyées par l’API', 'assumé'],
      ['Bouton « Participer »', 'lien vers l’inscription au club', 'inscription réelle pour un membre, invitation à se connecter pour un visiteur', 'assumé (UC-09)'],
    ],
    etats: ['Chargement, introuvable, erreur, contenu ; action d’inscription : confirmée, liste d’attente, annulation avec confirmation.'],
  },

  '08-projets-vitrine': {
    titre: 'Projets, vitrine',
    path: '/projets',
    maquette: '08-projets-vitrine',
    scenarios: etatsDeListe('projets'),
    ecarts: [...ECARTS_COMMUNS, ['Filtres', 'six libellés en dur', 'catégories réelles', 'assumé'], ['Pastille « +3 »', 'présente', 'retirée ; trois avatars au plus', 'retrait']],
    etats: ETATS_LISTE,
  },

  '09-projet-detail': {
    titre: 'Projet, détail',
    path: '/projets/:slug',
    maquette: '09-projets-detail',
    scenarios: etatsDeDetail('projets', 'projets'),
    ecarts: [
      ...ECARTS_COMMUNS,
      ['Liste de tâches et « 5/7 tâches »', 'présentes', 'retirées (non modélisées)', 'retrait'],
      ['Progression', '« 66 % » figé', 'avancement saisi lors du suivi, renvoyé par l’API', 'assumé'],
      ['Objectifs, technologies, liens', 'absents', 'ajoutés car présents dans le modèle', 'dérivation'],
    ],
    etats: ['Chargement, introuvable, erreur, contenu.'],
  },

  '10-formations-liste': {
    titre: 'Formations, liste',
    path: '/formations',
    maquette: '10-formations-liste',
    scenarios: etatsDeListe('formations'),
    ecarts: [
      ...ECARTS_COMMUNS,
      ['Badge « E-Learning IST », mention « Gratuit », « Progression 0 % »', 'présents', 'retirés (non modélisés, hors CDC)', 'retrait (E-11)'],
      ['Carte « Formation bientôt disponible »', 'présente', 'retirée', 'retrait (contenu fictif)'],
      ['Niveau', 'absent', 'badge du niveau renvoyé par l’API', 'dérivation'],
    ],
    etats: ETATS_LISTE,
  },

  '11-formation-detail': {
    titre: 'Formation, détail',
    path: '/formations/:slug',
    maquette: '11-formations-detail',
    scenarios: etatsDeDetail('formations', 'formations'),
    ecarts: [
      ...ECARTS_COMMUNS,
      ['Lecteur de leçons (curriculum, code, console)', 'présent', 'remplacé par la fiche de la formation et ses sessions, même composition à deux colonnes', 'retrait (E-11)'],
      ['Inscription à une session', 'absente', 'action réelle par session (UC-09)', 'dérivation'],
    ],
    etats: ['Chargement, introuvable, erreur, contenu ; sessions : chargement, vide, contenu.'],
  },

  '12-ressources': {
    titre: 'Ressources publiques',
    path: '/ressources',
    maquette: '12-ressources-publiques',
    scenarios: etatsDeListe('ressources/publiques', '**/api/v1/ressources/publiques*'),
    ecarts: [...ECARTS_COMMUNS, ['Compteurs de téléchargements', '900, 750, 645', 'retirés (aucune mesure)', 'retrait'], ['Recherche', 'absente', 'recherche côté serveur', 'dérivation']],
    etats: ETATS_LISTE,
  },

  '13-contact': {
    titre: 'Contact',
    path: '/contact',
    maquette: '13-contact',
    scenarios: [
      { id: 'initial', titre: 'État initial' },
      {
        id: 'validation',
        titre: 'Formulaire soumis vide',
        run: async (page) => {
          await page.getByRole('button', { name: 'Envoyer' }).click();
        },
        check: async (page) => ((await page.locator('.form-error:visible').count()) >= 5 ? null : 'messages de validation manquants'),
      },
      {
        id: 'envoi',
        titre: 'Message envoyé au backend réel et enregistré en base',
        run: async (page, { width, theme }) => {
          await page.getByLabel(/Nom complet/).fill('Rasmata Ilboudo');
          await page.getByLabel(/Adresse électronique/).fill('rasmata.ilboudo@recette.invalid');
          await page.getByLabel(/Objet/).fill(`Recette ${theme} ${width}`);
          await page.getByLabel(/^\s*Message/).fill('Message d’essai envoyé par la recette automatisée.');
          await page.getByRole('checkbox').check();
          await page.getByRole('button', { name: 'Envoyer' }).click();
          await page.getByRole('status').waitFor();
        },
      },
      {
        id: 'erreur',
        titre: 'Service injoignable',
        expectedConsole: CONSOLE_PANNE,
        before: (page) => injoignable(page, '**/api/v1/contact'),
        run: async (page) => {
          await page.getByLabel(/Nom complet/).fill('Rasmata Ilboudo');
          await page.getByLabel(/Adresse électronique/).fill('rasmata.ilboudo@recette.invalid');
          await page.getByLabel(/Objet/).fill('Recette');
          await page.getByLabel(/^\s*Message/).fill('Message d’essai envoyé par la recette automatisée.');
          await page.getByRole('checkbox').check();
          await page.getByRole('button', { name: 'Envoyer' }).click();
          await page.getByRole('alert').waitFor();
        },
      },
    ],
    ecarts: [
      ...ECARTS_COMMUNS,
      ['« Nous vous répondrons dans les plus brefs délais »', 'présent', 'retiré (aucune promesse, annexe C)', 'retrait'],
      ['Coordonnées', 'siège, courriel, « suivez-nous »', 'établissement, courriel, WhatsApp, téléphones, quatre réseaux réels', 'corrigé (section 4.4)'],
      ['Anti-spam', 'absent', 'champ piège invisible et durée de saisie transmis au backend', 'dérivation (8.8.1)'],
      ['Libellés', 'texte indicatif seul', 'libellés réservés aux lecteurs d’écran', 'corrigé (accessibilité)'],
    ],
    etats: ['Validation par champ, attente, succès (accusé de réception annoncé), erreur.'],
  },

  '14-conditions-utilisation': {
    titre: 'Conditions d’utilisation',
    path: '/conditions-utilisation',
    maquette: '14-cgu',
    scenarios: [{ id: 'contenu', titre: 'Texte' }],
    ecarts: [['Texte', 'cinq articles de démonstration', 'texte décrivant le fonctionnement réel ; informations manquantes signalées comme en attente', 'assumé (8.8.2)'], ['Icône du sommaire', 'emoji', 'pictogramme', 'corrigé (E-01)']],
    etats: ['Page statique ; date de dernière mise à jour affichée ; relecture par le club requise avant publication.'],
  },
  '15-confidentialite': {
    titre: 'Politique de confidentialité',
    path: '/confidentialite',
    maquette: '15-politique-confidentialite',
    scenarios: [{ id: 'contenu', titre: 'Texte' }],
    ecarts: [
      ['Texte', 'démonstration, mention « DPO »', 'texte fondé sur la loi n° 001-2021/AN (articles vérifiés sur le texte officiel) et sur les traitements réels', 'assumé (8.8.2)'],
      ['Mise en page', 'bandeau d’introduction et cartes numérotées', 'sommaire collant et cartes numérotées de l’écran 14, commun aux trois pages légales', 'assumé (cohérence)'],
    ],
    etats: ['Page statique ; informations en attente du club affichées comme telles.'],
  },
  'D1-mentions-legales': {
    titre: 'Mentions légales',
    path: '/mentions-legales',
    maquette: null,
    scenarios: [{ id: 'contenu', titre: 'Texte' }],
    ecarts: [['Page entière', 'absente', 'dérivée de l’écran 14', 'dérivation']],
    etats: ['Page statique ; éditeur, directeur de la publication et hébergeur en attente du club.'],
  },
  '16-erreur-404': {
    titre: 'Page introuvable',
    path: '/adresse-inexistante',
    maquette: '16-erreur-404',
    scenarios: [{ id: 'contenu', titre: 'Adresse inconnue' }],
    ecarts: [['Illustration', 'emoji d’avertissement et libellé « Erreur 404 »', 'pictogramme', 'corrigé (E-01)'], ['Gabarit', 'en-tête et pied de page publics', 'identique', 'conforme']],
    etats: ['Message de l’annexe C, retour à l’accueil, retour arrière.'],
  },
  '17-erreur-service': {
    titre: 'Erreur générique',
    path: '/erreur',
    maquette: '17-erreur-500',
    scenarios: [{ id: 'contenu', titre: 'Service indisponible' }],
    ecarts: [['Encadré « Statut : maintenance en cours, durée estimée… »', 'présent', 'retiré (information inventée)', 'retrait'], ['Texte', '« en maintenance pour améliorer votre expérience »', 'message de l’annexe C', 'assumé']],
    etats: ['Retour à l’accueil et nouvelle tentative.'],
  },
  'D3-acces-refuse': {
    titre: 'Accès refusé',
    path: '/acces-refuse',
    maquette: null,
    scenarios: [{ id: 'contenu', titre: 'Visiteur' }],
    ecarts: [['Page entière', 'absente', 'dérivée de l’écran 16', 'dérivation']],
    etats: ['Message de l’annexe C ; retour à l’espace pour un utilisateur connecté, à l’accueil sinon.'],
  },
};
