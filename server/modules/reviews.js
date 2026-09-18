const crypto = require('crypto');
const db = require('../db');
const { nowIso, logAudit } = require('../helpers');
const organizations = require('./organizations');
const contributions = require('./contributions');
const verifications = require('./verifications');

// =========================================================
// FILE D'EXAMEN
// Règle : status = 'pending' ET is_hidden = 0.
// public_visibility n'entre PAS dans le filtre : une contribution
// non prépubliée doit quand même être examinée.
// Les contributions masquées relèvent de la modération (phase 8).
// =========================================================

function findQueue() {
  return db.prepare(`
    SELECT
      c.id,
      c.organization_name,
      c.organization_type,
      c.status,
      c.public_visibility,
      c.created_at,
      d.name AS department_name,
      cm.name AS commune_name
    FROM contributions c
    LEFT JOIN departments d ON d.id = c.department_id
    LEFT JOIN communes cm ON cm.id = c.commune_id
    WHERE c.status = 'pending'
      AND c.is_hidden = 0
    ORDER BY c.created_at ASC
  `).all();
}

// Détail d'examen : contexte INTERNE, les coordonnées du contributeur
// sont volontairement exposées ici (et nulle part ailleurs).
function findForReview(id) {
  const contribution = contributions.findById(id);
  if (!contribution) return null;

  return {
    ...contribution,
    reviews: contributions.findReviews(id)
  };
}

// =========================================================
// GARDE COMMUNE
// Une contribution déjà décidée ne peut plus être re-décidée.
// =========================================================

function loadDecidable(id) {
  const contribution = contributions.findById(id);

  if (!contribution) {
    return { error: { status: 404, message: 'Contribution introuvable' } };
  }

  if (contribution.is_hidden === 1) {
    return {
      error: {
        status: 409,
        message: 'Contribution masquée : elle relève de la modération'
      }
    };
  }

  if (contribution.status !== 'pending') {
    return {
      error: {
        status: 409,
        message: `Contribution déjà traitée (statut : ${contribution.status})`
      }
    };
  }

  return { contribution };
}

