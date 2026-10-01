// Scénarios de recette de l'espace Membre (écrans 22, 25 à 30). Chaque scénario ouvre une session réelle.
import { CONSOLE_PANNE, ECARTS_COMMUNS, enAttente, injoignable, json, lire, pageVide } from './_outils.mjs';

const INSCRIPTIONS = '**/api/inscriptions/me*';
const NOTIFICATIONS = '**/api/notifications?*';
const PROFIL = '**/api/users/me';
const PREFERENCES = '**/api/users/me/preferences';

/** Préférences conformes au contrat (point d'accès à créer en Phase 3). */
const preferencesContrat = (page) => page.route(PREFERENCES, (route) => json(route, { notificationsCourriel: true }));

const ECARTS_ESPACE = [
  ...ECARTS_COMMUNS,
  ['Barre supérieure', 'champ de recherche globale, pastille « 5 »', 'fil d’Ariane, cloche avec le nombre réel de notifications non lues, thème, menu du compte', 'assumé (aucune recherche globale au CDC)'],
];

async function premierSupport() {
  const formations = (await (await fetch('http://localhost:8080/api/formations?search=')).json()).content;
  const inscriptions = (await lire('/inscriptions/me?size=200', 'membre')).content.filter((i) => i.statut === 'CONFIRMEE' && i.sessionFormationId);
  const formation = formations.find((f) => (f.sessions ?? []).some((s) => inscriptions.some((i) => i.sessionFormationId === s.id)));
  const ressources = await lire(`/ressources/formation/${formation.id}`, 'membre');
  const devoirs = await lire(`/formations/${formation.id}/devoirs`, 'membre');
  return { formation, ressource: ressources[0], devoir: devoirs[0] };
}

