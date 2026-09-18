const crypto = require('crypto');
const db = require('../db');
const { nowIso } = require('../helpers');
const { loadUser } = require('../auth');
const { logAudit } = require('../helpers');

// =========================================================
// ACCÈS SQL
// =========================================================

function findById(id) {
  return db.prepare(`
    SELECT
      ctr.*,
      d.name AS department_name,
      c.name AS commune_name,
      s.name AS activity_sector_name
    FROM contributions ctr
    LEFT JOIN departments d ON d.id = ctr.department_id
    LEFT JOIN communes c ON c.id = ctr.commune_id
    LEFT JOIN activity_sectors s ON s.id = ctr.activity_sector_id
    WHERE ctr.id = ?
  `).get(id);
}

function findAll(filters = {}) {
  const conditions = [];
  const params = [];

  let sql = `
    SELECT
      ctr.*,
      d.name AS department_name,
      c.name AS commune_name,
      s.name AS activity_sector_name
    FROM contributions ctr
    LEFT JOIN departments d ON d.id = ctr.department_id
    LEFT JOIN communes c ON c.id = ctr.commune_id
    LEFT JOIN activity_sectors s ON s.id = ctr.activity_sector_id
  `;

  if (filters.status) {
    conditions.push('ctr.status = ?');
    params.push(filters.status);
  }

  if (filters.contributorId) {
    conditions.push('ctr.contributor_id = ?');
    params.push(filters.contributorId);
  }

  if (filters.organizationType) {
    conditions.push('ctr.organization_type = ?');
    params.push(filters.organizationType);
  }

  if (filters.departmentId) {
    conditions.push('ctr.department_id = ?');
    params.push(filters.departmentId);
  }

  if (filters.communeId) {
    conditions.push('ctr.commune_id = ?');
    params.push(filters.communeId);
  }

  if (filters.publicVisibility !== undefined) {
    conditions.push('ctr.public_visibility = ?');
    params.push(filters.publicVisibility ? 1 : 0);
  }

  if (filters.isHidden !== undefined) {
    conditions.push('ctr.is_hidden = ?');
    params.push(filters.isHidden ? 1 : 0);
  }

  if (filters.search) {
    conditions.push(`
      (
        ctr.organization_name LIKE ?
        OR ctr.description LIKE ?
        OR ctr.address LIKE ?
      )
    `);

    const search = `%${filters.search}%`;
    params.push(search, search, search);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  sql += ` ORDER BY ctr.created_at DESC`;

  return db.prepare(sql).all(...params);
}

// Cette fonction sera utilisée par les routes publiques.
// Elle ne retourne jamais les coordonnées privées du contributeur.
function findPublic(filters = {}) {
  const conditions = [
    `ctr.status = 'pending'`,
    `ctr.public_visibility = 1`,
    `ctr.is_hidden = 0`
  ];

  const params = [];

  let sql = `
    SELECT
      ctr.id,
      ctr.organization_name,
      ctr.organization_type,
      ctr.description,
      ctr.department_id,
      ctr.commune_id,
      ctr.neighborhood,
      ctr.address,
      ctr.phone,
      ctr.email,
      ctr.website,
      ctr.activity_sector_id,
      ctr.status,
      ctr.published_at,
      ctr.created_at,
      d.name AS department_name,
      c.name AS commune_name,
      s.name AS activity_sector_name
    FROM contributions ctr
    LEFT JOIN departments d ON d.id = ctr.department_id
    LEFT JOIN communes c ON c.id = ctr.commune_id
    LEFT JOIN activity_sectors s ON s.id = ctr.activity_sector_id
  `;

  if (filters.id) {
    conditions.push('ctr.id = ?');
    params.push(filters.id);
  }

  if (filters.organizationType) {
    conditions.push('ctr.organization_type = ?');
    params.push(filters.organizationType);
  }

  if (filters.communeId) {
    conditions.push('ctr.commune_id = ?');
    params.push(filters.communeId);
  }

  if (filters.search) {
    conditions.push(`
      (
        ctr.organization_name LIKE ?
        OR ctr.description LIKE ?
      )
    `);

    const search = `%${filters.search}%`;
    params.push(search, search);
  }

  sql += ` WHERE ${conditions.join(' AND ')}`;
  sql += ` ORDER BY ctr.created_at DESC`;

  return db.prepare(sql).all(...params);
}

function findPublicById(id) {
  return db.prepare(`
    SELECT
      ctr.id,
      ctr.organization_name,
      ctr.organization_type,
      ctr.description,
      ctr.department_id,
      ctr.commune_id,
      ctr.neighborhood,
      ctr.address,
      ctr.phone,
      ctr.email,
      ctr.website,
      ctr.activity_sector_id,
      ctr.status,
      ctr.published_at,
      ctr.created_at,
      d.name AS department_name,
      c.name AS commune_name,
      s.name AS activity_sector_name
    FROM contributions ctr
    LEFT JOIN departments d ON d.id = ctr.department_id
    LEFT JOIN communes c ON c.id = ctr.commune_id
    LEFT JOIN activity_sectors s ON s.id = ctr.activity_sector_id
    WHERE ctr.id = ?
      AND ctr.status = 'pending'
      AND ctr.public_visibility = 1
      AND ctr.is_hidden = 0
    LIMIT 1
  `).get(id);
}

function create(data) {
  const id = data.id || crypto.randomUUID();
  const currentDate = nowIso();
  const isPublic = data.publicVisibility === false ? 0 : 1;

  db.prepare(`
    INSERT INTO contributions (
      id,
      contributor_id,
      contributor_first_name,
      contributor_last_name,
      contributor_phone,
      organization_name,
      organization_type,
      description,
      department_id,
      commune_id,
      neighborhood,
      address,
      phone,
      email,
      website,
      activity_sector_id,
      status,
      public_visibility,
      is_hidden,
      moderation_reason,
      duplicate_of_organization_id,
      created_organization_id,
      published_at,
      withdrawn_at,
      created_at,
      updated_at
    )
    VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `).run(
    id,
    data.contributorId || null,
    data.contributorFirstName || null,
    data.contributorLastName || null,
    data.contributorPhone || null,
    data.organizationName,
    data.organizationType,
    data.description || null,
    data.departmentId || null,
    data.communeId || null,
    data.neighborhood || null,
    data.address || null,
    data.phone || null,
    data.email || null,
    data.website || null,
    data.activitySectorId || null,
    'pending',
    isPublic,
    0,
    null,
    null,
    null,
    isPublic ? currentDate : null,
    null,
    currentDate,
    null
  );

  return findById(id);
}

const editableFields = {
  organizationName: 'organization_name',
  organizationType: 'organization_type',
  description: 'description',
  departmentId: 'department_id',
  communeId: 'commune_id',
  neighborhood: 'neighborhood',
  address: 'address',
  phone: 'phone',
  email: 'email',
  website: 'website',
  activitySectorId: 'activity_sector_id',
  status: 'status',
  publicVisibility: 'public_visibility',
  isHidden: 'is_hidden',
  moderationReason: 'moderation_reason',
  duplicateOfOrganizationId: 'duplicate_of_organization_id',
  createdOrganizationId: 'created_organization_id',
  publishedAt: 'published_at',
  withdrawnAt: 'withdrawn_at'
};

function update(id, changes) {
  const assignments = [];
  const values = [];

  for (const [inputName, columnName] of Object.entries(editableFields)) {
    if (!Object.prototype.hasOwnProperty.call(changes, inputName)) {
      continue;
    }

    let value = changes[inputName];

    if (inputName === 'publicVisibility' || inputName === 'isHidden') {
      value = value ? 1 : 0;
    }

    assignments.push(`${columnName} = ?`);
    values.push(value);
  }

  if (assignments.length === 0) {
    return findById(id);
  }

  assignments.push('updated_at = ?');
  values.push(nowIso(), id);

  const result = db.prepare(`
    UPDATE contributions
    SET ${assignments.join(', ')}
    WHERE id = ?
  `).run(...values);

  if (result.changes === 0) return null;

  return findById(id);
}

function findReviews(contributionId) {
  return db.prepare(`
    SELECT
      cr.*,
      u.first_name AS reviewer_first_name,
      u.last_name AS reviewer_last_name
    FROM contribution_reviews cr
    JOIN users u ON u.id = cr.reviewer_id
    WHERE cr.contribution_id = ?
    ORDER BY cr.created_at DESC
  `).all(contributionId);
}

// =========================================================
// HANDLERS EXPRESS
// =========================================================

function listContributionsHandler(req, res) {
  try {
    const contributions = findAll({
      status: req.query.status,
      contributorId: req.query.contributor_id,
      organizationType: req.query.organization_type,
      departmentId: req.query.department_id,
      communeId: req.query.commune_id,
      search: req.query.search
    });

    res.json(contributions);
  } catch (error) {
    res.status(500).json({
      error: 'Impossible de charger les contributions'
    });
  }
}

function getContributionHandler(req, res) {
  try {
    const contribution = findById(req.params.id);

    if (!contribution) {
      return res.status(404).json({
        error: 'Contribution introuvable'
      });
    }

    res.json({
      ...contribution,
      reviews: findReviews(contribution.id)
    });
  } catch (error) {
    res.status(500).json({
      error: 'Impossible de charger la contribution'
    });
  }
}

// =========================================================
// HANDLERS PUBLICS (phase 5)
// =========================================================

const ORGANIZATION_TYPES = ['private_profit', 'private_nonprofit', 'public'];

// Liste publique : pending + visibles + non masquées (règle §9.3)
function listPublicContributionsHandler(req, res) {
  try {
    const contributions = findPublic({
      search: req.query.search,
      communeId: req.query.commune_id,
      organizationType: req.query.type
    });

    res.json(contributions);
  } catch (error) {
    res.status(500).json({ error: 'Impossible de charger les contributions' });
  }
}

function getPublicContributionHandler(req, res) {
  try {
    const contribution = findPublicById(req.params.id);

    if (!contribution) {
      return res.status(404).json({ error: 'Contribution introuvable' });
    }

    res.json(contribution); // déjà épuré : aucune coordonnée contributeur
  } catch (error) {
    res.status(500).json({ error: 'Impossible de charger la contribution' });
  }
}

function createPublicContributionHandler(req, res) {
  try {
    const {
      organizationName,
      organizationType,
      description,
      departmentId,
      communeId,
      neighborhood,
      address,
      phone,
      email,
      website,
      activitySectorId,
      publicVisibility,
      contributorFirstName,
      contributorLastName,
      contributorPhone,
      consent
    } = req.body;

    // --- Validation serveur ---
    if (!organizationName || !organizationName.trim()) {
      return res.status(400).json({ error: 'Le nom de l’organisation est requis' });
    }

    if (!ORGANIZATION_TYPES.includes(organizationType)) {
      return res.status(400).json({ error: 'Type d’organisation invalide' });
    }

    // Consentement explicite requis (§8.3)
    if (consent !== true) {
      return res.status(400).json({ error: 'Vous devez confirmer avoir été informé avant l’envoi' });
    }

    const user = loadUser(req);

    let contributorId = null;
    let firstName = null;
    let lastName = null;
    let phoneContrib = null;

    if (user) {
      // Connecté : on lie le compte, jamais l'identité saisie
      contributorId = user.id;
    } else {
      // Anonyme : identité privée requise (jamais affichée publiquement)
      if (!contributorFirstName || !contributorLastName || !contributorPhone) {
        return res.status(400).json({
          error: 'Prénom, nom et téléphone du contributeur requis pour une contribution sans compte'
        });
      }
      firstName = contributorFirstName.trim();
      lastName = contributorLastName.trim();
      phoneContrib = contributorPhone.trim();
    }

    // Cohérence géographique (règle §11) : la commune doit appartenir au département
    if (communeId && departmentId) {
      const commune = db.prepare(`
        SELECT id FROM communes WHERE id = ? AND department_id = ?
      `).get(communeId, departmentId);

      if (!commune) {
        return res.status(400).json({ error: 'La commune ne correspond pas au département indiqué' });
      }
    }

    const isPublic = publicVisibility !== false; // défaut : visible (règle §9.3)

    const contribution = create({
      contributorId,
      contributorFirstName: firstName,
      contributorLastName: lastName,
      contributorPhone: phoneContrib,
      organizationName: organizationName.trim(),
      organizationType,
      description,
      departmentId,
      communeId,
      neighborhood,
      address,
      phone,
      email,
      website,
      activitySectorId,
      publicVisibility: isPublic
    });

    // Traçabilité (§27)
    logAudit({
      actorType: 'system',
      action: isPublic ? 'contribution_pre_published' : 'contribution_submitted_private',
      entityType: 'contribution',
      entityId: contribution.id,
      metadata: { connected: Boolean(user) }
    });

    // Réponse épurée : mêmes champs que findPublicById, jamais l'identité
    res.status(201).json(findPublicById(contribution.id) || { id: contribution.id, status: 'pending' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossible d’enregistrer la contribution' });
  }
}
// =========================================================
// ESPACE CONTRIBUTEUR (phase 6)
// L'utilisateur ne voit QUE SES contributions.
// C'est le seul contexte où contributor_* est exposé.
// =========================================================

// Liste "Mes contributions" — colonnes conformes au schéma réel.
function listMyContributionsHandler(req, res) {
  try {
    const userId = req.user.id;
    const rows = db.prepare(`
      SELECT
        c.id,
        c.organization_name,
        c.organization_type,
        c.status,
        c.public_visibility,
        c.is_hidden,
        c.moderation_reason,
        c.duplicate_of_organization_id,
        c.created_organization_id,
        c.published_at,
        c.withdrawn_at,
        c.created_at
      FROM contributions c
      WHERE c.contributor_id = ?
      ORDER BY c.created_at DESC
    `).all(userId);

    // Enrichissement : nom de l'org créée / dupliquée si présent
    const enriched = rows.map((row) => {
      const out = { ...row };

      if (row.created_organization_id) {
        const org = db.prepare(
          'SELECT id, name FROM organizations WHERE id = ?'
        ).get(row.created_organization_id);
        out.resulting_organization = org ? { id: org.id, name: org.name } : null;
      }

      if (row.duplicate_of_organization_id) {
        const dup = db.prepare(
          'SELECT id, name FROM organizations WHERE id = ?'
        ).get(row.duplicate_of_organization_id);
        out.duplicate_of_organization = dup ? { id: dup.id, name: dup.name } : null;
      }

      return out;
    });

    res.json(enriched);
  } catch (error) {
    console.error('listMyContributions:', error.message);
    res.status(500).json({ error: 'Impossible de charger vos contributions' });
  }
}

// Détail d'UNE de SES contributions (contributor_* visible : c'est lui)
function getMyContributionHandler(req, res) {
  try {
    const contribution = findById(req.params.id);

    // 404 uniforme : qu'elle n'existe pas ou qu'elle ne soit pas à lui
    if (!contribution || contribution.contributor_id !== req.user.id) {
      return res.status(404).json({ error: 'Contribution introuvable' });
    }

        // Enrichissement orgs liées
    const out = { ...contribution };
    if (contribution.created_organization_id) {
      const org = db.prepare('SELECT id, name, status FROM organizations WHERE id = ?')
        .get(contribution.created_organization_id);
      out.resulting_organization = org || null;
    }
    if (contribution.duplicate_of_organization_id) {
      const dup = db.prepare('SELECT id, name FROM organizations WHERE id = ?')
        .get(contribution.duplicate_of_organization_id);
      out.duplicate_of_organization = dup || null;
    }

    res.json(out);
  } catch (error) {
    res.status(500).json({ error: 'Impossible de charger la contribution' });
  }
}


// =========================================================
// MODÉRATION — masquage (phase 8)
// =========================================================

function hideContributionHandler(req, res) {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Le motif de masquage est obligatoire' });
    }

    const contribution = db.prepare(
      'SELECT id, is_hidden, organization_name FROM contributions WHERE id = ?'
    ).get(req.params.id);

    if (!contribution) {
      return res.status(404).json({ error: 'Contribution introuvable' });
    }
    if (contribution.is_hidden === 1) {
      return res.status(409).json({ error: 'Cette contribution est déjà masquée' });
    }

    const now = nowIso();
    db.prepare(`
      UPDATE contributions
      SET is_hidden = 1, moderation_reason = ?, withdrawn_at = ?, updated_at = ?
      WHERE id = ?
    `).run(reason.trim(), now, now, contribution.id);

    logAudit({
      actorId: req.user.id,
      action: 'contribution_hidden',
      entityType: 'contribution',
      entityId: contribution.id,
      metadata: { reason: reason.trim() }
    });

    res.json({ ok: true, id: contribution.id, is_hidden: 1 });
  } catch (error) {
    console.error('hideContribution:', error.message);
    res.status(500).json({ error: 'Impossible de masquer la contribution' });
  }
}

function restoreContributionHandler(req, res) {
  try {
    const contribution = db.prepare(
      'SELECT id, is_hidden FROM contributions WHERE id = ?'
    ).get(req.params.id);

    if (!contribution) {
      return res.status(404).json({ error: 'Contribution introuvable' });
    }
    if (contribution.is_hidden === 0) {
      return res.status(409).json({ error: 'Cette contribution n’est pas masquée' });
    }

    const now = nowIso();
    db.prepare(`
      UPDATE contributions
      SET is_hidden = 0, moderation_reason = NULL, withdrawn_at = NULL, updated_at = ?
      WHERE id = ?
    `).run(now, contribution.id);

    logAudit({
      actorId: req.user.id,
      action: 'contribution_restored',
      entityType: 'contribution',
      entityId: contribution.id,
      metadata: {}
    });

    res.json({ ok: true, id: contribution.id, is_hidden: 0 });
  } catch (error) {
    console.error('restoreContribution:', error.message);
    res.status(500).json({ error: 'Impossible de restaurer la contribution' });
  }
}

module.exports = {
  findById,
  findAll,
  findPublic,
  findPublicById,
  create,
  update,
  findReviews,
  listContributionsHandler,
  getContributionHandler,
  listPublicContributionsHandler,
  getPublicContributionHandler,
  createPublicContributionHandler,
  listMyContributionsHandler,
  getMyContributionHandler,
  hideContributionHandler,
  restoreContributionHandler
};