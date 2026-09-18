-- =========================================================
-- SEED WORKMAP — données fictives
-- Mot de passe en clair pour tous : Password123!
-- =========================================================

-- ---------------------------------------------------------
-- USERS
-- ---------------------------------------------------------
INSERT INTO users (id, first_name, last_name, phone, email, password, status, created_at, updated_at) VALUES
('usr-001', 'Afi', 'Dossou', '+2290197000001', 'afi.dossou@example.test', '$2b$12$/PjYj8VmXcsown0WkKsEKurp.47g94qbA0vPts8MrGEEKvqHGsGUO', 'active', '2026-01-01T08:00:00+01:00', NULL),
('usr-002', 'Boris', 'Houngbédji', '+2290197000002', 'boris.h@example.test', '$2b$12$/PjYj8VmXcsown0WkKsEKurp.47g94qbA0vPts8MrGEEKvqHGsGUO', 'active', '2026-01-01T08:00:00+01:00', NULL),
('usr-003', 'Carine', 'Kora', '+2290197000003', 'carine.kora@example.test', '$2b$12$/PjYj8VmXcsown0WkKsEKurp.47g94qbA0vPts8MrGEEKvqHGsGUO', 'active', '2026-01-01T08:00:00+01:00', NULL),
('usr-004', 'David', 'Soglo', '+2290197000004', 'david.soglo@example.test', '$2b$12$/PjYj8VmXcsown0WkKsEKurp.47g94qbA0vPts8MrGEEKvqHGsGUO', 'active', '2026-01-01T08:00:00+01:00', NULL),
('usr-005', 'Estelle', 'Bio', '+2290197000005', 'estelle.bio@example.test', '$2b$12$/PjYj8VmXcsown0WkKsEKurp.47g94qbA0vPts8MrGEEKvqHGsGUO', 'active', '2026-01-01T08:00:00+01:00', NULL),
('usr-006', 'Firmin', 'Zinsou', '+2290197000006', 'firmin.zinsou@example.test', '$2b$12$/PjYj8VmXcsown0WkKsEKurp.47g94qbA0vPts8MrGEEKvqHGsGUO', 'suspended', '2026-01-01T08:00:00+01:00', NULL);

-- ---------------------------------------------------------
-- ROLES
-- ---------------------------------------------------------
/*INSERT INTO roles (id, name, description, created_at) VALUES
('rol-001', 'contributor', 'Propose et consulte ses contributions', '2026-01-01T08:00:00+01:00'),
('rol-002', 'verifier', 'Examine et vérifie les contributions', '2026-01-01T08:00:00+01:00'),
('rol-003', 'moderator', 'Traite signalements et corrections', '2026-01-01T08:00:00+01:00'),
('rol-004', 'user_manager', 'Gère les comptes utilisateurs', '2026-01-01T08:00:00+01:00'),
('rol-005', 'administrator', 'Administration complète', '2026-01-01T08:00:00+01:00');*/

-- ---------------------------------------------------------
-- PERMISSIONS
-- ---------------------------------------------------------
/*INSERT INTO permissions (id, name, description) VALUES
('per-001', 'submit_contribution', 'Proposer une contribution'),
('per-002', 'review_contribution', 'Examiner une contribution'),
('per-003', 'verify_organization', 'Vérifier une organisation'),
('per-004', 'review_correction', 'Traiter une demande de correction'),
('per-005', 'publish_organization', 'Publier officiellement une organisation'),
('per-006', 'manage_users', 'Gérer les comptes utilisateurs'),
('per-007', 'manage_roles', 'Gérer rôles et permissions'),
('per-008', 'view_audit_logs', 'Consulter les journaux d''audit'),
('per-009', 'view_public_pending_contributions', 'Voir les contributions publiques en attente'),
('per-010', 'hide_public_contribution', 'Masquer une contribution publique'),
('per-011', 'restore_public_contribution', 'Restaurer une contribution masquée'),
('per-012', 'review_contribution_report', 'Traiter un signalement de contribution'),
('per-013', 'manage_public_visibility', 'Gérer la visibilité publique'),
('per-014', 'archive_organization', 'Archiver une organisation publiée');*/

