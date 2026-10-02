// Pile réelle des parcours utilisateur (section 12) : base PostgreSQL vierge, backend construit, courriels capturés,
// frontend de production construit et servi par Nginx (image du déploiement).
// Prérequis : Docker démarré, conteneurs « ci-ist-pg » (PostgreSQL, port 5433) et « ci-ist-mail » (Mailpit, ports 1025 et 8025),
// fichier JAR du backend construit (mvn -B package -DskipTests).
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const frontend = join(here, '..', '..');
const backend = join(frontend, '..', 'club-informatique-backend');

export const BASE = process.env.PARCOURS_FRONTEND ?? 'http://localhost:4300';
export const BACKEND = process.env.PARCOURS_BACKEND ?? 'http://localhost:8080';
export const API = `${BACKEND}/api/v1`;
export const COURRIELS = process.env.PARCOURS_COURRIELS ?? 'http://localhost:8025/api/v1';
/** Mot de passe des comptes d'essai de la pile locale ; il ne protège aucune donnée réelle. */
export const MOT_DE_PASSE = process.env.RECETTE_MOT_DE_PASSE ?? 'Recette@2026';
export const PREMIER_ADMIN = 'premier.admin@club.test';
export const MOT_DE_PASSE_INITIAL = `${MOT_DE_PASSE}-initial`;
export const ADRESSE_DU_CLUB = 'club@club.test';

const CONTENEUR_BASE = process.env.PARCOURS_CONTENEUR_BASE ?? 'ci-ist-pg';
const CONTENEUR_FRONTEND = 'ci-ist-front';
const NOM_BASE = 'club_parcours';
const DEPOTS = join(backend, 'target', 'depots-parcours');

const docker = (...args) => execFileSync('docker', args, { stdio: 'pipe' }).toString();
const psql = (base, requete) => docker('exec', CONTENEUR_BASE, 'psql', '-U', 'postgres', '-d', base, '-At', '-c', requete).trim();

/** Recrée la base des parcours : aucune table, aucune donnée ; les migrations s'appliquent au démarrage du backend. */
export function baseVierge() {
  psql('postgres', `DROP DATABASE IF EXISTS ${NOM_BASE} WITH (FORCE)`);
  psql('postgres', `CREATE DATABASE ${NOM_BASE}`);
  rmSync(DEPOTS, { recursive: true, force: true });
}

/** Requête de lecture sur la base des parcours, pour vérifier ce que l'application y a réellement écrit. */
export const enBase = (requete) => psql(NOM_BASE, requete);

/** Vide la boîte de capture des courriels. */
export async function viderCourriels() {
  await fetch(`${COURRIELS}/messages`, { method: 'DELETE' });
}

let processus = null;

/**
 * Démarre le backend sur la base des parcours et attend qu'il réponde.
 * options : comptesDeTest (création des comptes d'essai), purge (retrait des comptes d'essai au démarrage),
 * limites (limitation de débit de production au lieu de limites relevées), dureeJeton (durée du jeton d'accès, en ms).
 */
