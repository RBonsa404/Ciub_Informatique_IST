// Scénarios de recette de la gestion du club : tableau de bord du Responsable (écran 42), bureau (D5), messages de contact (D4).
import { CONSOLE_PANNE, ECARTS_COMMUNS, enAttente, injoignable, json, pageVide } from './_outils.mjs';

const INDICATEURS = '**/api/gestion/indicateurs';
const BUREAU = '**/api/bureau';
const MESSAGES = '**/api/contact/admin*';

const ECARTS_ESPACE = [
  ...ECARTS_COMMUNS,
  ['Barre supérieure', 'champ de recherche globale, pastille à valeur fixe', 'fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte', 'assumé (E-31)'],
];

/** Indicateurs conformes au contrat (point d'accès à créer en Phase 3) : valeurs d'essai de l'outil de recette. */
const indicateursContrat = {
  membresActifs: 3,
  frequentation: [
    { mois: '2026-06', inscriptions: 0 },
    { mois: '2026-07', inscriptions: 1 },
    { mois: '2026-08', inscriptions: 0 },
    { mois: '2026-09', inscriptions: 2 },
    { mois: '2026-10', inscriptions: 4 },
  ],
};

/** Composition conforme au contrat (point d'accès à créer) : noms d'essai de l'outil de recette, jamais livrés. */
const bureauContrat = [
  { id: 1, nom: 'Kaboré', prenom: 'Salif', fonction: 'Président', filiere: 'Génie logiciel', ordre: 1 },
  { id: 2, nom: 'Sawadogo', prenom: 'Aminata', fonction: 'Vice-présidente', filiere: 'Informatique de gestion', ordre: 2 },
  { id: 3, nom: 'Traoré', prenom: 'Fatoumata', fonction: 'Secrétaire générale', filiere: null, ordre: 3 },
];

