// Scénarios de recette de l'espace Formateur (écrans 35 à 40). Chaque scénario ouvre une session réelle.
import { API, CONSOLE_PANNE, ECARTS_COMMUNS, enAttente, injoignable, jeton, json, lire, pageVide } from './_outils.mjs';

const COURS = '**/api/v1/gestion/formations*';
const FORMATION = '**/api/v1/formations/*';
const INSCRITS = '**/api/v1/inscriptions/formations/*';

const ECARTS_ESPACE = [
  ...ECARTS_COMMUNS,
  ['Barre supérieure', 'champ de recherche globale, pastille à valeur fixe', 'fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte', 'assumé (E-31)'],
];

/** Premier cours publié du formateur de recette (il porte des séances, un support et un devoir) et sa première séance, lus sur le backend réel. */
async function cours() {
  const formation = (await lire('/gestion/formations?size=20', 'formateur')).content.find((f) => f.publie && (f.sessions ?? []).length > 0);
  const session = [...formation.sessions].sort((a, b) => a.dateDebut.localeCompare(b.dateDebut))[0];
  return { formation, session };
}
const chemin = (suffixe = '') => async () => `/espace/formateur/cours/${(await cours()).formation.id}${suffixe}`;
const cheminPresences = async () => {
  const { formation, session } = await cours();
  return `/espace/formateur/cours/${formation.id}/sessions/${session.id}/presences`;
};

