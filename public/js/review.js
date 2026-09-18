// Examen des contributions — vérificateur (interface tableau)

let currentId = null;

// --- Helpers fetch ---
async function getJson(path) {
  const res = await fetch(path, { credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data.error || `Erreur ${res.status}`, status: res.status };
  return data;
}

async function postJson(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data.error || `Erreur ${res.status}`, status: res.status };
  return data;
}

// ✅ CODE CORRIGÉ
function esc(value) {
  return String(value ?? '—').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;' // Apostrophe correctement échappée (\')
  }[c]));
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR');
}

// --- Init ---
async function init() {
  const accessEl = document.getElementById('access-message');

  const user = await getJson('/api/auth/me');
  if (user.error) {
    window.location.href = '/login.html';
    return;
  }
  if (!user.permissions.includes('review_contribution')) {
    accessEl.textContent = 'Accès refusé : vous n’avez pas la permission d’examiner les contributions.';
    accessEl.className = 'message error';
    return;
  }

  await loadQueue();
}
init();

// --- File d'attente ---
async function loadQueue() {
  document.getElementById('detail-section').hidden = true;
  document.getElementById('queue-section').hidden = false;
  currentId = null;

  const tbody = document.querySelector('#queue-table tbody');
  const msg = document.getElementById('queue-message');
  msg.textContent = '';
  msg.className = 'message';

  const data = await getJson('/api/review/contributions');

  if (data.error) {
    msg.textContent = data.error;
    msg.className = 'message error';
    return;
  }

  tbody.innerHTML = '';

  if (data.length === 0) {
    msg.textContent = 'Aucune contribution en attente d’examen.';
    msg.className = 'message empty';
    return;
  }

  for (const c of data) {
    const location = [c.commune_name, c.department_name].filter(Boolean).join(', ') || '—';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${esc(c.organization_name)}</td>
      <td>${esc(c.organization_type)}</td>
      <td>${esc(location)}</td>
      <td>${c.public_visibility ? 'Oui' : 'Non'}</td>
      <td>${fmtDate(c.created_at)}</td>
      <td><button data-open="${c.id}">Examiner</button></td>`;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll('button[data-open]').forEach(btn => {
    btn.addEventListener('click', () => loadDetail(btn.dataset.open));
  });
}

// --- Détail d'examen ---
async function loadDetail(id) {
  const c = await getJson(`/api/review/contributions/${id}`);
  if (c.error) {
    toast(c.error, 'error');
    return;
  }

  currentId = c.id;
  document.getElementById('queue-section').hidden = true;
  document.getElementById('detail-section').hidden = false;

  const contributor = c.contributor_first_name
    ? `${c.contributor_first_name} ${c.contributor_last_name || ''}`.trim()
    : '—';

  document.getElementById('detail-table').innerHTML = `
    <tr><th>Identifiant</th><td>${esc(c.id)}</td></tr>
    <tr><th>Nom</th><td>${esc(c.organization_name)}</td></tr>
    <tr><th>Type</th><td>${esc(c.organization_type)}</td></tr>
    <tr><th>Département</th><td>${esc(c.department_name)}</td></tr>
    <tr><th>Commune</th><td>${esc(c.commune_name)}</td></tr>
    <tr><th>Adresse</th><td>${esc(c.address)}</td></tr>
    <tr><th>Téléphone</th><td>${esc(c.phone)}</td></tr>
    <tr><th>Email</th><td>${esc(c.email)}</td></tr>
    <tr><th>Site web</th><td>${esc(c.website)}</td></tr>
    <tr><th>Secteur d’activité</th><td>${esc(c.activity_sector_name)}</td></tr>
    <tr><th>Prépubliée</th><td>${c.public_visibility ? 'Oui' : 'Non'}</td></tr>
    <tr><th>Déposée le</th><td>${fmtDate(c.created_at)}</td></tr>
    <tr><th>Contributeur (interne)</th><td>${esc(contributor)}</td></tr>`;

  resetDecisionForm();
}

function resetDecisionForm() {
  document.getElementById('decision-comment').value = '';
  document.getElementById('reject-reason').value = '';
  document.getElementById('duplicate-org-id').value = '';
  document.getElementById('verif-field').value = '';
  document.getElementById('verif-method').value = '';
  document.getElementById('verif-status').value = 'confirmed';
  document.getElementById('reject-box').hidden = true;
  document.getElementById('duplicate-box').hidden = true;
}

function setButtonsDisabled(disabled) {
  ['btn-validate', 'btn-reject', 'btn-duplicate'].forEach(id => {
    document.getElementById(id).disabled = disabled;
  });
}

// --- Décisions ---
async function submitDecision(action, extra) {
  if (!currentId) return;
  if (action === 'reject') {
    const reason = document.getElementById('reject-reason').value.trim();
    if (!reason) {
      toast('Le motif du rejet est obligatoire.', 'error');
      return;
    }
    extra = { ...extra, reason };
  }
  if (action === 'duplicate') {
    const orgId = document.getElementById('duplicate-org-id').value.trim();
    if (!orgId) {
      toast('L’ID de l’organisation existante est obligatoire.', 'error');
      return;
    }
    extra = { ...extra, organizationId: orgId };
  }

  setButtonsDisabled(true);
  try {
    const result = await postJson(
      `/api/review/contributions/${currentId}/${action}`,
      { comment: document.getElementById('decision-comment').value.trim(), ...extra }
    );

    if (result.error) {
      toast(result.error, 'error');
      return;
    }

    let text = 'Décision enregistrée.';
    if (action === 'validate') {
      text = `Contribution validée. Organisation publiée : ${result.organization.name}.`;
    } else if (action === 'duplicate') {
      text = `Doublon rattaché à : ${result.organization.name}.`;
    } else if (action === 'reject') {
      text = 'Contribution rejetée et retirée de l’espace public.';
    }
    toast(text, 'success');

    setTimeout(loadQueue, 1500);
  } catch (e) {
    toast('Erreur réseau', 'error');
  } finally {
    setButtonsDisabled(false);
  }
}

document.getElementById('btn-back').addEventListener('click', loadQueue);

document.getElementById('btn-validate').addEventListener('click', () => submitDecision('validate'));
document.getElementById('btn-reject').addEventListener('click', () => {
  document.getElementById('reject-box').hidden = false;
  submitDecision('reject');
});
document.getElementById('btn-duplicate').addEventListener('click', () => {
  document.getElementById('duplicate-box').hidden = false;
  submitDecision('duplicate');
});
document.getElementById('btn-verif').addEventListener('click', async () => {
  const field = document.getElementById('verif-field').value;
  const method = document.getElementById('verif-method').value.trim();
  const status = document.getElementById('verif-status').value;

  if (!field || !method) {
    toast('Champ et méthode sont obligatoires.', 'error');
    return;
  }
  if (!currentId) return;

  const btn = document.getElementById('btn-verif');
  setLoading(btn, true);
  try {
    const result = await postJson(`/api/review/contributions/${currentId}/verifications`, {
      field, method, status
    });
    if (result.error) {
      toast(result.error, 'error');
    } else {
      toast('Vérification enregistrée.', 'success');
    }
  } catch (e) {
    toast('Erreur réseau', 'error');
  } finally {
    setLoading(btn, false);
  }
});