-- ---------------------------------------------------------
-- ROLE_PERMISSIONS
-- ---------------------------------------------------------
-- contributor
/*INSERT INTO role_permissions (id, role_id, permission_id) VALUES
('rp-001', 'rol-001', 'per-001'),
('rp-023', 'rol-005', 'per-014');

-- verifier
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
('rp-002', 'rol-002', 'per-002'),
('rp-003', 'rol-002', 'per-003');

-- moderator
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
('rp-004', 'rol-003', 'per-004'),
('rp-005', 'rol-003', 'per-010'),
('rp-006', 'rol-003', 'per-011'),
('rp-007', 'rol-003', 'per-012'),
('rp-008', 'rol-003', 'per-013');

-- user_manager
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
('rp-009', 'rol-004', 'per-006');

-- administrator : toutes les permissions
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
('rp-010', 'rol-005', 'per-001'),
('rp-011', 'rol-005', 'per-002'),
('rp-012', 'rol-005', 'per-003'),
('rp-013', 'rol-005', 'per-004'),
('rp-014', 'rol-005', 'per-005'),
('rp-015', 'rol-005', 'per-006'),
('rp-016', 'rol-005', 'per-007'),
('rp-017', 'rol-005', 'per-008'),
('rp-018', 'rol-005', 'per-009'),
('rp-019', 'rol-005', 'per-010'),
('rp-020', 'rol-005', 'per-011'),
('rp-021', 'rol-005', 'per-012'),
('rp-022', 'rol-005', 'per-013');*/

-- ---------------------------------------------------------
-- USER_ROLES
-- ---------------------------------------------------------
INSERT INTO user_roles (id, user_id, role_id, assigned_by, assigned_at) VALUES
('ur-001', 'usr-001', 'rol-001', 'usr-005', '2026-01-01T09:00:00+01:00'),
('ur-002', 'usr-002', 'rol-002', 'usr-005', '2026-01-01T09:00:00+01:00'),
('ur-003', 'usr-003', 'rol-003', 'usr-005', '2026-01-01T09:00:00+01:00'),
('ur-004', 'usr-004', 'rol-004', 'usr-005', '2026-01-01T09:00:00+01:00'),
('ur-005', 'usr-005', 'rol-005', 'usr-005', '2026-01-01T09:00:00+01:00');

-- ---------------------------------------------------------
-- DEPARTMENTS
-- ---------------------------------------------------------
/*INSERT INTO departments (id, name) VALUES
('dep-001', 'Littoral'),
('dep-002', 'Atlantique');

-- ---------------------------------------------------------
-- COMMUNES
-- ---------------------------------------------------------
INSERT INTO communes (id, department_id, name) VALUES
('com-001', 'dep-001', 'Cotonou'),
('com-002', 'dep-002', 'Abomey-Calavi'),
('com-003', 'dep-002', 'Ouidah');*/

-- ---------------------------------------------------------
-- ACTIVITY_SECTORS
-- ---------------------------------------------------------
/*INSERT INTO activity_sectors (id, name, description, status) VALUES
('sec-001', 'Transformation agroalimentaire', NULL, 'active'),
('sec-002', 'Services numériques', NULL, 'active');*/

