const express = require('express');
const path = require('path');
const config = require('./config');
const rateLimit = require('./rateLimit');

const cookieParser = require('cookie-parser');
const db = require('./db');
const {
  verifyPassword,
  createSession,
  destroySession,
  loadUser,
  requireAuth,
  requirePermission,
  setSessionCookie,
  hashPassword,                          // ← LIGNE AJOUTÉE
  clearSessionCookie   
} = require('./auth');
const { nowIso, logAudit } = require('./helpers');

const app = express();
const PORT = config.PORT;

const organizationsModule = require('./modules/organizations');
const contributionsModule = require('./modules/contributions');
const reportsModule = require('./modules/reports');
const correctionsModule = require('./modules/corrections');
const accountsModule = require('./modules/accounts');


const {
  listMyContributionsHandler,
  getMyContributionHandler
} = require('./modules/contributions');

const reviewsModule = require('./modules/reviews');


const {
  listModerationReportsHandler,
  reviewReportHandler
} = require('./modules/reports');

const {
  hideContributionHandler,
  restoreContributionHandler
} = require('./modules/contributions');

const {
  listModerationCorrectionsHandler,
  approveCorrectionHandler,
  rejectCorrectionHandler
} = require('./modules/corrections');

const {
  listUsersHandler,
  getUserHandler,
  listRolesHandler,
  suspendUserHandler,
  reactivateUserHandler,
  assignRoleHandler,
  removeRoleHandler,
  resetPasswordHandler
} = require('./modules/users');

const auditModule = require('./modules/audit');

const statsModule = require('./modules/stats');


app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Route de test simple, sans logique métier
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'WorkMap API en ligne' });
});




// --- PUBLIC (phase 5 : aucune authentification requise) ---

// Organisations officielles
app.get('/api/public/organizations', organizationsModule.listPublicOrganizationsHandler);
app.get('/api/public/organizations/:id', organizationsModule.getPublicOrganizationHandler);

// Contributions publiques (pending + visibles + non masquées)
app.get('/api/public/contributions', contributionsModule.listPublicContributionsHandler);
app.get('/api/public/contributions/:id', contributionsModule.getPublicContributionHandler);
app.post('/api/public/contributions', contributionsModule.createPublicContributionHandler);

// Signalement d'une contribution publique
app.post('/api/public/contributions/:id/reports', reportsModule.createPublicReportHandler);

// Demande de correction d'une organisation officielle
app.post('/api/public/organizations/:id/corrections', correctionsModule.createPublicCorrectionHandler);

// Référentiels (départements, communes, secteurs actifs)
app.get('/api/public/referentials', (req, res) => {
  try {
    const departments = db.prepare(`SELECT id, name FROM departments ORDER BY name`).all();
    const communes = db.prepare(`
      SELECT id, department_id, name FROM communes ORDER BY name
    `).all();
    const activitySectors = db.prepare(`
      SELECT id, name FROM activity_sectors
      WHERE status = 'active'
      ORDER BY name
    `).all();

    res.json({ departments, communes, activitySectors });
  } catch (error) {
    res.status(500).json({ error: 'Impossible de charger les référentiels' });
  }
});



// --- AUTH ---

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (rateLimit.isBlocked(req)) {
    return res.status(429).json({
      error: 'Trop de tentatives. Réessayez dans 15 minutes.'
    });
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);

  if (!user || !verifyPassword(password, user.password)) {
    rateLimit.registerFailure(req);
    return res.status(401).json({ error: 'Identifiants invalides' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Compte suspendu ou désactivé' });
  }

  const session = createSession(user.id);

  rateLimit.reset(req);

  setSessionCookie(res, session);
  res.json({ ok: true });
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { current_password, new_password, new_password_confirm } = req.body;

  if (!current_password || !new_password || !new_password_confirm) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  if (new_password.length < 10) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 10 caractères' });
  }

  if (new_password !== new_password_confirm) {
    return res.status(400).json({ error: 'La confirmation ne correspond pas' });
  }

  const userRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.id);

  if (!verifyPassword(current_password, userRow.password)) {
    return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
  }

  if (current_password === new_password) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit être différent de l\'actuel' });
  }

  const newHash = hashPassword(new_password);

  db.prepare(`
    UPDATE users
    SET password = ?, must_change_password = 0, updated_at = ?
    WHERE id = ?
  `).run(newHash, nowIso(), req.user.id);

  // Sécurité : on détruit toutes les sessions sauf celle en cours,
  // pour forcer la reconnexion ailleurs si le mot de passe a fuité.
  db.prepare(`
    DELETE FROM sessions WHERE user_id = ? AND id != ?
  `).run(req.user.id, req.user.sessionId);

  logAudit({
    userId: req.user.id,
    actorType: 'user',
    action: 'password_changed',
    entityType: 'user',
    entityId: req.user.id,
    details: 'Changement de mot de passe par l\'utilisateur'
  });

  res.json({ ok: true });
});

