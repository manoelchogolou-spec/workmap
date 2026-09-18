// Helper API central — tous les appels passent par ici

// GET : retourne les données, ou { error, status } (jamais d'exception réseau)
async function getJson(path) {
  const res = await fetch(path, { credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data.error || 'Erreur ' + res.status, status: res.status };
  return data;
}

// POST/PUT : body = objet JS (sérialisé ici), même contrat de retour que getJson
async function postJson(path, body, method = 'POST') {
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data.error || 'Erreur ' + res.status, status: res.status };
  return data;
}

// Alias historique utilisé par home.js / contribute.js
async function api(path, { method = 'GET', body } = {}) {
  if (method === 'GET' && !body) {
    const res = await fetch(path, { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Erreur ' + res.status);
    return data;
  }
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erreur ' + res.status);
  return data;
}

// Construit une query string (ignore les valeurs vides)
function buildQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined);
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries).toString();
}

// Petit helper pour lire ?id= dans l'URL
function getUrlParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Libellés lisibles
const TYPE_LABELS = {
  private_profit: 'Privée lucrative',
  private_nonprofit: 'Privée non lucrative',
  public: 'Publique'
};

const REASON_LABELS = {
  false_information: 'Informations fausses',
  duplicate: 'Doublon',
  personal_data: 'Données personnelles exposées',
  abusive_content: 'Contenu abusif',
  impersonation: 'Usurpation d’identité',
  nonexistent_organization: 'Organisation inexistante',
  other: 'Autre'
};

const CORRECTABLE_FIELD_LABELS = {
  name: 'Nom',
  description: 'Description',
  neighborhood: 'Quartier',
  address: 'Adresse',
  phone: 'Téléphone',
  email: 'Email',
  website: 'Site web'
};