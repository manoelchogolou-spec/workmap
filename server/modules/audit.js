const db = require('../db');

// =========================================================
// LECTURE DE L'AUDIT — lecture seule, jamais d'écriture ici
// =========================================================

function findAllAudit(filters) {
  const f = filters || {};
  const where = [];
  const params = [];

  if (f.userId) {
    where.push('a.user_id = ?');
    params.push(f.userId);
  }
  if (f.action) {
    where.push('a.action = ?');
    params.push(f.action);
  }
  if (f.entityType) {
    where.push('a.entity_type = ?');
    params.push(f.entityType);
  }
  if (f.entityId) {
    where.push('a.entity_id = ?');
    params.push(f.entityId);
  }

  let limit = parseInt(f.limit, 10);
  if (!Number.isInteger(limit) || limit < 1) limit = 100;
  if (limit > 500) limit = 500;

  const sql = `
    SELECT
      a.id,
      a.user_id,
      CASE WHEN a.user_id IS NULL THEN 'system'
           ELSE u.first_name || ' ' || u.last_name END AS actor_name,
      a.actor_type,
      a.action,
      a.entity_type,
      a.entity_id,
      a.old_data,
      a.new_data,
      a.metadata,
      a.created_at
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.user_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY a.created_at DESC, a.id DESC
    LIMIT ?
  `;
  params.push(limit);

  return db.prepare(sql).all(...params);
}

function listAuditHandler(req, res) {
  try {
    const rows = findAllAudit({
      userId: req.query.user_id,
      action: req.query.action,
      entityType: req.query.entity_type,
      entityId: req.query.entity_id,
      limit: req.query.limit
    });
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossible de charger l’audit' });
  }
}

module.exports = { findAllAudit, listAuditHandler };