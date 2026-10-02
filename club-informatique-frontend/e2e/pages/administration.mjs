// Scénarios de recette de l'administration (écrans 50 à 55, journal D6, sécurité D7). Chaque scénario ouvre une session réelle.
import { COMPTES, CONSOLE_PANNE, ECARTS_COMMUNS, enAttente, injoignable, json, lire, pageVide } from './_outils.mjs';

const STATS = '**/api/v1/admin/statistiques';
const JOURNAL = '**/api/v1/admin/security/audit-logs*';
const ALERTES = '**/api/v1/admin/security/alerts';
const COMPTES_API = '**/api/v1/admin/users?*';
const COMPTE_API = '**/api/v1/admin/users/*';
const ROLES = '**/api/v1/admin/roles';
const CATEGORIES = '**/api/v1/categories';

const ECARTS_ESPACE = [
  ...ECARTS_COMMUNS,
  ['Barre supérieure', 'champ de recherche globale, pastille à valeur fixe', 'fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte', 'assumé (E-31)'],
];

const compte = async (role) => (await lire('/admin/users?size=100', 'admin')).content.find((u) => u.email === COMPTES[role]);
const cheminCompte = (role) => async () => `/espace/admin/utilisateurs/${(await compte(role)).id}`;

export const PAGES = {
  '50-tdb-administrateur': {
    titre: 'Tableau de bord de l’Administrateur',
    path: '/espace/admin',
    role: 'admin',
    maquette: '50-tdb-administrateur',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel (totaux du serveur hors comptes de test, dernières entrées du journal)',
        check: async (page) => {
          const stats = await lire('/admin/statistiques', 'admin');
          if (!(await page.locator('.tiles').innerText()).includes(String(stats.totalMembres))) return 'les tuiles doivent afficher les totaux du serveur';
          return (await page.locator('main').innerText()).includes('Connexion') ? null : 'les dernières entrées réelles du journal doivent être listées';
        },
      },
      { id: 'journal-vide', titre: 'Journal vide', before: (page) => page.route(JOURNAL, (route) => json(route, pageVide)) },
      {
        id: 'chargement',
        titre: 'Chargement',
        waitUntil: 'load',
        before: async (page) => {
          await enAttente(page, STATS);
          await enAttente(page, JOURNAL);
        },
        check: async (page) => (/\d/.test(await page.locator('.tiles').innerText()) ? 'un chiffre est affiché pendant le chargement' : null),
      },
      {
        id: 'erreur',
        titre: 'Service injoignable',
        expectedConsole: CONSOLE_PANNE,
        before: async (page) => {
          await injoignable(page, STATS);
          await injoignable(page, JOURNAL);
        },
      },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Compteurs', '« 148 », « +18 ce mois », « 94% assiduité », « 99.98% », « 1.4 Go »', 'totaux réels du serveur : comptes, comptes actifs, formations, messages à traiter ; disponibilité et stockage retirés (non mesurés)', 'assumé et retrait (section 1)'],
      ['« Dernières actions critiques de sécurité »', 'entrées fictives (adresse IP, « 2FA Activé », sauvegarde)', 'cinq dernières entrées réelles du journal d’audit ; état vide honnête', 'assumé (6.6 : aucune mention de double authentification)'],
      ['« Maintenance Système », « Sauvegardes & Snapshots BD »', 'accessibles à l’Administrateur', '« Configuration du système » proposée au seul Super Admin', 'assumé (rôles du CDC)'],
      ['« Gestion des utilisateurs (148) »', 'compteur dans le bouton', 'sans compteur', 'retrait (section 1)'],
    ],
    etats: ['Totaux : squelettes sans valeur, erreur avec « Réessayer », contenu.', 'Journal : squelettes, vide, erreur, contenu.'],
  },

  '51-gestion-comptes-utilisateurs': {
    titre: 'Gestion des comptes utilisateurs',
    path: '/espace/admin/utilisateurs',
    role: 'admin',
    maquette: '51-gestion-comptes-utilisateurs',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel (comptes de la base de recette)',
        check: async (page) => ((await page.locator('tbody tr').count()) >= 6 ? null : 'les comptes réels doivent être listés'),
      },
      {
        id: 'recherche',
        titre: 'Recherche par adresse (recherche réelle du serveur)',
        run: async (page) => {
          await page.getByLabel('Rechercher un compte').fill(COMPTES.membre);
          await page.waitForTimeout(900);
        },
        check: async (page) => ((await page.locator('tbody tr').count()) === 1 ? null : 'un seul compte doit correspondre'),
      },
      {
        id: 'invitation',
        titre: 'Invitation : validation du formulaire',
        run: async (page) => {
          await page.getByRole('button', { name: 'Inviter un utilisateur' }).click();
          await page.getByRole('button', { name: 'Envoyer l’invitation' }).click();
        },
        check: async (page) => ((await page.locator('.form-error:not(:empty)').count()) >= 3 ? null : 'les erreurs de champ doivent être affichées'),
      },
      { id: 'vide', titre: 'Aucun compte', before: (page) => page.route(COMPTES_API, (route) => json(route, pageVide)) },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, COMPTES_API) },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, COMPTES_API) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Rôle attribué', 'un seul rôle par compte', 'tous les rôles réels du compte, du plus élevé au moins élevé', 'assumé (modèle existant)'],
      ['« Inviter un utilisateur »', 'bouton inactif', 'formulaire : la personne invitée choisit elle-même son mot de passe par un lien à usage unique reçu par courriel', 'assumé (8.7.9)'],
      ['Filière', 'saisie libre', 'saisie libre', 'conforme (6.5)'],
    ],
    etats: ['Chargement : squelettes.', 'Vide : message (ou message de recherche).', 'Erreur : message et « Réessayer ».', 'Contenu : pagination côté serveur, recherche différée.'],
  },

  '52-detail-edition-compte': {
    titre: 'Détail et édition d’un compte',
    path: '/espace/admin/utilisateurs/:id',
    role: 'admin',
    maquette: '52-detail-edition-compte',
    scenarios: [
      { id: 'contenu', titre: 'Contenu réel (compte du membre de recette)', path: cheminCompte('membre') },
      {
        id: 'validation',
        titre: 'Prénom vide et aucun rôle',
        path: cheminCompte('membre'),
        run: async (page) => {
          await page.getByLabel(/Prénom/).fill('');
          for (const box of await page.getByRole('checkbox', { checked: true }).all()) await box.uncheck();
          await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();
        },
        check: async (page) => ((await page.locator('main').innerText()).includes('Attribuez au moins un rôle.') ? null : 'le rôle manquant doit être signalé'),
      },
      {
        id: 'enregistrement',
        titre: 'Enregistrement réel (backend)',
        path: cheminCompte('membre'),
        run: async (page) => {
          await page.getByLabel(/Filière/).fill('Informatique de gestion, 2e année');
          await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();
          await page.getByText('Le compte est mis à jour.').waitFor();
        },
      },
      {
        id: 'suspension',
        titre: 'Suspension : modale de confirmation (non confirmée)',
        path: cheminCompte('membre'),
        run: async (page) => {
          await page.getByRole('button', { name: 'Suspendre' }).click();
          await page.getByRole('dialog').waitFor();
          await page.waitForTimeout(400);
        },
      },
      {
        id: 'soi-meme',
        titre: 'Son propre compte : rôles et statut non modifiables',
        path: cheminCompte('admin'),
        check: async (page) => ((await page.getByRole('button', { name: 'Suspendre' }).count()) === 0 ? null : 'un administrateur ne doit pas pouvoir se suspendre lui-même'),
      },
      { id: 'introuvable', titre: 'Compte introuvable (réponse réelle du backend)', path: '/espace/admin/utilisateurs/999999', expectedConsole: ['404'] },
      { id: 'chargement', titre: 'Chargement', path: cheminCompte('membre'), waitUntil: 'load', before: (page) => enAttente(page, COMPTE_API) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['« Nom complet »', 'un champ', 'prénom et nom', 'assumé'],
      ['Adresse électronique', 'modifiable', 'en lecture seule : l’adresse est l’identifiant de connexion', 'assumé (modèle existant)'],
      ['Rôle', 'liste à choix unique', 'cases à cocher (plusieurs rôles possibles) ; Super Admin et DSI attribuables par le seul Super Admin', 'assumé (UC-24)'],
      ['« Suspendre »', 'action immédiate', 'confirmation ; « Réactiver » pour un compte suspendu ; impossible sur son propre compte', 'assumé'],
      ['« Historique d’activité »', 'entrées fictives', 'entrées réelles du journal d’audit pour ce compte', 'assumé (section 1)'],
    ],
    etats: ['Chargement : squelettes.', 'Introuvable : message dédié.', 'Erreur : message et « Réessayer ».', 'Validation : message par champ et pour les rôles.', 'Historique : squelettes, vide, erreur, contenu.'],
  },

  '53-gestion-roles-permissions': {
    titre: 'Rôles et permissions',
    path: '/espace/admin/roles',
    role: 'admin',
    maquette: '53-gestion-roles-permissions',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel (rôles et permissions du serveur)',
        check: async (page) => ((await page.locator('tbody tr').count()) >= 10 ? null : 'les permissions réelles doivent être listées'),
      },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, ROLES) },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, ROLES) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Matrice', 'sept lignes de fonctionnalités, quatre rôles', 'permissions et rôles réels du serveur', 'assumé (section 1)'],
      ['« Rétablir défaut », « Enregistrer la matrice »', 'boutons', 'retirés : matrice en lecture seule', 'retrait (D-07)'],
      ['Pictogrammes « ✓ » et « ✗ »', 'caractères', 'icônes avec texte pour les lecteurs d’écran', 'corrigé (E-01)'],
    ],
    etats: ['Chargement : squelette.', 'Erreur : message et « Réessayer ».', 'Contenu : tableau défilant sur petit écran.'],
  },

  '54-gestion-contenus-categories': {
    titre: 'Gestion des catégories',
    path: '/espace/admin/categories',
    role: 'admin',
    maquette: '54-gestion-contenus-categories',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel (catégories du serveur)',
        check: async (page) => ((await page.locator('main li').count()) >= 3 ? null : 'les catégories réelles doivent être listées'),
      },
      {
        id: 'creation',
        titre: 'Création : validation du formulaire',
        run: async (page) => {
          await page.getByRole('button', { name: 'Nouvelle catégorie' }).click();
          await page.getByRole('button', { name: 'Enregistrer' }).click();
        },
        check: async (page) => ((await page.locator('.form-error:not(:empty)').count()) >= 1 ? null : 'le nom obligatoire doit être signalé'),
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
      { id: 'vide', titre: 'Aucune catégorie', before: (page) => page.route(CATEGORIES, (route) => json(route, [])) },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, CATEGORIES) },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, CATEGORIES) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Compteurs « 18 articles • 3 cours »', 'valeurs fixes', 'retirés : le serveur ne fournit pas ces décomptes', 'retrait (section 1)'],
      ['« Archiver »', 'bouton', '« Supprimer » avec confirmation ; le serveur refuse si la catégorie est utilisée', 'assumé (modèle existant)'],
      ['Couleur', 'badge coloré', 'repère de la couleur réelle de la catégorie, modifiable', 'assumé'],
    ],
    etats: ['Chargement : squelettes.', 'Vide : message.', 'Erreur : message et « Réessayer ».', 'Formulaire : validation, erreurs du serveur, notification de succès.'],
  },

  '55-statistiques-utilisation-detaillees': {
    titre: 'Statistiques d’utilisation',
    path: '/espace/admin/statistiques',
    role: 'admin',
    maquette: '55-statistiques-utilisation-detaillees',
    scenarios: [
      { id: 'contenu', titre: 'Contenu réel (totaux et répartitions du serveur)' },
      {
        id: 'chargement',
        titre: 'Chargement',
        waitUntil: 'load',
        before: (page) => enAttente(page, STATS),
        check: async (page) => (/\d/.test(await page.locator('main').innerText()) ? 'un chiffre est affiché pendant le chargement' : null),
      },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, STATS) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['« Connexions & Sessions par Semaine », « 412 sessions actives », « +32% »', 'graphique et valeurs fixes', 'retirés : le serveur ne mesure pas les connexions', 'retrait (section 1)'],
      ['« Répartition par Filière »', 'pourcentages fixes', 'répartitions réelles disponibles : comptes par rôle, projets par statut', 'assumé (donnée par filière absente)'],
      ['« Exporter Rapport PDF »', 'bouton', 'retiré', 'retrait'],
      ['Totaux', 'absents', 'six totaux réels du serveur', 'assumé'],
    ],
    etats: ['Chargement : squelettes, aucun chiffre.', 'Erreur : message et « Réessayer ».', 'Contenu : totaux et répartitions.', 'Les comptes de test et ce qu’ils ont créé sont exclus par le serveur (règle 7).'],
  },

  'D7-securite-comptes': {
    titre: 'Sécurité des comptes',
    path: '/espace/admin/securite',
    role: 'admin',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel (compte suspendu et connexions refusées de la base de recette)',
        check: async (page) => {
          const alertes = await lire('/admin/security/alerts', 'admin');
          if (!alertes.some((a) => a.typeAlerte === 'COMPTE_SUSPENDU')) return 'la base de recette doit contenir un compte suspendu';
          return (await page.locator('main li').count()) === alertes.length ? null : 'chaque alerte du serveur doit être listée';
        },
      },
      { id: 'vide', titre: 'Aucune alerte', before: (page) => page.route(ALERTES, (route) => json(route, [])) },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, ALERTES) },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, ALERTES) },
    ],
    ecarts: [['Page dérivée', 'aucun écran dans la maquette', 'cartes reprises de l’écran 50 ; aucune interface de double authentification', 'dérivation (UC-27, règle 6.6)']],
    etats: ['Chargement : squelettes.', 'Vide : message.', 'Erreur : message et « Réessayer ».', 'Contenu : alertes de la plus grave à la moins grave ; déverrouillage et suspension depuis la fiche du compte.'],
  },

  'D6-journal-audit': {
    titre: 'Journal d’audit',
    path: '/espace/admin/journal',
    role: 'admin',
    scenarios: [
      { id: 'contenu', titre: 'Contenu réel (journal alimenté par les actions de la recette)', check: async (page) => ((await page.locator('tbody tr').count()) >= 5 ? null : 'les entrées réelles du journal doivent être listées') },
      { id: 'vide', titre: 'Journal vide', before: (page) => page.route(JOURNAL, (route) => json(route, pageVide)) },
      {
        id: 'filtre',
        titre: 'Filtre « Échec » (filtre réel du serveur)',
        run: async (page) => {
          await page.getByLabel('Résultat').selectOption('ECHEC');
          await page.waitForTimeout(600);
        },
        check: async (page) => {
          const attendu = (await lire('/admin/security/audit-logs?statut=ECHEC&size=20', 'admin')).totalElements;
          const lignes = await page.locator('tbody tr').count();
          return attendu >= 1 && lignes === Math.min(attendu, 20) ? null : `les entrées en échec du serveur doivent rester seules : ${lignes} affichées, ${attendu} attendues`;
        },
      },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, JOURNAL) },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, JOURNAL) },
    ],
    ecarts: [['Page dérivée', 'aucun écran dans la maquette', 'tableau repris de l’écran 51', 'dérivation (sections 8.7.2 et 12.6)']],
    etats: ['Chargement : squelettes.', 'Vide : message (ou message de filtre).', 'Erreur : message et « Réessayer ».', 'Contenu : pagination côté serveur, filtres par compte et par résultat.'],
  },
};
