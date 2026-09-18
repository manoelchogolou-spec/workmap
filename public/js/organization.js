async function loadOrganization() {
  const id = getUrlParam('id');
  const errorEl = document.getElementById('error');
  const card = document.getElementById('org-card');

  if (!id) {
    errorEl.textContent = 'Identifiant manquant.';
    errorEl.classList.remove('hidden');
    return;
  }

  let org;
  try {
    org = await api('/api/public/organizations/' + encodeURIComponent(id));
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
    return;
  }

  document.title = 'WorkMap — ' + org.name;
  card.classList.remove('hidden');

  document.getElementById('org-name').textContent = org.name;
  document.getElementById('org-type').textContent = TYPE_LABELS[org.type] || org.type;

  const details = [
    ['Département', org.department_name],
    ['Commune', org.commune_name],
    ['Quartier', org.neighborhood],
    ['Adresse', org.address],
    ['Téléphone', org.phone],
    ['Email', org.email],
    ['Site web', org.website],
    ['Description', org.description]
  ];

  const dl = document.getElementById('org-details');
  details.forEach(([label, value]) => {
    if (!value) return;
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    dl.appendChild(dt);
    dl.appendChild(dd);
  });

  // Spécialisation selon le type
  const specDiv = document.getElementById('org-specialization');
  const spec = org.specialization;
  if (spec) {
    const title = document.createElement('h3');
    let fields = [];

    if (org.type === 'private_profit') {
      title.textContent = 'Informations légales';
      fields = [
        ['IFU', spec.ifu],
        ['RCCM', spec.rccm],
        ['Forme juridique', spec.legal_form],
        ['Secteur d’activité', spec.activity_sector_name]
      ];
    } else if (org.type === 'private_nonprofit') {
      title.textContent = 'Informations légales';
      fields = [
        ['Numéro RAF', spec.raf_number],
        ['IFU', spec.ifu],
        ['Forme', spec.organization_form],
        ['Secteur d’activité', spec.activity_sector_name]
      ];
    } else {
      title.textContent = 'Informations publiques';
      fields = [
        ['Acte de création', spec.creation_act],
        ['Référence', spec.creation_act_reference],
        ['Date de création', spec.creation_date]
      ];
    }

    const dl2 = document.createElement('dl');
    fields.forEach(([label, value]) => {
      if (!value) return;
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      dl2.appendChild(dt);
      dl2.appendChild(dd);
    });

    if (dl2.children.length > 0) {
      specDiv.appendChild(title);
      specDiv.appendChild(dl2);
    }
  }

  document.getElementById('correction-link')
    .href = '/correction.html?organization_id=' + encodeURIComponent(org.id);
}

loadOrganization();