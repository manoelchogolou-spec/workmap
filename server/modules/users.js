const crypto = require('crypto');
const db = require('../db');
const { nowIso, logAudit } = require('../helpers');
const { destroyAllSessionsForUser, hashPassword } = require('../auth');

// =========================================================
// ACCÈS SQL
// =========================================================

function findById(id) {
  return db.prepare(`
    SELECT
      id,
      first_name,
      last_name,
      phone,
      email,
      status,
      created_at,
      updated_at
    FROM users
    WHERE id = ?
  `).get(id);
}

function findByEmail(email) {
  return db.prepare(`
    SELECT *
    FROM users
    WHERE email = ?
  `).get(email);
}

function findAll({ status } = {}) {
  let sql = `
    SELECT
      id,
      first_name,
      last_name,
      phone,
      email,
      status,
      created_at,
      updated_at
    FROM users
  `;

  const params = [];

  if (status) {
    sql += ` WHERE status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY created_at DESC`;

  return db.prepare(sql).all(...params);
}

function findRolesByUserId(userId) {
  return db.prepare(`
    SELECT r.id, r.name, r.description
    FROM roles r
    JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = ?
    ORDER BY r.name
  `).all(userId);
}

function findPermissionsByUserId(userId) {
  return db.prepare(`
    SELECT DISTINCT p.id, p.name, p.description
    FROM permissions p
    JOIN role_permissions rp ON rp.permission_id = p.id
    JOIN user_roles ur ON ur.role_id = rp.role_id
    WHERE ur.user_id = ?
    ORDER BY p.name
  `).all(userId);
}

function updateStatus(userId, status) {
  return db.prepare(`
    UPDATE users
    SET status = ?, updated_at = ?
    WHERE id = ?
  `).run(status, nowIso(), userId);
}

function assignRole(userId, roleId, assignedBy) {
  return db.prepare(`
    INSERT INTO user_roles (
      id,
      user_id,
      role_id,
      assigned_by,
      assigned_at
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    userId,
    roleId,
    assignedBy,
    nowIso()
  );
}

function removeRole(userId, roleId) {
  return db.prepare(`
    DELETE FROM user_roles
    WHERE user_id = ? AND role_id = ?
  `).run(userId, roleId);
}

function updatePasswordAndForceChange(userId, hashedPassword) {
  return db.prepare(`
    UPDATE users
    SET password = ?,
        must_change_password = 1,
        updated_at = ?
    WHERE id = ?
  `).run(hashedPassword, nowIso(), userId);
}

// =========================================================
// RÈGLES MÉTIER
// =========================================================

const allowedStatuses = ['active', 'suspended', 'disabled'];

function changeUserStatus({ userId, status, actorId }) {
  if (!allowedStatuses.includes(status)) {
    throw new Error('Statut utilisateur invalide');
  }

  const user = findById(userId);

  if (!user) {
    throw new Error('Utilisateur introuvable');
  }

  if (user.status === status) {
    return user;
  }

  const transaction = db.transaction(() => {
    updateStatus(userId, status);

    if (status !== 'active') {
      destroyAllSessionsForUser(userId);
    }

    logAudit({
      actorId,
      action: 'user_status_changed',
      entityType: 'user',
      entityId: userId,
      oldData: { status: user.status },
      newData: { status }
    });
  });

  transaction();

  return findById(userId);
}

function addRoleToUser({ userId, roleId, actorId }) {
  const user = findById(userId);

  if (!user) {
    throw new Error('Utilisateur introuvable');
  }

  const role = db.prepare(`
    SELECT id, name
    FROM roles
    WHERE id = ?
  `).get(roleId);

  if (!role) {
    throw new Error('Rôle introuvable');
  }

  const existingRole = db.prepare(`
    SELECT id
    FROM user_roles
    WHERE user_id = ? AND role_id = ?
  `).get(userId, roleId);

  if (existingRole) {
    throw new Error('Ce rôle est déjà attribué');
  }

  const transaction = db.transaction(() => {
    assignRole(userId, roleId, actorId);

    logAudit({
      actorId,
      action: 'role_assigned',
      entityType: 'user',
      entityId: userId,
      newData: {
        role_id: role.id,
        role_name: role.name
      }
    });
  });

  transaction();

  return findRolesByUserId(userId);
}

function removeRoleFromUser({ userId, roleId, actorId }) {
  const existingRole = db.prepare(`
    SELECT r.id, r.name
    FROM roles r
    JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = ? AND ur.role_id = ?
  `).get(userId, roleId);

  if (!existingRole) {
    throw new Error('Rôle non attribué à cet utilisateur');
  }

  const transaction = db.transaction(() => {
    removeRole(userId, roleId);

    logAudit({
      actorId,
      action: 'role_removed',
      entityType: 'user',
      entityId: userId,
      oldData: {
        role_id: existingRole.id,
        role_name: existingRole.name
      }
    });
  });

  transaction();

  return findRolesByUserId(userId);
}

function generateTempPassword() {
  // 12 caractères hexadécimaux + suffixe pour satisfaire les règles de complexité
  return crypto.randomBytes(6).toString('hex') + 'Aa1!';
}

function resetUserPassword({ userId, actorId }) {
  const user = findById(userId);

  if (!user) {
    throw new Error('Utilisateur introuvable');
  }

  const tempPassword = generateTempPassword();
  const hashed = hashPassword(tempPassword);

  const transaction = db.transaction(() => {
    updatePasswordAndForceChange(userId, hashed);
    destroyAllSessionsForUser(userId);

    logAudit({
      actorId,
      action: 'password_reset_by_manager',
      entityType: 'user',
      entityId: userId,
      newData: { must_change_password: 1 }
    });
  });

  transaction();

  return tempPassword;
}

function assertCanManageAdministrator(targetRoleId, reqUser) {
  const row = db.prepare(`SELECT name FROM roles WHERE id = ?`).get(targetRoleId);
  if (row && row.name === 'administrator') {
    const canManageRoles = reqUser.permissions.includes('manage_roles');
    if (!canManageRoles) {
      const err = new Error('Seul un administrateur peut gérer le rôle administrator');
      err.status = 403;
      throw err;
    }
  }
}

// =========================================================
// HANDLERS EXPRESS
// =========================================================

function listUsersHandler(req, res) {
  try {
    const users = findAll({ status: req.query.status });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Impossible de charger les utilisateurs' });
  }
}

function getUserHandler(req, res) {
  try {
    const user = findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    res.json({
      ...user,
      roles: findRolesByUserId(user.id),
      permissions: findPermissionsByUserId(user.id)
    });
  } catch (error) {
    res.status(500).json({ error: 'Impossible de charger l’utilisateur' });
  }
}

// =========================================================
// GESTION DES UTILISATEURS (phase 9)
// =========================================================

// Traduction règle métier -> code HTTP.
// Le SELECT ne filtre que sur l'id : le statut sert à choisir 404 / 409.
function handleDomainError(res, error) {
  if (error.status) {
    return res.status(error.status).json({ error: error.message });
  }
  const msg = error.message;
  if (msg === 'Utilisateur introuvable' || msg === 'Rôle introuvable' || msg === 'Rôle non attribué à cet utilisateur') {
    return res.status(404).json({ error: msg });
  }
  if (msg === 'Ce rôle est déjà attribué') {
    return res.status(409).json({ error: msg });
  }
  throw error; // erreur inconnue -> 500 par le catch externe
}

function listRolesHandler(req, res) {
  try {
    const roles = db.prepare(`SELECT id, name, description FROM roles ORDER BY name`).all();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Impossible de charger les rôles' });
  }
}

function suspendUserHandler(req, res) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(409).json({ error: 'Impossible de suspendre votre propre compte' });
    }

    const target = findById(req.params.id);
    if (!target) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    if (target.status === 'suspended') {
      return res.status(409).json({ error: 'Utilisateur déjà suspendu' });
    }
    if (target.status === 'disabled') {
      return res.status(409).json({ error: 'Compte désactivé, hors périmètre' });
    }

    const user = changeUserStatus({
      userId: req.params.id,
      status: 'suspended',
      actorId: req.user.id
    });

    res.json({ ok: true, user });
  } catch (error) {
    console.error('suspendUser:', error.message);
    res.status(500).json({ error: 'Impossible de suspendre l’utilisateur' });
  }
}

function reactivateUserHandler(req, res) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(409).json({ error: 'Action impossible sur votre propre compte' });
    }

    const target = findById(req.params.id);
    if (!target) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    if (target.status !== 'suspended') {
      return res.status(409).json({ error: 'Utilisateur non suspendu' });
    }

    const user = changeUserStatus({
      userId: req.params.id,
      status: 'active',
      actorId: req.user.id
    });

    res.json({ ok: true, user });
  } catch (error) {
    console.error('reactivateUser:', error.message);
    res.status(500).json({ error: 'Impossible de réactiver l’utilisateur' });
  }
}

function assignRoleHandler(req, res) {
  try {
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({ error: 'roleId requis' });
    }
    if (req.params.id === req.user.id) {
      return res.status(409).json({ error: 'Impossible de modifier vos propres rôles' });
    }

    assertCanManageAdministrator(roleId, req.user);

    const roles = addRoleToUser({
      userId: req.params.id,
      roleId,
      actorId: req.user.id
    });

    res.status(201).json({ ok: true, roles });
  } catch (error) {
    try {
      handleDomainError(res, error);
    } catch (e) {
      console.error('assignRole:', e.message);
      res.status(500).json({ error: 'Impossible d’attribuer le rôle' });
    }
  }
}

function removeRoleHandler(req, res) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(409).json({ error: 'Impossible de modifier vos propres rôles' });
    }

    assertCanManageAdministrator(req.params.roleId, req.user);

    const roles = removeRoleFromUser({
      userId: req.params.id,
      roleId: req.params.roleId,
      actorId: req.user.id
    });

    res.json({ ok: true, roles });
  } catch (error) {
    try {
      handleDomainError(res, error);
    } catch (e) {
      console.error('removeRole:', e.message);
      res.status(500).json({ error: 'Impossible de retirer le rôle' });
    }
  }
}

function resetPasswordHandler(req, res) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(409).json({
        error: 'Utilisez le changement de mot de passe personnel'
      });
    }

    const target = findById(req.params.id);
    if (!target) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Garde-fou : un gestionnaire ne peut pas réinitialiser
    // le mot de passe d'un administrateur
    const targetRoles = findRolesByUserId(req.params.id).map(r => r.name);
    const targetIsAdmin = targetRoles.includes('administrator');
    const actorIsAdmin = req.user.roles.includes('administrator');

    if (targetIsAdmin && !actorIsAdmin) {
      return res.status(403).json({
        error: 'Seul un administrateur peut réinitialiser le mot de passe d’un administrateur'
      });
    }

    const tempPassword = resetUserPassword({
      userId: req.params.id,
      actorId: req.user.id
    });

    res.json({ ok: true, tempPassword });
  } catch (error) {
    console.error('resetPassword:', error.message);
    res.status(500).json({ error: 'Impossible de réinitialiser le mot de passe' });
  }
}


module.exports = {
  findById,
  findByEmail,
  findAll,
  findRolesByUserId,
  findPermissionsByUserId,
  changeUserStatus,
  addRoleToUser,
  removeRoleFromUser,
  listUsersHandler,
  getUserHandler,
  listRolesHandler,
  suspendUserHandler,
  reactivateUserHandler,
  assignRoleHandler,
  removeRoleHandler,
  resetUserPassword,
  resetPasswordHandler,
  assertCanManageAdministrator
};