export async function demarrerBackend(options = {}) {
  await arreterBackend();
  const cible = join(backend, 'target');
  const jar = existsSync(cible) ? readdirSync(cible).find((f) => /^club-informatique-backend-.*\.jar$/.test(f)) : undefined;
  if (!jar) throw new Error('fichier JAR du backend absent : exécutez « mvn -B package -DskipTests » dans club-informatique-backend');
  const reglages = ['-Dlogging.level.org.hibernate.SQL=WARN', '-Dlogging.level.root=WARN'];
  if (!options.limites) reglages.push('-Dapp.rate-limit.auth.capacity=100000', '-Dapp.rate-limit.contact.capacity=100000', '-Dapp.rate-limit.password-reset.capacity=100000');
  if (options.dureeJeton) reglages.push(`-Dapp.jwt.access-token-expiration-ms=${options.dureeJeton}`);
  const env = {
    ...process.env,
    SPRING_PROFILES_ACTIVE: 'dev',
    DB_URL: `jdbc:postgresql://localhost:5433/${NOM_BASE}`,
    DB_USERNAME: 'postgres',
    DB_PASSWORD: 'postgres',
    MAIL_HOST: 'localhost',
    MAIL_PORT: '1025',
    MAIL_FROM: 'ne-pas-repondre@club.test',
    CONTACT_EMAIL: ADRESSE_DU_CLUB,
    APP_FRONTEND_URL: BASE,
    CORS_ALLOWED_ORIGINS: BASE,
    UPLOAD_DIR: DEPOTS,
    // Secret fixe de la pile locale : les sessions survivent à un redémarrage du backend, comme en production.
    JWT_SECRET: 'secret-de-la-pile-locale-des-parcours-0123456789-abcdefghijklmnopqrstuvwxyz',
    APP_SEED_TEST_ACCOUNTS: options.comptesDeTest ? 'true' : 'false',
    APP_TEST_ACCOUNTS_PASSWORD: MOT_DE_PASSE,
    APP_PURGE_TEST_ACCOUNTS: options.purge ? 'true' : 'false',
    APP_BOOTSTRAP_ADMIN_EMAIL: PREMIER_ADMIN,
    APP_BOOTSTRAP_ADMIN_PASSWORD: MOT_DE_PASSE_INITIAL,
  };
  const sortie = [];
  processus = spawn('java', [...reglages, '-jar', join(cible, jar)], { cwd: backend, env, stdio: ['ignore', 'pipe', 'pipe'] });
  processus.stdout.on('data', (d) => sortie.push(d.toString()));
  processus.stderr.on('data', (d) => sortie.push(d.toString()));
  const debut = Date.now();
  while (Date.now() - debut < 180000) {
    if (processus.exitCode !== null) throw new Error(`le backend s'est arrêté au démarrage :\n${sortie.join('').slice(-3000)}`);
    try {
      const sante = await fetch(`${BACKEND}/api/v1/actuator/health`);
      if (sante.ok && (await sante.json()).status === 'UP') return { demarrage: Date.now() - debut, journal: () => sortie.join('') };
    } catch {
      // Le serveur n'écoute pas encore.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`le backend ne répond pas après trois minutes :\n${sortie.join('').slice(-3000)}`);
}

export async function arreterBackend() {
  if (!processus) return;
  const courant = processus;
  processus = null;
  if (courant.exitCode !== null) return;
  await new Promise((resolve) => {
    courant.once('exit', resolve);
    tuer(courant);
  });
  // Le port est libéré peu après la fin du processus.
  for (let essai = 0; essai < 40; essai++) {
    try {
      await fetch(`${BACKEND}/api/v1/actuator/health`);
    } catch {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('le backend répond encore après son arrêt');
}

/** Sous Windows, la commande « java » peut n'être qu'un lanceur : c'est tout l'arbre de processus qu'il faut arrêter. */
function tuer(cible) {
  if (process.platform === 'win32') {
    try {
      execFileSync('taskkill', ['/PID', String(cible.pid), '/T', '/F'], { stdio: 'pipe' });
    } catch {
      // Processus déjà terminé.
    }
  } else {
    cible.kill();
  }
}

/** Construit l'image de production du frontend et la sert sur le port de BASE ; l'API est relayée vers le backend local. */
export function demarrerFrontend({ reconstruire = true } = {}) {
  arreterFrontend();
  if (reconstruire) execFileSync('docker', ['build', '-t', 'ci-ist-front', frontend], { stdio: 'inherit' });
  const port = new URL(BASE).port;
  docker('run', '-d', '--name', CONTENEUR_FRONTEND, '-p', `${port}:8080`, '-e', 'API_URL=http://host.docker.internal:8080', 'ci-ist-front');
}

export function arreterFrontend() {
  try {
    docker('rm', '-f', CONTENEUR_FRONTEND);
  } catch {
    // Aucun conteneur à retirer.
  }
}

export async function attendreFrontend() {
  for (let essai = 0; essai < 60; essai++) {
    try {
      if ((await fetch(`${BASE}/sante`)).ok) return;
    } catch {
      // Le conteneur démarre.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('le frontend de production ne répond pas');
}

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => processus && tuer(processus));
process.on('exit', () => processus && tuer(processus));
