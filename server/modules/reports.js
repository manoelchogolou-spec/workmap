const crypto = require('crypto');
const db = require('../db');
const { nowIso } = require('../helpers');
const { loadUser } = require('../auth');
const { logAudit } = require('../helpers');
const contributions = require('./contributions');

// =========================================================
// ACCÈS SQL
// =========================================================

function findById(id) {
  return db.prepare(`
    SELECT
      r.*,
      c.organization_name,
      u.first_name AS reviewer_first_name,
      u.last_name AS reviewer_last_name
    FROM contribution_reports r
    JOIN contributions c ON c.id = r.contribution_id
    LEFT JOIN users u ON u.id = r.reviewed_by
    WHERE r.id = ?
  `).get(id);
}

function findAll(filters = {}) {
  const conditions = [];
  const params = [];

  let sql = `
    SELECT
      r.*,
      c.organization_name,
      u.first_name AS reviewer_first_name,
      u.last_name AS reviewer_last_name
    FROM contribution_reports r
    JOIN contributions c ON c.id = r.contribution_id
    LEFT JOIN users u ON u.id = r.reviewed_by
  `;

  if (filters.status) {
    conditions.push('r.status = ?');
    params.push(filters.status);
  }

  if (filters.contributionId) {
    conditions.push('r.contribution_id = ?');
    params.push(filters.contributionId);
  }

  if (filters.reporterId) {
    conditions.push('r.reporter_id = ?');
    params.push(filters.reporterId);
  }

  if (filters.reason) {
    conditions.push('r.reason = ?');
    params.push(filters.reason);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  sql += ` ORDER BY r.created_at DESC`;

  return db.prepare(sql).all(...params);
}

function create(data) {
  const id = data.id || crypto.randomUUID();

  db.prepare(`
    INSERT INTO contribution_reports (
      id,
      contribution_id,
      reporter_id,
      reporter_name,
      reporter_contact,
      reason,
      comment,
      status,
      effect,
      reviewed_by,
      reviewed_at,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.contributionId,
    data.reporterId || null,
    data.reporterName || null,
    data.reporterContact || null,
    data.reason,
    data.comment || null,
    data.status || 'pending',
    data.effect || null,
    data.reviewedBy || null,
    data.reviewedAt || null,
    nowIso()
  );

  return findById(id);
}

const editableFields = {
  status: 'status',
  effect: 'effect',
  reviewedBy: 'reviewed_by',
  reviewedAt: 'reviewed_at',
  comment: 'comment'
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
    UPDATE contribution_reports
    SET ${assignments.join(', ')}
    WHERE id = ?
  `).run(...values);

  if (result.changes === 0) return null;

  return findById(id);
}

// =========================================================
// HANDLERS EXPRESS
// =========================================================

function listReportsHandler(req, res) {
  try {
    const reports = findAll({
      status: req.query.status,
      contributionId: req.query.contribution_id,
      reporterId: req.query.reporter_id,
      reason: req.query.reason
    });

    res.json(reports);
  } catch (error) {
    res.status(500).json({
      error: 'Impossible de charger les signalements'
    });
  }
}

function getReportHandler(req, res) {
  try {
    const report = findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        error: 'Signalement introuvable'
      });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({
      error: 'Impossible de charger le signalement'
    });
  }
}

// =========================================================
// HANDLERS PUBLICS (phase 5)
// =========================================================

const REPORT_REASONS = [
  'false_information',
  'duplicate',
  'personal_data',
  'abusive_content',
  'impersonation',
  'nonexistent_organization',
  'other'
];

