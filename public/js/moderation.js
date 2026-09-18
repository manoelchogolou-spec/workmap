// Modération — tableaux back-office

const msg = document.getElementById('msg');

function show(text, isError) {
  msg.textContent = text;
  msg.className = 'message ' + (isError ? 'error' : 'success');
}

function td(text, parent) {
  const cell = document.createElement('td');
  cell.textContent = (text === null || text === undefined || text === '') ? '—' : String(text);
  parent.appendChild(cell);
  return cell;
}

function tdActions(row) {
  const cell = document.createElement('td');
  row.appendChild(cell);
  return cell;
}

function makeButton(label, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'button';
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

const REPORT_STATUS = {
  pending: 'En attente',
  resolved: 'Traité',
  dismissed: 'Sans suite'
};

const CORRECTION_STATUS = {
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Refusée'
};

/*const CORRECTABLE_FIELD_LABELS = {
  name: 'Nom',
  address: 'Adresse',
  phone: 'Téléphone',
  email: 'Email',
  website: 'Site web'
};*/

// ---------- Signalements ----------
async function loadReports() {
  const tbody = document.querySelector('#reports-table tbody');
  const empty = document.getElementById('reports-empty');
  tbody.innerHTML = '';

  const rows = await getJson('/api/moderation/reports');

  if (rows.error) {
    empty.textContent = rows.error;
    empty.className = 'message error';
    return;
  }
  if (!rows.length) {
    empty.textContent = 'Aucun signalement.';
    empty.className = 'message';
    return;
  }
  empty.textContent = '';

  for (const r of rows) {
    const tr = document.createElement('tr');
    tr.appendChild(td(r.organization_name || r.contribution_id, tr));
    td(r.reason_label, tr);
    td(r.comment, tr);
    td(r.is_hidden ? 'Masquée' : 'Visible', tr);
    td(r.effect, tr);
    td(REPORT_STATUS[r.status] || r.status, tr);

    const actions = tdActions(tr);
    if (r.status === 'pending') {
      actions.appendChild(makeButton('Traiter', (ev) => reviewReport(ev.target, r, 'resolved')));
      actions.appendChild(makeButton('Sans suite', (ev) => reviewReport(ev.target, r, 'dismissed')));
    }
    if (r.is_hidden) {
      actions.appendChild(makeButton('Restaurer', (ev) => hideOrRestore(ev.target, r.contribution_id, false)));
    } else {
      actions.appendChild(makeButton('Masquer', (ev) => hideOrRestore(ev.target, r.contribution_id, true)));
    }

    tbody.appendChild(tr);
  }
}

// ---------- Corrections ----------
async function loadCorrections() {
  const tbody = document.querySelector('#corrections-table tbody');
  const empty = document.getElementById('corrections-empty');
  tbody.innerHTML = '';

  const rows = await getJson('/api/moderation/corrections');

  if (rows.error) {
    empty.textContent = rows.error;
    empty.className = 'message error';
    return;
  }
  if (!rows.length) {
    empty.textContent = 'Aucune demande.';
    empty.className = 'message';
    return;
  }
  empty.textContent = '';

  for (const c of rows) {
    const tr = document.createElement('tr');

    // Colonne organisation : lien texte sûr
    const tdOrg = document.createElement('td');
    const a = document.createElement('a');
    a.href = '/organization.html?id=' + encodeURIComponent(c.organization_id);
    a.textContent = c.organization_name || c.organization_id;
    tdOrg.appendChild(a);
    tr.appendChild(tdOrg);

    td(CORRECTABLE_FIELD_LABELS[c.field_name] || c.field_name, tr);
    td(c.current_value, tr);
    td(c.proposed_value, tr);
    td(c.submitter_name || 'Anonyme', tr);
    td(CORRECTION_STATUS[c.status] || c.status, tr);

    const actions = tdActions(tr);
    if (c.status === 'pending') {
      actions.appendChild(makeButton('Approuver', (ev) => approveCorrection(ev.target, c)));
      actions.appendChild(makeButton('Refuser', (ev) => rejectCorrection(ev.target, c)));
    }

    tbody.appendChild(tr);
  }
}

// ---------- Actions (avec anti double-clic) ----------
async function runAction(button, fn) {
  if (!setLoading(button, true)) return; // déjà en cours
  try {
    await fn();
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    setLoading(button, false);
    await loadReports();
    await loadCorrections();
  }
}

async function reviewReport(button, r, decision) {
  await runAction(button, async () => {
    const effect = decision === 'resolved' ? 'Contribution masquée' : 'Aucun masquage';
    const result = await postJson(`/api/moderation/reports/${r.id}/review`, { decision, effect });
    if (result.error) return toast(result.error, 'error');
    toast('Signalement clôturé.', 'success');
  });
}

async function hideOrRestore(button, contributionId, hide) {
  await runAction(button, async () => {
    if (hide) {
      const reason = prompt('Motif du masquage (obligatoire) :');
      if (!reason) return;
      const result = await postJson(`/api/moderation/contributions/${contributionId}/hide`, { reason });
      if (result.error) return toast(result.error, 'error');
      toast('Contribution masquée.', 'success');
    } else {
      if (!confirm('Restaurer cette contribution ?')) return;
      const result = await postJson(`/api/moderation/contributions/${contributionId}/restore`);
      if (result.error) return toast(result.error, 'error');
      toast('Contribution restaurée.', 'success');
    }
  });
}

async function approveCorrection(button, c) {
  await runAction(button, async () => {
    if (!confirm('Appliquer cette correction à la fiche officielle ?')) return;
    const result = await postJson(`/api/moderation/corrections/${c.id}/approve`);
    if (result.error) return toast(result.error, 'error');
    show('Correction appliquée : ' + (result.field_name || c.field_name) +
      ' « ' + (result.old_value || '—') + ' » → « ' + (result.new_value || '') + ' »');
    toast('Correction appliquée.', 'success');
  });
}

async function rejectCorrection(button, c) {
  await runAction(button, async () => {
    const reason = prompt('Motif du refus (obligatoire) :');
    if (!reason) return;
    const result = await postJson(`/api/moderation/corrections/${c.id}/reject`, { reason });
    if (result.error) return toast(result.error, 'error');
    toast('Demande refusée.', 'success');
  });
}

// ---------- Init ----------
(async () => {
  const me = await getJson('/api/auth/me');
  if (me.error) {
    window.location.href = '/login.html';
    return;
  }

  const p = me.permissions || [];
  if (!p.includes('review_contribution_report') && !p.includes('review_correction')) {
    show('Accès réservé aux modérateurs.', true);
    return;
  }

  await loadReports();
  await loadCorrections();
})();