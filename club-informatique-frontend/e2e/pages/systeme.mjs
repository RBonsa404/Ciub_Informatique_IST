// Scénarios de recette du Super Admin et de la DSI : configuration (écran 56), supervision (écran 57), mot de passe imposé (D8).
import { API, CONSOLE_PANNE, ECARTS_COMMUNS, PASSWORD, aller, enAttente, injoignable, json, lire } from './_outils.mjs';

const CONFIG = '**/api/v1/admin/system/config';
const SAUVEGARDES = '**/api/v1/admin/system/sauvegardes';
const CONFORMITE = '**/api/v1/dsi/conformite';
const JOURNAL = '**/api/v1/dsi/conformite/logs*';

const ECARTS_ESPACE = [
  ...ECARTS_COMMUNS,
  ['Barre supérieure', 'champ de recherche globale, pastille à valeur fixe', 'fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte', 'assumé (E-31)'],
];

/** Premier Super Admin créé au démarrage par l'amorçage (variables d'environnement) : son mot de passe initial doit être changé. */
const PREMIER_ADMIN = process.env.RECETTE_ADMIN_EMAIL ?? 'premier.admin@club.test';
const MOT_DE_PASSE_INITIAL = process.env.RECETTE_ADMIN_MOT_DE_PASSE ?? `${PASSWORD}-initial`;

async function seConnecter(page) {
  await page.getByLabel(/Adresse électronique/).fill(PREMIER_ADMIN);
  await page.getByLabel(/^\s*Mot de passe/).fill(MOT_DE_PASSE_INITIAL);
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
      {
        id: 'contenu',
        titre: 'Réglages et sauvegardes réels (sauvegarde réalisée par le script d’exploitation)',
        check: async (page) => {
          const liste = await lire('/admin/system/sauvegardes', 'superadmin');
          if (liste.length === 0) return 'la base de recette doit contenir une sauvegarde réelle';
          return (await page.locator('main').innerText()).toLowerCase().includes('réussie') ? null : 'le résultat de la sauvegarde réelle doit être affiché';
        },
      },
      { id: 'sans-sauvegarde', titre: 'Aucune sauvegarde enregistrée', before: (page) => page.route(SAUVEGARDES, (route) => json(route, [])) },
      {
        id: 'validation',
        titre: 'Valeurs hors bornes',
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
        run: async (page) => {
          await page.getByLabel(/Durée du verrouillage/).fill('15');
          await page.getByRole('button', { name: 'Enregistrer les réglages' }).click();
          await page.getByText('Les réglages sont enregistrés.').waitFor();
        },
      },
      {
        id: 'maintenance',
        titre: 'Mode maintenance : modale de confirmation (non confirmée)',
        run: async (page) => {
          await page.getByRole('checkbox', { name: 'Activer le mode maintenance' }).check();
          await page.getByRole('button', { name: 'Enregistrer les réglages' }).click();
          await page.getByRole('dialog').waitFor();
          await page.waitForTimeout(400);
        },
      },
      { id: 'sauvegardes-indisponibles', titre: 'État des sauvegardes injoignable : message dans le panneau', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, SAUVEGARDES) },
      {
        id: 'chargement',
        titre: 'Chargement',
        waitUntil: 'load',
        before: async (page) => {
          await enAttente(page, CONFIG);
          await enAttente(page, SAUVEGARDES);
        },
      },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, '**/api/v1/admin/system/**') },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['« Expiration JWT (minutes) »', 'champ modifiable', 'retiré : réglage de sécurité fixé par variable d’environnement', 'retrait (6.11)'],
      ['Réglages', 'nom, expiration, maintenance, inscriptions', 'nom, tentatives avant verrouillage, durée du verrouillage, maintenance, ouverture des inscriptions', 'assumé (modèle existant)'],
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
      {
        id: 'contenu',
        titre: 'Contenu réel (contrôles calculés par le serveur, journal réel)',
        check: async (page) => {
          const conformite = await lire('/dsi/conformite', 'dsi');
          const texte = await page.locator('main').innerText();
          const manquant = conformite.verifications.find((v) => !texte.includes(v.libelle));
          if (manquant) return `contrôle du serveur non affiché : ${manquant.libelle}`;
          return (await page.locator('tbody tr').count()) >= 1 ? null : 'les entrées réelles du journal doivent être listées';
        },
      },
      { id: 'journal-vide', titre: 'Journal vide', before: (page) => page.route(JOURNAL, (route) => json(route, { content: [], page: 0, size: 15, totalElements: 0, totalPages: 0 })) },
      {
        id: 'non-conforme',
        titre: 'Contrôles non conformes signalés (pile de recette : cookie non sécurisé, comptes de test présents)',
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
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, '**/api/v1/dsi/**') },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Tuiles « TLS 1.3 / HSTS », « 100% Conforme », « SHA-256 Validé »', 'valeurs fixes', 'versions et compteurs renvoyés par le serveur ; contrôles de conformité listés un à un avec leur résultat', 'assumé (section 1)'],
      ['Badge « Conforme DSI-IST »', 'fixe', 'déduit des contrôles renvoyés : conformes ou à examiner', 'assumé'],
      ['« Certificat de Conformité »', 'bouton', 'retiré : aucun certificat n’est produit par la plateforme', 'retrait'],
      ['Colonne « Hash Cryptographique », emplacement géographique', 'présents', 'retirés : données absentes du journal', 'retrait (section 1)'],
      ['Contrôle de double authentification', 'non prévu', 'absent : aucune double authentification dans le produit', 'conforme (6.6)'],
    ],
    etats: ['Contrôles : squelettes, erreur avec « Réessayer », contenu.', 'Journal : squelettes, vide, erreur, contenu paginé côté serveur.', 'Les contrôles sont calculés par le serveur à chaque consultation.'],
  },

  'D8-mot-de-passe-impose': {
    titre: 'Changement de mot de passe imposé',
    path: '/connexion',
    scenarios: [
      { id: 'initial', titre: 'Première connexion du Super Admin créé par l’amorçage : redirection vers le choix du mot de passe', run: seConnecter },
      {
        id: 'verrou',
        titre: 'Aucune autre page de l’espace n’est accessible',
        run: async (page) => {
          await seConnecter(page);
          await aller(page, '/espace/admin/utilisateurs', false);
        },
        check: async (page) => {
          if (new URL(page.url()).pathname !== '/espace/mot-de-passe') return `la navigation aurait dû être refusée : ${page.url()}`;
          // Le serveur refuse lui aussi toute autre requête tant que le mot de passe initial n'est pas changé.
          const session = await (await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: PREMIER_ADMIN, motDePasse: MOT_DE_PASSE_INITIAL }) })).json();
          const refus = await fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
          const corps = await refus.json();
          return refus.status === 403 && corps.code === 'CHANGEMENT_MOT_DE_PASSE_REQUIS' ? null : `le serveur aurait dû refuser la requête : ${refus.status} ${corps.code}`;
        },
      },
      {
        id: 'validation',
        titre: 'Mot de passe initial erroné (réponse réelle du backend)',
        expectedConsole: ['400'],
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
    etats: ['Formulaire : validation par champ, refus du même mot de passe, erreur du serveur sous le champ.', 'Succès : indicateur levé, retour à l’accueil du rôle.', 'Le compte utilisé est le premier Super Admin créé par l’amorçage ; le changement réussi est rejoué dans le parcours du Super Admin (base neuve).'],
  },
};
