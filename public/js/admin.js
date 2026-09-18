// Administration — tableaux (phase 18)

// ---------- Helpers ----------

function findStatusCount(rows, status) {
  const row = rows.find(item => item.status === status);
  return row ? row.count : 0;
}

function setStat(id, value) {
  document.getElementById(id).textContent = value;
}

function fmtDate(value) {
  return (value || '').slice(0, 16).replace('T', ' ') || '—';
}

function showStatsError(text) {
  const message = document.getElementById('stats-message');
  message.textContent = text;
  message.className = 'message error';
}

function td(text, parent) {
  const cell = document.createElement('td');
  cell.textContent = (text === null || text === undefined || text === '') ? '—' : String(text);
  parent.appendChild(cell);
  return cell;
}

function fillTable(tableId, emptyId, errorText, renderRow) {
  const tbody = document.querySelector('#' + tableId + ' tbody');
  const empty = document.getElementById(emptyId);
  tbody.innerHTML = '';
  empty.textContent = '';

  if (errorText) {
    empty.textContent = errorText;
    empty.className = 'message error';
    return;
  }
  empty.className = 'message';
}

// ---------- Statistiques ----------

async function loadStats() {
  const message = document.getElementById('stats-message');
  const content = document.getElementById('stats-content');

  message.textContent = 'Chargement…';
  message.className = 'message';

  const data = await getJson('/api/admin/stats');

  if (data.error) {
    if (data.status === 401 || data.status === 403) return showStatsError('Accès refusé');
    return showStatsError(data.error);
  }

  const counts = data.counts;

  setStat('stats-organizations', counts.organizations);
  setStat('stats-published-organizations', counts.publishedOrganizations);
  setStat('stats-archived-organizations', counts.archivedOrganizations);

  setStat('stats-contributions', counts.contributions);
  setStat('stats-pending-contributions', findStatusCount(data.contributionsByStatus, 'pending'));
  setStat('stats-validated-contributions', findStatusCount(data.contributionsByStatus, 'validated'));
  setStat('stats-rejected-contributions', findStatusCount(data.contributionsByStatus, 'rejected'));
  setStat('stats-duplicate-contributions', findStatusCount(data.contributionsByStatus, 'duplicate'));
  setStat('stats-public-contributions', counts.pendingPublicContributions);

  setStat('stats-reports', counts.reports);
  setStat('stats-pending-reports', counts.pendingReports);
  setStat('stats-resolved-reports', counts.resolvedReports);
  setStat('stats-dismissed-reports', counts.dismissedReports);

  setStat('stats-corrections', counts.corrections);
  setStat('stats-pending-corrections', counts.pendingCorrections);
  setStat('stats-approved-corrections', counts.approvedCorrections);
  setStat('stats-rejected-corrections', counts.rejectedCorrections);

  setStat('stats-users', counts.users);
  setStat('stats-active-users', counts.activeUsers);
  setStat('stats-suspended-users', counts.suspendedUsers);
  setStat('stats-disabled-users', counts.disabledUsers);

  message.textContent = '';
  content.hidden = false;
}

// ---------- Organisations ----------

async function loadOrganizations() {
  const tbody = document.querySelector('#orgs-table tbody');
  const empty = document.getElementById('orgs-empty');

  const orgs = await getJson('/api/admin/organizations');

  tbody.innerHTML = '';
  empty.textContent = '';
  empty.className = 'message';

  if (orgs.error) {
    empty.textContent = (orgs.status === 401 || orgs.status === 403)
      ? 'Accès refusé' : orgs.error;
    empty.className = 'message error';
    return;
  }

  if (!orgs.length) {
    empty.textContent = 'Aucune organisation.';
    return;
  }

  for (const org of orgs) {
    const tr = document.createElement('tr');
    td(org.name, tr);
    td(org.type, tr);
    td(org.status, tr);
    td(org.commune_name || org.department_name, tr);

    const actions = document.createElement('td');
    if (org.status === 'published' || org.status === 'suspended') {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'button';
      btn.textContent = 'Archiver';
      btn.addEventListener('click', () => archiveOrganization(org.id, btn));
      actions.appendChild(btn);
    }
    tr.appendChild(actions);

    tbody.appendChild(tr);
  }
}

async function archiveOrganization(id, btn) {
  if (!confirm('Archiver cette organisation ? Elle disparaîtra du site public.')) return;

  setLoading(btn, true);
  const result = await postJson(`/api/admin/organizations/${id}/archive`);
  setLoading(btn, false);

  if (result.error) {
    toast(result.error, 'error');
    return;
  }

  toast('Organisation archivée.', 'success');
  await Promise.all([loadOrganizations(), loadAudit(), loadStats()]);
}

// ---------- Audit ----------

async function loadAudit(filters) {
  const tbody = document.querySelector('#audit-table tbody');
  const empty = document.getElementById('audit-empty');

  const params = new URLSearchParams(filters || {});
  const rows = await getJson('/api/admin/audit?' + params.toString());

  tbody.innerHTML = '';
  empty.textContent = '';
  empty.className = 'message';

  if (rows.error) {
    empty.textContent = (rows.status === 401 || rows.status === 403)
      ? 'Accès refusé' : rows.error;
    empty.className = 'message error';
    return;
  }

  if (!rows.length) {
    empty.textContent = 'Aucune entrée.';
    return;
  }

  for (const row of rows) {
    const tr = document.createElement('tr');
    td(fmtDate(row.created_at), tr);
    td(row.actor_name, tr);
    td(row.action, tr);
    td((row.entity_type || '') + (row.entity_id ? ' (' + row.entity_id + ')' : ''), tr);
    tbody.appendChild(tr);
  }
}

// ---------- Filtres ----------

document.getElementById('audit-filters').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const filters = {};
  for (const [key, value] of f.entries()) {
    if (value.trim()) filters[key] = value.trim();
  }

  const btn = document.getElementById('audit-filter-btn');
  setLoading(btn, true);
  await loadAudit(filters);
  setLoading(btn, false);
});

// ---------- Démarrage ----------

(async () => {
  const me = await getJson('/api/auth/me');
  if (me.error) {
    window.location.href = '/login.html';
    return;
  }
  await Promise.all([loadStats(), loadOrganizations(), loadAudit()]);
})();