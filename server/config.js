// Configuration centralisée de WorkMap.
// Tout ce qui diffère entre développement et production passe par ici.
// Aucun autre fichier ne doit lire process.env directement.

const path = require('path');

// Charge .env depuis la racine du projet (silencieux s'il est absent)
require('dotenv').config({
  path: path.join(__dirname, '..', '.env')
});

// --- Lecteurs typés -------------------------------------------------

function readString(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') return fallback;
  return value.trim();
}

function readInt(name, fallback) {
  const raw = readString(name, null);
  if (raw === null) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Configuration invalide : ${name} doit être un entier (reçu "${raw}")`);
  }
  return parsed;
}

function readBool(name, fallback) {
  const raw = readString(name, null);
  if (raw === null) return fallback;
  const normalized = raw.toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  throw new Error(`Configuration invalide : ${name} doit valoir true ou false (reçu "${raw}")`);
}

// --- Valeurs de configuration ---------------------------------------

const NODE_ENV = readString('NODE_ENV', 'development');
const IS_PRODUCTION = NODE_ENV === 'production';

const config = {
  NODE_ENV,
  IS_PRODUCTION,

  // Serveur
  PORT: readInt('PORT', 3000),

  // Base de données
  DB_PATH: readString('DB_PATH', path.join(__dirname, '..', 'db', 'workmap.sqlite')),

  // Sessions
  SESSION_COOKIE_NAME: readString('SESSION_COOKIE_NAME', 'wm_sid'),
  SESSION_DURATION_DAYS: readInt('SESSION_DURATION_DAYS', 7),

  // Mots de passe
  BCRYPT_ROUNDS: readInt('BCRYPT_ROUNDS', 12),
  PASSWORD_MIN_LENGTH: readInt('PASSWORD_MIN_LENGTH', 10),

  // Fonctionnalités
  REGISTRATION_OPEN: readBool('REGISTRATION_OPEN', true),

  // Amorçage du premier administrateur (étape 3)
  BOOTSTRAP_ADMIN_EMAIL: readString('BOOTSTRAP_ADMIN_EMAIL', null),
  BOOTSTRAP_ADMIN_FIRST_NAME: readString('BOOTSTRAP_ADMIN_FIRST_NAME', 'Admin'),
  BOOTSTRAP_ADMIN_LAST_NAME: readString('BOOTSTRAP_ADMIN_LAST_NAME', 'WorkMap')
};

// Durée de session en millisecondes, dérivée une seule fois
config.SESSION_DURATION_MS = config.SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

// --- Garde-fous de production ---------------------------------------

if (IS_PRODUCTION) {
  const problems = [];

  if (config.BCRYPT_ROUNDS < 12) {
    problems.push('BCRYPT_ROUNDS doit être au moins 12 en production');
  }
  if (config.PASSWORD_MIN_LENGTH < 10) {
    problems.push('PASSWORD_MIN_LENGTH doit être au moins 10 en production');
  }

  if (problems.length > 0) {
    console.error('\n=== Configuration de production invalide ===');
    problems.forEach(p => console.error(' - ' + p));
    console.error('Démarrage interrompu.\n');
    process.exit(1);
  }
}

module.exports = config;