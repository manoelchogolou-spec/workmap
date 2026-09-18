const form = document.getElementById('correction-form');
const errorEl = document.getElementById('error');
const successEl = document.getElementById('success');
const organizationId = getUrlParam('organization_id');
const targetInfo = document.getElementById('target-info');

if (!organizationId) {
  errorEl.textContent = 'Organisation manquante (paramètre organization_id absent).';
  errorEl.classList.remove('hidden');
  form.classList.add('hidden');
}

async function loadTarget() {
  try {
    const org = await api('/api/public/organizations/' + encodeURIComponent(organizationId));
    targetInfo.textContent = 'Vous demandez une correction pour : « ' + org.name + ' »';
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
    fieldName: form.fieldName.value,
    proposedValue: form.proposedValue.value,
    reason: form.reason.value || null
  };

  const anonFields = document.getElementById('anonymous-fields');
  if (!anonFields.classList.contains('hidden')) {
    data.submitterName = form.submitterName.value;
    data.submitterContact = form.submitterContact.value;
  }

  try {
    await api('/api/public/organizations/' + encodeURIComponent(organizationId) + '/corrections', {
      method: 'POST',
      body: data
    });
    form.reset();
    successEl.textContent = 'Demande de correction enregistrée. Elle sera examinée avant toute modification.';
    successEl.classList.remove('hidden');
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
});

loadTarget();
checkSession();