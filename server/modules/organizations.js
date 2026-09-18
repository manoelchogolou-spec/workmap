const crypto = require('crypto');
const db = require('../db');
const { nowIso, logAudit } = require('../helpers');

// =========================================================
// ACCÈS SQL
// =========================================================

function findById(id) {
  const organization = db.prepare(`
    SELECT
      o.*,
      d.name AS department_name,
      c.name AS commune_name
    FROM organizations o
    LEFT JOIN departments d ON d.id = o.department_id
    LEFT JOIN communes c ON c.id = o.commune_id
    WHERE o.id = ?
  `).get(id);

  if (!organization) return null;

  let specialization = null;

  if (organization.type === 'private_profit') {
    specialization = db.prepare(`
      SELECT
        opp.*,
        s.name AS activity_sector_name
      FROM organization_private_profit opp
      LEFT JOIN activity_sectors s ON s.id = opp.activity_sector_id
      WHERE opp.organization_id = ?
    `).get(id);
  }

  if (organization.type === 'private_nonprofit') {
    specialization = db.prepare(`
      SELECT
        opn.*,
        s.name AS activity_sector_name
      FROM organization_private_nonprofit opn
      LEFT JOIN activity_sectors s ON s.id = opn.activity_sector_id
      WHERE opn.organization_id = ?
    `).get(id);
  }

  if (organization.type === 'public') {
    specialization = db.prepare(`
      SELECT *
      FROM organization_public
      WHERE organization_id = ?
    `).get(id);
  }

  return {
    ...organization,
    specialization: specialization || null
  };
}

function findAll(filters = {}) {
  const conditions = [];
  const params = [];

  let sql = `
    SELECT
      o.*,
      d.name AS department_name,
      c.name AS commune_name
    FROM organizations o
    LEFT JOIN departments d ON d.id = o.department_id
    LEFT JOIN communes c ON c.id = o.commune_id
  `;

  if (filters.status) {
    conditions.push('o.status = ?');
    params.push(filters.status);
  }

  if (filters.type) {
    conditions.push('o.type = ?');
    params.push(filters.type);
  }

  if (filters.departmentId) {
    conditions.push('o.department_id = ?');
    params.push(filters.departmentId);
  }

  if (filters.communeId) {
    conditions.push('o.commune_id = ?');
    params.push(filters.communeId);
  }

  if (filters.search) {
    conditions.push(`
      (
        o.name LIKE ?
        OR o.description LIKE ?
        OR o.address LIKE ?
      )
    `);

    const search = `%${filters.search}%`;
    params.push(search, search, search);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  sql += ` ORDER BY o.name ASC`;

  return db.prepare(sql).all(...params);
}

function create(data) {
  const id = data.id || crypto.randomUUID();
  const currentDate = nowIso();

  db.prepare(`
    INSERT INTO organizations (
      id,
      name,
      type,
      description,
      department_id,
      commune_id,
      neighborhood,
      address,
      phone,
      email,
      website,
      status,
      created_at,
      updated_at,
      published_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name,
    data.type,
    data.description || null,
    data.departmentId || null,
    data.communeId || null,
    data.neighborhood || null,
    data.address || null,
    data.phone || null,
    data.email || null,
    data.website || null,
    data.status || 'draft',
    currentDate,
    currentDate,
    data.publishedAt || null
  );

  return findById(id);
}

const editableFields = {
  name: 'name',
  description: 'description',
  departmentId: 'department_id',
  communeId: 'commune_id',
  neighborhood: 'neighborhood',
  address: 'address',
  phone: 'phone',
  email: 'email',
  website: 'website',
  status: 'status',
  publishedAt: 'published_at'
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

  assignments.push('updated_at = ?');
  values.push(nowIso(), id);

  const result = db.prepare(`
    UPDATE organizations
    SET ${assignments.join(', ')}
    WHERE id = ?
  `).run(...values);

  if (result.changes === 0) return null;

  return findById(id);
}

function createSpecialization(organizationId, type, data = {}) {
  const id = crypto.randomUUID();

  if (type === 'private_profit') {
    db.prepare(`
      INSERT INTO organization_private_profit (
        id,
        organization_id,
        ifu,
        rccm,
        legal_form,
        activity_sector_id
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      organizationId,
      data.ifu || null,
      data.rccm || null,
      data.legalForm || null,
      data.activitySectorId || null
    );

    return;
  }

  if (type === 'private_nonprofit') {
    db.prepare(`
      INSERT INTO organization_private_nonprofit (
        id,
        organization_id,
        raf_number,
        ifu,
        organization_form,
        activity_sector_id,
        promoter_name,
        promoter_phone,
        promoter_email
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      organizationId,
      data.rafNumber || null,
      data.ifu || null,
      data.organizationForm || null,
      data.activitySectorId || null,
      data.promoterName || null,
      data.promoterPhone || null,
      data.promoterEmail || null
    );

    return;
  }

  if (type === 'public') {
    db.prepare(`
      INSERT INTO organization_public (
        id,
        organization_id,
        creation_act,
        creation_act_reference,
        creation_date
      )
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id,
      organizationId,
      data.creationAct || null,
      data.creationActReference || null,
      data.creationDate || null
    );
  }
}

// Création atomique de l’organisation et de sa spécialisation.
function createComplete(data) {
  const transaction = db.transaction(() => {
    const organization = create(data);

    createSpecialization(
      organization.id,
      organization.type,
      data.specialization
    );

    return findById(organization.id);
  });

  return transaction();
}

// =========================================================
// HANDLERS EXPRESS
// =========================================================

function listOrganizationsHandler(req, res) {
  try {
    const organizations = findAll({
      status: req.query.status,
      type: req.query.type,
      departmentId: req.query.department_id,
      communeId: req.query.commune_id,
      search: req.query.search
    });

    res.json(organizations);
  } catch (error) {
    res.status(500).json({
      error: 'Impossible de charger les organisations'
    });
  }
}

function getOrganizationHandler(req, res) {
  try {
    const organization = findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        error: 'Organisation introuvable'
      });
    }

    res.json(organization);
  } catch (error) {
    res.status(500).json({
      error: 'Impossible de charger l’organisation'
    });
  }
}

