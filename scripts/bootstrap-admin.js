const crypto = require('crypto');
const readline = require('readline');
const Database = require('better-sqlite3');
const config = require('../server/config');
const { hashPassword } = require('../server/auth');
const { nowIso } = require('../server/helpers');

const db = new Database(config.DB_PATH);
db.pragma('foreign_keys = ON');

function generatePassword() {
  // 16 caractères, alphabet restreint mais suffisant, pas de confusion 0/O, 1/l
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  const bytes = crypto.randomBytes(16);
  for (let i = 0; i < 16; i++) {
    pwd += alphabet[bytes[i] % alphabet.length];
  }
  return pwd;
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const existingAdmin = db.prepare(`
    SELECT u.id, u.email FROM users u
    JOIN user_roles ur ON ur.user_id = u.id
    JOIN roles r ON r.id = ur.role_id
    WHERE r.name = 'administrator'
  `).all();

  if (existingAdmin.length > 0) {
    console.log('\nUn ou plusieurs administrateurs existent déjà :');
    existingAdmin.forEach((a) => console.log(`  - ${a.email}`));
    console.log('\nBootstrap refusé pour éviter les doublons.');
    console.log('Utilise le compte existant ou supprime-le manuellement si nécessaire.\n');
    process.exit(1);
  }

  const email = await ask('Email de l\'administrateur : ');
  const firstName = await ask('Prénom : ');
  const lastName = await ask('Nom : ');

  if (!email || !firstName || !lastName) {
    console.error('\nTous les champs sont obligatoires.\n');
    process.exit(1);
  }

  const role = db.prepare(`SELECT id FROM roles WHERE name = 'administrator'`).get();
  if (!role) {
    console.error('\nRôle "administrator" introuvable. Le référentiel a-t-il été chargé ?\n');
    process.exit(1);
  }

  const password = generatePassword();
  const passwordHash = hashPassword(password);
  const userId = crypto.randomUUID();
  const now = nowIso();

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO users (id, first_name, last_name, email, password, status, created_at, must_change_password)
      VALUES (?, ?, ?, ?, ?, 'active', ?, 1)
    `).run(userId, firstName, lastName, email, passwordHash, now);

    db.prepare(`
      INSERT INTO user_roles (id, user_id, role_id, assigned_by, assigned_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), userId, role.id, userId, now);
  });

  transaction();

  console.log('\n========================================');
  console.log('Administrateur créé avec succès.');
  console.log('========================================');
  console.log(`Email       : ${email}`);
  console.log(`Mot de passe: ${password}`);
  console.log('========================================');
  console.log('Ce mot de passe ne sera plus jamais affiché.');
  console.log('Il devra être changé à la première connexion.\n');

  db.close();
}

main();