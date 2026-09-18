const db = require('../db');

function getCounts() {
  return {
    users: db.prepare(`
      SELECT COUNT(*) AS count FROM users
    `).get().count,

    activeUsers: db.prepare(`
      SELECT COUNT(*) AS count
      FROM users
      WHERE status = 'active'
    `).get().count,

    suspendedUsers: db.prepare(`
      SELECT COUNT(*) AS count
      FROM users
      WHERE status = 'suspended'
    `).get().count,

    disabledUsers: db.prepare(`
      SELECT COUNT(*) AS count
      FROM users
      WHERE status = 'disabled'
    `).get().count,

    organizations: db.prepare(`
      SELECT COUNT(*) AS count
      FROM organizations
    `).get().count,

    publishedOrganizations: db.prepare(`
      SELECT COUNT(*) AS count
      FROM organizations
      WHERE status = 'published'
    `).get().count,

    archivedOrganizations: db.prepare(`
      SELECT COUNT(*) AS count
      FROM organizations
      WHERE status = 'archived'
    `).get().count,

    contributions: db.prepare(`
      SELECT COUNT(*) AS count
      FROM contributions
    `).get().count,

    pendingPublicContributions: db.prepare(`
      SELECT COUNT(*) AS count
      FROM contributions
      WHERE status = 'pending'
        AND public_visibility = 1
        AND is_hidden = 0
    `).get().count,

    reports: db.prepare(`
      SELECT COUNT(*) AS count
      FROM contribution_reports
    `).get().count,

    pendingReports: db.prepare(`
      SELECT COUNT(*) AS count
      FROM contribution_reports
      WHERE status = 'pending'
    `).get().count,

    resolvedReports: db.prepare(`
      SELECT COUNT(*) AS count
      FROM contribution_reports
      WHERE status = 'resolved'
    `).get().count,

    dismissedReports: db.prepare(`
      SELECT COUNT(*) AS count
      FROM contribution_reports
      WHERE status = 'dismissed'
    `).get().count,

    corrections: db.prepare(`
      SELECT COUNT(*) AS count
      FROM correction_requests
    `).get().count,

    pendingCorrections: db.prepare(`
      SELECT COUNT(*) AS count
      FROM correction_requests
      WHERE status = 'pending'
    `).get().count,

    approvedCorrections: db.prepare(`
      SELECT COUNT(*) AS count
      FROM correction_requests
      WHERE status = 'approved'
    `).get().count,

    rejectedCorrections: db.prepare(`
      SELECT COUNT(*) AS count
      FROM correction_requests
      WHERE status = 'rejected'
    `).get().count
  };
}

function getOrganizationsByStatus() {
  return db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM organizations
    GROUP BY status
    ORDER BY status
  `).all();
}

function getContributionsByStatus() {
  return db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM contributions
    GROUP BY status
    ORDER BY status
  `).all();
}

function getReportsByStatus() {
  return db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM contribution_reports
    GROUP BY status
    ORDER BY status
  `).all();
}

function getCorrectionsByStatus() {
  return db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM correction_requests
    GROUP BY status
    ORDER BY status
  `).all();
}

function getUsersByStatus() {
  return db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM users
    GROUP BY status
    ORDER BY status
  `).all();
}

function getDashboardStats() {
  return {
    counts: getCounts(),
    organizationsByStatus: getOrganizationsByStatus(),
    contributionsByStatus: getContributionsByStatus(),
    reportsByStatus: getReportsByStatus(),
    correctionsByStatus: getCorrectionsByStatus(),
    usersByStatus: getUsersByStatus()
  };
}

function dashboardStatsHandler(req, res) {
  try {
    res.json(getDashboardStats());
  } catch (error) {
    console.error('Erreur statistiques :', error);

    res.status(500).json({
      error: 'Impossible de charger les statistiques'
    });
  }
}

module.exports = {
  getCounts,
  getOrganizationsByStatus,
  getContributionsByStatus,
  getReportsByStatus,
  getCorrectionsByStatus,
  getUsersByStatus,
  getDashboardStats,
  dashboardStatsHandler
};