-- ---------------------------------------------------------
-- ORGANIZATIONS
-- ---------------------------------------------------------
INSERT INTO organizations (id, name, type, description, department_id, commune_id, neighborhood, address, phone, email, website, status, created_at, updated_at, published_at) VALUES
('org-001', 'Atacora Numérique SARL', 'private_profit', 'Solutions numériques pour les petites entreprises', 'dep-08', 'com-048', 'Ganhi', NULL, '+2290140000101', 'contact@atacora-numerique.example.test', NULL, 'published', '2026-01-05T08:00:00+01:00', '2026-01-05T08:00:00+01:00', '2026-01-06T08:00:00+01:00'),
('org-002', 'Association Espoir du Littoral', 'private_nonprofit', 'Accompagnement éducatif des jeunes', 'dep-03', 'com-016', 'Zogbadjè', NULL, '+2290140000102', 'contact@espoir-littoral.example.test', NULL, 'published', '2026-01-05T08:00:00+01:00', '2026-01-05T08:00:00+01:00', '2026-01-06T08:00:00+01:00'),
('org-003', 'Agence Communale des Initiatives Locales', 'public', 'Appui fictif aux initiatives économiques locales', 'dep-03', 'com-019', 'Centre-ville', NULL, '+2290140000103', 'contact@acil.example.test', NULL, 'published', '2026-01-05T08:00:00+01:00', '2026-01-05T08:00:00+01:00', '2026-01-06T08:00:00+01:00'),
('org-004', 'Saveurs du Mono', 'private_profit', 'Transformation de produits agricoles locaux', 'dep-03', 'com-016', 'Tankpè', NULL, '+2290140000104', 'contact@saveurs-mono.example.test', NULL, 'draft', '2026-01-05T08:00:00+01:00', '2026-09-08T10:30:00+01:00', NULL),
('org-005', 'Fondation Horizon Bénin', 'private_nonprofit', 'Actions communautaires et environnementales', 'dep-08', 'com-048', 'Akpakpa', NULL, '+2290140000105', 'contact@horizon-benin.example.test', NULL, 'suspended', '2026-01-05T08:00:00+01:00', '2026-01-05T08:00:00+01:00', NULL),
('org-006', 'Atelier Sèmè Innovation', 'private_profit', 'Ateliers fictifs d''innovation locale', 'dep-03', 'com-019', 'Pahou', NULL, '+2290140000106', 'contact@seme-innovation.example.test', NULL, 'pending', '2026-01-05T08:00:00+01:00', '2026-01-05T08:00:00+01:00', NULL);

-- ---------------------------------------------------------
-- SPECIALISATIONS
-- ---------------------------------------------------------
INSERT INTO organization_private_profit (id, organization_id, ifu, rccm, legal_form, activity_sector_id) VALUES
('opp-001', 'org-001', '3202600000001', 'RB/COT/26 B 00001', 'SARL', 'sec-19');

INSERT INTO organization_private_nonprofit (id, organization_id, raf_number, ifu, organization_form, activity_sector_id, promoter_name, promoter_phone, promoter_email) VALUES
('opn-001', 'org-002', 'RAF-FICTIF-ATL-2026-001', '3202600000002', 'Association', 'sec-34', 'Nadège Hounsa', '+2290140000201', 'nadege.hounsa@example.test');

INSERT INTO organization_public (id, organization_id, creation_act, creation_act_reference, creation_date) VALUES
('opu-001', 'org-003', 'Arrêté communal fictif', 'ACIL/2026/001', '2026-01-15');

-- ---------------------------------------------------------
-- CONTRIBUTIONS
-- ---------------------------------------------------------
INSERT INTO contributions (
  id, contributor_id, contributor_first_name, contributor_last_name, contributor_phone,
  organization_name, organization_type, description,
  department_id, commune_id, neighborhood, address, phone, email, website, activity_sector_id,
  status, public_visibility, is_hidden, moderation_reason,
  duplicate_of_organization_id, created_organization_id,
  published_at, withdrawn_at, created_at, updated_at
) VALUES
('ctr-001', 'usr-001', NULL, NULL, NULL,
 'Coopérative Nouvelle Récolte', 'private_profit', NULL,
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 'pending', 1, 0, NULL,
 NULL, NULL,
 '2026-09-07T09:00:00+01:00', NULL, '2026-09-07T08:30:00+01:00', NULL),

('ctr-002', NULL, 'Mariam', 'Adjovi', '+2290197111002',
 'Centre artisanal Wémè', 'private_profit', NULL,
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 'pending', 1, 0, NULL,
 NULL, NULL,
 '2026-09-07T10:00:00+01:00', NULL, '2026-09-07T09:30:00+01:00', NULL),

('ctr-003', 'usr-001', NULL, NULL, NULL,
 'Ferme Solidaire Atlantique', 'private_nonprofit', NULL,
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 'pending', 0, 0, NULL,
 NULL, NULL,
 NULL, NULL, '2026-09-07T10:00:00+01:00', NULL),

