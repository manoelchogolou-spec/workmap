const form = document.getElementById('report-form');
const errorEl = document.getElementById('error');
const successEl = document.getElementById('success');
const contributionId = getUrlParam('contribution_id');
const targetInfo = document.getElementById('target-info');

if (!contributionId) {
  errorEl.textContent = 'Contribution manquante (paramètre contribution_id absent).';
  errorEl.classList.remove('hidden');
  form.classList.add('hidden');
}

// Afficher le nom de la contribution ciblée
async function loadTarget() {
  try {
    const ctr = await api('/api/public/contributions/' + encodeURIComponent(contributionId));
    targetInfo.textContent = 'Vous signalez la contribution : « ' + ctr.organization_name + ' »';
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
    form.classList.add('hidden');
  }
}

async function checkSession() {
  try {
    const me = await api('/api/auth/me');
    if (me && me.id) {
      document.getElementById('anonymous-fields').classList.add('hidden');
    }
  } catch (err) {
    // non connecté : champs visibles
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.classList.add('hidden');
  successEl.classList.add('hidden');

  const data = {
    reason: form.reason.value,
    comment: form.comment.value || null
  };

  const anonFields = document.getElementById('anonymous-fields');
  if (!anonFields.classList.contains('hidden')) {
    data.reporterName = form.reporterName.value;
    data.reporterContact = form.reporterContact.value;
  }

  try {
    await api('/api/public/contributions/' + encodeURIComponent(contributionId) + '/reports', {
      method: 'POST',
      body: data
    });
    form.reset();
    successEl.textContent = 'Signalement enregistré. Il sera examiné par un modérateur.';
    successEl.classList.remove('hidden');
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
});

loadTarget();
checkSession();