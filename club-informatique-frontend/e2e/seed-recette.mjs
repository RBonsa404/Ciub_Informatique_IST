// Peuple la base LOCALE de recette par l'API réelle du backend (jamais une base de production).
// Les contenus créés sont des données d'essai, sur le domaine réservé .invalid, uniquement destinées
// à la recette visuelle et aux parcours. Usage : node e2e/seed-recette.mjs
// Prérequis : conteneur PostgreSQL « ci-ist-pg » et backend démarré (e2e/backend-recette.sh).
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = process.env.RECETTE_API ?? 'http://localhost:8080/api';
const PASSWORD = process.env.RECETTE_MOT_DE_PASSE ?? 'Recette@2026';
const CONTAINER = process.env.RECETTE_PG_CONTAINER ?? 'ci-ist-pg';
const DB = process.env.RECETTE_PG_DB ?? 'club_informatique_dev';

const ACCOUNTS = [
  { key: 'membre', nom: 'Sawadogo', prenom: 'Aminata', filiere: 'Informatique de gestion, 2e année', roles: ['ROLE_MEMBRE'] },
  { key: 'formateur', nom: 'Ouédraogo', prenom: 'Issouf', filiere: 'Réseaux et télécommunications', roles: ['ROLE_MEMBRE', 'ROLE_FORMATEUR'] },
  { key: 'responsable', nom: 'Kaboré', prenom: 'Salif', filiere: 'Génie logiciel, 3e année', roles: ['ROLE_MEMBRE', 'ROLE_RESPONSABLE_CLUB'] },
  { key: 'admin', nom: 'Compaoré', prenom: 'Abdoul', filiere: 'Systèmes et réseaux', roles: ['ROLE_ADMIN'] },
  { key: 'superadmin', nom: 'Zongo', prenom: 'Mariam', filiere: 'Génie logiciel', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
  { key: 'dsi', nom: 'Tapsoba', prenom: 'Boukary', filiere: 'Direction des systèmes d’information', roles: ['ROLE_DSI'] },
];
const emailOf = (a) => `${a.prenom}.${a.nom}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() + '@recette.invalid';

const sql = (statement) =>
  execFileSync('docker', ['exec', CONTAINER, 'psql', '-U', 'postgres', '-d', DB, '-At', '-c', statement], { encoding: 'utf8' }).trim();

async function call(method, path, body, token) {
  const response = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`${method} ${path} : ${response.status} ${text.slice(0, 200)}`);
  return data;
}

async function login(account) {
  return (await call('POST', '/auth/login', { email: emailOf(account), motDePasse: PASSWORD })).accessToken;
}

const inDays = (days, hour, minutes = 0) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, minutes, 0, 0);
  return d.toISOString().slice(0, 19);
};

// 1. Comptes de recette (un par rôle). Les rôles sont attribués directement en base : le backend actuel
//    n'offre aucun moyen d'amorcer un administrateur (voir docs/audit-backend.md, B-31).
for (const account of ACCOUNTS) {
  const email = emailOf(account);
  if (sql(`select count(*) from utilisateur where email='${email}'`) === '0') {
    await call('POST', '/auth/register', { nom: account.nom, prenom: account.prenom, email, motDePasse: PASSWORD, filiere: account.filiere });
  }
  sql(`delete from utilisateur_role where utilisateur_id=(select id from utilisateur where email='${email}')`);
  for (const role of account.roles) {
    sql(`insert into utilisateur_role(utilisateur_id, role_id) select u.id, r.id from utilisateur u, role r where u.email='${email}' and r.nom='${role}' on conflict do nothing`);
  }
}
const tokens = {};
for (const account of ACCOUNTS) tokens[account.key] = await login(account);

// 2. Contenus, créés une seule fois.
if (sql('select count(*) from actualite') === '0') {
  const categories = await call('GET', '/categories');
  const cat = (index) => categories[index % categories.length]?.id ?? null;
  const r = tokens.responsable;

  const actualites = [
    ['Ouverture des inscriptions aux ateliers du semestre', 'Les inscriptions aux ateliers du semestre sont ouvertes aux membres du club.', true],
    ['Compte rendu de la réunion de rentrée', 'Retour sur la réunion de rentrée et sur le calendrier des activités.', true],
    ['Appel à propositions de projets', 'Les membres peuvent soumettre leurs idées de projets depuis leur espace.', true],
    ['Mise à jour du règlement des ateliers', 'Les règles de participation aux ateliers ont été précisées.', true],
    ['Brouillon : bilan du premier trimestre', 'Brouillon non publié, visible uniquement dans l’espace de gestion.', false],
  ];
  for (const [i, [titre, resume, publie]] of actualites.entries()) {
    await call('POST', '/actualites', {
      titre,
      resume,
      contenu: `${resume}\n\nCe texte est un contenu d’essai de la base de recette. Il sert à vérifier la mise en page d’un article de plusieurs paragraphes.\n\n> Une citation d’essai, pour vérifier la mise en forme des citations.\n\nDernier paragraphe de l’article d’essai.`,
      categorieId: cat(i),
      publie,
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

  const f = tokens.formateur;
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

  await call('POST', '/ressources', { titre: 'Guide de démarrage avec Git', description: 'Ressource publique d’essai de la base de recette.', type: 'DOCUMENT_PDF', urlFichier: 'https://exemple.invalid/guide-git.pdf', estPublique: true, categorieId: cat(0) }, f);
  await call('POST', '/ressources', { titre: 'Documentation officielle de Python', description: 'Lien externe d’essai.', type: 'LIEN_EXTERNE', urlFichier: 'https://docs.python.org/fr/3/', estPublique: true, categorieId: cat(1) }, f);

  const m = tokens.membre;
  const projets = [
    ['Application de gestion de bibliothèque', 'Angular, Spring Boot, PostgreSQL', 'VALIDE'],
    ['Station météo connectée', 'Python, Raspberry Pi', 'VALIDE'],
    ['Annuaire des anciens étudiants', 'Angular', null],
  ];
  for (const [i, [titre, technologies, decision]] of projets.entries()) {
    const projet = await call('POST', '/projets', { titre, description: `Projet d’essai de la base de recette : ${titre.toLowerCase()}.`, objectifs: 'Objectifs d’essai du projet.', technologies, categorieId: cat(i) }, m);
    if (decision) await call('PUT', `/projets/${projet.id}/validation`, { statut: decision, motif: 'Validation d’essai.' }, r);
    if (i === 0) await call('PUT', `/projets/${projet.id}/suivi`, { suiviFormateur: 'Suivi d’essai.', avancementPourcentage: 40 }, f);
  }

  await call('POST', '/contact', { nom: 'Fatoumata Traoré', email: 'fatoumata.traore@recette.invalid', sujet: 'Demande d’information', message: 'Message d’essai envoyé depuis le script de recette.' });
  await call('POST', '/notifications/globales', { titre: 'Annonce d’essai', message: 'Notification globale d’essai de la base de recette.' }, r);
}

// 3. Inscriptions du membre de recette, créées une seule fois par l'API réelle : un événement, une session
//    de formation confirmée et une session complète (liste d'attente, la place étant prise par le formateur).
const mine = await call('GET', '/inscriptions/me?size=200', undefined, tokens.membre);
if (!mine.content.some((i) => i.statut !== 'ANNULEE')) {
  const evenements = (await call('GET', '/evenements?search=&sort=dateDebut,asc')).content;
  const formations = (await call('GET', '/formations?search=')).content;
  const sessions = formations.flatMap((f) => f.sessions ?? []);
  const ouverte = sessions.find((s) => s.capaciteMax > 1);
  const limitee = sessions.find((s) => s.capaciteMax === 1 && s.formationId !== ouverte?.formationId) ?? sessions.find((s) => s.capaciteMax === 1);
  if (evenements[1]) await call('POST', `/inscriptions/evenements/${evenements[1].id}`, undefined, tokens.membre);
  if (ouverte) await call('POST', `/inscriptions/formations/${ouverte.id}`, undefined, tokens.membre);
  if (limitee) {
    await call('POST', `/inscriptions/formations/${limitee.id}`, undefined, tokens.formateur).catch(() => {});
    await call('POST', `/inscriptions/formations/${limitee.id}`, undefined, tokens.membre);
  }
}

const summary = {
  comptes: Object.fromEntries(ACCOUNTS.map((a) => [a.key, emailOf(a)])),
  actualites: Number(sql('select count(*) from actualite')),
  evenements: Number(sql('select count(*) from evenement')),
  formations: Number(sql('select count(*) from formation')),
  projets: Number(sql('select count(*) from projet')),
  ressources: Number(sql('select count(*) from ressource')),
  inscriptionsDuMembre: (await call('GET', '/inscriptions/me?size=200', undefined, tokens.membre)).content.map((i) => i.statut),
};
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), '.recette-comptes.json'), JSON.stringify(summary.comptes, null, 2));
console.log(JSON.stringify(summary, null, 1));
