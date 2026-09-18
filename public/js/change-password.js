(async function () {
  const form = document.getElementById('change-password-form');
  const message = document.getElementById('message');
  const forcedNotice = document.getElementById('forced-notice');

  const user = await getJson('/api/auth/me');

  if (user.error) {
    window.location.href = 'login.html';
    return;
  }

  if (user.must_change_password) {
    forcedNotice.hidden = false;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    message.textContent = '';

    const newPassword = form.new_password.value;
    const confirm = form.new_password_confirm.value;

    if (newPassword !== confirm) {
      message.textContent = 'La confirmation ne correspond pas.';
      return;
    }

    const result = await postJson('/api/auth/change-password', {
      current_password: form.current_password.value,
      new_password: newPassword,
      new_password_confirm: confirm
    });

    if (result.error) {
      message.textContent = result.error;
      return;
    }

    message.textContent = 'Mot de passe changé. Redirection...';
    form.reset();
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1200);
  });
})();