// Inscription publique — pas de requireAuth, par définition
app.post('/api/auth/register', accountsModule.registerHandler);

app.post('/api/auth/logout', (req, res) => {
  const sid = req.cookies && req.cookies[config.SESSION_COOKIE_NAME];
  if (sid) {
    destroySession(sid);
    clearSessionCookie(res);
  }
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  const user = loadUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  res.json(user);
});

// --- ESPACE CONTRIBUTEUR (phase 6) ---
app.get('/api/contributions/mine', requireAuth, listMyContributionsHandler);
app.get('/api/contributions/mine/:id', requireAuth, getMyContributionHandler);


// --- EXAMEN DES CONTRIBUTIONS (phase 7) ---
const canReview = requirePermission('review_contribution');

app.get('/api/review/contributions', canReview, reviewsModule.listQueueHandler);
app.get('/api/review/contributions/:id', canReview, reviewsModule.getForReviewHandler);
app.post('/api/review/contributions/:id/validate', canReview, reviewsModule.validateHandler);
app.post('/api/review/contributions/:id/reject', canReview, reviewsModule.rejectHandler);
app.post('/api/review/contributions/:id/duplicate', canReview, reviewsModule.duplicateHandler);

app.post(
  '/api/review/organizations/:id/verifications',
  requirePermission('verify_organization'),
  reviewsModule.createVerificationHandler
);

// --- MODÉRATION (phase 8) ---


app.get('/api/moderation/reports',
  requirePermission('review_contribution_report'), listModerationReportsHandler);

app.post('/api/moderation/reports/:id/review',
  requirePermission('review_contribution_report'), reviewReportHandler);

app.post('/api/moderation/contributions/:id/hide',
  requirePermission('hide_public_contribution'), hideContributionHandler);

app.post('/api/moderation/contributions/:id/restore',
  requirePermission('restore_public_contribution'), restoreContributionHandler);

app.get('/api/moderation/corrections',
  requirePermission('review_correction'), listModerationCorrectionsHandler);

app.post('/api/moderation/corrections/:id/approve',
  requirePermission('review_correction'), approveCorrectionHandler);

app.post('/api/moderation/corrections/:id/reject',
  requirePermission('review_correction'), rejectCorrectionHandler);

// --- GESTION DES UTILISATEURS (phase 9) ---
const canManageUsers = requirePermission('manage_users');

app.get('/api/users', canManageUsers, listUsersHandler);
app.get('/api/users/roles', canManageUsers, listRolesHandler);
app.get('/api/users/:id', canManageUsers, getUserHandler);
app.post('/api/users/:id/suspend', canManageUsers, suspendUserHandler);
app.post('/api/users/:id/reactivate', canManageUsers, reactivateUserHandler);
app.post('/api/users/:id/reset-password', requireAuth, requirePermission('manage_users'), resetPasswordHandler);
app.post('/api/users/:id/roles', canManageUsers, assignRoleHandler);
app.post('/api/users/:id/roles/:roleId/remove', canManageUsers, removeRoleHandler);


/// --- ADMIN (phase 10) ---
app.get('/api/admin/organizations',
  requirePermission('archive_organization'),
  organizationsModule.listAdminOrganizationsHandler);

app.post('/api/admin/organizations/:id/archive',
  requirePermission('archive_organization'),
  organizationsModule.archiveOrganizationHandler);

app.get('/api/admin/audit',
  requirePermission('view_audit_logs'),
  auditModule.listAuditHandler);

/// ----STATS-----
app.get('/api/admin/stats',
  requirePermission('view_audit_logs'),
  statsModule.dashboardStatsHandler);

// --- DÉMARRAGE (toujours en dernier) ---
app.listen(PORT, () => {
  console.log(`WorkMap démarré sur http://localhost:${PORT}`);
  console.log(`Environnement : ${config.NODE_ENV}`);
});