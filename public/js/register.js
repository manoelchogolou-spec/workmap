// Soumission du formulaire d'inscription — phase 15

async function getJson(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data.error || 'Erreur ' + res.status };
  return data;
}

function showMessage(text, isError) {
  const el = document.getElementById('message');
  el.textContent = text;
  el.style.color = isError ? 'crimson' : 'green';
}

document.getElementById('registerForm').onsubmit = async (e) => {
  e.preventDefault();

  const body = JSON.stringify({
    first_name: document.getElementById('first_name').value,
    last_name: document.getElementById('last_name').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value,
    password_confirm: document.getElementById('password_confirm').value
  });

  const data = await getJson('/api/auth/register', {
    method: 'POST',
    body
  });

  if (data.error) {
    return showMessage(data.error, true);
  }

  // 201 { ok: true } — pas de connexion automatique (décision verrouillée)
  showMessage('Compte créé. Vous pouvez maintenant vous connecter.');
  setTimeout(() => { window.location.href = '/login.html'; }, 1500);
};