export const PAGES = {
  '42-tdb-responsable': {
    titre: 'Tableau de bord du Responsable',
    path: '/espace/gestion',
    role: 'responsable',
    maquette: '42-tdb-responsable',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel ; effectif et fréquentation selon le contrat d’API',
        before: (page) => page.route(INDICATEURS, (route) => json(route, indicateursContrat)),
        check: async (page) => ((await page.locator('.bar-col').count()) === 5 && (await page.locator('.tile').count()) === 4 ? null : 'quatre tuiles et cinq barres attendues'),
      },
      {
        id: 'backend-actuel',
        titre: 'Backend actuel : indicateurs absents, tuile « Membres » et graphique retirés',
        expectedConsole: ['500'],
        check: async (page) => ((await page.locator('.tile').count()) === 3 && (await page.locator('.chart').count()) === 0 ? null : 'la tuile et le graphique sans donnée doivent être retirés'),
      },
      {
        id: 'chargement',
        titre: 'Chargement',
        waitUntil: 'load',
        before: (page) => enAttente(page, '**/api/**/admin/all*'),
        expectedConsole: ['500'],
        check: async (page) => (/\b0\b/.test(await page.locator('.tiles').innerText()) ? 'un zéro est affiché pendant le chargement' : null),
      },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, '**/api/**') },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Compteurs « 12 », « 4 », « 5 », « 148 »', 'valeurs fixes et tendances (« +3 publiées ce mois »)', 'totaux réels du serveur, sans tendance ; « Membres » retiré tant que l’indicateur n’existe pas', 'assumé (section 1)'],
      ['« Activité & Fréquentation globale »', 'barres fixes, « Moyenne : 28 étudiants / session »', 'inscriptions confirmées par mois selon le serveur, valeur au-dessus de chaque barre ; graphique retiré sans donnée ; moyenne retirée', 'assumé (section 1)'],
      ['« Projets en attente (5) », « Événements prévus »', 'contenu fixe', 'propositions et événements réels, trois au plus', 'assumé'],
      ['Tuiles', 'non cliquables', 'chaque tuile mène à la page de gestion correspondante', 'assumé'],
    ],
    etats: ['Tuiles : squelette, valeur réelle, « Indisponible » en cas d’erreur ; aucune valeur provisoire.', 'Graphique : squelette, vide, contenu ; retiré si la donnée manque.', 'Panneaux : squelettes, vide, erreur avec « Réessayer », contenu.'],
  },

  'D5-composition-bureau': {
    titre: 'Composition du bureau',
    path: '/espace/gestion/bureau',
    role: 'responsable',
    scenarios: [
      { id: 'contenu', titre: 'Contenu selon le contrat d’API (point d’accès à créer)', before: (page) => page.route(BUREAU, (route) => json(route, bureauContrat)) },
      {
        id: 'ajout',
        titre: 'Ajout : validation du formulaire',
        before: (page) => page.route(BUREAU, (route) => json(route, bureauContrat)),
        run: async (page) => {
          await page.getByRole('button', { name: 'Ajouter un membre' }).first().click();
          await page.getByRole('button', { name: 'Enregistrer' }).click();
        },
        check: async (page) => ((await page.locator('.form-error:not(:empty)').count()) >= 3 ? null : 'les erreurs de champ doivent être affichées'),
      },
      {
        id: 'retrait',
        titre: 'Retrait : modale de confirmation (non confirmée)',
        before: (page) => page.route(BUREAU, (route) => json(route, bureauContrat)),
        run: async (page) => {
          await page.getByRole('button', { name: /^Retirer/ }).first().click();
          await page.getByRole('dialog').waitFor();
          await page.waitForTimeout(400);
        },
      },
      { id: 'vide', titre: 'Bureau non encore saisi', before: (page) => page.route(BUREAU, (route) => json(route, [])) },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, BUREAU) },
      { id: 'backend-actuel', titre: 'Backend actuel : point d’accès absent (erreur 500, état d’erreur affiché)', expectedConsole: ['500'] },
    ],
    ecarts: [['Page dérivée', 'aucun écran dans la maquette', 'tableau et formulaire repris des écrans 43 et 45 ; aucune photo, filière en saisie libre', 'dérivation (sections 8.7.2 et 12.5)']],
    etats: ['Chargement : squelettes.', 'Vide : message et bouton d’ajout.', 'Erreur : message et « Réessayer ».', 'Formulaire : validation par champ, erreurs du serveur, notification de succès.', 'Aucun membre n’est inventé : la liste reste vide tant que le club ne l’a pas saisie (annexe E).'],
  },

  'D4-messages-contact': {
    titre: 'Messages de contact',
    path: '/espace/admin/messages',
    role: 'responsable',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel (messages reçus par le formulaire public)',
        check: async (page) => ((await page.locator('main li').count()) >= 1 ? null : 'les messages réels doivent être listés'),
      },
      {
        id: 'filtre',
        titre: 'Filtre « Traités » (filtre réel du serveur)',
        run: async (page) => {
          await page.getByRole('button', { name: 'Traités' }).click();
          await page.waitForTimeout(600);
        },
        check: async (page) => {
          const badges = await page.locator('main li .badge').allInnerTexts();
          return badges.every((b) => b.toLowerCase().includes('traité')) ? null : `seuls les messages traités doivent rester : ${badges.join(', ')}`;
        },
      },
      { id: 'vide', titre: 'Aucun message', before: (page) => page.route(MESSAGES, (route) => json(route, pageVide)) },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, MESSAGES) },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, MESSAGES) },
    ],
    ecarts: [
      ['Page dérivée', 'aucun écran dans la maquette', 'cartes reprises du centre de notifications (écran 33)', 'dérivation (section 8.8.1)'],
      ['État « archivé »', 'prévu par l’inventaire', 'non repris : le modèle ne connaît que « nouveau » et « traité »', 'à arbitrer en Phase 2'],
    ],
    etats: ['Chargement : squelettes.', 'Vide : message propre au filtre.', 'Erreur : message et « Réessayer ».', 'Contenu : pagination et filtre côté serveur ; réponse par courriel, marquage comme traité.'],
  },
};
