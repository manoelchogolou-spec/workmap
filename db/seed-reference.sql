-- =========================================================
-- SEED DE RÉFÉRENCE — WorkMap
-- Aucun utilisateur, aucune organisation.
-- Utilisé en développement ET en production.
-- =========================================================

-- ---------------------------------------------------------
-- ROLES
-- ---------------------------------------------------------
INSERT INTO roles (id, name, description, created_at) VALUES
('rol-001', 'contributor',   'Propose et consulte ses contributions',  '2026-01-01T08:00:00+01:00'),
('rol-002', 'verifier',      'Examine et vérifie les contributions',   '2026-01-01T08:00:00+01:00'),
('rol-003', 'moderator',     'Traite signalements et corrections',     '2026-01-01T08:00:00+01:00'),
('rol-004', 'user_manager',  'Gère les comptes utilisateurs',          '2026-01-01T08:00:00+01:00'),
('rol-005', 'administrator', 'Administre la plateforme',               '2026-01-01T08:00:00+01:00');

-- ---------------------------------------------------------
-- PERMISSIONS
-- ---------------------------------------------------------
INSERT INTO permissions (id, name, description) VALUES
('per-001', 'submit_contribution',                'Proposer une contribution'),
('per-002', 'review_contribution',                'Examiner une contribution'),
('per-003', 'verify_organization',                'Vérifier une organisation'),
('per-004', 'review_correction',                  'Traiter une demande de correction'),
('per-005', 'publish_organization',               'Publier officiellement une organisation'),
('per-006', 'manage_users',                       'Gérer les comptes utilisateurs'),
('per-007', 'manage_roles',                       'Gérer rôles et permissions'),
('per-008', 'view_audit_logs',                    'Consulter les journaux d''audit'),
('per-009', 'view_public_pending_contributions',  'Voir les contributions publiques en attente'),
('per-010', 'hide_public_contribution',           'Masquer une contribution publique'),
('per-011', 'restore_public_contribution',        'Restaurer une contribution masquée'),
('per-012', 'review_contribution_report',         'Traiter un signalement de contribution'),
('per-013', 'manage_public_visibility',           'Gérer la visibilité publique'),
('per-014', 'archive_organization',               'Archiver une organisation publiée');

-- ---------------------------------------------------------
-- ROLE_PERMISSIONS
-- ---------------------------------------------------------

-- contributor
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
('rp-001', 'rol-001', 'per-001');

-- verifier
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
('rp-002', 'rol-002', 'per-002'),
('rp-003', 'rol-002', 'per-003'),
('rp-004', 'rol-002', 'per-005'),
('rp-005', 'rol-002', 'per-009');

-- moderator
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
('rp-006', 'rol-003', 'per-004'),
('rp-007', 'rol-003', 'per-010'),
('rp-008', 'rol-003', 'per-011'),
('rp-009', 'rol-003', 'per-012'),
('rp-023', 'rol-003', 'per-013');

-- user_manager
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
('rp-024', 'rol-004', 'per-006');

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
('rp-022', 'rol-005', 'per-013'),
('rp-025', 'rol-005', 'per-014');

-- ---------------------------------------------------------
-- DEPARTMENTS (12)
-- ---------------------------------------------------------
INSERT INTO departments (id, name) VALUES
('dep-01', 'Alibori'),
('dep-02', 'Atacora'),
('dep-03', 'Atlantique'),
('dep-04', 'Borgou'),
('dep-05', 'Collines'),
('dep-06', 'Couffo'),
('dep-07', 'Donga'),
('dep-08', 'Littoral'),
('dep-09', 'Mono'),
('dep-10', 'Ouémé'),
('dep-11', 'Plateau'),
('dep-12', 'Zou');

-- ---------------------------------------------------------
-- COMMUNES (77)
-- ---------------------------------------------------------

-- Alibori (6)
INSERT INTO communes (id, department_id, name) VALUES
('com-001', 'dep-01', 'Banikoara'),
('com-002', 'dep-01', 'Gogounou'),
('com-003', 'dep-01', 'Kandi'),
('com-004', 'dep-01', 'Karimama'),
('com-005', 'dep-01', 'Malanville'),
('com-006', 'dep-01', 'Segbana');

-- Atacora (9)
INSERT INTO communes (id, department_id, name) VALUES
('com-007', 'dep-02', 'Boukoumbé'),
('com-008', 'dep-02', 'Cobly'),
('com-009', 'dep-02', 'Kérou'),
('com-010', 'dep-02', 'Kouandé'),
('com-011', 'dep-02', 'Matéri'),
('com-012', 'dep-02', 'Natitingou'),
('com-013', 'dep-02', 'Péhunco'),
('com-014', 'dep-02', 'Tanguiéta'),
('com-015', 'dep-02', 'Toucountouna');

-- Atlantique (8)
INSERT INTO communes (id, department_id, name) VALUES
('com-016', 'dep-03', 'Abomey-Calavi'),
('com-017', 'dep-03', 'Allada'),
('com-018', 'dep-03', 'Kpomassè'),
('com-019', 'dep-03', 'Ouidah'),
('com-020', 'dep-03', 'Sô-Ava'),
('com-021', 'dep-03', 'Toffo'),
('com-022', 'dep-03', 'Tori-Bossito'),
('com-023', 'dep-03', 'Zè');