export const PAGES = {
  '35-tdb-formateur': {
    titre: 'Tableau de bord Formateur',
    path: '/espace/formateur',
    role: 'formateur',
    maquette: '35-tdb-formateur',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel (cours et séances du formateur de recette)',
        check: async (page) => ((await page.locator('main li').count()) >= 3 ? null : 'les séances et les cours réels doivent être listés'),
      },
      { id: 'vide', titre: 'Aucun cours', before: (page) => page.route(COURS, (route) => json(route, pageVide)) },
      {
        id: 'chargement',
        titre: 'Chargement',
        waitUntil: 'load',
        before: (page) => enAttente(page, COURS),
        check: async (page) => (/\b0\b/.test(await page.locator('main').innerText()) ? 'un zéro est affiché pendant le chargement' : null),
      },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, COURS) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Titre', '« Bienvenue, Dr. Ouédraogo ! » suivi d’un emoji', '« Bienvenue, <prénom> » sans titre honorifique ni emoji', 'corrigé (6.4)'],
      ['Tuiles d’accès rapide', 'quatre tuiles avec compteurs fixes (« 3 modules actifs », « 8 projets suivis »)', 'trois tuiles sans compteur : mes cours, catalogue, projets suivis', 'retrait des valeurs (section 1)'],
      ['Tuiles « Émargement » et « Publier devoir »', 'liens directs', 'actions proposées sur chaque séance et dans le détail du cours (elles dépendent d’un cours)', 'assumé'],
      ['Séances à venir', 'deux séances d’illustration avec thème', 'séances réelles : rang dans le cours, date, lieu, nombre réel d’inscrits', 'assumé (section 1)'],
      ['« Derniers devoirs rendus », « 6 à noter »', 'présents', 'remplacés par la liste des cours du formateur', 'retrait (D-03)'],
    ],
    etats: ['Chargement : squelettes dans les deux panneaux.', 'Vide : message par panneau et lien de création.', 'Erreur : message et « Réessayer ».', 'Contenu : cinq prochaines séances et cours du formateur.'],
  },

  '36-gestion-cours-liste': {
    titre: 'Gestion des cours, liste',
    path: '/espace/formateur/cours',
    role: 'formateur',
    maquette: '36-gestion-cours-liste',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel (cours du formateur de recette)',
        check: async (page) => ((await page.locator('main li').count()) >= 2 ? null : 'les cours réels doivent être listés'),
      },
      {
        id: 'filtre',
        titre: 'Filtre « Brouillons » (filtre réel du serveur)',
        run: async (page) => {
          await page.getByRole('button', { name: 'Brouillons' }).click();
          await page.waitForLoadState('networkidle');
        },
        check: async (page) => {
          const badges = await page.locator('main li .badge').allInnerTexts();
          return badges.length >= 1 && !badges.some((b) => b.includes('Publié')) ? null : `seuls les brouillons doivent rester : ${badges.join(', ')}`;
        },
      },
      { id: 'vide', titre: 'Aucun cours', before: (page) => page.route(COURS, (route) => json(route, pageVide)) },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, COURS) },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, COURS) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Titre et sous-titre', '« Gestion des cours & ateliers », « Sessions 2025-2026 »', '« Gestion des cours » et description de la page', 'assumé'],
      ['Filtres', '« Tous (3) », « En cours (2) », « À venir (1) », « Archivés (4) »', '« Tous », « Publiés », « Brouillons » : états réels du modèle, sans compteur', 'assumé (section 1)'],
      ['Badge', '« Formation Active », « En cours », « Planifié »', '« Publié » ou « Brouillon »', 'assumé'],
      ['Inscrits et progression', 'valeurs fixes', 'inscriptions réelles cumulées et séances tenues sur séances planifiées', 'assumé (section 1)'],
      ['Bouton « Émargement »', 'sur la carte', 'par séance, dans le détail du cours', 'assumé'],
    ],
    etats: ['Chargement : squelettes de carte.', 'Vide : message propre au filtre et lien de création.', 'Erreur : message et « Réessayer ».', 'Contenu : pagination côté serveur.'],
  },

  '37-creation-edition-cours': {
    titre: 'Création et édition d’un cours',
    path: '/espace/formateur/cours/nouveau',
    role: 'formateur',
    maquette: '37-creation-edition-cours',
    scenarios: [
      { id: 'creation', titre: 'Création : formulaire initial (catégories réelles)' },
      {
        id: 'validation',
        titre: 'Création : champs obligatoires vides',
        run: (page) => page.getByRole('button', { name: 'Enregistrer le cours' }).click(),
        check: async (page) => ((await page.locator('.form-error:not(:empty)').count()) >= 2 ? null : 'les erreurs de champ doivent être affichées'),
      },
      { id: 'edition', titre: 'Édition : formulaire prérempli (cours réel)', path: chemin('/modifier') },
      {
        id: 'enregistrement',
        titre: 'Édition : enregistrement réel (backend), retour au détail',
        path: chemin('/modifier'),
        run: async (page) => {
          await page.getByLabel(/Prérequis/).fill('Aucun prérequis.');
          await page.getByRole('button', { name: 'Enregistrer le cours' }).click();
          await page.waitForURL((url) => /\/espace\/formateur\/cours\/\d+$/.test(url.pathname));
          await page.waitForLoadState('networkidle');
        },
      },
      { id: 'introuvable', titre: 'Édition : cours introuvable (réponse réelle du backend)', path: '/espace/formateur/cours/999999/modifier', expectedConsole: ['404'] },
      { id: 'chargement', titre: 'Édition : chargement', path: chemin('/modifier'), waitUntil: 'load', before: (page) => enAttente(page, FORMATION) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['« Code Module », « Filières recommandées », « Volume horaire »', 'présents', 'retirés', 'retrait (D-05)'],
      ['« Salle / Amphi », « Capacité maximale »', 'dans le formulaire du cours', 'saisis par séance, dans le détail du cours (modèle : une formation, plusieurs séances)', 'assumé (D-05)'],
      ['Domaine d’apprentissage', 'liste fixe', 'catégories réelles du serveur', 'assumé (section 1)'],
      ['Syllabus (dépôt de fichier)', 'zone de dépôt', 'les documents du cours se déposent comme supports, depuis le détail du cours', 'assumé (D-05)'],
      ['« Enregistrer & Publier le cours »', 'un bouton', 'interrupteur « Publier le cours » et bouton « Enregistrer le cours »', 'assumé (brouillon possible)'],
      ['Objectifs et prérequis', 'un seul champ « Description & Objectifs »', 'description, objectifs et prérequis distincts, comme sur la fiche publique', 'assumé'],
    ],
    etats: ['Création : formulaire immédiat.', 'Édition : squelette, introuvable, erreur avec « Réessayer ».', 'Validation : message par champ, erreurs du serveur sous le champ.', 'Succès : notification et retour au détail du cours.'],
  },

  '38-cours-detail': {
    titre: 'Détail d’un cours',
    path: '/espace/formateur/cours/:id',
    role: 'formateur',
    maquette: '38-cours-detail',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel (séances, supports et devoirs)',
        path: chemin(),
        check: async (page) => ((await page.locator('main li').count()) >= 4 ? null : 'séances, support et devoir réels attendus'),
      },
      {
        id: 'seance',
        titre: 'Planification d’une séance : validation du formulaire',
        path: chemin(),
        run: async (page) => {
          await page.getByRole('button', { name: 'Planifier une séance' }).click();
          await page.getByRole('button', { name: 'Planifier la séance' }).click();
        },
        check: async (page) => ((await page.locator('.form-error:not(:empty)').count()) >= 3 ? null : 'les erreurs de champ doivent être affichées'),
      },
      {
        id: 'suppression',
        titre: 'Suppression d’un support : modale de confirmation (non confirmée)',
        path: chemin(),
        run: async (page) => {
          await page.getByRole('button', { name: /^Supprimer le support/ }).first().click();
          await page.getByRole('dialog').waitFor();
          await page.waitForTimeout(400);
        },
      },
      { id: 'introuvable', titre: 'Cours introuvable (réponse réelle du backend)', path: '/espace/formateur/cours/999999', expectedConsole: ['404'] },
      { id: 'chargement', titre: 'Chargement', path: chemin(), waitUntil: 'load', before: (page) => enAttente(page, FORMATION) },
      { id: 'erreur', titre: 'Service injoignable', path: chemin(), expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, '**/api/v1/**') },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Badges d’en-tête', '« Module DEV-301 », « En cours • Séance 4 sur 6 »', 'état de publication, niveau, catégorie', 'assumé (D-05)'],
      ['Bloc de code « SecurityConfig.java » et badge « Direct Labo »', 'décor à texte fictif', 'retiré', 'retrait (écart déjà classé en section 3)'],
      ['Plan des séances', 'séances titrées avec nombre de présents', 'séances réelles : date, horaire, lieu, inscrits et places, statut ; planification et suppression', 'assumé'],
      ['« Supports & Fichiers »', 'deux fichiers à télécharger', 'supports et devoirs réels, lien d’ouverture, suppression avec confirmation', 'assumé'],
      ['« Cohorte » : assiduité moyenne « 94.5% », devoirs rendus « 28 / 32 »', 'présents', 'retirés ; inscriptions et séances réelles', 'retrait (section 1, D-03)'],
    ],
    etats: ['Chargement : squelettes.', 'Introuvable : message dédié.', 'Erreur : message et « Réessayer ».', 'Contenu : séances, supports, devoirs ; zone des supports avec ses propres états.'],
  },

  '39-feuille-presence': {
    titre: 'Feuille d’émargement',
    path: '/espace/formateur/cours/:id/sessions/:sessionId/presences',
    role: 'formateur',
    maquette: '39-feuille-presence',
    scenarios: [
      { id: 'contenu', titre: 'Contenu réel (inscrits confirmés de la séance)', path: cheminPresences },
      {
        id: 'enregistrement',
        titre: 'Pointage et enregistrement réels (backend)',
        path: cheminPresences,
        run: async (page) => {
          const select = page.locator('tbody select').first();
          const actuel = await select.inputValue();
          await select.selectOption(actuel === 'PRESENT' ? 'EXCUSE' : 'PRESENT');
          await page.getByRole('button', { name: 'Enregistrer la feuille' }).click();
          await page.getByText(/est enregistré/).first().waitFor();
          await page.waitForLoadState('networkidle');
        },
        check: async (page) => ((await page.locator('main').innerText()).includes('Dernier enregistrement') ? null : 'la date du dernier enregistrement doit être affichée'),
      },
      { id: 'vide', titre: 'Aucun inscrit', path: cheminPresences, before: (page) => page.route(INSCRITS, (route) => json(route, [])) },
      { id: 'chargement', titre: 'Chargement', path: cheminPresences, waitUntil: 'load', before: (page) => enAttente(page, INSCRITS) },
      { id: 'erreur', titre: 'Service injoignable', path: cheminPresences, expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, INSCRITS) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['« QR Code Étudiant », « Export PDF »', 'présents', 'retirés (absents du CDC) ; action « Tous présents » pour un pointage rapide', 'retrait'],
      ['Compteurs', 'valeurs fixes', 'calculés sur la feuille affichée : présents, absents, excusés, non pointés', 'assumé (section 1)'],
      ['Statuts', 'présent, absent, retard justifié', 'présent, absent, excusé (statuts du modèle)', 'assumé'],
      ['Action par ligne', 'bouton « Basculer »', 'liste de choix du statut, enregistrement groupé', 'assumé (trois statuts)'],
      ['Colonne « Filière »', 'présente', 'affichée seulement si le serveur fournit la filière des inscrits', 'assumé'],
      ['« Heure d’émargement (QR Code / Manuel) »', 'présente', '« Dernier pointage » : date réelle d’enregistrement', 'assumé'],
      ['Signature « Certifié IST-DSI #8841-A » et horodatage', 'présents', 'retirés ; date réelle du dernier enregistrement', 'retrait (mention fictive)'],
    ],
    etats: ['Chargement : squelettes.', 'Vide : aucun inscrit, lien de retour au cours.', 'Erreur : message et « Réessayer ».', 'Contenu : tableau défilant horizontalement sur petit écran ; bouton d’enregistrement inactif sans modification.'],
  },

  '40-publication-devoir-ressource': {
    titre: 'Publication d’un devoir ou d’une ressource',
    path: '/espace/formateur/cours/:id/publier',
    role: 'formateur',
    maquette: '40-publication-devoir-ressource',
    scenarios: [
      { id: 'devoir', titre: 'Formulaire initial : devoir', path: chemin('/publier') },
      {
        id: 'ressource',
        titre: 'Type « Support de cours »',
        path: chemin('/publier'),
        run: (page) => page.getByLabel(/Type d’élément/).selectOption('SUPPORT_COURS'),
        check: async (page) => ((await page.getByLabel(/Date limite/).count()) === 0 ? null : 'la date limite ne concerne que les devoirs'),
      },
      {
        id: 'validation',
        titre: 'Champs obligatoires vides et adresse invalide',
        path: chemin('/publier'),
        run: async (page) => {
          await page.getByLabel(/adresse du sujet/i).fill('document.pdf');
          await page.getByRole('button', { name: 'Publier pour les inscrits' }).click();
        },
        check: async (page) => ((await page.locator('.form-error:not(:empty)').count()) >= 4 ? null : 'les erreurs de champ doivent être affichées'),
      },
      {
        id: 'depot',
        titre: 'Dépôt réel d’un fichier, publication du support, puis téléchargement par le membre inscrit',
        path: chemin('/publier'),
        run: async (page, { width, theme }) => {
          if (width !== 1440 || theme !== 'dark') return;
          await page.getByLabel(/Type d’élément/).selectOption('SUPPORT_COURS');
          await page.getByLabel(/^\s*Titre/).fill('Support déposé par la recette');
          await page.locator('input[type="file"]').setInputFiles({ name: 'support-recette.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% fichier d’essai de la recette\n%%EOF\n') });
          await page.getByText('support-recette.pdf', { exact: true }).waitFor();
          await page.getByRole('button', { name: 'Publier pour les inscrits' }).click();
          await page.getByText('La ressource est publiée.').waitFor();
        },
        check: async (page, { width, theme }) => {
          if (width !== 1440 || theme !== 'dark') return null;
          const { formation } = await cours();
          const support = (await lire(`/ressources/formation/${formation.id}`, 'formateur')).find((r) => r.titre === 'Support déposé par la recette');
          if (!support || !/\/fichiers\/[0-9a-f-]{36}$/.test(support.urlFichier)) return 'le support publié doit désigner le fichier déposé';
          const adresse = new URL(API).origin + support.urlFichier;
          const anonyme = await fetch(adresse);
          if (anonyme.status !== 401) return `un visiteur ne doit pas pouvoir télécharger le fichier : ${anonyme.status}`;
          const inscrit = await fetch(adresse, { headers: { Authorization: `Bearer ${await jeton('formateur')}` } });
          return inscrit.status === 200 && (await inscrit.text()).startsWith('%PDF') ? null : `le fichier déposé doit être téléchargeable avec la session : ${inscrit.status}`;
        },
      },
      { id: 'introuvable', titre: 'Cours introuvable (réponse réelle du backend)', path: '/espace/formateur/cours/999999/publier', expectedConsole: ['404'] },
      { id: 'chargement', titre: 'Chargement', path: chemin('/publier'), waitUntil: 'load', before: (page) => enAttente(page, FORMATION) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['« Module de formation associé »', 'liste de modules', 'cours de la page, en lecture seule (la publication part du détail d’un cours)', 'assumé'],
      ['« Barème d’évaluation »', 'présent', 'retiré', 'retrait (D-03)'],
      ['Fichier joint', 'zone de dépôt « jusqu’à 30 Mo »', 'zone de dépôt (10 Mo au plus, type vérifié par le serveur) ou adresse web du document', 'conforme (limite du serveur)'],
      ['Visibilité', 'absente', 'case « visible sur la page publique des ressources » pour une ressource', 'assumé (modèle existant)'],
    ],
    etats: ['Chargement du cours : squelette, introuvable, erreur.', 'Validation : règles propres au devoir (échéance, consignes) ou à la ressource (adresse).', 'Succès : notification et retour au détail du cours.'],
  },
};
