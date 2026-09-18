const crypto = require('crypto');
const db = require('../db');
const { nowIso } = require('../helpers');

// =========================================================
// ACCÈS SQL
// =========================================================

function findById(id) {
  return db.prepare(`
    SELECT
      v.*,
      o.name AS organization_name,
      u.first_name AS verifier_first_name,
      u.last_name AS verifier_last_name
    FROM verifications v
    JOIN organizations o ON o.id = v.organization_id
    JOIN users u ON u.id = v.verifier_id
    WHERE v.id = ?
  `).get(id);
}

function findAll(filters = {}) {
  const conditions = [];
  const params = [];

  let sql = `
    SELECT
      v.*,
      o.name AS organization_name,
      u.first_name AS verifier_first_name,
      u.last_name AS verifier_last_name
    FROM verifications v
    JOIN organizations o ON o.id = v.organization_id
    JOIN users u ON u.id = v.verifier_id
  `;

  if (filters.organizationId) {
    conditions.push('v.organization_id = ?');
    params.push(filters.organizationId);
  }

  if (filters.verifierId) {
    conditions.push('v.verifier_id = ?');
    params.push(filters.verifierId);
  }

  if (filters.status) {
    conditions.push('v.status = ?');
    params.push(filters.status);
  }

  if (filters.fieldName !== undefined) {
    if (filters.fieldName === null) {
      conditions.push('v.field_name IS NULL');
    } else {
      conditions.push('v.field_name = ?');
      params.push(filters.fieldName);
    }
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  sql += ` ORDER BY v.created_at DESC`;

  return db.prepare(sql).all(...params);
}

function create(data) {
  const id = data.id || crypto.randomUUID();

  db.prepare(`
    INSERT INTO verifications (
      id,
      organization_id,
      field_name,
      verifier_id,
      status,
      method,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.organizationId,
    data.fieldName || null,
    data.verifierId,
    data.status,
    data.method || null,
    nowIso()
  );

  return findById(id);
}

const editableFields = {
  fieldName: 'field_name',
  status: 'status',
  method: 'method'
};

function update(id, changes) {
  const assignments = [];
  const values = [];

  for (const [inputName, columnName] of Object.entries(editableFields)) {
    if (Object.prototype.hasOwnProperty.call(changes, inputName)) {
      assignments.push(`${columnName} = ?`);
      values.push(changes[inputName]);
    }
  }

  if (assignments.length === 0) {
    return findById(id);
  }

  values.push(id);

  const result = db.prepare(`
    UPDATE verifications
    SET ${assignments.join(', ')}
    WHERE id = ?
  `).run(...values);

  if (result.changes === 0) return null;

  return findById(id);
}

function findLatestForOrganization(organizationId) {
  return db.prepare(`
    SELECT
      v.*,
      u.first_name AS verifier_first_name,
      u.last_name AS verifier_last_name
    FROM verifications v
    JOIN users u ON u.id = v.verifier_id
    WHERE v.organization_id = ?
    ORDER BY v.created_at DESC
    LIMIT 1
  `).get(organizationId);
}

// =========================================================
// HANDLERS EXPRESS
// =========================================================

function listVerificationsHandler(req, res) {
  try {
    const filters = {
      organizationId: req.query.organization_id,
      verifierId: req.query.verifier_id,
      status: req.query.status
    };

    if (Object.prototype.hasOwnProperty.call(req.query, 'field_name')) {
      filters.fieldName =
        req.query.field_name === '' ? null : req.query.field_name;
    }

    res.json(findAll(filters));
  } catch (error) {
    res.status(500).json({
      error: 'Impossible de charger les vérifications'
    });
  }
}

function getVerificationHandler(req, res) {
  try {
    const verification = findById(req.params.id);

    if (!verification) {
      return res.status(404).json({
        error: 'Vérification introuvable'
      });
    }

    res.json(verification);
  } catch (error) {
    res.status(500).json({
      error: 'Impossible de charger la vérification'
    });
  }
}

module.exports = {
  findById,
  findAll,
  create,
  update,
  findLatestForOrganization,
  listVerificationsHandler,
  getVerificationHandler
};