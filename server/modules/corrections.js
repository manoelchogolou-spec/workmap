const crypto = require('crypto');
const db = require('../db');
const { nowIso } = require('../helpers');
const { loadUser } = require('../auth');
const { logAudit } = require('../helpers');
const organizations = require('./organizations');

// =========================================================
// ACCÈS SQL
// =========================================================

function findById(id) {
  return db.prepare(`
    SELECT
      cr.*,
      o.name AS organization_name,
      reviewer.first_name AS reviewer_first_name,
      reviewer.last_name AS reviewer_last_name
    FROM correction_requests cr
    JOIN organizations o ON o.id = cr.organization_id
    LEFT JOIN users reviewer ON reviewer.id = cr.reviewed_by
    WHERE cr.id = ?
  `).get(id);
}

function findAll(filters = {}) {
  const conditions = [];
  const params = [];

  let sql = `
    SELECT
      cr.*,
      o.name AS organization_name,
      reviewer.first_name AS reviewer_first_name,
      reviewer.last_name AS reviewer_last_name
    FROM correction_requests cr
    JOIN organizations o ON o.id = cr.organization_id
    LEFT JOIN users reviewer ON reviewer.id = cr.reviewed_by
  `;

  if (filters.status) {
    conditions.push('cr.status = ?');
    params.push(filters.status);
  }

  if (filters.organizationId) {
    conditions.push('cr.organization_id = ?');
    params.push(filters.organizationId);
  }

  if (filters.requesterId) {
    conditions.push('cr.requester_id = ?');
    params.push(filters.requesterId);
  }

  if (filters.fieldName) {
    conditions.push('cr.field_name = ?');
    params.push(filters.fieldName);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  sql += ` ORDER BY cr.created_at DESC`;

  return db.prepare(sql).all(...params);
}

function create(data) {
  const id = data.id || crypto.randomUUID();

  db.prepare(`
    INSERT INTO correction_requests (
      id,
      organization_id,
      requester_id,
      submitter_name,
      submitter_contact,
      field_name,
      old_value,
      proposed_value,
      reason,
      status,
      reviewed_by,
      reviewed_at,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.organizationId,
    data.requesterId || null,
    data.submitterName || null,
    data.submitterContact || null,
    data.fieldName,
    data.oldValue || null,
    data.proposedValue,
    data.reason || null,
    data.status || 'pending',
    data.reviewedBy || null,
    data.reviewedAt || null,
    nowIso()
  );

  return findById(id);
}

const editableFields = {
  proposedValue: 'proposed_value',
  reason: 'reason',
  status: 'status',
  reviewedBy: 'reviewed_by',
  reviewedAt: 'reviewed_at'
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
    UPDATE correction_requests
    SET ${assignments.join(', ')}
    WHERE id = ?
  `).run(...values);

  if (result.changes === 0) return null;

  return findById(id);
}

function findAttachments(correctionRequestId) {
  return db.prepare(`
    SELECT
      id,
      file_name,
      file_path,
      mime_type,
      uploaded_at
    FROM attachments
    WHERE correction_request_id = ?
    ORDER BY uploaded_at DESC
  `).all(correctionRequestId);
}

// =========================================================
// HANDLERS EXPRESS
// =========================================================

function listCorrectionsHandler(req, res) {
  try {
    const corrections = findAll({
      status: req.query.status,
      organizationId: req.query.organization_id,
      requesterId: req.query.requester_id,
      fieldName: req.query.field_name
    });

    res.json(corrections);
  } catch (error) {
    res.status(500).json({
      error: 'Impossible de charger les corrections'
    });
  }
}

function getCorrectionHandler(req, res) {
  try {
    const correction = findById(req.params.id);

    if (!correction) {
      return res.status(404).json({
        error: 'Demande de correction introuvable'
      });
    }

    res.json({
      ...correction,
      attachments: findAttachments(correction.id)
    });
  } catch (error) {
    res.status(500).json({
      error: 'Impossible de charger la correction'
    });
  }
}

// =========================================================
// HANDLERS PUBLICS (phase 5)
// =========================================================

// Champs que le public peut proposer de corriger.
// status / publishedAt volontairement interdits.
const CORRECTABLE_FIELDS = [
  'name',
  'description',
  'neighborhood',
  'address',
  'phone',
  'email',
  'website'
];

// Colonne SQL correspondant à chaque champ corrigeable
const FIELD_COLUMNS = {
  name: 'name',
  description: 'description',
  neighborhood: 'neighborhood',
  address: 'address',
  phone: 'phone',
  email: 'email',
  website: 'website'
};

function createPublicCorrectionHandler(req, res) {
  try {
    const {
      fieldName,
      proposedValue,
      reason,
      submitterName,
      submitterContact
    } = req.body;

    const organizationId = req.params.id;

    // L'organisation doit exister ET être published
    const organization = organizations.findById(organizationId);
    if (!organization || organization.status !== 'published') {
      return res.status(404).json({ error: 'Organisation introuvable' });
    }

    if (!CORRECTABLE_FIELDS.includes(fieldName)) {
      return res.status(400).json({ error: 'Champ à corriger invalide' });
    }

    if (!proposedValue || !String(proposedValue).trim()) {
      return res.status(400).json({ error: 'La valeur proposée est requise' });
    }

    // Règle §27 : old_value lu depuis la base, JAMAIS depuis le client
    const oldValue = organization[FIELD_COLUMNS[fieldName]] || null;

    const user = loadUser(req);

    let requesterId = null;
    let name = null;
    let contact = null;

    if (user) {
      requesterId = user.id;
    } else {
      if (!submitterName || !submitterContact) {
        return res.status(400).json({
          error: 'Nom et moyen de contact requis pour une demande sans compte'
        });
      }
      name = submitterName.trim();
      contact = submitterContact.trim();
    }

    const correction = create({
      organizationId,
      requesterId,
      submitterName: name,
      submitterContact: contact,
      fieldName,
      oldValue,
      proposedValue: String(proposedValue).trim(),
      reason
    });

    logAudit({
      actorType: 'system',
      action: 'correction_requested',
      entityType: 'correction_request',
      entityId: correction.id,
      metadata: { organizationId, fieldName }
    });

    res.status(201).json({ id: correction.id, status: correction.status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossible d’enregistrer la demande de correction' });
  }
}

// =========================================================
// MODÉRATION DES CORRECTIONS (phase 8)
// =========================================================

// Champs d'organizations modifiables par correction.
// Liste blanche stricte : jamais de champ injecté par le client.

function listModerationCorrectionsHandler(req, res) {
  try {
    const rows = db.prepare(`
      SELECT
        cr.id, cr.organization_id, cr.submitter_name, cr.submitter_contact,
        cr.field_name, cr.old_value, cr.proposed_value, cr.reason,
        cr.status, cr.reviewed_by, cr.reviewed_at, cr.created_at,
        o.name AS organization_name, o.status AS organization_status
      FROM correction_requests cr
      JOIN organizations o ON o.id = cr.organization_id
      ORDER BY
        CASE cr.status WHEN 'pending' THEN 0 ELSE 1 END,
        cr.created_at DESC
    `).all();

    // Valeur actuelle réelle en base (peut différer de old_value figé)
    const enriched = rows.map(r => {
      let current = null;
      if (CORRECTABLE_FIELDS.includes(r.field_name)) {
        const org = db.prepare(
          `SELECT ${r.field_name} AS v FROM organizations WHERE id = ?`
        ).get(r.organization_id);
        current = org ? org.v : null;
      }
      return { ...r, current_value: current };
    });

    res.json(enriched);
  } catch (error) {
    console.error('listModerationCorrections:', error.message);
    res.status(500).json({ error: 'Impossible de charger les corrections' });
  }
}

// Approbation : transaction unique.
// 1. relire la valeur ACTUELLE  2. UPDATE organizations
// 3. INSERT organization_changes  4. correction -> approved
function approveCorrectionHandler(req, res) {
  try {
    const correction = db.prepare(
      'SELECT * FROM correction_requests WHERE id = ?'
    ).get(req.params.id);

    if (!correction) {
      return res.status(404).json({ error: 'Demande introuvable' });
    }
    if (correction.status !== 'pending') {
      return res.status(409).json({ error: 'Cette demande a déjà été traitée' });
    }
    if (!CORRECTABLE_FIELDS.includes(correction.field_name)) {
      return res.status(400).json({
        error: 'Champ non modifiable par correction : ' + correction.field_name
      });
    }

    const organization = db.prepare(
      'SELECT * FROM organizations WHERE id = ?'
    ).get(correction.organization_id);

    if (!organization) {
      return res.status(404).json({ error: 'Organisation introuvable' });
    }

    const field = correction.field_name;
    const oldValue = organization[field];
    const newValue = correction.proposed_value;
    const now = nowIso();
    const changeId = crypto.randomUUID();

    const apply = db.transaction(() => {
      db.prepare(
        `UPDATE organizations SET ${field} = ?, updated_at = ? WHERE id = ?`
      ).run(newValue, now, organization.id);

      db.prepare(`
        INSERT INTO organization_changes (
          id, organization_id, field_name, old_value, new_value,
          changed_by, source, reason, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'correction', ?, ?)
      `).run(
        changeId, organization.id, field,
        oldValue, newValue, req.user.id,
        correction.reason || null, now
      );

      db.prepare(`
        UPDATE correction_requests
        SET status = 'approved', reviewed_by = ?, reviewed_at = ?
        WHERE id = ?
      `).run(req.user.id, now, correction.id);
    });

    apply();

    logAudit({
      actorId: req.user.id,
      action: 'correction_approved',
      entityType: 'correction_request',
      entityId: correction.id,
      metadata: {
        organization_id: organization.id,
        field_name: field,
        old_value: oldValue,
        new_value: newValue,
        change_id: changeId
      }
    });

    res.json({
      ok: true,
      id: correction.id,
      status: 'approved',
      field_name: field,
      old_value: oldValue,
      new_value: newValue
    });
  } catch (error) {
    console.error('approveCorrection:', error.message);
    res.status(500).json({ error: 'Impossible d’approuver la correction' });
  }
}

function rejectCorrectionHandler(req, res) {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Le motif de refus est obligatoire' });
    }

    const correction = db.prepare(
      'SELECT * FROM correction_requests WHERE id = ?'
    ).get(req.params.id);

    if (!correction) {
      return res.status(404).json({ error: 'Demande introuvable' });
    }
    if (correction.status !== 'pending') {
      return res.status(409).json({ error: 'Cette demande a déjà été traitée' });
    }

    const now = nowIso();
    db.prepare(`
      UPDATE correction_requests
      SET status = 'rejected', reviewed_by = ?, reviewed_at = ?
      WHERE id = ?
    `).run(req.user.id, now, correction.id);

    logAudit({
      actorId: req.user.id,
      action: 'correction_rejected',
      entityType: 'correction_request',
      entityId: correction.id,
      metadata: {
        organization_id: correction.organization_id,
        field_name: correction.field_name,
        reason: reason.trim()
      }
    });

    res.json({ ok: true, id: correction.id, status: 'rejected' });
  } catch (error) {
    console.error('rejectCorrection:', error.message);
    res.status(500).json({ error: 'Impossible de refuser la correction' });
  }
}

module.exports = {
  findById,
  findAll,
  create,
  update,
  findAttachments,
  listCorrectionsHandler,
  getCorrectionHandler,
  createPublicCorrectionHandler,
  rejectCorrectionHandler,
  approveCorrectionHandler,
  listModerationCorrectionsHandler
};