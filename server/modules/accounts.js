const crypto = require('crypto');
const db = require('../db');
const { nowIso, logAudit } = require('../helpers');
const { hashPassword } = require('../auth');

// En phase 19, cette valeur sera lue depuis .env (décision D1).
const config = require('../config');

// =========================================================
// ACCÈS SQL
// =========================================================

function findUserIdByEmail(email) {
  const row = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
  return row ? row.id : null;
}

function findRoleByName(name) {
  return db.prepare(`SELECT id, name FROM roles WHERE name = ?`).get(name);
}

function insertUser({ id, firstName, lastName, email, passwordHash }) {
  db.prepare(`
    INSERT INTO users (id, first_name, last_name, email, password, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'active', ?, NULL)
  `).run(id, firstName, lastName, email, passwordHash, nowIso());
}

function assignRole(userId, roleId) {
  db.prepare(`
    INSERT INTO user_roles (id, user_id, role_id, assigned_by, assigned_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    userId,
    roleId,
    userId, // auto-attribution à l'inscription : le user est son propre attributeur
    nowIso()
  );
}

// =========================================================
// RÈGLES MÉTIER
// =========================================================

function validateRegistrationInput(body) {
  const errors = [];

  const firstName = (body.first_name || '').trim();
  const lastName = (body.last_name || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  const passwordConfirm = body.password_confirm || '';

  if (!firstName) errors.push('Prénom requis');
  if (firstName.length > 100) errors.push('Prénom trop long (max 100)');
  if (!lastName) errors.push('Nom requis');
  if (lastName.length > 100) errors.push('Nom trop long (max 100)');

  if (!email) {
    errors.push('Email requis');
  } else {
    const at = email.indexOf('@');
    if (at < 1 || email.indexOf('.', at) === -1 || email.length > 255) {
      errors.push('Email invalide');
    }
  }

  if (password.length < config.PASSWORD_MIN_LENGTH) {
    errors.push(`Mot de passe trop court (${config.PASSWORD_MIN_LENGTH} caractères minimum)`);
  }
  if (password !== passwordConfirm) errors.push('La confirmation ne correspond pas au mot de passe');

  return { errors, firstName, lastName, email, password };
}

function registerAccount(body) {
  // Le flag prime : inutile de valider un formulaire si les inscriptions
  // sont fermées (403 avant 400).
  if (!config.REGISTRATION_OPEN) {
    const err = new Error('Les inscriptions sont actuellement fermées');
    err.status = 403;
    throw err;
  }

  const { errors, firstName, lastName, email, password } = validateRegistrationInput(body);

  if (errors.length > 0) {
    const err = new Error(errors[0]);
    err.status = 400;
    throw err;
  }

  if (findUserIdByEmail(email)) {
    const err = new Error('Un compte existe déjà avec cet email');
    err.status = 409;
    throw err;
  }

  const role = findRoleByName('contributor');
  if (!role) {
    throw new Error('Rôle contributor introuvable');
  }

  const userId = crypto.randomUUID();
  const passwordHash = hashPassword(password);

  const transaction = db.transaction(() => {
    insertUser({ id: userId, firstName, lastName, email, passwordHash });
    assignRole(userId, role.id);

    logAudit({
      actorId: userId,
      action: 'register',
      entityType: 'user',
      entityId: userId,
      newData: { email, role: role.name }
    });
  });

  transaction();

  return { userId };
}

// =========================================================
// HANDLERS
// =========================================================

function registerHandler(req, res) {
  try {
    registerAccount(req.body || {});
    res.status(201).json({ ok: true });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('register:', error.message);
    res.status(500).json({ error: 'Impossible de créer le compte' });
  }
}

module.exports = {
  registerHandler
};