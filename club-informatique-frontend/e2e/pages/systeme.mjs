// Scénarios de recette du Super Admin et de la DSI : configuration (écran 56), supervision (écran 57), mot de passe imposé (D8).
import { COMPTES, CONSOLE_PANNE, ECARTS_COMMUNS, PASSWORD, aller, enAttente, injoignable, json } from './_outils.mjs';

const CONFIG = '**/api/admin/system/config';
const SAUVEGARDES = '**/api/admin/system/sauvegardes';
const CONFORMITE = '**/api/dsi/conformite';
const JOURNAL = '**/api/dsi/conformite/logs*';

const ECARTS_ESPACE = [
  ...ECARTS_COMMUNS,
  ['Barre supérieure', 'champ de recherche globale, pastille à valeur fixe', 'fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte', 'assumé (E-31)'],
];

/** Sauvegardes conformes au contrat (point d'accès à créer en Phase 3) : valeurs d'essai de l'outil de recette. */
const sauvegardesContrat = [
  { id: 2, date: '2026-10-02T02:00:00', tailleOctets: 14890000, statut: 'REUSSIE' },
  { id: 1, date: '2026-10-01T02:00:00', tailleOctets: null, statut: 'ECHOUEE' },
];
const sauvegardes = (page) => page.route(SAUVEGARDES, (route) => json(route, sauvegardesContrat));

const journalContrat = {
  content: [
    { id: 2, action: 'CONNEXION', utilisateurEmail: COMPTES.admin, ipAddress: '192.0.2.10', dateAction: '2026-10-02T08:40:00', statut: 'SUCCES' },
    { id: 1, action: 'ATTRIBUTION_ROLE', utilisateurEmail: COMPTES.superadmin, ipAddress: '192.0.2.11', dateAction: '2026-10-01T16:05:00', statut: 'SUCCES' },
  ],
  page: 0,
  size: 15,
  totalElements: 2,
  totalPages: 1,
};

/** La réponse réelle de connexion est complétée par l'indicateur du contrat : changement de mot de passe imposé. */
async function connexionAvecMotDePasseImpose(page) {
  await page.route('**/api/auth/login', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({ response, json: { ...body, changementMotDePasseRequis: true } });
  });
}