function createPublicReportHandler(req, res) {
  try {
    const { reason, comment, reporterName, reporterContact } = req.body;
    const contributionId = req.params.id;

    // La contribution doit exister ET être publiquement visible
    const contribution = contributions.findPublicById(contributionId);
    if (!contribution) {
      return res.status(404).json({ error: 'Contribution introuvable' });
    }

    if (!REPORT_REASONS.includes(reason)) {
      return res.status(400).json({ error: 'Raison de signalement invalide' });
    }

    const user = loadUser(req);

    let reporterId = null;
    let name = null;
    let contact = null;

    if (user) {
      reporterId = user.id;
    } else {
      if (!reporterName || !reporterContact) {
        return res.status(400).json({
          error: 'Nom et moyen de contact requis pour un signalement sans compte'
        });
      }
      name = reporterName.trim();
      contact = reporterContact.trim();
    }

    const report = create({
      contributionId,
      reporterId,
      reporterName: name,
      reporterContact: contact,
      reason,
      comment
    });

    logAudit({
      actorType: 'system',
      action: 'contribution_reported',
      entityType: 'contribution',
      entityId: contributionId,
      metadata: { reportId: report.id, reason }
    });

    res.status(201).json({ id: report.id, status: report.status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossible d’enregistrer le signalement' });
  }
}


// =========================================================
// MODÉRATION (phase 8)
// =========================================================


const REPORT_REASON_LABELS = {
  false_information: 'Information fausse',
  duplicate: 'Doublon',
  personal_data: 'Donnée personnelle',
  abusive_content: 'Contenu abusif',
  impersonation: 'Usurpation',
  nonexistent_organization: 'Organisation inexistante',
  other: 'Autre'
};


// File des signalements : pending d'abord, puis historique récent.
function listModerationReportsHandler(req, res) {
  try {
    const rows = db.prepare(`
      SELECT
        r.id, r.contribution_id, r.reporter_name, r.reporter_contact,
        r.reason, r.comment, r.status, r.effect,
        r.reviewed_by, r.reviewed_at, r.created_at,
        c.organization_name, c.status AS contribution_status,
        c.is_hidden, c.public_visibility, c.moderation_reason
      FROM contribution_reports r
      JOIN contributions c ON c.id = r.contribution_id
      ORDER BY
        CASE r.status WHEN 'pending' THEN 0 ELSE 1 END,
        r.created_at DESC
    `).all();

    res.json(rows.map(r => ({
      ...r,
      reason_label: REPORT_REASON_LABELS[r.reason] || r.reason
    })));
  } catch (error) {
    console.error('listModerationReports:', error.message);
    res.status(500).json({ error: 'Impossible de charger les signalements' });
  }
}

// Clôture un signalement : resolved (action prise) ou dismissed (sans suite).
function reviewReportHandler(req, res) {
  try {
    const { decision, effect } = req.body;

    if (!['resolved', 'dismissed'].includes(decision)) {
      return res.status(400).json({ error: 'Décision invalide' });
    }

    const report = db.prepare('SELECT * FROM contribution_reports WHERE id = ?').get(req.params.id);

if (!report) {
  return res.status(404).json({ error: 'Signalement introuvable' });
}

if (report.status !== 'pending') {
  return res.status(409).json({ error: 'Signalement déjà traité' });
}

    const now = nowIso();
    const effectText = (effect && effect.trim())
      || (decision === 'resolved' ? 'Traité' : 'Aucun');

    db.prepare(`
      UPDATE contribution_reports
      SET status = ?, effect = ?, reviewed_by = ?, reviewed_at = ?
      WHERE id = ?
    `).run(decision, effectText, req.user.id, now, report.id);

    logAudit({
      actorId: req.user.id,
      action: decision === 'resolved' ? 'report_resolved' : 'report_dismissed',
      entityType: 'contribution_report',
      entityId: report.id,
      metadata: { contribution_id: report.contribution_id, effect: effectText }
    });

    res.json({ ok: true, id: report.id, status: decision, effect: effectText });
  } catch (error) {
    console.error('reviewReport:', error.message);
    res.status(500).json({ error: 'Impossible de traiter le signalement' });
  }
}

module.exports = {
  findById,
  findAll,
  create,
  update,
  listReportsHandler,
  getReportHandler,
  createPublicReportHandler,
  listModerationReportsHandler,
  reviewReportHandler
};