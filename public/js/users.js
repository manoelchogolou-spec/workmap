// Gestion des utilisateurs — tableau back-office

const STATUS_LABELS = {
  active: 'Actif',
  suspended: 'Suspendu',
  disabled: 'Désactivé'
};

let users = [];
let roles = [];
let dialogTargetUserId = null;

function showMessage(text, isError) {
  const msg = document.getElementById('message');
  msg.textContent = text;
  msg.className = 'message ' + (isError ? 'error' : 'success');
  if (isError) toast(text, 'error');
}

function td(text, parent) {
  const cell = document.createElement('td');
  cell.textContent = (text === null || text === undefined || text === '') ? '—' : String(text);
  parent.appendChild(cell);
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

async function runAction(button, fn) {
  setLoading(button, true);
  try {
    await fn();
  } catch (e) {
    toast(e.message || 'Erreur réseau', 'error');
  } finally {
    setLoading(button, false);
    await loadUsers();
  }
}

// ---------- Chargement ----------

async function loadRoles() {
  const data = await getJson('/api/users/roles');
  if (data.error) {
    showMessage(data.error, true);
    return;
  }
  roles = data;
  renderRoleSelect();
}

function renderRoleSelect() {
  const select = document.getElementById('role-select');
  if (!select) return;
  select.replaceChildren();
  for (const r of roles) {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = r.name;
    select.appendChild(opt);
  }
}

async function loadUsers() {
  const tbody = document.querySelector('#users-table tbody');
  const empty = document.getElementById('users-empty');
  tbody.innerHTML = '';
  empty.textContent = '';

  const list = await getJson('/api/users');
  if (list.error) {
    showMessage(list.error, true);
    return;
  }

  // Enrichissement des rôles en parallèle
  const details = await Promise.all(
    list.map(u => getJson(`/api/users/${u.id}`))
  );
  users = list.map((u, i) => details[i].error ? u : details[i]);

  if (!users.length) {
    empty.textContent = 'Aucun utilisateur.';
    return;
  }

  for (const u of users) {
    const tr = document.createElement('tr');
    td(`${u.first_name} ${u.last_name}`, tr);
    td(u.email, tr);
    td(u.phone, tr);
    td(STATUS_LABELS[u.status] || u.status, tr);
    td((u.roles && u.roles.length)
      ? u.roles.map(r => r.name).join(', ')
      : 'aucun', tr);
    td((u.created_at || '').slice(0, 10), tr);

    const actions = document.createElement('td');

    if (u.status === 'active') {
      actions.appendChild(makeButton('Suspendre', (e) => {
        if (!confirm(`Suspendre le compte de ${u.first_name} ${u.last_name} ?`)) return;
        runAction(e.target, async () => {
          const r = await postJson(`/api/users/${u.id}/suspend`);
          if (r.error) throw new Error(r.error);
          showMessage(`Compte de ${u.first_name} suspendu. Sessions invalidées.`);
        });
      }));
    } else if (u.status === 'suspended') {
      actions.appendChild(makeButton('Réactiver', (e) => {
        runAction(e.target, async () => {
          const r = await postJson(`/api/users/${u.id}/reactivate`);
          if (r.error) throw new Error(r.error);
          showMessage(`Compte de ${u.first_name} réactivé.`);
        });
      }));
    }

    actions.appendChild(makeButton('+ Rôle', () => openRoleDialog(u)));
    actions.appendChild(makeButton('Réinit. mdp', (e) => {
      if (!confirm(`Réinitialiser le mot de passe de ${u.first_name} ${u.last_name} ? Ses sessions seront fermées.`)) return;
      resetPassword(u, e.target);
    }));

    for (const role of (u.roles || [])) {
      actions.appendChild(makeButton(`− ${role.name}`, (e) => {
        if (!confirm(`Retirer le rôle ${role.name} à ${u.first_name} ?`)) return;
        runAction(e.target, async () => {
          const r = await postJson(`/api/users/${u.id}/roles/${role.id}/remove`);
          if (r.error) throw new Error(r.error);
          showMessage(`Rôle ${role.name} retiré.`);
        });
      }));
    }

    tr.appendChild(actions);
    tbody.appendChild(tr);
  }
}

// ---------- Dialog de rôle ----------

function openRoleDialog(u) {
  dialogTargetUserId = u.id;
  document.getElementById('role-dialog-title').textContent =
    `Attribuer un rôle à ${u.first_name} ${u.last_name}`;
  renderRoleSelect();
  document.getElementById('role-dialog').showModal();
}

document.getElementById('role-cancel').onclick = () => {
  document.getElementById('role-dialog').close();
};

document.getElementById('role-form').onsubmit = async (e) => {
  e.preventDefault();
  const confirmBtn = document.getElementById('role-confirm');
  const roleId = document.getElementById('role-select').value;

  setLoading(confirmBtn, true);
  const r = await postJson(`/api/users/${dialogTargetUserId}/roles`, { roleId });
  setLoading(confirmBtn, false);

  document.getElementById('role-dialog').close();

  if (r.error) return showMessage(r.error, true);
  showMessage('Rôle attribué.');
  toast('Rôle attribué.', 'success');
  loadUsers();
};

// ---------- Réinitialisation de mot de passe ----------

async function resetPassword(u, button) {
  setLoading(button, true);
  const r = await postJson(`/api/users/${u.id}/reset-password`);
  setLoading(button, false);

  if (r.error) return showMessage(r.error, true);

  document.getElementById('temp-password-value').textContent = r.tempPassword;
  document.getElementById('temp-password-dialog').showModal();
  showMessage(`Mot de passe de ${u.first_name} réinitialisé. Sessions invalidées.`);
}

document.getElementById('temp-password-close').onclick = () => {
  document.getElementById('temp-password-dialog').close();
};

// ---------- Init ----------

async function init() {
  const me = await getJson('/api/auth/me');
  if (me.error || !me.permissions || !me.permissions.includes('manage_users')) {
    window.location.href = '/login.html';
    return;
  }
  await loadUsers();
  await loadRoles();
}

init();