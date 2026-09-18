const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');
const config = require('./config');

const SESSION_DURATION_MS = config.SESSION_DURATION_MS;

function nowIso() {
  return new Date().toISOString();
}

function hashPassword(plain) {
  return bcrypt.hashSync(plain, config.BCRYPT_ROUNDS);
}

function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

function createSession(userId) {
  const id = crypto.randomUUID();
  const created = new Date();
  const expires = new Date(created.getTime() + SESSION_DURATION_MS);

  db.prepare(`
    INSERT INTO sessions (id, user_id, created_at, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(id, userId, created.toISOString(), expires.toISOString());

  return { id, expiresAt: expires };
}

function destroySession(sessionId) {
  db.prepare(`DELETE FROM sessions WHERE id = ?`).run(sessionId);
}

function destroyAllSessionsForUser(userId) {
  db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(userId);
}

// Charge l'utilisateur courant à partir du cookie de session.
// Revérifie systématiquement le statut et les rôles à chaque requête
// (pas de JWT : la session en base est la seule source de vérité).
function loadUser(req) {
  const sid = req.cookies && req.cookies[config.SESSION_COOKIE_NAME];
  if (!sid) return null;

  const session = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(sid);
  if (!session) return null;

  if (new Date(session.expires_at) < new Date()) {
    destroySession(sid);
    return null;
  }

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(session.user_id);
  if (!user || user.status !== 'active') {
    return null;
  }

  const roles = db.prepare(`
    SELECT r.id, r.name
    FROM roles r
    JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = ?
  `).all(user.id);

  const permissions = db.prepare(`
    SELECT DISTINCT p.name
    FROM permissions p
    JOIN role_permissions rp ON rp.permission_id = p.id
    JOIN user_roles ur ON ur.role_id = rp.role_id
    WHERE ur.user_id = ?
  `).all(user.id).map(p => p.name);

  const { password, ...safeUser } = user;

  return {
    ...safeUser,
    roles: roles.map(r => r.name),
    permissions,
    sessionId: sid
  };
}

function requireAuth(req, res, next) {
  const user = loadUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  req.user = user;
  next();
}

function requirePermission(permissionName) {
  return (req, res, next) => {
    const user = req.user || loadUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    if (!user.permissions.includes(permissionName)) {
      return res.status(403).json({ error: 'Permission refusée' });
    }
    req.user = user;
    next();
  };
}


// Pose le cookie de session. Centralisé ici pour que les options
// de sécurité soient identiques partout.
function setSessionCookie(res, session) {
  res.cookie(config.SESSION_COOKIE_NAME, session.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.IS_PRODUCTION,
    path: '/',
    expires: session.expiresAt
  });
}

function clearSessionCookie(res) {
  res.clearCookie(config.SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.IS_PRODUCTION,
    path: '/'
  });
}

// Bloque tout accès aux routes protégées tant que le mot de passe
// généré automatiquement n'a pas été changé. Les routes de login,
// logout et change-password doivent rester accessibles.
function requirePasswordChanged(req, res, next) {
  const user = req.user || loadUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  if (user.must_change_password) {
    return res.status(403).json({
      error: 'Changement de mot de passe requis',
      code: 'PASSWORD_CHANGE_REQUIRED'
    });
  }
  req.user = user;
  next();
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  destroyAllSessionsForUser,
  loadUser,
  requireAuth,
  requirePermission,
  requirePasswordChanged,
  setSessionCookie,
  clearSessionCookie,
  nowIso
};