// Helper de fetch local (identique à api.js des autres pages)
async function getJson(path) {
  const res = await fetch(path, { credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data.error || `Erreur ${res.status}` };
  return data;
}

async function loadDashboard() {
  const contentEl = document.getElementById('content');
  const logoutBtn = document.getElementById('logoutBtn');

  try {
    const user = await getJson('/api/auth/me');

    // 1. D'ABORD : redirection si non connecté
    if (user.error) {
      window.location.href = '/login.html';
      return;
    }

    if (user.must_change_password) {
      window.location.href = 'change-password.html';
      return;
    }
   
    // 2. ENSUITE : liens de rôle
    /*const links = document.getElementById('role-links');
    if (links) {
      const perms = user.permissions || [];
      if (perms.includes('review_contribution')) {
        links.innerHTML += '<a href="/review.html">Examiner les contributions</a> ';
      }
      if (perms.includes('review_contribution_report') || perms.includes('review_correction')) {
        links.innerHTML += '<a href="/moderation.html">Modération</a> ';
      }
      if (perms.includes('manage_users')) {
        links.innerHTML += '<a href="/users.html">Gestion des utilisateurs</a> ';
      }
      if (perms.includes('archive_organization') || perms.includes('view_audit_logs')) {
        links.innerHTML += '<a href="/admin.html">Administration</a> ';
      }
    } */


    // 3. PUIS : le contenu
    
    contentEl.innerHTML = `
      <p>Bonjour ${user.first_name} ${user.last_name}</p>
      <p>Rôle(s) : ${user.roles.join(', ') || 'aucun'}</p>
      <p>Permissions : ${user.permissions.join(', ') || 'aucune'}</p>
    `;

    if (user.permissions.includes('review_contribution')) {
      contentEl.innerHTML +=
        '<p><a class="button" href="/review.html">Espace vérificateur</a></p>';
    }

    logoutBtn.style.display = 'inline-block';

    await loadMyContributions();
  } catch (err) {
    contentEl.textContent = 'Erreur de chargement';
  }
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/login.html';
});

async function loadMyContributions() {
  const section = document.getElementById('my-contributions-section');
  const tbody = document.querySelector('#my-contributions-table tbody');
  const msg = document.getElementById('my-contributions-message');

  const data = await getJson('/api/contributions/mine');
  section.hidden = false;

  if (data.error) {
    msg.textContent = data.error;
    msg.className = 'message error';
    return;
  }

  if (data.length === 0) {
    msg.textContent = 'Vous n’avez encore aucune contribution.';
    return;
  }

  const STATUS_LABELS = {
    pending: 'En attente d’examen',
    validated: 'Validée ✅',
    rejected: 'Rejetée ❌',
    duplicate: 'Doublon ⚠️'
  };

  tbody.innerHTML = '';
    for (const c of data) {
    let decision = '—';
    let orgLink = c.organization_name; // Par défaut, juste du texte sans lien

    if (c.status === 'rejected' && c.moderation_reason) {
      decision = c.moderation_reason;
    } else if (c.resulting_organization) {
      decision = `Devenue officielle : ${c.resulting_organization.name}`;
      // Si validée, on pointe vers la fiche officielle
      orgLink = `<a href="/organization.html?id=${c.resulting_organization.id}">${c.organization_name}</a>`;
    } else if (c.duplicate_of_organization) {
      decision = `Doublon de : ${c.duplicate_of_organization.name}`;
      // Si doublon, on pointe vers la fiche existante
      orgLink = `<a href="/organization.html?id=${c.duplicate_of_organization.id}">${c.organization_name}</a>`;
    } else if (c.status === 'pending' && c.public_visibility && !c.is_hidden) {
      // Si en attente et visible, on pointe vers la fiche contribution
      orgLink = `<a href="/contribution.html?id=${c.id}">${c.organization_name}</a>`;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${orgLink}</td>
      <td>${c.organization_type}</td>
      <td>${STATUS_LABELS[c.status] || c.status}</td>
      <td>${c.public_visibility && !c.is_hidden ? 'Oui' : 'Non'}</td>
      <td>${decision}</td>
      <td>${(c.created_at || '').slice(0, 16).replace('T', ' ')}</td>`;
    tbody.appendChild(tr);
  }
}

loadDashboard();