async function seConnecter(page) {
  await page.getByLabel(/Adresse électronique/).fill(COMPTES.superadmin);
  await page.getByLabel(/^\s*Mot de passe/).fill(PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL((url) => url.pathname === '/espace/mot-de-passe');
  await page.waitForTimeout(500);
}

export const PAGES = {
  '56-configuration-systeme-sauvegardes': {
    titre: 'Configuration du système et sauvegardes',
    path: '/espace/systeme',
    role: 'superadmin',
    maquette: '56-configuration-systeme-sauvegardes',
    scenarios: [
      { id: 'contenu', titre: 'Réglages réels ; sauvegardes selon le contrat d’API', before: sauvegardes },
      {
        id: 'validation',
        titre: 'Valeurs hors bornes',
        before: sauvegardes,
        run: async (page) => {
          await page.getByLabel(/Nom de la plateforme/).fill('');
          await page.getByLabel(/Tentatives de connexion/).fill('50');
          await page.getByRole('button', { name: 'Enregistrer les réglages' }).click();
        },
        check: async (page) => ((await page.locator('.form-error:not(:empty)').count()) >= 2 ? null : 'les erreurs de champ doivent être affichées'),
      },
      {
        id: 'enregistrement',
        titre: 'Enregistrement réel des réglages (backend)',
        before: sauvegardes,
        run: async (page) => {
          await page.getByLabel(/Durée du verrouillage/).fill('15');
          await page.getByRole('button', { name: 'Enregistrer les réglages' }).click();
          await page.getByText('Les réglages sont enregistrés.').waitFor();
        },
      },
      {
        id: 'maintenance',
        titre: 'Mode maintenance : modale de confirmation (non confirmée)',
        before: sauvegardes,
        run: async (page) => {
          await page.getByRole('checkbox', { name: 'Activer le mode maintenance' }).check();
          await page.getByRole('button', { name: 'Enregistrer les réglages' }).click();
          await page.getByRole('dialog').waitFor();
          await page.waitForTimeout(400);
        },
      },
      { id: 'backend-actuel', titre: 'Backend actuel : état des sauvegardes absent (erreur 500, message dans le panneau)', expectedConsole: ['500'] },
      {
        id: 'chargement',
        titre: 'Chargement',
        waitUntil: 'load',
        before: async (page) => {
          await enAttente(page, CONFIG);
          await enAttente(page, SAUVEGARDES);
        },
      },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, '**/api/admin/system/**') },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['« Expiration JWT (minutes) »', 'champ modifiable', 'retiré : réglage de sécurité fixé par variable d’environnement', 'retrait (6.11)'],
      ['Réglages', 'nom, expiration, maintenance, inscriptions', 'nom, tentatives avant verrouillage, durée du verrouillage, maintenance ; inscriptions si le serveur gère ce réglage', 'assumé (modèle existant)'],
      ['« Créer un snapshot SQL immédiat »', 'bouton', 'retiré : sauvegarde par tâche planifiée hors application', 'retrait (D-09)'],
      ['Archives « backup_auto_…sql », « 14.2 Mo », téléchargement', 'liste fixe', 'date, taille et résultat réels des dernières sauvegardes ; aucun téléchargement', 'assumé (D-09, section 1)'],
      ['Mode maintenance', 'case à cocher', 'confirmation avant activation', 'assumé'],
    ],
    etats: ['Réglages : squelettes, erreur avec « Réessayer », validation par champ, notification de succès.', 'Sauvegardes : squelettes, vide, message si l’état est indisponible, contenu.'],
  },

  '57-supervision-conformite-dsi': {
    titre: 'Supervision technique et conformité',
    path: '/espace/dsi',
    role: 'dsi',
    maquette: '57-supervision-conformite-dsi',
    scenarios: [
      { id: 'contenu', titre: 'Contenu réel (contrôles du serveur, journal réel vide)' },
      { id: 'journal', titre: 'Journal alimenté selon le contrat d’API', before: (page) => page.route(JOURNAL, (route) => json(route, journalContrat)) },
      {
        id: 'non-conforme',
        titre: 'Contrôle non conforme (format du contrat)',
        before: (page) =>
          page.route(CONFORMITE, (route) =>
            json(route, {
              statut: 'A_EXAMINER',
              versionBackend: '2.0.0',
              versionJava: '17',
              comptesActifs: 3,
              tentativesEchouees: 4,
              verifications: [
                { code: 'CHIFFREMENT', libelle: 'Mots de passe chiffrés', conforme: true },
                { code: 'SAUVEGARDE', libelle: 'Sauvegarde de moins de vingt-quatre heures', conforme: false },
              ],
            }),
          ),
        check: async (page) => ((await page.locator('main').innerText()).toLowerCase().includes('non conforme') ? null : 'le contrôle en échec doit être signalé'),
      },
      {
        id: 'chargement',
        titre: 'Chargement',
        waitUntil: 'load',
        before: async (page) => {
          await enAttente(page, CONFORMITE);
          await enAttente(page, JOURNAL);
        },
      },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, '**/api/dsi/**') },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Tuiles « TLS 1.3 / HSTS », « 100% Conforme », « SHA-256 Validé »', 'valeurs fixes', 'versions et compteurs renvoyés par le serveur ; contrôles de conformité listés un à un avec leur résultat', 'assumé (section 1)'],
      ['Badge « Conforme DSI-IST »', 'fixe', 'déduit des contrôles renvoyés : conformes ou à examiner', 'assumé'],
      ['« Certificat de Conformité »', 'bouton', 'retiré : aucun certificat n’est produit par la plateforme', 'retrait'],
      ['Colonne « Hash Cryptographique », emplacement géographique', 'présents', 'retirés : données absentes du journal', 'retrait (section 1)'],
      ['Contrôle de double authentification', 'non prévu', 'non repris même s’il est renvoyé par le backend actuel', 'retrait (6.6)'],
    ],
    etats: ['Contrôles : squelettes, erreur avec « Réessayer », contenu.', 'Journal : squelettes, vide, erreur, contenu paginé côté serveur.', 'Le backend actuel renvoie des contrôles codés en dur (audit) : ils devront être calculés en Phase 3 avant l’ouverture du module.'],
  },

  'D8-mot-de-passe-impose': {
    titre: 'Changement de mot de passe imposé',
    path: '/connexion',
    scenarios: [
      { id: 'initial', titre: 'Première connexion : redirection vers le choix du mot de passe', before: connexionAvecMotDePasseImpose, run: seConnecter },
      {
        id: 'verrou',
        titre: 'Aucune autre page de l’espace n’est accessible',
        // Le backend actuel répond 500 au renouvellement de session sans jeton (rechargement de la page de connexion).
        expectedConsole: ['500'],
        before: connexionAvecMotDePasseImpose,
        run: async (page) => {
          await seConnecter(page);
          await aller(page, '/espace/admin/utilisateurs', false);
        },
        check: async (page) => (new URL(page.url()).pathname === '/espace/mot-de-passe' ? null : `la navigation aurait dû être refusée : ${page.url()}`),
      },
      {
        id: 'validation',
        titre: 'Mot de passe initial erroné (réponse réelle du backend)',
        expectedConsole: ['400', '500'],
        before: connexionAvecMotDePasseImpose,
        run: async (page) => {
          await seConnecter(page);
          await page.getByLabel(/Mot de passe initial/).fill('Inexact@2026');
          await page.getByLabel(/^\s*Nouveau mot de passe/).fill('Nouveau@2026x');
          await page.getByLabel(/Confirmation/).fill('Nouveau@2026x');
          await page.getByRole('button', { name: 'Enregistrer et continuer' }).click();
          await page.getByText('Le mot de passe initial est incorrect.').waitFor();
        },
      },
    ],
    ecarts: [['Page dérivée', 'aucun écran dans la maquette', 'carte reprise de l’écran 21 (réinitialisation du mot de passe)', 'dérivation (section 8.7.9)']],
    etats: ['Formulaire : validation par champ, refus du même mot de passe, erreur du serveur sous le champ.', 'Succès : indicateur levé, retour à l’accueil du rôle.', 'L’indicateur de changement obligatoire est à créer côté serveur (Phase 3) ; la recette l’ajoute à la réponse réelle de connexion.'],
  },
};
