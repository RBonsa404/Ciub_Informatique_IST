// Scénarios de recette de la gestion du club par le Responsable. Chaque scénario ouvre une session réelle.
import { CONSOLE_PANNE, ECARTS_COMMUNS, enAttente, injoignable, json, lire, pageVide } from './_outils.mjs';

const EVENEMENTS = '**/api/evenements/admin/all*';
const INSCRITS = '**/api/inscriptions/{evenements,formations}/*';

const ECARTS_ESPACE = [
  ...ECARTS_COMMUNS,
  ['Barre supérieure', 'champ de recherche globale, pastille à valeur fixe', 'fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte', 'assumé (E-31)'],
];

/** Séance de recette dont la capacité est atteinte : un inscrit confirmé et un membre en liste d'attente. */
async function seanceComplete() {
  const formations = (await lire('/formations/admin/all?size=50', 'responsable')).content;
  for (const session of formations.flatMap((f) => f.sessions ?? [])) {
    const inscrits = await lire(`/inscriptions/formations/${session.id}`, 'responsable');
    if (inscrits.some((i) => i.statut === 'LISTE_ATTENTE')) return session.id;
  }
  throw new Error('aucune séance avec liste d’attente dans la base de recette');
}

export const PAGES = {
  '45-gestion-evenements': {
    titre: 'Gestion des événements',
    path: '/espace/gestion/evenements',
    role: 'responsable',
    maquette: '45-gestion-evenements',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel (événements de la base de recette)',
        check: async (page) => ((await page.locator('main li').count()) >= 3 && (await page.locator('td.marked').count()) >= 1 ? null : 'la liste et le calendrier doivent refléter les événements réels'),
      },
      {
        id: 'creation',
        titre: 'Création : validation du formulaire',
        run: async (page) => {
          await page.getByRole('button', { name: 'Nouvel événement' }).click();
          await page.getByRole('button', { name: 'Enregistrer l’événement' }).click();
        },
        check: async (page) => ((await page.locator('.form-error:not(:empty)').count()) >= 4 ? null : 'les erreurs de champ doivent être affichées'),
      },
      {
        id: 'modification',
        titre: 'Modification : enregistrement réel (backend)',
        run: async (page) => {
          await page.getByRole('button', { name: /^Modifier/ }).first().click();
          await page.getByLabel(/Lieu/).fill('Amphithéâtre de l’IST');
          await page.getByRole('button', { name: 'Enregistrer l’événement' }).click();
          await page.getByText('L’événement est mis à jour.').waitFor();
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
      { id: 'vide', titre: 'Aucun événement', before: (page) => page.route(EVENEMENTS, (route) => json(route, pageVide)) },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, EVENEMENTS) },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, EVENEMENTS) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Calendrier', 'mois fixe « Septembre / Octobre 2026 », jours surlignés fictifs', 'mois courant, navigation entre les mois, jours des événements réels', 'assumé (section 1)'],
      ['« Gérer inscrits (24) »', 'valeur fixe', 'nombre réel d’inscrits renvoyé par le serveur', 'assumé'],
      ['Badge', '« À venir », « Passé », « Complet »', 'mêmes états, déduits des données, et « Brouillon »', 'assumé'],
      ['Formulaire', 'toujours affiché, quatre champs', 'affiché à la création ou à la modification ; début, fin, description et catégorie ajoutés (champs obligatoires du modèle)', 'assumé'],
      ['« Inscription ouverte », « Liste d’attente activée »', 'cases à cocher', 'interrupteur « Publier l’événement » ; la liste d’attente découle de la capacité', 'assumé (modèle existant)'],
      ['Actions par événement', '« Gérer inscrits » seulement', 'gérer les inscrits, modifier, supprimer avec confirmation', 'assumé (UC-19)'],
    ],
    etats: ['Liste : squelettes, vide, erreur, contenu paginé côté serveur.', 'Calendrier : squelette, erreur avec « Réessayer », mention si aucun événement dans le mois.', 'Formulaire : validation par champ, erreurs du serveur, notification de succès.'],
  },

  '48-gestion-inscriptions-attente': {
    titre: 'Inscriptions et listes d’attente',
    path: '/espace/gestion/inscriptions',
    role: 'responsable',
    maquette: '48-gestion-inscriptions-attente',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel : séance complète avec liste d’attente',
        path: async () => `/espace/gestion/inscriptions?session=${await seanceComplete()}`,
        check: async (page) => ((await page.getByRole('button', { name: /^Promouvoir/ }).count()) === 1 ? null : 'le membre en liste d’attente doit pouvoir être promu'),
      },
      { id: 'selection', titre: 'Aucune activité choisie' },
      {
        id: 'recherche',
        titre: 'Recherche sans résultat',
        path: async () => `/espace/gestion/inscriptions?session=${await seanceComplete()}`,
        run: (page) => page.getByLabel('Rechercher un participant').fill('zzz'),
        check: async (page) => ((await page.locator('main').innerText()).includes('ne correspond à la recherche') ? null : 'le message de recherche vide doit être affiché'),
      },
      { id: 'vide', titre: 'Activité sans inscrit', path: '/espace/gestion/inscriptions?evenement=1', before: (page) => page.route(INSCRITS, (route) => json(route, [])) },
      { id: 'chargement', titre: 'Chargement des inscrits', path: '/espace/gestion/inscriptions?evenement=1', waitUntil: 'load', before: (page) => enAttente(page, INSCRITS) },
      { id: 'erreur', titre: 'Service injoignable', path: '/espace/gestion/inscriptions?evenement=1', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, INSCRITS) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Choix de l’activité', 'liste de trois titres', 'événements et séances de formation réels, regroupés ; l’activité choisie figure dans l’adresse', 'assumé'],
      ['Compteurs « Inscrits 24 », « En attente 6 »', 'valeurs fixes', 'effectifs réels de l’activité choisie, affichés après chargement', 'assumé (section 1)'],
      ['« Exporter CSV »', 'bouton inactif', 'export réel des inscrits affichés (nom, adresse, statut, date)', 'assumé (D-06)'],
      ['Sous-titre « promouvez automatiquement »', 'présent', 'promotion manuelle par le Responsable', 'assumé (UC-21)'],
      ['Filière des inscrits', 'présente', 'affichée seulement si le serveur la fournit', 'assumé'],
    ],
    etats: ['Activités : squelette, vide, erreur.', 'Inscrits : invitation à choisir, squelettes, vide, erreur avec « Réessayer », contenu.', 'Recherche : filtre immédiat sur la liste chargée, messages propres à chaque colonne.'],
  },
};