('ctr-004', 'usr-001', NULL, NULL, NULL,
 'Comptoir Littoral Plus', 'private_profit', NULL,
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 'pending', 1, 1, 'Signalement de donnée personnelle à examiner',
 NULL, NULL,
 '2026-09-07T11:00:00+01:00', NULL, '2026-09-07T10:30:00+01:00', NULL),

('ctr-005', 'usr-001', NULL, NULL, NULL,
 'Saveurs du Mono', 'private_profit', NULL,
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 'validated', 0, 0, NULL,
 NULL, 'org-004',
 '2026-09-06T08:00:00+01:00', '2026-09-08T11:00:00+01:00', '2026-09-06T07:30:00+01:00', NULL),

('ctr-006', 'usr-001', NULL, NULL, NULL,
 'Centre Commercial du Littoral', 'private_profit', NULL,
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 'rejected', 0, 0, NULL,
 NULL, NULL,
 '2026-09-06T09:00:00+01:00', '2026-09-08T11:30:00+01:00', '2026-09-06T08:30:00+01:00', NULL),

('ctr-007', 'usr-001', NULL, NULL, NULL,
 'Atacora Numérique', 'private_profit', NULL,
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 'duplicate', 0, 0, NULL,
 'org-001', NULL,
 '2026-09-06T10:00:00+01:00', '2026-09-08T12:00:00+01:00', '2026-09-06T09:30:00+01:00', NULL);

-- ---------------------------------------------------------
-- CONTRIBUTION_REVIEWS
-- ---------------------------------------------------------
INSERT INTO contribution_reviews (id, contribution_id, reviewer_id, decision, linked_organization_id, comment, created_at) VALUES
('rev-001', 'ctr-005', 'usr-002', 'validated', 'org-004', NULL, '2026-09-08T10:00:00+01:00'),
('rev-002', 'ctr-006', 'usr-002', 'rejected', NULL, NULL, '2026-09-08T10:15:00+01:00'),
('rev-003', 'ctr-007', 'usr-002', 'duplicate', 'org-001', NULL, '2026-09-08T10:20:00+01:00');

-- ---------------------------------------------------------
-- CONTRIBUTION_REPORTS
-- ---------------------------------------------------------
INSERT INTO contribution_reports (id, contribution_id, reporter_id, reporter_name, reporter_contact, reason, comment, status, effect, reviewed_by, reviewed_at, created_at) VALUES
('rpt-001', 'ctr-001', NULL, 'Anonyme', NULL, 'duplicate', NULL, 'pending', 'Aucun', NULL, NULL, '2026-09-07T12:00:00+01:00'),
('rpt-002', 'ctr-004', NULL, 'Anonyme', NULL, 'personal_data', NULL, 'resolved', 'Contribution masquée', 'usr-003', '2026-09-08T09:00:00+01:00', '2026-09-07T13:00:00+01:00'),
('rpt-003', 'ctr-002', NULL, 'Anonyme', NULL, 'false_information', NULL, 'dismissed', 'Aucun masquage', 'usr-003', '2026-09-08T09:15:00+01:00', '2026-09-07T14:00:00+01:00');

-- ---------------------------------------------------------
-- VERIFICATIONS
-- ---------------------------------------------------------
INSERT INTO verifications (id, organization_id, field_name, verifier_id, status, method, created_at) VALUES
('ver-001', 'org-004', NULL, 'usr-002', 'verified', 'Examen d''un document', '2026-09-08T10:30:00+01:00'),
('ver-002', 'org-001', 'phone', 'usr-002', 'verified', 'Vérification téléphonique', '2026-09-08T15:00:00+01:00');

