async function loadContribution() {
  const id = getUrlParam('id');
  const errorEl = document.getElementById('error');
  const card = document.getElementById('ctr-card');

  if (!id) {
    errorEl.textContent = 'Identifiant manquant.';
    errorEl.classList.remove('hidden');
    return;
  }

  let ctr;
  try {
    ctr = await api('/api/public/contributions/' + encodeURIComponent(id));
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
    return;
  }

  document.title = 'WorkMap — ' + ctr.organization_name;
  card.classList.remove('hidden');

  document.getElementById('ctr-name').textContent = ctr.organization_name;
  document.getElementById('ctr-type').textContent =
    TYPE_LABELS[ctr.organization_type] || ctr.organization_type;

  const details = [
    ['Département', ctr.department_name],
    ['Commune', ctr.commune_name],
    ['Quartier', ctr.neighborhood],
    ['Adresse', ctr.address],
    ['Téléphone', ctr.phone],
    ['Email', ctr.email],
    ['Site web', ctr.website],
    ['Secteur d’activité', ctr.activity_sector_name],
    ['Description', ctr.description],
    ['Soumise le', ctr.created_at ? ctr.created_at.slice(0, 10) : null]
  ];

  const dl = document.getElementById('ctr-details');
  details.forEach(([label, value]) => {
    if (!value) return;
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    dl.appendChild(dt);
    dl.appendChild(dd);
  });

  document.getElementById('report-link')
    .href = '/report.html?contribution_id=' + encodeURIComponent(ctr.id);
}

loadContribution();