// Page d'accueil — recherche unifiée en cartes (phase 18)

const searchForm = document.getElementById('search-form');
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search');
const departmentSelect = document.getElementById('department');
const communeSelect = document.getElementById('commune');
const typeSelect = document.getElementById('type');
const showOfficialCheckbox = document.getElementById('show-official');
const showContributionsCheckbox = document.getElementById('show-contributions');

let ALL_COMMUNES = [];

function formatDate(iso) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

// Recharge la liste des communes selon le département choisi
function refreshCommuneOptions() {
  const departmentId = departmentSelect.value;

  communeSelect.replaceChildren();

  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'Toutes';
  communeSelect.appendChild(allOption);

  for (const c of ALL_COMMUNES) {
    if (departmentId && c.department_id !== departmentId) continue;
    const option = document.createElement('option');
    option.value = c.id;
    option.textContent = c.name;
    communeSelect.appendChild(option);
  }
}

async function loadReferentials() {
  const data = await api('/api/public/referentials');

  // Départements
  for (const d of data.departments) {
    const option = document.createElement('option');
    option.value = d.id;
    option.textContent = d.name;
    departmentSelect.appendChild(option);
  }

  // Communes (gardées en mémoire pour filtrage par département)
  ALL_COMMUNES = data.communes;
  refreshCommuneOptions();
}

function organizationToCard(org) {
  return {
    title: org.name,
    subtitle: TYPE_LABELS[org.type] || org.type,
    badge: { label: 'Officiel', type: 'official' },
    fields: [
      { label: 'Commune', value: org.commune_name || '—' },
      { label: 'Téléphone', value: org.phone || '—' }
    ],
    link: { href: `/organization.html?id=${org.id}`, text: 'Voir la fiche officielle' }
  };
}

function contributionToCard(ctr) {
  return {
    title: ctr.organization_name,
    subtitle: TYPE_LABELS[ctr.organization_type] || ctr.organization_type,
    badge: { label: '⚠️ Informations non vérifiées', type: 'unverified' },
    fields: [
      { label: 'Commune', value: ctr.commune_name || '—' },
      { label: 'Soumise le', value: formatDate(ctr.created_at) }
    ],
    link: { href: `/contribution.html?id=${ctr.id}`, text: 'Voir la fiche provisoire' }
  };
}

async function loadResults() {
  const showOfficial = showOfficialCheckbox.checked;
  const showContributions = showContributionsCheckbox.checked;

  const params = {
    search: searchInput.value.trim(),
    commune_id: communeSelect.value,
    type: typeSelect.value
  };
  const query = buildQuery(params);

  setLoading(searchBtn, true);

  try {
    // Aucune case cochée : résultat vide explicite, pas d'appel réseau
    if (!showOfficial && !showContributions) {
      renderCardGrid('results-grid', [], 'Cochez au moins une source de résultats.');
      document.getElementById('reliability-hint').classList.add('hidden');
      return;
    }

    const requests = [];
    if (showOfficial) {
      requests.push(api('/api/public/organizations' + query));
    } else {
      requests.push(Promise.resolve([]));
    }
    if (showContributions) {
      requests.push(api('/api/public/contributions' + query));
    } else {
      requests.push(Promise.resolve([]));
    }

    const [organizations, contributions] = await Promise.all(requests);

    // Tri : organisations officielles d'abord, puis contributions
    const cards = [
      ...organizations.map(organizationToCard),
      ...contributions.map(contributionToCard)
    ];

    renderCardGrid(
      'results-grid',
      cards,
      'Aucun résultat pour cette recherche.'
    );

    document.getElementById('reliability-hint')
      .classList.toggle('hidden', contributions.length === 0);

  } catch (error) {
    toast(error.message || 'Erreur de chargement des résultats.', 'error');
  } finally {
    setLoading(searchBtn, false);
  }
}

// Si le département change, on restreint les communes
departmentSelect.addEventListener('change', () => {
  refreshCommuneOptions();
});

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  loadResults();
});

// Les cases à cocher relancent la recherche immédiatement
showOfficialCheckbox.addEventListener('change', loadResults);
showContributionsCheckbox.addEventListener('change', loadResults);

loadReferentials()
  .then(loadResults)
  .catch(error => {
    toast(error.message || 'Impossible de charger les référentiels.', 'error');
  });