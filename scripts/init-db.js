const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('../server/config');

const DB_PATH = config.DB_PATH;
const SCHEMA_PATH = path.join(__dirname, '..', 'db', 'schema.sql');
const REFERENCE_PATH = path.join(__dirname, '..', 'db', 'seed-reference.sql');
const SEED_PATH = path.join(__dirname, '..', 'db', 'seed.sql');

if (config.IS_PRODUCTION) {
  console.error('\nRefus : init-db supprime la base de données.');
  console.error('Interdit en production (NODE_ENV=production).\n');
  process.exit(1);
}

if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('Ancienne base supprimée.');
}

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
console.log('Schéma appliqué.');

db.exec(fs.readFileSync(REFERENCE_PATH, 'utf8'));
console.log('Référentiels insérés.');

db.exec(fs.readFileSync(SEED_PATH, 'utf8'));
console.log('Données de test insérées.');

db.close();
console.log('Base de développement initialisée :', DB_PATH);