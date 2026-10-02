// Peuple la base LOCALE de recette par l'API réelle du backend (jamais une base de production).
// Les comptes sont les comptes de test créés par le backend (APP_SEED_TEST_ACCOUNTS, domaine .invalid) ;
// les contenus créés ici sont des données d'essai, destinées à la recette visuelle et aux parcours.
// Usage : node e2e/seed-recette.mjs      Prérequis : backend démarré par e2e/backend-recette.mjs.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { API, COMPTES, PASSWORD, courrielPour, lienDuCourriel } from './pages/_outils.mjs';

async function call(method, path, body, token) {
  const response = await fetch(API + path, {
    method,
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${path} : ${response.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

const tokens = {};
for (const [role, email] of Object.entries(COMPTES)) {
  tokens[role] = (await call('POST', '/auth/login', { email, motDePasse: PASSWORD })).accessToken;
}

const inDays = (days, hour, minutes = 0) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, minutes, 0, 0);
  return d.toISOString().slice(0, 19) + 'Z';
};

const r = tokens.responsable;
const f = tokens.formateur;
const m = tokens.membre;

// 1. Catégories d'essai (la base neuve n'en contient aucune).
let categories = await call('GET', '/categories');
if (categories.length === 0) {
  for (const [nom, description, couleur] of [
    ['Développement', 'Catégorie d’essai : programmation et projets logiciels.', '#2563EB'],
    ['Réseaux et systèmes', 'Catégorie d’essai : réseaux, systèmes et sécurité.', '#059669'],
    ['Vie du club', 'Catégorie d’essai : annonces et rencontres.', '#D97706'],
  ]) {
    await call('POST', '/categories', { nom, description, couleur }, tokens.admin);
  }
  categories = await call('GET', '/categories');
}
const cat = (index) => categories[index % categories.length]?.id ?? null;

// 2. Contenus, créés une seule fois.
if ((await call('GET', '/gestion/actualites?size=1', undefined, r)).totalElements === 0) {
  await call('PUT', '/pages/accueil', { titre: 'Texte d’accueil d’essai', contenu: 'Ce texte est un contenu d’essai de la base de recette. Il sert à vérifier la mise en page.\n\nSecond paragraphe du contenu d’essai.' }, tokens.admin);
  // Une introduction puis trois sections, pour vérifier la mise en page de la présentation.
  await call('PUT', '/pages/presentation', {
    titre: 'Présentation d’essai',
    contenu: 'Texte d’introduction d’essai, saisi par l’administration.\n\n# Première section\n\nTexte d’essai de la première section.\n\n# Deuxième section\n\nTexte d’essai de la deuxième section.\n\n# Troisième section\n\nTexte d’essai de la troisième section.',
  }, tokens.admin);

  for (const [i, [nom, prenom, fonction, filiere]] of [
    ['Kaboré', 'Rasmata', 'Présidente', 'Génie logiciel'],
    ['Ouédraogo', 'Issouf', 'Secrétaire général', 'Réseaux et télécommunications'],
    ['Sawadogo', 'Aminata', 'Trésorière', null],
  ].entries()) {
    await call('POST', '/bureau', { nom, prenom, fonction, filiere, ordre: i + 1 }, r);
  }

  const actualites = [
    ['Ouverture des inscriptions aux ateliers du semestre', 'Les inscriptions aux ateliers du semestre sont ouvertes aux membres du club.', true, 'PUBLIC'],
    ['Compte rendu de la réunion de rentrée', 'Retour sur la réunion de rentrée et sur le calendrier des activités.', true, 'PUBLIC'],
    ['Appel à propositions de projets', 'Les membres peuvent soumettre leurs idées de projets depuis leur espace.', true, 'PUBLIC'],
    ['Mise à jour du règlement des ateliers', 'Les règles de participation aux ateliers ont été précisées.', true, 'PUBLIC'],
    ['Brouillon : bilan du premier trimestre', 'Brouillon non publié, visible uniquement dans l’espace de gestion.', false, 'PUBLIC'],
    ['Annonce aux membres : calendrier des permanences', 'Annonce d’essai réservée aux membres connectés.', true, 'MEMBRES'],
    ['Annonce aux membres : matériel disponible', 'Seconde annonce d’essai réservée aux membres connectés.', true, 'MEMBRES'],
  ];
  for (const [i, [titre, resume, publie, visibilite]] of actualites.entries()) {
    await call('POST', '/actualites', {
      titre,
      resume,
      contenu: `${resume}\n\nCe texte est un contenu d’essai de la base de recette. Il sert à vérifier la mise en page d’un article de plusieurs paragraphes.\n\n> Une citation d’essai, pour vérifier la mise en forme des citations.\n\nDernier paragraphe de l’article d’essai.`,
      categorieId: cat(i),
      publie,
      visibilite,
    }, r);
  }

  const evenements = [
    ['Atelier Git et travail collaboratif', 7, 14, 17, 'Salle informatique, IST', 30],
    ['Réunion mensuelle du club', 14, 16, 18, 'Salle des clubs, IST', null],
    ['Journée de présentation des projets', 30, 9, 16, 'Amphithéâtre de l’IST', 2],
  ];
  for (const [i, [titre, jours, debut, fin, lieu, capaciteMax]] of evenements.entries()) {
    await call('POST', '/evenements', {
      titre,
      description: `Événement d’essai de la base de recette : ${titre.toLowerCase()}.\n\nLe déroulement précis sera communiqué aux inscrits.`,
      dateDebut: inDays(jours, debut),
      dateFin: inDays(jours, fin),
      lieu,
      capaciteMax,
      categorieId: cat(i + 1),
      publie: true,
    }, r);
  }

  const formations = [
    ['Initiation à la programmation Python', 'DEBUTANT', 'Aucun prérequis.', 'Écrire et exécuter un premier programme ; manipuler variables, conditions et boucles.'],
    ['Bases de l’administration réseau', 'INTERMEDIAIRE', 'Notions de base sur les réseaux.', 'Configurer un petit réseau local ; diagnostiquer une panne simple.'],
  ];
  for (const [i, [titre, niveau, prerequis, objectifs]] of formations.entries()) {
    const formation = await call('POST', '/formations', {
      titre,
      description: `Formation d’essai de la base de recette : ${titre.toLowerCase()}.\n\nLes séances alternent explications et exercices pratiques.`,
      niveau,
      prerequis,
      objectifs,
      categorieId: cat(i),
      publie: true,
    }, f);
    await call('POST', `/formations/${formation.id}/sessions`, { dateDebut: inDays(10 + i, 14), dateFin: inDays(10 + i, 17), lieu: 'Salle informatique, IST', capaciteMax: 20, statut: 'PLANIFIEE' }, f);
    await call('POST', `/formations/${formation.id}/sessions`, { dateDebut: inDays(17 + i, 14), dateFin: inDays(17 + i, 17), lieu: 'Salle informatique, IST', capaciteMax: 1, statut: 'PLANIFIEE' }, f);
    await call('POST', `/formations/${formation.id}/devoirs`, { titre: `Exercices de la séance sur ${titre.toLowerCase()}`, description: 'Devoir d’essai : réaliser les exercices indiqués pendant la séance.', dateLimite: inDays(20 + i, 23, 59) }, f);
    await call('POST', '/ressources', { titre: `Support de la formation « ${titre} »`, description: 'Support d’essai réservé aux inscrits.', type: 'SUPPORT_COURS', urlFichier: 'https://exemple.invalid/support.pdf', estPublique: false, formationId: formation.id }, f);
  }
  await call('POST', '/formations', { titre: 'Brouillon : atelier Linux', description: 'Formation d’essai non publiée.', niveau: 'DEBUTANT', publie: false }, f);

  await call('POST', '/ressources', { titre: 'Guide de démarrage avec Git', description: 'Ressource publique d’essai de la base de recette.', type: 'DOCUMENT_PDF', urlFichier: 'https://exemple.invalid/guide-git.pdf', estPublique: true, categorieId: cat(0) }, f);
  await call('POST', '/ressources', { titre: 'Documentation officielle de Python', description: 'Lien externe d’essai.', type: 'LIEN_EXTERNE', urlFichier: 'https://docs.python.org/fr/3/', estPublique: true, categorieId: cat(1) }, f);

  const projets = [
    ['Application de gestion de bibliothèque', 'Angular, Spring Boot, PostgreSQL', 'VALIDE', 'Validation d’essai.'],
    ['Station météo connectée', 'Python, Raspberry Pi', 'VALIDE', null],
    ['Annuaire des anciens étudiants', 'Angular', null, null],
    ['Jeu de plateau numérique', 'JavaScript', 'REJETE', 'Motif d’essai : sujet déjà traité.'],
  ];
  for (const [i, [titre, technologies, decision, motif]] of projets.entries()) {
    const projet = await call('POST', '/projets', { titre, description: `Projet d’essai de la base de recette : ${titre.toLowerCase()}.`, objectifs: 'Objectifs d’essai du projet.', technologies, categorieId: cat(i) }, m);
    if (decision) await call('PUT', `/projets/${projet.id}/validation`, { statut: decision, motif }, r);
    if (i === 0) await call('PUT', `/projets/${projet.id}/suivi`, { suiviFormateur: 'Suivi d’essai.', avancementPourcentage: 40 }, f);
  }

  await call('POST', '/contact', { nom: 'Fatoumata Traoré', email: 'fatoumata.traore@recette.invalid', sujet: 'Demande d’information', message: 'Message d’essai envoyé depuis le script de recette.', siteWeb: '', dureeSaisieMs: 15000 });
  await call('POST', '/notifications/globales', { titre: 'Annonce d’essai', message: 'Notification globale d’essai de la base de recette.', lien: '/evenements' }, r);
}

// 3. Inscriptions du membre de test, créées une seule fois : un événement, une séance confirmée et une séance complète
//    (liste d'attente, la place étant prise par le formateur, qui est aussi membre).
const mine = await call('GET', '/inscriptions/me?size=200', undefined, m);
if (!mine.content.some((i) => i.statut !== 'ANNULEE')) {
  const evenements = (await call('GET', '/evenements?sort=dateDebut,asc')).content;
  const formations = (await call('GET', '/formations')).content;
  const sessions = formations.flatMap((formation) => formation.sessions ?? []);
  const ouverte = sessions.find((s) => s.capaciteMax > 1);
  const limitee = sessions.find((s) => s.capaciteMax === 1 && s.formationId !== ouverte?.formationId) ?? sessions.find((s) => s.capaciteMax === 1);
  if (evenements[1]) await call('POST', `/inscriptions/evenements/${evenements[1].id}`, undefined, m);
  if (ouverte) await call('POST', `/inscriptions/formations/${ouverte.id}`, undefined, m);
  if (limitee) {
    await call('POST', `/inscriptions/formations/${limitee.id}`, undefined, f).catch(() => {});
    await call('POST', `/inscriptions/formations/${limitee.id}`, undefined, m);
  }
}

// 4. Comptes réels de la base de recette (non marqués « test ») : les statistiques et les indicateurs ignorent les
//    comptes de test et ce qu'ils créent. Ces comptes passent par le parcours réel : inscription, courriel, vérification.
const REELS = { membre: 'mariam.sanou@club.test', suspendu: 'salif.nikiema@club.test' };
const existants = (await call('GET', '/admin/users?search=club.test&size=100', undefined, tokens.admin)).content.map((u) => u.email);
if (!existants.includes(REELS.membre)) {
  for (const [email, nom, prenom] of [[REELS.membre, 'Sanou', 'Mariam'], [REELS.suspendu, 'Nikiéma', 'Salif']]) {
    await call('POST', '/auth/register', { nom, prenom, email, motDePasse: PASSWORD, filiere: 'Génie logiciel', consentement: true });
    const lien = lienDuCourriel(await courrielPour(email, 'Confirmez votre adresse'), 'verification-adresse');
    await call('POST', '/auth/verification', { jeton: new URLSearchParams(lien.split('?')[1]).get('jeton') });
  }
  const reel = (await call('POST', '/auth/login', { email: REELS.membre, motDePasse: PASSWORD })).accessToken;
  const evenements = (await call('GET', '/evenements?sort=dateDebut,asc')).content;
  await call('POST', `/inscriptions/evenements/${evenements[0].id}`, undefined, reel);
  await call('POST', `/inscriptions/evenements/${evenements[1].id}`, undefined, reel);
  await call('POST', '/projets', { titre: 'Carte interactive du campus', description: 'Projet d’essai de la base de recette, proposé par un compte réel.', objectifs: 'Objectifs d’essai du projet.', technologies: 'Angular, Leaflet', categorieId: cat(0) }, reel);
  // Un compte suspendu et une connexion refusée : alertes de sécurité et entrée en échec du journal.
  const comptes = (await call('GET', '/admin/users?search=club.test&size=100', undefined, tokens.admin)).content;
  await call('PATCH', `/admin/users/${comptes.find((u) => u.email === REELS.suspendu).id}/status`, { statut: 'SUSPENDU' }, tokens.admin);
  await call('POST', '/auth/login', { email: REELS.membre, motDePasse: 'MotDePasse@Faux1' }).catch(() => {});
}

// 5. Une sauvegarde réelle, par le script d'exploitation exécuté dans le conteneur de la base (elle s'inscrit dans la table lue par l'écran 56).
if ((await call('GET', '/admin/system/sauvegardes', undefined, tokens.superadmin)).length === 0) {
  const script = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'club-informatique-backend', 'scripts', 'sauvegarde.sh');
  const conteneur = process.env.RECETTE_CONTENEUR_BASE ?? 'ci-ist-pg';
  try {
    execFileSync('docker', ['cp', script, `${conteneur}:/tmp/sauvegarde.sh`], { stdio: 'pipe' });
    execFileSync('docker', ['exec', '-e', 'PGUSER=postgres', '-e', 'PGDATABASE=club_recette', '-e', 'DOSSIER_SAUVEGARDES=/tmp/sauvegardes', conteneur, 'sh', '/tmp/sauvegarde.sh'], { stdio: 'pipe' });
  } catch (erreur) {
    console.warn(`Sauvegarde de recette non réalisée : ${String(erreur.stderr ?? erreur.message).slice(0, 200)}`);
  }
}

const total = async (path, token) => (await call('GET', path, undefined, token)).totalElements;
const summary = {
  comptes: COMPTES,
  categories: categories.length,
  bureau: (await call('GET', '/bureau')).length,
  actualites: await total('/gestion/actualites?size=1', r),
  evenements: await total('/gestion/evenements?size=1', r),
  formations: await total('/gestion/formations?size=1', r),
  projets: await total('/gestion/projets?size=1', r),
  ressourcesPubliques: await total('/ressources/publiques?size=1'),
  inscriptionsDuMembre: (await call('GET', '/inscriptions/me?size=200', undefined, m)).content.map((i) => i.statut),
  indicateurs: await call('GET', '/gestion/indicateurs', undefined, r),
  alertes: (await call('GET', '/admin/security/alerts', undefined, tokens.admin)).map((a) => a.typeAlerte),
  sauvegardes: (await call('GET', '/admin/system/sauvegardes', undefined, tokens.superadmin)).map((s) => s.statut),
};
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), '.recette-comptes.json'), JSON.stringify(summary.comptes, null, 2));
console.log(JSON.stringify(summary, null, 1));
