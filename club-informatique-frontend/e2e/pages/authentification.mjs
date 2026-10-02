// Scénarios de recette des pages d'authentification. Les comptes créés utilisent le domaine réservé .invalid.
import { API, CONSOLE_PANNE, PASSWORD, adresseNeuve, compteActif, courrielPour, inscrire, lienDeReinitialisation } from './_outils.mjs';

/** Champ désigné par son libellé, avec ou sans astérisque d'obligation. */
const champ = (page, libelle) => page.getByLabel(new RegExp("^\\s*" + libelle + "(\\s*\\*)?\\s*$"));

const COMMON = [
  ['Gabarit', 'en-tête public complet (18, 20) ou absent (19, 21)', 'gabarit d’authentification unique : marque, retour à l’accueil, thème', 'assumé (E-06)'],
  ['Icônes de champ et d’action', 'emoji (œil, coche)', 'pictogrammes de la famille unique', 'corrigé (E-01)'],
  ['Libellé « e-mail »', '« Adresse e-mail »', '« Adresse électronique »', 'assumé (langue française)'],
];

export const PAGES = {
  '19-connexion': {
    titre: 'Connexion',
    path: '/connexion',
    maquette: '19-connexion',
    scenarios: [
      { id: 'initial', titre: 'État initial' },
      {
        id: 'validation',
        titre: 'Champs obligatoires manquants',
        run: async (page) => {
          await page.getByRole('button', { name: 'Se connecter' }).click();
        },
        check: async (page) => ((await page.locator('.form-error:visible').count()) === 2 ? null : 'deux messages de champ attendus'),
      },
      {
        id: 'echec',
        titre: 'Identifiants refusés par le backend réel',
        expectedConsole: ['401'],
        run: async (page) => {
          await champ(page, 'Adresse électronique').fill('inconnu@recette.invalid');
          await champ(page, 'Mot de passe').fill('MotDePasse@Faux1');
          await page.getByRole('button', { name: 'Se connecter' }).click();
          await page.getByRole('alert').waitFor();
        },
        check: async (page) => ((await page.getByRole('alert').innerText()).includes('incorrect') ? null : 'message d’échec absent'),
      },
      {
        id: 'adresse-non-verifiee',
        titre: 'Compte dont l’adresse n’est pas vérifiée : refus réel du backend',
        expectedConsole: ['403'],
        run: async (page) => {
          const { email } = await inscrire();
          await champ(page, 'Adresse électronique').fill(email);
          await champ(page, 'Mot de passe').fill(PASSWORD);
          await page.getByRole('button', { name: 'Se connecter' }).click();
          await page.getByRole('alert').waitFor();
        },
        check: async (page) => ((await page.getByRole('alert').innerText()).includes('pas encore vérifiée') ? null : 'le refus doit expliquer que l’adresse n’est pas vérifiée'),
      },
      {
        id: 'session-expiree',
        titre: 'Retour après expiration de session',
        path: '/connexion?motif=session-expiree',
        check: async (page) => ((await page.getByRole('status').innerText()).includes('expiré') ? null : 'message de session expirée absent'),
      },
      {
        id: 'succes',
        titre: 'Connexion réussie d’un compte créé par le parcours réel (inscription, courriel, vérification)',
        run: async (page, { width, theme }) => {
          if (width !== 1440 || theme !== 'dark') return;
          const email = await compteActif();
          await champ(page, 'Adresse électronique').fill(email);
          await champ(page, 'Mot de passe').fill(PASSWORD);
          await page.getByRole('button', { name: 'Se connecter' }).click();
          await page.waitForURL((url) => url.pathname.startsWith('/espace'));
        },
        check: async (page, { width, theme }) => {
          if (width !== 1440 || theme !== 'dark') return null;
          const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
          return /eyJ|accessToken|refreshToken/.test(stored) ? 'un jeton figure dans le stockage du navigateur' : null;
        },
      },
    ],
    ecarts: [
      ...COMMON,
      ['Bloc de marque de la colonne gauche', 'logo, nom et slogan', 'retiré : la marque figure dans l’en-tête ; slogan non validé (C.1)', 'retrait'],
      ['Panneau décoratif', 'faux code et libellé « Environnement Développeur IST »', 'panneau conservé, pictogramme seul', 'retrait partiel (texte fictif)'],
      ['Alerte d’échec', 'affichée en permanence', 'affichée seulement après un refus réel', 'corrigé'],
      ['Champs préremplis', 'adresse et mot de passe d’exemple', 'champs vides', 'retrait (données d’illustration)'],
      ['Accroche', '« … continuer votre apprentissage »', '« … accéder à votre espace »', 'assumé (valable pour tous les rôles)'],
    ],
    etats: [
      'Chargement : bouton en attente pendant l’appel.',
      'Erreur : message identique pour un compte inconnu et un mot de passe erroné ; messages distincts pour le verrouillage, le compte inactif, la limitation de débit et la panne de réseau.',
      'Succès : redirection vers la destination demandée si elle est interne, sinon vers `/espace` ; aucun jeton dans le stockage du navigateur (contrôlé).',
    ],
  },

  '18-inscription': {
    titre: 'Inscription',
    path: '/inscription',
    maquette: '18-inscription',
    scenarios: [
      { id: 'initial', titre: 'État initial' },
      {
        id: 'validation',
        titre: 'Formulaire soumis vide',
        run: async (page) => {
          await page.getByRole('button', { name: 'S’inscrire' }).click();
        },
        check: async (page) => ((await page.locator('.form-error:visible').count()) >= 6 ? null : 'messages de validation manquants'),
      },
      {
        id: 'saisie',
        titre: 'Saisie valide (filière libre normalisée)',
        run: async (page) => {
          await champ(page, 'Nom').fill('Kaboré');
          await champ(page, 'Prénom').fill('Issouf');
          await champ(page, 'Adresse électronique').fill('issouf.kabore@recette.invalid');
          await champ(page, 'Filière d’études').fill('  Réseaux   et télécommunications, 2e année ');
          await champ(page, 'Mot de passe').fill(PASSWORD);
          await champ(page, 'Confirmation du mot de passe').fill(PASSWORD);
        },
        check: async (page) => {
          const tag = await champ(page, 'Filière d’études').evaluate((el) => el.tagName);
          return tag === 'INPUT' ? null : 'la filière doit être un champ de saisie libre';
        },
      },
      {
        id: 'succes',
        titre: 'Inscription réelle : écran « Vérifiez votre boîte de réception », courriel de vérification reçu',
        run: async (page, { width, theme }) => {
          if (width !== 1440 || theme !== 'dark') return;
          let sent;
          page.on('request', (r) => {
            if (r.url().endsWith('/auth/register')) sent = r.postDataJSON();
          });
          await champ(page, 'Nom').fill('Kaboré');
          await champ(page, 'Prénom').fill('Issouf');
          page.__email = adresseNeuve('issouf.kabore');
          await champ(page, 'Adresse électronique').fill(page.__email);
          await champ(page, 'Filière d’études').fill('  Réseaux   et télécommunications ');
          await champ(page, 'Mot de passe').fill(PASSWORD);
          await champ(page, 'Confirmation du mot de passe').fill(PASSWORD);
          await page.getByRole('checkbox').check();
          await page.getByRole('button', { name: 'S’inscrire' }).click();
          await page.getByRole('heading', { name: /boîte de réception/ }).waitFor();
          page.__sent = sent;
        },
        check: async (page, { width, theme }) => {
          if (width !== 1440 || theme !== 'dark') return null;
          if (page.__sent?.filiere !== 'Réseaux et télécommunications') return `filière non normalisée : ${JSON.stringify(page.__sent?.filiere)}`;
          const courriel = await courrielPour(page.__email, 'Confirmez votre adresse');
          return courriel.includes('/verification-adresse?jeton=') ? null : 'le courriel de vérification doit contenir le lien d’activation';
        },
      },
    ],
    ecarts: [
      ...COMMON,
      ['Champs', 'nom complet, adresse, filière, téléphone, mot de passe, confirmation', 'nom, prénom, adresse, filière, mot de passe, confirmation', 'assumé (CDC, D-08) ; téléphone retiré (minimisation des données)'],
      ['Coches de validité', 'affichées en permanence sur quatre champs', 'affichées seulement pour un champ modifié et valide', 'corrigé'],
      ['Case de consentement', 'cochée par défaut', 'décochée par défaut', 'corrigé (consentement explicite, BNF-09)'],
      ['Colonne de marque', 'logo, nom, slogan et citation', 'logo et nom ; slogan et citation non validés (C.1)', 'retrait'],
      ['Carte de droite', '« Rejoignez plus de 120 étudiants… »', 'visuel conservé sans texte ni chiffre', 'retrait (donnée inventée)'],
      ['Libellés de champ', 'texte indicatif seul', 'texte indicatif et libellé réservé aux lecteurs d’écran', 'corrigé (accessibilité)'],
      ['Redirection', 'simulée vers le tableau de bord', 'écran « Vérifiez votre boîte de réception » : le compte n’est actif qu’après vérification de l’adresse', 'assumé'],
    ],
    etats: [
      'Chargement : bouton en attente.',
      'Erreur : messages par champ (validation locale et erreurs renvoyées par le backend), alerte générale ; un conflit d’adresse ne confirme pas l’existence du compte.',
      'Succès : écran « Vérifiez votre boîte de réception » ; le courriel de vérification est réellement envoyé (lu dans la boîte de recette).',
    ],
  },

  '20-mot-de-passe-oublie': {
    titre: 'Mot de passe oublié',
    path: '/mot-de-passe-oublie',
    maquette: '20-mot-de-passe-oublie',
    scenarios: [
      { id: 'initial', titre: 'État initial' },
      {
        id: 'envoye',
        titre: 'Demande acceptée par le backend réel (adresse inconnue : même réponse)',
        run: async (page) => {
          await champ(page, 'Adresse électronique').fill('inconnu@recette.invalid');
          await page.getByRole('button', { name: 'Envoyer le lien' }).click();
          await page.getByRole('status').waitFor();
        },
      },
      {
        id: 'courriel',
        titre: 'Compte existant : même écran, courriel de réinitialisation réellement reçu',
        run: async (page, { width, theme }) => {
          if (width !== 1440 || theme !== 'dark') return;
          page.__email = await compteActif('issouf.kabore');
          await champ(page, 'Adresse électronique').fill(page.__email);
          await page.getByRole('button', { name: 'Envoyer le lien' }).click();
          await page.getByRole('status').waitFor();
        },
        check: async (page, { width, theme }) => {
          if (width !== 1440 || theme !== 'dark') return null;
          return (await courrielPour(page.__email, 'Réinitialisation')).includes('/reinitialisation?jeton=') ? null : 'le courriel doit contenir le lien de réinitialisation';
        },
      },
      {
        id: 'erreur',
        titre: 'Service injoignable',
        expectedConsole: CONSOLE_PANNE,
        before: async (page) => {
          await page.route('**/api/v1/auth/forgot-password', (route) => route.abort());
        },
        run: async (page) => {
          await champ(page, 'Adresse électronique').fill('inconnu@recette.invalid');
          await page.getByRole('button', { name: 'Envoyer le lien' }).click();
          await page.getByRole('alert').waitFor();
        },
      },
    ],
    ecarts: [
      ...COMMON,
      ['Bouton « Simuler la saisie du nouveau mot de passe »', 'présent dans la carte de succès', 'retiré', 'retrait (démonstration)'],
      ['Badge flottant du visuel', 'emoji et texte « Lien sécurisé »', 'pictogramme d’enveloppe', 'corrigé (E-01)'],
      ['Accroche', '« Pas d’inquiétude ! … »', 'phrase factuelle', 'assumé (ton neutre)'],
    ],
    etats: [
      'Succès : message identique que l’adresse corresponde ou non à un compte ; pour un compte existant, le courriel est réellement reçu.',
      'Erreur : alerte avec message adapté (réseau, débit, serveur).',
    ],
  },

  '21-reinitialisation': {
    titre: 'Réinitialisation du mot de passe',
    path: '/reinitialisation?jeton=jeton-de-recette',
    maquette: '21-reinitialisation-mot-de-passe',
    scenarios: [
      { id: 'initial', titre: 'Lien reçu par courriel' },
      {
        id: 'robustesse',
        titre: 'Indicateur de robustesse calculé sur la saisie',
        run: async (page) => {
          await champ(page, 'Nouveau mot de passe').fill('Recette@2026');
          await champ(page, 'Confirmation du mot de passe').fill('Recette@2027');
          await champ(page, 'Confirmation du mot de passe').blur();
        },
        check: async (page) => ((await page.locator('.strength-bars span.on').count()) === 5 ? null : 'cinq segments attendus pour un mot de passe conforme'),
      },
      {
        id: 'jeton-refuse',
        titre: 'Jeton inconnu refusé par le backend réel',
        expectedConsole: ['400'],
        run: async (page) => {
          await champ(page, 'Nouveau mot de passe').fill('Recette@2026');
          await champ(page, 'Confirmation du mot de passe').fill('Recette@2026');
          await page.getByRole('button', { name: 'Enregistrer' }).click();
          await page.getByRole('alert').waitFor();
        },
      },
      {
        id: 'succes',
        titre: 'Lien reçu par courriel : nouveau mot de passe enregistré, retour à la connexion, connexion avec le nouveau mot de passe',
        path: async () => (await lienDeReinitialisation()).lien,
        run: async (page) => {
          await champ(page, 'Nouveau mot de passe').fill('Nouveau@2026xy');
          await champ(page, 'Confirmation du mot de passe').fill('Nouveau@2026xy');
          await page.getByRole('button', { name: 'Enregistrer' }).click();
          await page.waitForURL((url) => url.pathname === '/connexion');
          await page.getByRole('status').waitFor();
        },
      },
      {
        id: 'lien-reutilise',
        titre: 'Lien déjà utilisé : refus réel du backend',
        expectedConsole: ['400'],
        path: async () => {
          const { lien } = await lienDeReinitialisation();
          const response = await fetch(`${API}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: new URLSearchParams(lien.split('?')[1]).get('jeton'), nouveauMotDePasse: 'Nouveau@2026xy' }),
          });
          if (!response.ok) throw new Error(`première utilisation du lien refusée : ${response.status}`);
          return lien;
        },
        run: async (page) => {
          await champ(page, 'Nouveau mot de passe').fill('Nouveau@2026zz');
          await champ(page, 'Confirmation du mot de passe').fill('Nouveau@2026zz');
          await page.getByRole('button', { name: 'Enregistrer' }).click();
          await page.getByRole('alert').waitFor();
        },
      },
      { id: 'sans-jeton', titre: 'Lien incomplet', path: '/reinitialisation' },
    ],
    ecarts: [
      ...COMMON,
      ['Indicateur de robustesse', '« Forte (4/5) » figé', 'calculé sur la saisie, libellé sans chiffre', 'corrigé'],
      ['Libellé du visuel', '« Sécurité renforcée »', 'visuel conservé sans texte', 'retrait (affirmation non étayée)'],
      ['Encadré d’information', '« … vous pourrez vous connecter immédiatement »', 'précise que les sessions ouvertes seront fermées', 'assumé (comportement réel)'],
    ],
    etats: [
      'Lien incomplet : écran dédié avec renvoi vers une nouvelle demande.',
      'Erreur : jeton invalide, expiré ou déjà utilisé.',
      'Succès : retour à la connexion avec un message de confirmation.',
    ],
  },

  'D2-verification-adresse': {
    titre: 'Vérification de l’adresse électronique',
    path: '/verification-adresse?jeton=jeton-de-recette',
    maquette: null,
    scenarios: [
      {
        id: 'succes',
        titre: 'Lien reçu par courriel après une inscription réelle : compte activé',
        path: async () => (await inscrire()).lien,
        check: async (page) => ((await page.getByRole('status').innerText()).includes('Votre compte est activé') ? null : 'l’activation doit être confirmée'),
      },
      {
        id: 'lien-invalide',
        titre: 'Jeton inconnu refusé par le backend réel',
        expectedConsole: ['400'],
        check: async (page) => ((await page.getByRole('heading', { name: 'Lien invalide' }).count()) === 1 ? null : 'l’état « lien invalide » doit être affiché'),
      },
      {
        id: 'lien-reutilise',
        titre: 'Lien déjà utilisé : refus réel du backend',
        expectedConsole: ['400'],
        path: async () => {
          const { lien } = await inscrire();
          await fetch(`${API}/auth/verification`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jeton: new URLSearchParams(lien.split('?')[1]).get('jeton') }) });
          return lien;
        },
        check: async (page) => ((await page.getByRole('heading', { name: 'Lien invalide' }).count()) === 1 ? null : 'un lien déjà utilisé doit être refusé'),
      },
      {
        id: 'chargement',
        titre: 'Vérification en cours',
        waitUntil: 'load',
        before: async (page) => {
          await page.route('**/api/v1/auth/verification', () => {});
        },
      },
      {
        id: 'erreur',
        titre: 'Service injoignable',
        expectedConsole: CONSOLE_PANNE,
        before: async (page) => {
          await page.route('**/api/v1/auth/verification', (route) => route.abort());
        },
      },
      { id: 'sans-jeton', titre: 'Lien incomplet', path: '/verification-adresse' },
    ],
    ecarts: [['Page entière', 'absente', 'dérivée de la carte de l’écran 21', 'dérivation (10.1.4)']],
    etats: ['Chargement, succès, lien invalide et erreur de service : quatre états distincts, annoncés aux lecteurs d’écran.'],
  },
};