// =========================================================
// HANDLERS PUBLICS (phase 5)
// =========================================================

// Liste publique : uniquement les organisations PUBLISHED.
// Le statut est forcé serveur, jamais lu depuis la query.
function listPublicOrganizationsHandler(req, res) {
  try {
    const organizations = findAll({
      status: 'published', // forcé — jamais depuis req.query
      type: req.query.type,
      departmentId: req.query.department_id,
      communeId: req.query.commune_id,
      search: req.query.search
    });

    res.json(organizations);
  } catch (error) {
    res.status(500).json({ error: 'Impossible de charger les organisations' });
  }
}

// Fiche publique : une seule règle — published ou 404.
function getPublicOrganizationHandler(req, res) {
  try {
    const organization = findById(req.params.id);

    if (!organization || organization.status !== 'published') {
      // 404 identique que l'org n'existe pas ou ne soit pas publiée
      return res.status(404).json({ error: 'Organisation introuvable' });
    }

    res.json(organization);
  } catch (error) {
    res.status(500).json({ error: 'Impossible de charger l’organisation' });
  }
}

// =========================================================
// ADMINISTRATION (phase 10)
// =========================================================

function findAllForAdmin() {
  return db.prepare(`
    SELECT
      o.id, o.name, o.type, o.status, o.neighborhood,
      d.name AS department_name,
      c.name AS commune_name,
      o.updated_at
    FROM organizations o
    LEFT JOIN departments d ON d.id = o.department_id
    LEFT JOIN communes c ON c.id = o.commune_id
    ORDER BY o.name
  `).all();
}

function listAdminOrganizationsHandler(req, res) {
  try {
    res.json(findAllForAdmin());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossible de charger les organisations' });
  }
}

function archiveOrganizationHandler(req, res) {
  const { id } = req.params;

  try {
    // SELECT sur l'id seul : 404 = inexistante, 409 = déjà archivée / non archivable
    const org = db.prepare(`SELECT * FROM organizations WHERE id = ?`).get(id);

    if (!org) {
      return res.status(404).json({ error: 'Organisation inexistante' });
    }
    if (org.status === 'archived') {
      return res.status(409).json({ error: 'Organisation déjà archivée' });
    }
    if (org.status !== 'published' && org.status !== 'suspended') {
      return res.status(409).json({ error: 'Seules les organisations publiées ou suspendues peuvent être archivées' });
    }

    db.prepare(`
      UPDATE organizations
      SET status = 'archived', updated_at = ?
      WHERE id = ?
    `).run(nowIso(), id);

    logAudit({
      actorId: req.user.id,
      action: 'organization_archived',
      entityType: 'organization',
      entityId: id,
      oldData: { status: org.status },
      newData: { status: 'archived' }
    });

    res.json({ ok: true, id, status: 'archived' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossible d’archiver l’organisation' });
  }
}

module.exports = {
  findById,
  findAll,
  create,
  update,
  createSpecialization,
  createComplete,
  listOrganizationsHandler,
  getOrganizationHandler,
  listPublicOrganizationsHandler,
  getPublicOrganizationHandler,
  findAllForAdmin, 
  listAdminOrganizationsHandler,
  archiveOrganizationHandler
};