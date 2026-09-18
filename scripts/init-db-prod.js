const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('../server/config');

const DB_PATH = config.DB_PATH;
const SCHEMA_PATH = path.join(__dirname, '..', 'db', 'schema.sql');
const REFERENCE_PATH = path.join(__dirname, '..', 'db', 'seed-reference.sql');

// Ce script ne détruit JAMAIS une base existante.
if (fs.existsSync(DB_PATH)) {
  console.error('\nRefus : une base existe déjà à cet emplacement.');
  console.error(DB_PATH);
  console.error('Supprimez-la manuellement si vous voulez repartir de zéro.\n');
  process.exit(1);
}

// S'assurer que le dossier parent existe
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('Dossier créé :', dbDir);
}

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
console.log('Schéma appliqué.');

db.exec(fs.readFileSync(REFERENCE_PATH, 'utf8'));
console.log('Référentiels insérés : 5 rôles, 14 permissions, 12 départements, 77 communes, 41 secteurs.');

db.close();

console.log('\nBase de production initialisée :', DB_PATH);
console.log('Étape suivante : npm run bootstrap-admin\n');