-- ---------------------------------------------------------
-- CORRECTION_REQUESTS
-- ---------------------------------------------------------
INSERT INTO correction_requests (id, organization_id, requester_id, submitter_name, submitter_contact, field_name, old_value, proposed_value, reason, status, reviewed_by, reviewed_at, created_at) VALUES
('cor-001', 'org-001', NULL, 'Anonyme', '+2290140000199', 'phone', '+2290140000101', '+2290140000191', NULL, 'pending', NULL, NULL, '2026-09-07T16:00:00+01:00'),
('cor-002', 'org-002', NULL, 'Nadège Hounsa', 'nadege.hounsa@example.test', 'address', 'Zogbadjè', 'Rue fictive des Écoliers, Zogbadjè', NULL, 'approved', 'usr-003', '2026-09-08T09:30:00+01:00', '2026-09-07T17:00:00+01:00'),
('cor-003', 'org-003', NULL, 'Anonyme', '+2290140000198', 'name', 'Agence Communale des Initiatives Locales', 'Agence Nationale des Initiatives', NULL, 'rejected', 'usr-003', '2026-09-08T09:45:00+01:00', '2026-09-07T18:00:00+01:00');

-- ---------------------------------------------------------
-- ORGANIZATION_CHANGES
-- ---------------------------------------------------------
INSERT INTO organization_changes (id, organization_id, field_name, old_value, new_value, changed_by, source, reason, created_at) VALUES
('chg-001', 'org-002', 'address', 'Zogbadjè', 'Rue fictive des Écoliers, Zogbadjè', 'usr-003', 'correction', NULL, '2026-09-08T09:30:00+01:00'),
('chg-002', 'org-002', 'phone', '+2290140000102', '+2290140000182', 'usr-005', 'administration', NULL, '2026-09-08T09:35:00+01:00');

-- ---------------------------------------------------------
-- AUDIT_LOGS
-- ---------------------------------------------------------
INSERT INTO audit_logs (id, user_id, actor_type, action, entity_type, entity_id, old_data, new_data, metadata, created_at) VALUES
('aud-001', NULL, 'system', 'contribution_auto_published', 'contribution', 'ctr-001', NULL, NULL, NULL, '2026-09-07T09:00:00+01:00'),
('aud-002', 'usr-003', 'user', 'public_contribution_hidden', 'contribution', 'ctr-004', NULL, NULL, NULL, '2026-09-08T08:00:00+01:00'),
('aud-003', 'usr-003', 'user', 'public_contribution_restored', 'contribution', 'ctr-004', NULL, NULL, NULL, '2026-09-08T08:30:00+01:00'),
('aud-004', 'usr-002', 'user', 'contribution_validated', 'contribution', 'ctr-005', NULL, NULL, NULL, '2026-09-08T10:00:00+01:00'),
('aud-005', 'usr-002', 'user', 'contribution_rejected', 'contribution', 'ctr-006', NULL, NULL, NULL, '2026-09-08T10:15:00+01:00'),
('aud-006', 'usr-002', 'user', 'duplicate_identified', 'contribution', 'ctr-007', NULL, NULL, NULL, '2026-09-08T10:20:00+01:00'),
('aud-007', NULL, 'system', 'contribution_redirected', 'contribution', 'ctr-007', NULL, NULL, NULL, '2026-09-08T10:21:00+01:00'),
('aud-008', 'usr-003', 'user', 'correction_approved', 'correction_request', 'cor-002', NULL, NULL, NULL, '2026-09-08T09:30:00+01:00'),
('aud-009', 'usr-005', 'user', 'role_assigned', 'user', 'usr-004', NULL, NULL, NULL, '2026-01-01T09:00:00+01:00');

-- ---------------------------------------------------------
-- ATTACHMENTS
-- ---------------------------------------------------------
INSERT INTO attachments (id, contribution_id, correction_request_id, file_name, file_path, mime_type, uploaded_at) VALUES
('att-001', 'ctr-005', NULL, 'justificatif-fictif-saveurs-mono.pdf', 'private/contributions/ctr-005/justificatif.pdf', 'application/pdf', '2026-09-07T14:00:00+01:00'),
('att-002', NULL, 'cor-002', 'preuve-fictive-adresse.pdf', 'private/corrections/cor-002/preuve-adresse.pdf', 'application/pdf', '2026-09-07T15:00:00+01:00');