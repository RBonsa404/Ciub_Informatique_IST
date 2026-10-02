// Démarre le backend sur la pile LOCALE de recette : base PostgreSQL du conteneur « ci-ist-pg » (port 5433),
// courriels capturés par Mailpit (port 1025, lecture sur http://localhost:8025), comptes de test créés au démarrage.
// Usage : node e2e/backend-recette.mjs    (le fichier JAR est construit s'il manque)
// Variables facultatives : RECETTE_DB_URL, RECETTE_DB_USER, RECETTE_DB_PASSWORD, RECETTE_MOT_DE_PASSE, RECETTE_ADMIN_EMAIL.
// La limitation de débit est relevée pour permettre l'exécution répétée des scénarios ; jamais en production.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const backend = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'club-informatique-backend');
const cible = join(backend, 'target');
const jar = () => (existsSync(cible) ? readdirSync(cible).find((f) => /^club-informatique-backend-.*\.jar$/.test(f)) : undefined);

if (!jar()) {
  execFileSync(process.platform === 'win32' ? 'mvn.cmd' : 'mvn', ['-B', '-q', 'package', '-DskipTests'], { cwd: backend, stdio: 'inherit', shell: process.platform === 'win32' });
}

const motDePasse = process.env.RECETTE_MOT_DE_PASSE ?? 'Recette@2026';
const env = {
  ...process.env,
  SPRING_PROFILES_ACTIVE: 'dev',
  DB_URL: process.env.RECETTE_DB_URL ?? 'jdbc:postgresql://localhost:5433/club_recette',
  DB_USERNAME: process.env.RECETTE_DB_USER ?? 'postgres',
  DB_PASSWORD: process.env.RECETTE_DB_PASSWORD ?? 'postgres',
  MAIL_HOST: 'localhost',
  MAIL_PORT: '1025',
  MAIL_FROM: 'ne-pas-repondre@club.test',
  CONTACT_EMAIL: 'club@club.test',
  APP_FRONTEND_URL: process.env.RECETTE_FRONTEND ?? 'http://localhost:4200',
  CORS_ALLOWED_ORIGINS: 'http://localhost:4200,http://localhost:4300',
  UPLOAD_DIR: join(cible, 'depots-recette'),
  APP_SEED_TEST_ACCOUNTS: 'true',
  APP_TEST_ACCOUNTS_PASSWORD: motDePasse,
  // Premier Super Admin réel de la pile de recette : il sert à vérifier l'amorçage et le changement de mot de passe imposé.
  APP_BOOTSTRAP_ADMIN_EMAIL: process.env.RECETTE_ADMIN_EMAIL ?? 'premier.admin@club.test',
  APP_BOOTSTRAP_ADMIN_PASSWORD: process.env.RECETTE_ADMIN_MOT_DE_PASSE ?? `${motDePasse}-initial`,
  RATE_LIMIT_AUTH_CAPACITY: '100000',
};

const processus = spawn(
  'java',
  ['-Dapp.rate-limit.contact.capacity=100000', '-Dapp.rate-limit.password-reset.capacity=100000', '-Dlogging.level.org.hibernate.SQL=WARN', '-jar', join(cible, jar())],
  { cwd: backend, env, stdio: 'inherit' },
);
processus.on('exit', (code) => process.exit(code ?? 0));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => processus.kill());