-- Borgou (8)
INSERT INTO communes (id, department_id, name) VALUES
('com-024', 'dep-04', 'Bembèrèkè'),
('com-025', 'dep-04', 'Kalalé'),
('com-026', 'dep-04', 'N''Dali'),
('com-027', 'dep-04', 'Nikki'),
('com-028', 'dep-04', 'Parakou'),
('com-029', 'dep-04', 'Pèrèrè'),
('com-030', 'dep-04', 'Sinendé'),
('com-031', 'dep-04', 'Tchaourou');

-- Collines (6)
INSERT INTO communes (id, department_id, name) VALUES
('com-032', 'dep-05', 'Bantè'),
('com-033', 'dep-05', 'Dassa-Zoumè'),
('com-034', 'dep-05', 'Glazoué'),
('com-035', 'dep-05', 'Ouèssè'),
('com-036', 'dep-05', 'Savalou'),
('com-037', 'dep-05', 'Savè');

-- Couffo (6)
INSERT INTO communes (id, department_id, name) VALUES
('com-038', 'dep-06', 'Aplahoué'),
('com-039', 'dep-06', 'Djakotomey'),
('com-040', 'dep-06', 'Dogbo'),
('com-041', 'dep-06', 'Klouékanmè'),
('com-042', 'dep-06', 'Lalo'),
('com-043', 'dep-06', 'Toviklin');

-- Donga (4)
INSERT INTO communes (id, department_id, name) VALUES
('com-044', 'dep-07', 'Bassila'),
('com-045', 'dep-07', 'Copargo'),
('com-046', 'dep-07', 'Djougou'),
('com-047', 'dep-07', 'Ouaké');

-- Littoral (1)
INSERT INTO communes (id, department_id, name) VALUES
('com-048', 'dep-08', 'Cotonou');

-- Mono (6)
INSERT INTO communes (id, department_id, name) VALUES
('com-049', 'dep-09', 'Athiémé'),
('com-050', 'dep-09', 'Bopa'),
('com-051', 'dep-09', 'Comè'),
('com-052', 'dep-09', 'Grand-Popo'),
('com-053', 'dep-09', 'Houéyogbé'),
('com-054', 'dep-09', 'Lokossa');

-- Ouémé (9)
INSERT INTO communes (id, department_id, name) VALUES
('com-055', 'dep-10', 'Adjarra'),
('com-056', 'dep-10', 'Adjohoun'),
('com-057', 'dep-10', 'Aguégués'),
('com-058', 'dep-10', 'Akpro-Missérété'),
('com-059', 'dep-10', 'Avrankou'),
('com-060', 'dep-10', 'Bonou'),
('com-061', 'dep-10', 'Dangbo'),
('com-062', 'dep-10', 'Porto-Novo'),
('com-063', 'dep-10', 'Sèmè-Podji');

-- Plateau (5)
INSERT INTO communes (id, department_id, name) VALUES
('com-064', 'dep-11', 'Adja-Ouèrè'),
('com-065', 'dep-11', 'Ifangni'),
('com-066', 'dep-11', 'Kétou'),
('com-067', 'dep-11', 'Pobè'),
('com-068', 'dep-11', 'Sakété');

-- Zou (9)
INSERT INTO communes (id, department_id, name) VALUES
('com-069', 'dep-12', 'Abomey'),
('com-070', 'dep-12', 'Agbangnizoun'),
('com-071', 'dep-12', 'Bohicon'),
('com-072', 'dep-12', 'Covè'),
('com-073', 'dep-12', 'Djidja'),
('com-074', 'dep-12', 'Ouinhi'),
('com-075', 'dep-12', 'Za-Kpota'),
('com-076', 'dep-12', 'Zagnanado'),
('com-077', 'dep-12', 'Zogbodomey');

