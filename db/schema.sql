PRAGMA foreign_keys = ON;

-- =========================================================
-- 1. USERS
-- =========================================================
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  password TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'disabled')),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  must_change_password INTEGER NOT NULL DEFAULT 0
    CHECK (must_change_password IN (0, 1))
);

-- =========================================================
-- 2. ROLES
-- =========================================================
CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL
);

-- =========================================================
-- 3. PERMISSIONS
-- =========================================================
CREATE TABLE permissions (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- =========================================================
-- 4. USER_ROLES
-- =========================================================
CREATE TABLE user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by TEXT REFERENCES users(id),
  assigned_at TEXT NOT NULL,
  UNIQUE (user_id, role_id)
);

-- =========================================================
-- 5. ROLE_PERMISSIONS
-- =========================================================
CREATE TABLE role_permissions (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE (role_id, permission_id)
);

-- =========================================================
-- 6. DEPARTMENTS
-- =========================================================
CREATE TABLE departments (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- =========================================================
-- 7. COMMUNES
-- =========================================================
CREATE TABLE communes (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  UNIQUE (department_id, name)
);

-- =========================================================
-- 8. ACTIVITY_SECTORS
-- =========================================================
CREATE TABLE activity_sectors (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive'))
);

-- =========================================================
-- 9. ORGANIZATIONS
-- =========================================================
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('private_profit', 'private_nonprofit', 'public')),
  description TEXT,
  department_id TEXT REFERENCES departments(id),
  commune_id TEXT REFERENCES communes(id),
  neighborhood TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'published', 'suspended', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT
);

-- =========================================================
-- 10. ORGANIZATION_PRIVATE_PROFIT
-- =========================================================
CREATE TABLE organization_private_profit (
  id TEXT PRIMARY KEY,
  organization_id TEXT UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ifu TEXT,
  rccm TEXT,
  legal_form TEXT,
  activity_sector_id TEXT REFERENCES activity_sectors(id)
);

-- =========================================================
-- 11. ORGANIZATION_PRIVATE_NONPROFIT
-- =========================================================
CREATE TABLE organization_private_nonprofit (
  id TEXT PRIMARY KEY,
  organization_id TEXT UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  raf_number TEXT,
  ifu TEXT,
  organization_form TEXT,
  activity_sector_id TEXT REFERENCES activity_sectors(id),
  promoter_name TEXT,
  promoter_phone TEXT,
  promoter_email TEXT
);

-- =========================================================
-- 12. ORGANIZATION_PUBLIC
-- =========================================================
CREATE TABLE organization_public (
  id TEXT PRIMARY KEY,
  organization_id TEXT UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  creation_act TEXT,
  creation_act_reference TEXT,
  creation_date TEXT
);

-- =========================================================
-- 13. CONTRIBUTIONS
-- =========================================================
-- Une contribution peut venir d'un compte (contributor_id) OU
-- d'une personne sans compte (contributor_first_name/last_name/phone).
CREATE TABLE contributions (
  id TEXT PRIMARY KEY,

  contributor_id TEXT REFERENCES users(id),
  contributor_first_name TEXT,
  contributor_last_name TEXT,
  contributor_phone TEXT,

  organization_name TEXT NOT NULL,
  organization_type TEXT NOT NULL CHECK (organization_type IN ('private_profit', 'private_nonprofit', 'public')),
  description TEXT,
  department_id TEXT REFERENCES departments(id),
  commune_id TEXT REFERENCES communes(id),
  neighborhood TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  activity_sector_id TEXT REFERENCES activity_sectors(id),

  status TEXT NOT NULL CHECK (status IN ('pending', 'validated', 'rejected', 'duplicate')),

  -- visibilité publique de la fiche provisoire
  public_visibility INTEGER NOT NULL DEFAULT 1 CHECK (public_visibility IN (0, 1)),
  -- masquage par un modérateur (indépendant du statut métier)
  is_hidden INTEGER NOT NULL DEFAULT 0 CHECK (is_hidden IN (0, 1)),
  moderation_reason TEXT,

  duplicate_of_organization_id TEXT REFERENCES organizations(id),
  created_organization_id TEXT REFERENCES organizations(id),

  published_at TEXT,
  withdrawn_at TEXT,

  created_at TEXT NOT NULL,
  updated_at TEXT
);

-- =========================================================
-- 14. CONTRIBUTION_REVIEWS
-- =========================================================
CREATE TABLE contribution_reviews (
  id TEXT PRIMARY KEY,
  contribution_id TEXT NOT NULL REFERENCES contributions(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL REFERENCES users(id),
  decision TEXT NOT NULL CHECK (decision IN ('validated', 'rejected', 'duplicate')),
  linked_organization_id TEXT REFERENCES organizations(id),
  comment TEXT,
  created_at TEXT NOT NULL
);

-- =========================================================
-- 15. VERIFICATIONS
-- =========================================================
-- field_name = NULL => vérification globale
CREATE TABLE verifications (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  field_name TEXT,
  verifier_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'rejected')),
  method TEXT,
  created_at TEXT NOT NULL
);

-- =========================================================
-- 16. CORRECTION_REQUESTS
-- =========================================================
CREATE TABLE correction_requests (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requester_id TEXT REFERENCES users(id),
  submitter_name TEXT,
  submitter_contact TEXT,
  field_name TEXT NOT NULL,
  old_value TEXT,
  proposed_value TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  created_at TEXT NOT NULL
);

-- =========================================================
-- 17. ORGANIZATION_CHANGES
-- =========================================================
CREATE TABLE organization_changes (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT REFERENCES users(id),
  source TEXT NOT NULL CHECK (source IN ('contribution', 'correction', 'administration', 'other')),
  reason TEXT,
  created_at TEXT NOT NULL
);

-- =========================================================
-- 18. AUDIT_LOGS
-- =========================================================
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'system')),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_data TEXT,
  new_data TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL
);

-- =========================================================
-- 19. ATTACHMENTS
-- =========================================================
-- exactement un parent parmi contribution_id / correction_request_id
CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  contribution_id TEXT REFERENCES contributions(id) ON DELETE CASCADE,
  correction_request_id TEXT REFERENCES correction_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  uploaded_at TEXT NOT NULL,
  CHECK (
    (contribution_id IS NOT NULL AND correction_request_id IS NULL)
    OR
    (contribution_id IS NULL AND correction_request_id IS NOT NULL)
  )
);

-- =========================================================
-- 20. CONTRIBUTION_REPORTS
-- =========================================================
CREATE TABLE contribution_reports (
  id TEXT PRIMARY KEY,
  contribution_id TEXT NOT NULL REFERENCES contributions(id) ON DELETE CASCADE,
  reporter_id TEXT REFERENCES users(id),
  reporter_name TEXT,
  reporter_contact TEXT,
  reason TEXT NOT NULL,
  comment TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'resolved', 'dismissed')),
  effect TEXT,
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  created_at TEXT NOT NULL
);

-- =========================================================
-- 21. SESSIONS (technique, hors modèle métier)
-- =========================================================
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);