export const PAGES = {
  '22-tdb-membre': {
    titre: 'Tableau de bord Membre',
    path: '/espace/membre',
    role: 'membre',
    maquette: '22-tdb-membre',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel (inscriptions et notifications du compte de recette)',
        check: async (page) => ((await page.locator('main li').count()) >= 2 ? null : 'les inscriptions réelles du membre doivent être listées'),
      },
      {
        id: 'vide',
        titre: 'Aucune activité ni notification',
        before: async (page) => {
          await page.route(INSCRIPTIONS, (route) => json(route, pageVide));
          await page.route(NOTIFICATIONS, (route) => json(route, pageVide));
        },
      },
      {
        id: 'chargement',
        titre: 'Chargement',
        waitUntil: 'load',
        before: async (page) => {
          await enAttente(page, INSCRIPTIONS);
          await enAttente(page, NOTIFICATIONS);
        },
        check: async (page) => (/\b0\b/.test(await page.locator('main').innerText()) ? 'un zéro est affiché pendant le chargement' : null),
      },
      {
        id: 'erreur',
        titre: 'Service injoignable',
        expectedConsole: CONSOLE_PANNE,
        before: async (page) => {
          await injoignable(page, INSCRIPTIONS);
          await injoignable(page, NOTIFICATIONS);
        },
      },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Titre', '« Bienvenue, Aminata ! » suivi d’un emoji', '« Bienvenue, <prénom> » sans emoji', 'corrigé (6.4)'],
      ['Bouton « Nouvelle activité »', 'lien vers la proposition de projet', '« Proposer un projet », affiché si le module des projets est ouvert', 'assumé'],
      ['Cartes d’accès rapide', '« Mes cours », « Mes sessions », « Devenir ressource », « Projets / Clubs »', '« Mes cours », « Événements », « Supports et devoirs », « Mes projets », chacune liée à une page existante et filtrée par module', 'assumé'],
      ['« Mes prochaines activités »', 'trois activités d’illustration', 'inscriptions réelles à venir du membre (cinq au plus)', 'assumé (section 1)'],
      ['« Activités récentes »', 'flux social (publications, commentaires, arrivées)', '« Dernières notifications » réelles du membre', 'remplacé (CDC : fil social exclu, D-01)'],
    ],
    etats: ['Chargement : squelettes dans chaque panneau, aucune valeur provisoire.', 'Vide : message et lien vers les formations.', 'Erreur : message et action « Réessayer » par panneau.', 'Contenu : inscriptions à venir et dernières notifications.'],
  },

  '25-profil-vue': {
    titre: 'Profil, consultation',
    path: '/espace/profil',
    role: 'membre',
    maquette: '25-profil-vue',
    scenarios: [
      { id: 'contenu', titre: 'Contenu réel (compte de recette)' },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, PROFIL) },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, PROFIL) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Titre', '« Mon Profil Membre »', '« Mon profil » (page commune à tous les rôles)', 'assumé'],
      ['Badge', '« Membre Actif »', 'statut réel du compte', 'assumé'],
      ['Sous-titre', 'filière et nom de l’établissement', 'filière saisie par l’utilisateur', 'assumé'],
      ['Grille d’informations', 'courriel, téléphone, adhésion, localisation', 'courriel, numéro de membre, date d’adhésion, rôle (données réelles du compte)', 'assumé (minimisation, BNF-09)'],
      ['Panneau « Compétences & Domaines d’intérêt »', 'présent', 'retiré', 'retrait (D-04)'],
    ],
    etats: ['Chargement : squelette de la carte.', 'Erreur : message et action « Réessayer ».', 'Contenu : informations réelles du compte ; mention explicite si la présentation est vide.'],
  },

  '26-profil-edition': {
    titre: 'Profil, édition',
    path: '/espace/profil/modifier',
    role: 'membre',
    maquette: '26-profil-edition',
    scenarios: [
      { id: 'contenu', titre: 'Formulaire prérempli (compte de recette)' },
      {
        id: 'validation',
        titre: 'Champs obligatoires vides',
        run: async (page) => {
          await page.getByLabel(/Prénom/).fill('');
          await page.getByLabel(/Filière/).fill('');
          await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();
        },
        check: async (page) => ((await page.locator('.form-error:not(:empty)').count()) >= 2 ? null : 'les erreurs de champ doivent être affichées'),
      },
      {
        id: 'enregistrement',
        titre: 'Enregistrement réel (backend), retour au profil',
        run: async (page) => {
          await page.getByLabel(/Présentation/).fill('Étudiante en informatique de gestion, intéressée par le développement web. Texte d’essai de la base de recette.');
          await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();
          await page.waitForURL((url) => url.pathname === '/espace/profil');
          await page.waitForLoadState('networkidle');
        },
        check: async (page) => ((await page.locator('main').innerText()).includes('Texte d’essai') ? null : 'la présentation enregistrée doit apparaître sur le profil'),
      },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, PROFIL) },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, PROFIL) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Encart « Profil mis à jour »', 'affiché en permanence', 'notification après un enregistrement réussi', 'assumé (état de démonstration)'],
      ['« Changer la photo »', 'téléversement simulé', 'retiré : avatar à initiales, aucun stockage de fichier', 'retrait (6.4, BNF-09)'],
      ['« Nom complet »', 'un champ', 'prénom et nom, comme à l’inscription', 'assumé'],
      ['Filière', 'saisie libre', 'saisie libre', 'conforme (6.5)'],
      ['GitHub, LinkedIn, compétences', 'présents', 'retirés', 'retrait (D-04)'],
    ],
    etats: ['Chargement : squelette du formulaire.', 'Erreur de chargement : message et « Réessayer ».', 'Validation : message par champ, erreurs du serveur reprises sous le champ.', 'Succès : notification et retour au profil.'],
  },

  '27-parametres-compte': {
    titre: 'Paramètres du compte',
    path: '/espace/parametres',
    role: 'membre',
    maquette: '27-parametres-compte',
    scenarios: [
      { id: 'contenu', titre: 'Contenu (préférences selon le contrat d’API)', before: preferencesContrat },
      {
        id: 'mot-de-passe',
        titre: 'Changement de mot de passe : mot de passe actuel erroné (réponse réelle du backend)',
        expectedConsole: ['400'],
        before: preferencesContrat,
        run: async (page) => {
          await page.getByRole('button', { name: 'Changer le mot de passe' }).click();
          await page.getByLabel(/Mot de passe actuel/).fill('Inexact@2026');
          await page.getByLabel(/^\s*Nouveau mot de passe/).fill('Nouveau@2026x');
          await page.getByLabel(/Confirmation du nouveau/).fill('Nouveau@2026x');
          await page.getByRole('button', { name: 'Enregistrer' }).click();
          await page.getByText('Le mot de passe actuel est incorrect.').waitFor();
        },
      },
      {
        id: 'suppression',
        titre: 'Suppression du compte : confirmation par mot de passe puis modale (non confirmée)',
        before: preferencesContrat,
        run: async (page) => {
          await page.getByRole('button', { name: 'Supprimer mon compte' }).click();
          await page.getByLabel(/^\s*Mot de passe/).fill('Recette@2026');
          await page.getByRole('button', { name: 'Supprimer définitivement' }).click();
          await page.getByRole('dialog').waitFor();
          await page.waitForTimeout(400);
        },
      },
      { id: 'chargement', titre: 'Chargement des préférences', waitUntil: 'load', before: (page) => enAttente(page, PREFERENCES) },
      { id: 'backend-actuel', titre: 'Backend actuel : préférences absentes (erreur 500, état d’erreur dans le panneau)', expectedConsole: ['500'] },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Pictogramme d’en-tête', 'emoji', 'icône de la famille du produit', 'corrigé (E-01)'],
      ['« Changer mot de passe »', 'notification simulée', 'formulaire réel dans le panneau (mot de passe actuel, nouveau, confirmation)', 'assumé (UC-07)'],
      ['Langue', 'liste « Français / English »', 'mention « Français » (seule langue du produit)', 'retrait partiel (6.8)'],
      ['« Notifications Push »', 'présent', 'retiré (aucun canal de ce type au CDC)', 'retrait'],
      ['Panneau « Ma progression » (66 %)', 'présent', 'retiré : aucun indicateur de ce type côté serveur', 'retrait (section 1)'],
      ['Panneau « Confidentialité » (visibilité des projets)', 'présent', 'remplacé par « Mes données » : copie des données personnelles', 'assumé (loi n° 001-2021/AN, droit d’accès)'],
      ['Suppression du compte', 'boîte de dialogue du navigateur, action annulée', 'mot de passe puis modale de confirmation', 'assumé (BNF-09)'],
      ['Numérotation des panneaux', 'six panneaux numérotés', 'cinq panneaux numérotés', 'assumé'],
    ],
    etats: ['Préférences : squelette, erreur avec « Réessayer », contenu.', 'Mot de passe : validation par champ, erreur du serveur sous le champ, notification de succès.', 'Suppression : double confirmation.'],
  },

  '28-mes-inscriptions': {
    titre: 'Mes inscriptions',
    path: '/espace/inscriptions',
    role: 'membre',
    maquette: '28-mes-inscriptions',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel (inscriptions du compte de recette)',
        check: async (page) => ((await page.locator('main li').count()) >= 3 ? null : 'les inscriptions réelles doivent être listées'),
      },
      {
        id: 'filtre',
        titre: 'Filtre « Liste d’attente »',
        run: async (page) => {
          await page.getByRole('button', { name: 'Liste d’attente' }).click();
          await page.waitForLoadState('networkidle');
        },
        check: async (page) => {
          const badges = await page.locator('main li .badge').allInnerTexts();
          return badges.length > 0 && badges.every((b) => b.toLowerCase().includes('liste d’attente')) ? null : `seules les listes d’attente doivent rester : ${badges.join(', ')}`;
        },
      },
      {
        id: 'annulation',
        titre: 'Annulation : modale de confirmation (non confirmée)',
        run: async (page) => {
          await page.getByRole('button', { name: /^Annuler/ }).first().click();
          await page.getByRole('dialog').waitFor();
          await page.waitForTimeout(400);
        },
      },
      { id: 'vide', titre: 'Aucune inscription', before: (page) => page.route(INSCRIPTIONS, (route) => json(route, pageVide)) },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, INSCRIPTIONS) },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, INSCRIPTIONS) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Sous-titre', '« Accédez aux ressources et devoirs… » (texte d’une autre page)', 'description de la page', 'corrigé'],
      ['Filtres', 'Formations, Événements, Liste d’attente', 'ajout de « Toutes » (filtre par défaut)', 'assumé'],
      ['« Télécharger l’attestation »', 'présent', 'retiré : aucune attestation au CDC', 'retrait'],
      ['Action par ligne', 'aucune annulation', '« Annuler » pour une inscription à venir, avec confirmation', 'assumé (UC-09)'],
      ['Statut', '« Inscrit »', 'statut réel : confirmée, liste d’attente, annulée', 'assumé'],
    ],
    etats: ['Chargement : squelettes de ligne.', 'Vide : message propre au filtre et lien vers les formations.', 'Erreur : message et « Réessayer ».', 'Contenu : pagination côté serveur.'],
  },

  '29-supports-devoirs-liste': {
    titre: 'Supports et devoirs, liste',
    path: '/espace/supports',
    role: 'membre',
    maquette: '29-supports-devoirs-liste',
    scenarios: [
      {
        id: 'contenu',
        titre: 'Contenu réel (formation à laquelle le membre est inscrit)',
        check: async (page) => ((await page.locator('main li').count()) >= 2 ? null : 'le support et le devoir de la formation doivent être listés'),
      },
      { id: 'vide', titre: 'Aucune inscription à une formation', before: (page) => page.route(INSCRIPTIONS, (route) => json(route, pageVide)) },
      { id: 'chargement', titre: 'Chargement', waitUntil: 'load', before: (page) => enAttente(page, INSCRIPTIONS) },
      { id: 'erreur', titre: 'Service injoignable', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, INSCRIPTIONS) },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Format et poids du fichier (« PDF • 4.2 Mo »)', 'présents', 'retirés : donnée absente côté serveur ; formation de rattachement affichée', 'retrait (section 1)'],
      ['« J-3 restant »', 'présent', 'date d’échéance réelle du devoir', 'assumé'],
      ['« Déposer mon devoir »', 'présent', '« Voir le devoir » : consultation seulement', 'retrait (D-03)'],
    ],
    etats: ['Chargement : squelettes de carte.', 'Vide : message et lien vers les formations.', 'Erreur : message et « Réessayer ».', 'Contenu : devoirs par échéance, puis supports.'],
  },

  '30-supports-devoirs-detail': {
    titre: 'Support ou devoir, détail',
    path: '/espace/supports/ressources/:id',
    role: 'membre',
    maquette: '30-supports-devoirs-detail',
    scenarios: [
      { id: 'contenu', titre: 'Support réel', path: async () => `/espace/supports/ressources/${(await premierSupport()).ressource.id}` },
      {
        id: 'devoir',
        titre: 'Devoir réel',
        path: async () => {
          const { formation, devoir } = await premierSupport();
          return `/espace/supports/devoirs/${formation.id}/${devoir.id}`;
        },
      },
      { id: 'introuvable', titre: 'Document introuvable (réponse réelle du backend)', path: '/espace/supports/ressources/999999', expectedConsole: ['404'] },
      { id: 'chargement', titre: 'Chargement', path: '/espace/supports/ressources/1', waitUntil: 'load', before: (page) => enAttente(page, '**/api/ressources/*') },
      { id: 'erreur', titre: 'Service injoignable', path: '/espace/supports/ressources/1', expectedConsole: CONSOLE_PANNE, before: (page) => injoignable(page, '**/api/ressources/*') },
    ],
    ecarts: [
      ...ECARTS_ESPACE,
      ['Champs « Difficulté », « Matière », « Niveau / Public cible »', 'présents', 'retirés : données absentes du modèle ; type, formation, échéance, auteur et date de publication réels', 'retrait (section 1)'],
      ['Badge « À venir »', 'présent', 'type du document', 'assumé'],
      ['« Statut de remise » et « Remettre mon devoir »', 'présents', 'retirés', 'retrait (D-03)'],
      ['Téléchargement', 'zone vide', 'lien réel vers le fichier s’il existe, sinon mention explicite', 'assumé'],
    ],
    etats: ['Chargement : squelettes.', 'Introuvable : message dédié.', 'Erreur : message et « Réessayer ».', 'Contenu : support ou devoir.'],
  },
};