-- ---------------------------------------------------------
-- ACTIVITY_SECTORS (41)
-- ---------------------------------------------------------
INSERT INTO activity_sectors (id, name, description, status) VALUES
('sec-01', 'Agriculture et production végétale', 'Maïs, riz, manioc, igname, ananas, coton, noix de cajou, maraîchage, palmier à huile', 'active'),
('sec-02', 'Élevage et aviculture', 'Bovins, caprins, porcins, volailles, œufs, lait, miel, escargots', 'active'),
('sec-03', 'Pêche et aquaculture', 'Pêche maritime et lagunaire, pisciculture, élevage de crevettes, vente de poisson frais', 'active'),
('sec-04', 'Forêt, carrières et mines', 'Bois, charbon, sable, gravier, pierre, extraction minière', 'active'),
('sec-05', 'Transformation agroalimentaire', 'Gari, tapioca, huile rouge, jus, beurre de karité, farine, aliments pour bétail', 'active'),
('sec-06', 'Boulangerie, pâtisserie et boissons', 'Pain, gâteaux, jus, sachets d''eau, eau minérale, boissons locales', 'active'),
('sec-07', 'Textile, couture et mode', 'Couture, confection, pagne tissé, teinture, broderie, stylisme', 'active'),
('sec-08', 'Chaussures, cuir et maroquinerie', 'Cordonnerie, sacs, sandales, ceintures, articles en cuir', 'active'),
('sec-09', 'Menuiserie, bois et ameublement', 'Meubles, portes, fenêtres, lits, chaises, ébénisterie', 'active'),
('sec-10', 'Bâtiment et travaux publics', 'Maçonnerie, carrelage, peinture, plomberie, électricité bâtiment, routes, forages', 'active'),
('sec-11', 'Matériaux de construction', 'Briques, pavés, ciment, béton, carreaux, agglomérés', 'active'),
('sec-12', 'Métallurgie et soudure', 'Ferronnerie, soudure, portails, grilles, chaudronnerie, pièces métalliques', 'active'),
('sec-13', 'Industrie manufacturière', 'Fabrication plastique, cosmétiques, savon, produits d''entretien, emballages, imprimerie industrielle', 'active'),
('sec-14', 'Commerce de détail', 'Boutique, kiosque, étal de marché, supérette, vente de vivres', 'active'),
('sec-15', 'Commerce de gros et distribution', 'Demi-grossiste, grossiste, dépôt, distribution, approvisionnement de boutiques', 'active'),
('sec-16', 'Import-export', 'Importation, exportation, dédouanement, transit, commerce transfrontalier', 'active'),
('sec-17', 'Transport de personnes et de marchandises', 'Taxi, bus, camion, transport interurbain, moto-taxi, location de véhicules', 'active'),
('sec-18', 'Logistique, livraison et entreposage', 'Coursier, livraison à domicile, messagerie, magasinage, déménagement', 'active'),
('sec-19', 'Informatique et développement', 'Développement web et mobile, logiciels, sites internet, applications, données', 'active'),
('sec-20', 'Services et matériel informatiques', 'Cybercafé, maintenance, réparation d''ordinateurs, vente de matériel, réseaux, hébergement', 'active'),
('sec-21', 'Télécommunications', 'Opérateurs, fournisseurs d''accès Internet, antennes, vente de crédit de communication', 'active'),
('sec-22', 'Communication, publicité et médias', 'Agence marketing, sérigraphie, banderoles, community management, radio, presse, événementiel', 'active'),
('sec-23', 'Production audiovisuelle et photographie', 'Photographie, vidéo, studio, montage, infographie, impression numérique', 'active'),
('sec-24', 'Banque, microfinance et assurance', 'Banque, microfinance, tontine structurée, assurance, courtage, transfert d''argent, Mobile Money', 'active'),
('sec-25', 'Conseil, audit et comptabilité', 'Cabinet comptable, conseil en gestion, audit, fiscalité, études, ingénierie', 'active'),
('sec-26', 'Services juridiques', 'Avocat, notaire, huissier, conseil juridique, recouvrement', 'active'),
('sec-27', 'Ressources humaines et recrutement', 'Recrutement, placement, gestion du personnel, intérim, coaching professionnel', 'active'),
('sec-28', 'Immobilier et gestion foncière', 'Agence immobilière, location, vente de terrains, gestion locative, promotion immobilière', 'active'),
('sec-29', 'Restauration', 'Restaurant, maquis, buvette, bar, traiteur, vente de nourriture préparée', 'active'),
('sec-30', 'Hôtellerie et hébergement', 'Hôtel, auberge, résidence meublée, chambres d''hôtes', 'active'),
('sec-31', 'Tourisme et loisirs', 'Agence de voyage, guide touristique, excursions, sites touristiques, divertissement', 'active'),
('sec-32', 'Santé et services médicaux', 'Clinique, cabinet médical, laboratoire, imagerie, soins infirmiers, kinésithérapie', 'active'),
('sec-33', 'Pharmacie et produits de santé', 'Pharmacie, dépôt pharmaceutique, optique, matériel médical', 'active'),
('sec-34', 'Éducation et formation', 'École, collège, université privée, centre de formation, cours particuliers, formation en ligne', 'active'),
('sec-35', 'Coiffure, esthétique et bien-être', 'Salon de coiffure, tresses, institut de beauté, manucure, spa', 'active'),
('sec-36', 'Nettoyage, blanchisserie et entretien', 'Nettoyage de bureaux, pressing, blanchisserie, entretien d''espaces verts', 'active'),
('sec-37', 'Sécurité et gardiennage', 'Société de gardiennage, surveillance, vidéosurveillance, agents de sécurité', 'active'),
('sec-38', 'Réparation et maintenance', 'Mécanique auto, moto, carrosserie, réparation de téléphones, électroménager, froid, climatisation', 'active'),
('sec-39', 'Énergie et électricité', 'Énergie solaire, installation électrique, groupes électrogènes, distribution d''électricité', 'active'),
('sec-40', 'Eau, assainissement et environnement', 'Forage, distribution d''eau, gestion des déchets, recyclage, conseil environnemental', 'active'),
('sec-99', 'Autre', 'Secteur non listé. Précisez l''activité dans la description de l''organisation.', 'active');