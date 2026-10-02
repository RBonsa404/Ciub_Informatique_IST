// Scénarios de recette des projets (écrans 31, 32, 41, 46 et 47). Chaque scénario ouvre une session réelle.
import { CONSOLE_PANNE, ECARTS_COMMUNS, enAttente, injoignable, json, lire, pageVide } from './_outils.mjs';

const MES_PROJETS = '**/api/v1/projets/mes-projets*';
const PUBLIES = '**/api/v1/projets?*';
const EN_ATTENTE = '**/api/v1/projets/en-attente';
const PROJET = '**/api/v1/projets/*';

const ECARTS_ESPACE = [
  ...ECARTS_COMMUNS,
  ['Barre supérieure', 'champ de recherche globale, pastille à valeur fixe', 'fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte', 'assumé (E-31)'],
];

const tous = async () => (await lire('/gestion/projets?size=100', 'responsable')).content;
const propose = async () => (await tous()).find((p) => p.statut === 'PROPOSE');
const suivi = async () => (await tous()).find((p) => p.statut === 'EN_COURS' || p.statut === 'VALIDE');

export const PAGES = {
  '31-proposer-projet': {
    titre: 'Proposition de projet',
    path: '/espace/projets/proposer',
    role: 'membre',
    maquette: '31-proposer-projet',
    scenarios: [
      { id: 'initial', titre: 'Formulaire initial (catégories réelles)' },
      {
        id: 'validation',
        titre: 'Champs obligatoires vides et adresse invalide',
        run: async (page) => {
          await page.getByLabel(/Dépôt du code/).fill('depot');
          await page.getByRole('button', { name: /Transmettre la proposition/ }).click();
        },
        check: async (page) => ((await page.locator('.form-error:not(:empty)').count()) >= 4 ? null : 'les erreurs de champ doivent être affichées'),
      },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['« Objectifs & Fonctionnalités clés »', 'un champ', 'description (obligatoire) et objectifs (facultatif), comme sur la fiche publique', 'assumé (modèle existant)'],
      ['« Membres de l’équipe »', 'texte libre', 'retiré : l’équipe se compose de comptes réels, après validation', 'retrait (modèle existant)'],
      ['Catégorie et dépôt du code', 'absents', 'champs facultatifs', 'assumé (modèle existant)'],
    ],
    etats: ['Validation : message par champ, erreurs du serveur sous le champ.', 'Succès : notification et retour à « Mes projets ».', 'La création réelle est prouvée par le script de peuplement, qui appelle le même point d’accès.'],
  },

  '32-suivi-projets-proposes': {
    titre: 'Suivi de mes projets proposés',
    path: '/espace/projets',
    role: 'membre',
    maquette: '32-suivi-projets-proposes',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel (projets proposés par le membre de recette, motif du rejet compris)',
        check: async (page) => {
          if ((await page.locator('main li').count()) < 4) return 'les projets du membre doivent être listés';
          return (await page.locator('main').innerText()).includes('Motif d’essai') ? null : 'le motif du rejet doit être affiché';
        },
      },
      { id: 'vide', titre: 'Aucun projet proposé', before: (page) => page.route(MES_PROJETS, (route) => json(route, pageVide)) },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, MES_PROJETS) },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, MES_PROJETS) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Liste des projets', 'seul l’état vide est dessiné', 'cartes dérivées de l’écran 41 : titre, date, catégorie, avancement, statut, motif d’un rejet', 'dérivation'],
      ['Filtre de statut', '« En attente », « Validé & En cours », « Terminé »', 'statuts du modèle, rejet compris', 'assumé'],
      ['Catégories', 'liste fixe', 'catégories réelles du serveur', 'assumé (section 1)'],
      ['Bouton « Filtres avancés » et illustration à emoji', 'présents', 'retirés', 'retrait (6.4)'],
    ],
    etats: ['Chargement : squelettes.', 'Vide : message et bouton de proposition (ou message de filtre).', 'Erreur : message et « Réessayer ».', 'Contenu : pagination et tri côté serveur.'],
  },

  '41-suivi-projets-formateur': {
    titre: 'Suivi des projets par le formateur',
    path: '/espace/formateur/projets',
    role: 'formateur',
    maquette: '41-suivi-projets-formateur',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel (projets validés de la base de recette)',
        check: async (page) => ((await page.locator('main li').count()) >= 2 ? null : 'les projets validés doivent être listés'),
      },
      { id: 'vide', titre: 'Aucun projet validé', before: (page) => page.route(PUBLIES, (route) => json(route, pageVide)) },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, PUBLIES) },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, PUBLIES) },
      { id: 'suivi', titre: 'Suivi d’un projet : fiche et formulaire (projet réel)', path: async () => `/espace/formateur/projets/${(await suivi()).id}` },
      {
        id: 'suivi-enregistrement',
        titre: 'Suivi d’un projet : enregistrement réel (backend)',
        path: async () => `/espace/formateur/projets/${(await suivi()).id}`,
        run: async (page) => {
          await page.getByLabel(/Avancement/).fill('40');
          await page.getByLabel(/Note de suivi/).fill('Suivi d’essai.');
          await page.getByRole('button', { name: 'Enregistrer le suivi' }).click();
          await page.getByText('Le suivi du projet est enregistré.').waitFor();
        },
      },
      { id: 'suivi-introuvable', titre: 'Suivi d’un projet introuvable (réponse réelle du backend)', path: '/espace/formateur/projets/999999', expectedConsole: ['404'] },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Compteurs « 8 projets suivis », « 3 à relancer »', 'valeurs fixes', 'nombre réel de projets validés ; « à relancer » retiré (notion absente)', 'assumé et retrait (section 1)'],
      ['Filtres par domaine', 'liste fixe de trois domaines', 'catégories réelles du serveur', 'assumé'],
      ['Pastilles de domaine', 'texte dans la pastille', 'icône unique', 'assumé (6.4)'],
      ['« Voir le projet », « Examiner le livrable »', 'liens vers l’écran du Responsable', '« Suivre le projet » : fiche et formulaire de suivi (avancement, note)', 'dérivation (UC-17)'],
    ],
    etats: ['Liste : squelettes, vide, erreur, contenu paginé côté serveur.', 'Suivi : squelette, introuvable, validation, notification de succès.'],
  },

  '46-validation-projets-liste': {
    titre: 'Validation des projets, liste',
    path: '/espace/gestion/projets',
    role: 'responsable',
    maquette: '46-validation-projets-liste',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel (proposition en attente de la base de recette)',
        check: async (page) => ((await page.locator('tbody tr').count()) >= 1 ? null : 'la proposition en attente doit être listée'),
      },
      { id: 'vide', titre: 'Aucune proposition en attente', before: (page) => page.route(EN_ATTENTE, (route) => json(route, [])) },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, EN_ATTENTE) },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, EN_ATTENTE) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Compteurs « 5 », « 12 », « 2 »', 'valeurs fixes', 'décomptes calculés par le serveur (en attente, validés, rejetés)', 'assumé (section 1)'],
      ['Colonne « Filière »', 'présente', 'affichée seulement si le serveur fournit la filière du porteur', 'assumé'],
    ],
    etats: ['Chargement : squelettes, compteurs absents.', 'Vide : message.', 'Erreur : message et « Réessayer ».', 'Contenu : tableau défilant sur petit écran.'],
  },

  '47-detail-projet-valider': {
    titre: 'Détail d’un projet à valider',
    path: '/espace/gestion/projets/:id',
    role: 'responsable',
    maquette: '47-detail-projet-valider',
    scenarios: [
      { id: 'contenu', titre: 'Contenu réel (proposition en attente)', path: async () => `/espace/gestion/projets/${(await propose()).id}` },
      {
        id: 'rejet-sans-motif',
        titre: 'Rejet sans motif : message sous le champ',
        path: async () => `/espace/gestion/projets/${(await propose()).id}`,
        run: (page) => page.getByRole('button', { name: 'Rejeter' }).click(),
        check: async (page) => ((await page.locator('main').innerText()).includes('Indiquez le motif du rejet.') ? null : 'le motif doit être exigé'),
      },
      {
        id: 'approbation',
        titre: 'Approbation : modale de confirmation (non confirmée)',
        path: async () => `/espace/gestion/projets/${(await propose()).id}`,
        run: async (page) => {
          await page.getByRole('button', { name: 'Approuver' }).click();
          await page.getByRole('dialog').waitFor();
          await page.waitForTimeout(400);
        },
      },
      { id: 'decide', titre: 'Projet déjà décidé (projet réel validé)', path: async () => `/espace/gestion/projets/${(await suivi()).id}` },
      { id: 'introuvable', titre: 'Projet introuvable (réponse réelle du backend)', path: '/espace/gestion/projets/999999', expectedConsole: ['404'] },
      { id: 'chargement', titre: 'Chargement', path: '/espace/gestion/projets/1', waitUntil: 'load', before: (page) => enAttente(page, PROJET) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Description', 'texte fictif', 'description, objectifs, technologies et catégorie réels', 'assumé (section 1)'],
      ['« Fichiers joints » avec poids', 'deux fichiers', 'liens réels du projet (dépôt, documentation) s’ils existent', 'assumé (modèle existant)'],
      ['Participants', 'pastilles et « Équipe de 3 étudiants »', 'membres réels du projet, nommés', 'assumé'],
      ['Motif du rejet', 'champ facultatif sur une ligne', 'obligatoire pour un rejet, communiqué à l’auteur', 'assumé (UC-20)'],
      ['Approuver, rejeter', 'action immédiate', 'confirmation préalable', 'assumé'],
      ['Projet déjà décidé', 'non prévu', 'la décision prise est affichée à la place des boutons', 'dérivation'],
    ],
    etats: ['Chargement : squelettes.', 'Introuvable : message dédié.', 'Erreur : message et « Réessayer ».', 'Décision : validation du motif, confirmation, notification et retour à la liste.', 'La décision réelle est prouvée par le script de peuplement, qui appelle le même point d’accès.'],
  },
};