function insertReview({ contributionId, reviewerId, decision, linkedOrganizationId, comment }) {
  db.prepare(`
    INSERT INTO contribution_reviews (
      id, contribution_id, reviewer_id, decision,
      linked_organization_id, comment, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    contributionId,
    reviewerId,
    decision,
    linkedOrganizationId || null,
    comment || null,
    nowIso()
  );
}

// =========================================================
// HANDLERS
// =========================================================

function listQueueHandler(req, res) {
  try {
    res.json(findQueue());
  } catch (error) {
    console.error('listQueue:', error.message);
    res.status(500).json({ error: 'Impossible de charger la file d’examen' });
  }
}

function getForReviewHandler(req, res) {
  try {
    const contribution = findForReview(req.params.id);

    if (!contribution) {
      return res.status(404).json({ error: 'Contribution introuvable' });
    }

    res.json(contribution);
  } catch (error) {
    console.error('getForReview:', error.message);
    res.status(500).json({ error: 'Impossible de charger la contribution' });
  }
}

// --- VALIDER -------------------------------------------------
// Une seule transaction : organisation publiée + contribution
// validée + review + audit. Publication = effet de la validation.
function validateHandler(req, res) {
  try {
    const { contribution, error } = loadDecidable(req.params.id);
    if (error) return res.status(error.status).json({ error: error.message });

    const comment = (req.body.comment || '').trim() || null;
    const specialization = req.body.specialization || {};
    const verification = req.body.verification || null;

    const run = db.transaction(() => {
      const now = nowIso();

      // 1. Organisation officielle, directement publiée
      const organization = organizations.createComplete({
        name: contribution.organization_name,
        type: contribution.organization_type,
        description: contribution.description,
        departmentId: contribution.department_id,
        communeId: contribution.commune_id,
        neighborhood: contribution.neighborhood,
        address: contribution.address,
        phone: contribution.phone,
        email: contribution.email,
        website: contribution.website,
        status: 'published',
        publishedAt: now,
        specialization: {
          activitySectorId: contribution.activity_sector_id,
          ...specialization
        }
      });

      // 2. La contribution devient validée et sort de l'espace public
      contributions.update(contribution.id, {
        status: 'validated',
        createdOrganizationId: organization.id,
        publicVisibility: false,
        withdrawnAt: now
      });

      // 3. Trace de la décision
      insertReview({
        contributionId: contribution.id,
        reviewerId: req.user.id,
        decision: 'validated',
        linkedOrganizationId: organization.id,
        comment
      });

      // 4. Vérification optionnelle saisie au moment de l'examen
      if (verification && verification.status) {
        verifications.create({
          organizationId: organization.id,
          fieldName: verification.fieldName || null,
          verifierId: req.user.id,
          status: verification.status,
          method: verification.method || null
        });
      }

      return organization;
    });

    const organization = run();

    logAudit({
      actorId: req.user.id,
      action: 'contribution_validated',
      entityType: 'contribution',
      entityId: contribution.id,
      newData: { organizationId: organization.id }
    });

    res.json({
      ok: true,
      contributionId: contribution.id,
      organization: { id: organization.id, name: organization.name }
    });
  } catch (error) {
    console.error('validate:', error.message);
    res.status(500).json({ error: 'Impossible de valider la contribution' });
  }
}

// --- REJETER -------------------------------------------------
function rejectHandler(req, res) {
  try {
    const { contribution, error } = loadDecidable(req.params.id);
    if (error) return res.status(error.status).json({ error: error.message });

    const reason = (req.body.reason || '').trim();
    if (!reason) {
      return res.status(400).json({ error: 'Le motif de rejet est obligatoire' });
    }

    const run = db.transaction(() => {
      const now = nowIso();

      contributions.update(contribution.id, {
        status: 'rejected',
        moderationReason: reason,
        publicVisibility: false,
        withdrawnAt: now
      });

      insertReview({
        contributionId: contribution.id,
        reviewerId: req.user.id,
        decision: 'rejected',
        comment: reason
      });
    });

    run();

    logAudit({
      actorId: req.user.id,
      action: 'contribution_rejected',
      entityType: 'contribution',
      entityId: contribution.id,
      newData: { reason }
    });

    res.json({ ok: true, contributionId: contribution.id });
  } catch (error) {
    console.error('reject:', error.message);
    res.status(500).json({ error: 'Impossible de rejeter la contribution' });
  }
}

// --- DOUBLON -------------------------------------------------
// Aucune organisation n'est créée : on rattache à l'existante.
function duplicateHandler(req, res) {
  try {
    const { contribution, error } = loadDecidable(req.params.id);
    if (error) return res.status(error.status).json({ error: error.message });

    const organizationId = (req.body.organizationId || '').trim();
    if (!organizationId) {
      return res.status(400).json({
        error: 'L’identifiant de l’organisation existante est obligatoire'
      });
    }

    const target = db.prepare(
      'SELECT id, name FROM organizations WHERE id = ?'
    ).get(organizationId);

    if (!target) {
      return res.status(400).json({ error: 'Organisation cible introuvable' });
    }

    const comment = (req.body.comment || '').trim() || null;

    const run = db.transaction(() => {
      const now = nowIso();

      contributions.update(contribution.id, {
        status: 'duplicate',
        duplicateOfOrganizationId: target.id,
        publicVisibility: false,
        withdrawnAt: now
      });

      insertReview({
        contributionId: contribution.id,
        reviewerId: req.user.id,
        decision: 'duplicate',
        linkedOrganizationId: target.id,
        comment
      });
    });

    run();

    logAudit({
      actorId: req.user.id,
      action: 'duplicate_identified',
      entityType: 'contribution',
      entityId: contribution.id,
      newData: { organizationId: target.id }
    });

    res.json({
      ok: true,
      contributionId: contribution.id,
      organization: { id: target.id, name: target.name }
    });
  } catch (error) {
    console.error('duplicate:', error.message);
    res.status(500).json({ error: 'Impossible de marquer le doublon' });
  }
}

// --- VÉRIFICATION AUTONOME -----------------------------------
// field_name absent ou vide => vérification globale (NULL).
const VERIFICATION_STATUSES = ['pending', 'verified', 'rejected'];

function createVerificationHandler(req, res) {
  try {
    const organization = db.prepare(
      'SELECT id FROM organizations WHERE id = ?'
    ).get(req.params.id);

    if (!organization) {
      return res.status(404).json({ error: 'Organisation introuvable' });
    }

    const { status, fieldName, method } = req.body;

    if (!VERIFICATION_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Statut de vérification invalide' });
    }

    const verification = verifications.create({
      organizationId: organization.id,
      fieldName: fieldName && fieldName.trim() ? fieldName.trim() : null,
      verifierId: req.user.id,
      status,
      method: method || null
    });

    logAudit({
      actorId: req.user.id,
      action: 'verification_recorded',
      entityType: 'organization',
      entityId: organization.id,
      newData: { verificationId: verification.id, status, fieldName: verification.field_name }
    });

    res.status(201).json(verification);
  } catch (error) {
    console.error('createVerification:', error.message);
    res.status(500).json({ error: 'Impossible d’enregistrer la vérification' });
  }
}

module.exports = {
  findQueue,
  findForReview,
  listQueueHandler,
  getForReviewHandler,
  validateHandler,
  rejectHandler,
  duplicateHandler,
  createVerificationHandler
};