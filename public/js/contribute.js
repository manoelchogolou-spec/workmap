const form = document.getElementById('contribute-form');
const errorEl = document.getElementById('error');
const successEl = document.getElementById('success');
const departmentSelect = document.getElementById('department');
const communeSelect = document.getElementById('commune');
const sectorSelect = document.getElementById('sector');

let referentials = null;

// Charger les référentiels
async function loadReferentials() {
  referentials = await api('/api/public/referentials');

  referentials.departments.forEach(d => {
    const option = document.createElement('option');
    option.value = d.id;
    option.textContent = d.name;
    departmentSelect.appendChild(option);
  });

  referentials.activitySectors.forEach(s => {
    const option = document.createElement('option');
    option.value = s.id;
    option.textContent = s.name;
    sectorSelect.appendChild(option);
  });
}

// Filtre les communes selon le département choisi
function updateCommunes() {
  communeSelect.innerHTML = '<option value="">—</option>';
  const depId = departmentSelect.value;
  if (!depId) return;
  referentials.communes
    .filter(c => c.department_id === depId)
    .forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = c.name;
      communeSelect.appendChild(option);
    });
}

departmentSelect.addEventListener('change', updateCommunes);

// Si connecté : masquer les champs d'identité anonyme
async function checkSession() {
  try {
    const me = await api('/api/auth/me');
    if (me && me.id) {
      document.getElementById('anonymous-fields').classList.add('hidden');
      document.getElementById('connected-info').classList.remove('hidden');
      // Retirer required des champs masqués pour ne pas bloquer la soumission
      form.querySelectorAll('#anonymous-fields input').forEach(i => i.required = false);
    }
  } catch (err) {
    // Non connecté : champs anonymes visibles, rien à faire
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.classList.add('hidden');
  successEl.classList.add('hidden');

  const data = {
    organizationName: form.organizationName.value,
    organizationType: form.organizationType.value,
    description: form.description.value || null,
    departmentId: form.departmentId.value || null,
    communeId: form.communeId.value || null,
    neighborhood: form.neighborhood.value || null,
    address: form.address.value || null,
    phone: form.phone.value || null,
    email: form.email.value || null,
    website: form.website.value || null,
    activitySectorId: form.activitySectorId.value || null,
    publicVisibility: form.publicVisibility.checked,
    consent: form.consent.checked
  };

  // Champs anonymes uniquement si visibles (non connecté)
  if (!document.getElementById('anonymous-fields').classList.contains('hidden')) {
    data.contributorFirstName = form.contributorFirstName.value;
    data.contributorLastName = form.contributorLastName.value;
    data.contributorPhone = form.contributorPhone.value;
  }

  try {
    const result = await api('/api/public/contributions', { method: 'POST', body: data });
    form.reset();
    successEl.textContent =
      'Contribution enregistrée (statut : en attente).' +
      (result.published_at
        ? ' Elle est visible publiquement avec la mention « Informations non vérifiées ».'
        : ' Elle sera examinée avant toute publication.');
    successEl.classList.remove('hidden');
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
});

loadReferentials();
checkSession();