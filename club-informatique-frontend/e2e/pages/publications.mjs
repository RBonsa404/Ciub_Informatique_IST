// Scénarios de recette des publications et des notifications (écrans 23, 24, 33, 43, 44 et 49).
import { CONSOLE_PANNE, ECARTS_COMMUNS, enAttente, injoignable, json, lire, pageVide } from './_outils.mjs';

const NOTIFICATIONS = '**/api/v1/notifications?*';
const PUBLICATIONS = '**/api/v1/publications?*';
const PUBLICATION = '**/api/v1/publications/slug/*';
const ACTUALITES = '**/api/v1/gestion/actualites*';
const ACTUALITE = '**/api/v1/actualites/*';

const ECARTS_ESPACE = [
  ...ECARTS_COMMUNS,
  ['Barre supérieure', 'champ de recherche globale, pastille à valeur fixe', 'fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte', 'assumé (E-31)'],
];

const publications = async () => (await lire('/publications?size=20', 'membre')).content;
const cheminPublication = async () => `/espace/publications/${(await publications())[0].slug}`;

const actualites = async () => (await lire('/gestion/actualites?size=50', 'responsable')).content;
const brouillon = async () => (await actualites()).find((a) => !a.publie);
const cheminBrouillon = async () => `/espace/gestion/actualites/${(await brouillon()).id}/modifier`;

