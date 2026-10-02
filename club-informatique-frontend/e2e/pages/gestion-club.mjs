// Scénarios de recette de la gestion du club : tableau de bord du Responsable (écran 42), bureau (D5), messages de contact (D4).
import { CONSOLE_PANNE, ECARTS_COMMUNS, enAttente, injoignable, json, lire, pageVide } from './_outils.mjs';

const INDICATEURS = '**/api/v1/gestion/indicateurs';
const BUREAU = '**/api/v1/bureau';
const MESSAGES = '**/api/v1/gestion/messages*';

const ECARTS_ESPACE = [
  ...ECARTS_COMMUNS,
  ['Barre supérieure', 'champ de recherche globale, pastille à valeur fixe', 'fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte', 'assumé (E-31)'],
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
        titre: 'Contenu réel : totaux, effectif et fréquentation calculés par le serveur (hors comptes de test)',
        check: async (page) => {
          const indicateurs = await lire('/gestion/indicateurs', 'responsable');
          if ((await page.locator('.tile').count()) !== 4) return 'quatre tuiles attendues';
          if ((await page.locator('.bar-col').count()) !== indicateurs.frequentation.length) return 'une barre par mois renvoyé par le serveur';
          return (await page.locator('.tiles').innerText()).includes(String(indicateurs.membresActifs)) ? null : 'la tuile « Membres » doit afficher l’effectif du serveur';
        },
      },
      {
        id: 'indicateurs-indisponibles',
        titre: 'Indicateurs injoignables : tuile « Membres » et graphique retirés',
        expectedConsole: CONSOLE_PANNE,
        before: (page) => injoignable(page, INDICATEURS),
        check: async (page) => ((await page.locator('.tile').count()) === 3 && (await page.locator('.chart').count()) === 0 ? null : 'la tuile et le graphique sans donnée doivent être retirés'),
      },
      {
        id: 'chargement',
        titre: 'Chargement',
        waitUntil: 'load',
        before: (page) => enAttente(page, '**/api/v1/gestion/*'),
        check: async (page) => (/\b0\b/.test(await page.locator('.tiles').innerText()) ? 'un zéro est affiché pendant le chargement' : null),
      },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, '**/api/v1/**') },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Compteurs « 12 », « 4 », « 5 », « 148 »', 'valeurs fixes et tendances (« +3 publiées ce mois »)', 'totaux réels du serveur, sans tendance ; une tuile dont la donnée est indisponible est retirée', 'assumé (section 1)'],
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
      {
        id: 'contenu',
        titre: 'Contenu réel (bureau saisi dans la base de recette)',
        check: async (page) => ((await page.locator('tbody tr').count()) >= 3 ? null : 'les membres réels du bureau doivent être listés'),
      },
      {
        id: 'ajout-retrait',
        titre: 'Ajout puis retrait réels d’un membre (backend)',
        run: async (page, { width, theme }) => {
          if (width !== 1440 || theme !== 'dark') return;
          await page.getByRole('button', { name: 'Ajouter un membre' }).first().click();
          await page.getByLabel(/^\s*Prénom/).fill('Fatoumata');
          await page.getByLabel(/^\s*Nom/).fill('Traoré');
          await page.getByLabel(/^\s*Fonction/).fill('Chargée de communication');
          await page.getByLabel(/Ordre d’affichage/).fill('9');
          await page.getByRole('button', { name: 'Enregistrer' }).click();
          await page.getByText('Le membre est ajouté au bureau.').waitFor();
          if (!(await lire('/bureau', 'responsable')).some((m) => m.fonction === 'Chargée de communication')) throw new Error('le membre ajouté est absent de la réponse du serveur');
          await page.getByRole('button', { name: 'Retirer Fatoumata Traoré' }).click();
          await page.getByRole('dialog').getByRole('button', { name: /Retirer/ }).click();
          await page.getByText('Le membre est retiré du bureau.').waitFor();
        },
        check: async () => ((await lire('/bureau', 'responsable')).some((m) => m.fonction === 'Chargée de communication') ? 'le membre retiré figure encore dans la réponse du serveur' : null),
      },
      {
        id: 'ajout',
        titre: 'Ajout : validation du formulaire',
        run: async (page) => {
          await page.getByRole('button', { name: 'Ajouter un membre' }).first().click();
          await page.getByRole('button', { name: 'Enregistrer' }).click();
        },
        check: async (page) => ((await page.locator('.form-error:not(:empty)').count()) >= 3 ? null : 'les erreurs de champ doivent être affichées'),
      },
      {
        id: 'retrait',
        titre: 'Retrait : modale de confirmation (non confirmée)',
        run: async (page) => {
          await page.getByRole('button', { name: /^Retirer/ }).first().click();
          await page.getByRole('dialog').waitFor();
          await page.waitForTimeout(400);
        },
      },
      { id: 'vide', titre: 'Bureau non encore saisi', before: (page) => page.route(BUREAU, (route) => json(route, [])) },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, BUREAU) },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, BUREAU) },
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
      ['État « archivé »', 'prévu par l’inventaire', 'non repris : le modèle ne connaît que « nouveau » et « traité »', 'assumé (modèle existant)'],
    ],
    etats: ['Chargement : squelettes.', 'Vide : message propre au filtre.', 'Erreur : message et « Réessayer ».', 'Contenu : pagination et filtre côté serveur ; réponse par courriel, marquage comme traité.'],
  },
};
