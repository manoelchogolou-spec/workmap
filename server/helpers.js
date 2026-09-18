const crypto = require('crypto');
const db = require('./db');

function nowIso() {
  return new Date().toISOString();
}

function sendJson(res, status, data) {
  return res.status(status).json(data);
}

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

function logAudit({
  actorId = null,
  actorType,
  action,
  entityType,
  entityId = null,
  oldData = null,
  newData = null,
  metadata = null
}) {
  const id = crypto.randomUUID();

  const resolvedActorType =
    actorType || (actorId ? 'user' : 'system');

  db.prepare(`
    INSERT INTO audit_logs (
      id,
      user_id,
      actor_type,
      action,
      entity_type,
      entity_id,
      old_data,
      new_data,
      metadata,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    actorId,
    resolvedActorType,
    action,
    entityType,
    entityId,
    oldData ? JSON.stringify(oldData) : null,
    newData ? JSON.stringify(newData) : null,
    metadata ? JSON.stringify(metadata) : null,
    nowIso()
  );

  return id;
}

module.exports = {
  nowIso,
  sendJson,
  sendError,
  logAudit
};