export const PAGES = {
  '33-centre-notifications': {
    titre: 'Centre de notifications',
    path: '/espace/notifications',
    role: 'membre',
    maquette: '33-centre-notifications',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel (notifications du compte de recette)',
        check: async (page) => ((await page.locator('main li').count()) >= 1 ? null : 'la notification réelle doit être listée'),
      },
      {
        id: 'filtre',
        titre: 'Filtre par type sans résultat',
        run: async (page) => {
          await page.getByLabel('Type de notification').selectOption('RAPPEL_SESSION');
          await page.waitForLoadState('networkidle');
        },
        check: async (page) => ((await page.locator('main').innerText()).includes('aucune notification de ce type') ? null : 'le message vide du filtre doit être affiché'),
      },
      { id: 'vide', titre: 'Aucune notification', before: (page) => page.route(NOTIFICATIONS, (route) => json(route, pageVide)) },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, NOTIFICATIONS) },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, NOTIFICATIONS) },
      {
        id: 'lecture',
        titre: 'Marquage réel d’une notification, puis de toutes (backend) : plus aucune notification non lue',
        run: async (page) => {
          const bouton = page.getByRole('button', { name: /^Marquer comme lue/ }).first();
          if (await bouton.count()) {
            const avant = (await lire('/notifications?lue=false&size=1', 'membre')).totalElements;
            await bouton.click();
            await page.waitForLoadState('networkidle');
            const apres = (await lire('/notifications?lue=false&size=1', 'membre')).totalElements;
            if (apres !== avant - 1) throw new Error(`une seule notification devait passer à « lue » : ${avant} puis ${apres} non lues`);
          }
          const toutes = page.getByRole('button', { name: 'Tout marquer comme lu' });
          if (await toutes.isEnabled()) {
            await toutes.click();
            await page.getByText('Toutes vos notifications sont marquées comme lues.').waitFor();
          }
          await page.getByRole('button', { name: /^Non lues/ }).click();
          await page.waitForLoadState('networkidle');
        },
        check: async (page) => ((await page.locator('main').innerText()).includes('aucune notification non lue') ? null : 'après lecture, la liste des non lues doit être vide'),
      },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Filtres « Tout (4) », « Non lues (2) », « Mentionnés (0) », « Système (1) »', 'compteurs fixes', '« Tout » et « Non lues » avec le nombre réel de non lues ; le type se choisit dans la liste', 'assumé (section 1) ; « Mentionnés » retiré (fil social exclu)'],
      ['Types de la liste', 'Annonces, Événements, Projets', 'types du modèle : annonces, inscriptions, projets, rappels, système', 'assumé'],
      ['Pictogrammes', 'emoji', 'icônes de la famille du produit', 'corrigé (E-01)'],
      ['Date', '« Il y a 1h »', 'date et heure réelles', 'assumé'],
      ['Actions par notification', 'aucune', '« Marquer comme lue » et « Ouvrir » si la notification porte un lien interne', 'assumé (UC-13)'],
      ['Mention « Activez les notifications… »', 'présente', 'retirée (aucune notification poussée au CDC)', 'retrait'],
    ],
    etats: ['Chargement : squelettes.', 'Vide : message propre au filtre.', 'Erreur : message et « Réessayer ».', 'Contenu : pagination côté serveur, pastille de la barre mise à jour après lecture.'],
  },

  '23-feed': {
    titre: 'Publications du club',
    path: '/espace/publications',
    role: 'membre',
    maquette: '23-feed',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel (annonces réservées aux membres de la base de recette)',
        check: async (page) => {
          const texte = await page.locator('main').innerText();
          if (!texte.includes('Annonce aux membres : calendrier des permanences')) return 'les annonces réservées aux membres doivent être listées';
          return texte.includes('Brouillon') ? 'un brouillon ne doit pas apparaître' : null;
        },
      },
      { id: 'vide', titre: 'Aucune publication', before: (page) => page.route(PUBLICATIONS, (route) => json(route, pageVide)) },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, PUBLICATIONS) },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, PUBLICATIONS) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Nature de la page', 'fil social (mentions « J’aime », commentaires)', 'annonces internes en lecture seule', 'dérivation (D-01, CDC)'],
      ['Filtres « Toutes (12) », « Annonces »…', 'présents', 'retirés ; la catégorie figure sur chaque annonce', 'retrait (section 1)'],
      ['Bandeau illustré et emoji', 'présents', 'retirés', 'retrait (6.4)'],
      ['Fonction de l’auteur, pastille de certification', 'présentes', 'nom de l’auteur et date de publication', 'assumé (donnée absente)'],
    ],
    etats: ['Chargement : squelettes.', 'Vide : message.', 'Erreur : message et « Réessayer ».', 'Contenu : pagination côté serveur.'],
  },

  '24-feed-detail': {
    titre: 'Publication, détail',
    path: '/espace/publications/:slug',
    role: 'membre',
    maquette: '24-feed-detail',
    scenarios: [
      { id: 'contenu', titre: 'Contenu réel (annonce réservée aux membres)', path: cheminPublication },
      { id: 'introuvable', titre: 'Publication introuvable (réponse réelle du backend)', path: '/espace/publications/element-inexistant', expectedConsole: ['404'] },
      { id: 'chargement', titre: 'Chargement', path: cheminPublication, waitUntil: 'load', before: (page) => enAttente(page, PUBLICATION) },
      { id: 'erreur', titre: 'Service injoignable', path: cheminPublication, expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, PUBLICATION) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Commentaires, mentions « J’aime », partage', 'présents', 'retirés', 'retrait (D-01)'],
      ['« Publications connexes »', 'présent', 'retiré', 'retrait (D-01)'],
      ['Galerie et bandeau à emoji', 'présents', 'retirés', 'retrait (6.4)'],
    ],
    etats: ['Chargement : squelette.', 'Introuvable : message dédié.', 'Erreur : message et « Réessayer ».', 'Contenu : texte structuré (paragraphes, titres, citations).'],
  },

  '43-gestion-actualites-liste': {
    titre: 'Gestion des actualités, liste',
    path: '/espace/gestion/actualites',
    role: 'responsable',
    maquette: '43-gestion-actualites-liste',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel (actualités de la base de recette)',
        check: async (page) => ((await page.locator('tbody tr').count()) >= 5 ? null : 'les actualités réelles, brouillon compris, doivent être listées'),
      },
      {
        id: 'filtre',
        titre: 'Filtre « Brouillon »',
        run: async (page) => {
          await page.getByLabel('Statut').selectOption('brouillon');
          await page.waitForLoadState('networkidle');
        },
        check: async (page) => ((await page.locator('tbody tr').count()) === 1 ? null : 'seul le brouillon doit rester'),
      },
      {
        id: 'publication',
        titre: 'Publication puis retrait réels du brouillon (backend)',
        run: async (page) => {
          const ligne = page.locator('tbody tr', { hasText: 'Brouillon :' });
          await ligne.getByRole('button', { name: /^Publier/ }).click();
          await page.getByText('L’actualité est publiée.').waitFor();
          await ligne.getByRole('button', { name: /^Dépublier/ }).click();
          await page.getByText('L’actualité est retirée du site.').waitFor();
          await page.waitForLoadState('networkidle');
        },
      },
      {
        id: 'suppression',
        titre: 'Suppression : modale de confirmation (non confirmée)',
        run: async (page) => {
          await page.getByRole('button', { name: /^Supprimer/ }).first().click();
          await page.getByRole('dialog').waitFor();
          await page.waitForTimeout(400);
        },
      },
      { id: 'vide', titre: 'Aucune actualité', before: (page) => page.route(ACTUALITES, (route) => json(route, pageVide)) },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, ACTUALITES) },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, ACTUALITES) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Actions', '« Modifier »', 'modifier, publier ou dépublier, supprimer avec confirmation', 'assumé (UC-18)'],
      ['Date de publication d’un brouillon', 'non prévue', 'tiret', 'assumé'],
    ],
    etats: ['Chargement : squelettes.', 'Vide : message propre au filtre.', 'Erreur : message et « Réessayer ».', 'Contenu : tableau défilant sur petit écran, pagination côté serveur.'],
  },

  '44-editeur-publication-riche': {
    titre: 'Éditeur d’actualité',
    path: '/espace/gestion/actualites/nouvelle',
    role: 'responsable',
    maquette: '44-editeur-publication-riche',
    scenarios: [
      { id: 'creation', titre: 'Création : éditeur initial (catégories réelles)' },
      {
        id: 'blocs',
        titre: 'Insertion de blocs et image de couverture',
        run: async (page) => {
          await page.getByLabel(/^\s*Titre/).fill('Compte rendu de l’atelier');
          await page.getByRole('button', { name: 'Paragraphe' }).click();
          await page.getByRole('button', { name: 'Titre de section' }).click();
          await page.getByRole('button', { name: 'Citation' }).click();
        },
        check: async (page) => {
          const contenu = await page.getByRole('textbox', { name: /Contenu/ }).inputValue();
          return contenu.includes('# Titre de la section') && contenu.includes('> Texte de la citation') ? null : `les blocs doivent être insérés : ${contenu}`;
        },
      },
      {
        id: 'validation',
        titre: 'Champs obligatoires vides',
        run: (page) => page.getByRole('button', { name: 'Publier' }).click(),
        check: async (page) => ((await page.locator('.form-error:not(:empty)').count()) >= 2 ? null : 'les erreurs de champ doivent être affichées'),
      },
      { id: 'edition', titre: 'Modification : éditeur prérempli (brouillon réel)', path: cheminBrouillon },
      {
        id: 'enregistrement',
        titre: 'Modification : enregistrement réel du brouillon (backend), retour à la liste',
        path: cheminBrouillon,
        run: async (page) => {
          await page.getByLabel(/Résumé/).fill('Brouillon non publié, visible uniquement dans l’espace de gestion.');
          await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click();
          await page.waitForURL((url) => url.pathname === '/espace/gestion/actualites');
          await page.waitForLoadState('networkidle');
        },
      },
      { id: 'introuvable', titre: 'Actualité introuvable (réponse réelle du backend)', path: '/espace/gestion/actualites/999999/modifier', expectedConsole: ['404'] },
      { id: 'chargement', titre: 'Modification : chargement', path: cheminBrouillon, waitUntil: 'load', before: (page) => enAttente(page, ACTUALITE) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Composition par blocs glisser-déposer', 'six blocs (image, vidéo, texte, citation, galerie, bouton)', 'texte structuré : paragraphe, titre de section, citation, insérés d’un clic ; image de couverture déposée ou désignée par son adresse web', 'dérivation (D-02)'],
      ['« Date de publication »', 'champ de date', 'retiré : la date est fixée par le serveur à la publication', 'retrait (modèle existant)'],
      ['« Épingler en haut du feed »', 'case à cocher', 'retirée', 'retrait (D-01)'],
      ['Visibilité', '« Tout le monde » ou « Membres IST uniquement »', 'même choix, proposé si le module des publications internes est ouvert', 'conforme'],
      ['Catégorie', 'liste fixe', 'catégories réelles du serveur', 'assumé (section 1)'],
      ['Résumé', 'absent', 'champ facultatif, affiché dans les listes', 'assumé (modèle existant)'],
    ],
    etats: ['Création : éditeur immédiat.', 'Modification : squelette, introuvable, erreur.', 'Validation : message par champ, erreurs du serveur.', 'Succès : notification et retour à la liste.'],
  },

  '49-composition-notification-globale': {
    titre: 'Notification globale',
    path: '/espace/gestion/notifications',
    role: 'responsable',
    maquette: '49-composition-notification-globale',
    scenarios: [
      { id: 'initial', titre: 'Formulaire initial' },
      {
        id: 'apercu',
        titre: 'Aperçu en direct',
        run: async (page) => {
          await page.getByLabel(/Titre de la notification/).fill('Réunion mensuelle du club');
          await page.getByLabel(/Message/).fill('La réunion mensuelle se tiendra jeudi à 16 h dans la salle des clubs.');
        },
        check: async (page) => ((await page.locator('.bubble').innerText()).includes('Réunion mensuelle du club') ? null : 'l’aperçu doit reprendre le titre saisi'),
      },
      {
        id: 'validation',
        titre: 'Champs obligatoires vides et lien invalide',
        run: async (page) => {
          await page.getByLabel(/Lien associé/).fill('evenements');
          await page.getByRole('button', { name: 'Envoyer immédiatement' }).click();
        },
        check: async (page) => ((await page.locator('.form-error:not(:empty)').count()) >= 3 ? null : 'les erreurs de champ doivent être affichées'),
      },
      {
        id: 'confirmation',
        titre: 'Envoi : modale de confirmation (non confirmée)',
        run: async (page) => {
          await page.getByLabel(/Titre de la notification/).fill('Réunion mensuelle du club');
          await page.getByLabel(/Message/).fill('La réunion mensuelle se tiendra jeudi à 16 h dans la salle des clubs.');
          await page.getByRole('button', { name: 'Envoyer immédiatement' }).click();
          await page.getByRole('dialog').waitFor();
          await page.waitForTimeout(400);
        },
      },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['« Type »', 'liste (annonce, événement, alerte)', 'retiré : une notification globale est une annonce', 'retrait (modèle existant)'],
      ['« Audience ciblée » avec effectifs « (148) », « (12) »', 'liste à compteurs fixes', 'mention : tous les membres actifs', 'retrait (section 1) ; ciblage absent du CDC'],
      ['« Programmer »', 'bouton', 'retiré : envoi immédiat seulement', 'retrait (UC-22)'],
      ['Lien associé', 'absent', 'champ facultatif (chemin interne du site)', 'assumé (modèle existant)'],
      ['Envoi', 'immédiat', 'confirmation préalable : une notification envoyée ne peut pas être retirée', 'assumé'],
    ],
    etats: ['Validation : message par champ.', 'Confirmation avant envoi.', 'Succès : notification, formulaire vidé.', 'L’envoi réel est prouvé par le script de peuplement, qui appelle le même point d’accès.'],
  },
};
