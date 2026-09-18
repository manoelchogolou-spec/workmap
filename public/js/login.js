document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const messageEl = document.getElementById('message');
  messageEl.textContent = '';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      messageEl.textContent = data.error || 'Erreur de connexion';
      return;
    }

    window.location.href = '/dashboard.html';
  } catch (err) {
    messageEl.textContent = 'Erreur réseau';
  }
});