// Composants d'interface communs — phase 18

// --- Toasts (notifications éphémères) ---

function getToastContainer() {
  let container = document.getElementById('toast-container');

  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  return container;
}

/**
 * Affiche un toast : vert pour 'success', rouge pour 'error'.
 * Disparition automatique après 4 s. Accessible via role="status".
 */
function toast(message, type) {
  const container = getToastContainer();

  const toastEl = document.createElement('div');
  toastEl.className = `toast toast-${type === 'error' ? 'error' : 'success'}`;
  toastEl.setAttribute('role', 'status');
  toastEl.textContent = message;

  container.appendChild(toastEl);

  setTimeout(() => {
    toastEl.remove();
  }, 4000);
}

// --- État de chargement des boutons ---

/**
 * Active/désactive un bouton pendant un fetch.
 * Sauvegarde le libellé d'origine pour le restituer.
 */
function setLoading(button, isLoading) {
  if (!button) return;

  if (isLoading) {
    button.dataset.originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = 'Chargement…';
  } else {
    button.disabled = false;
    if (button.dataset.originalLabel) {
      button.textContent = button.dataset.originalLabel;
    }
    delete button.dataset.originalLabel;
  }
}

// --- Cartes (remplacement des tableaux) ---

/**
 * Construit une carte <article class="card">.
 *
 * data = {
 *   title: string,                        // obligatoire, échappé ici
 *   subtitle: string (optionnel),
 *   badge: { label, type } (optionnel),   // type: 'official' | 'unverified' | 'pending' | ...
 *   fields: [{ label, value }] (optionnel), // lignes clé/valeur
 *   link: { href, text } (optionnel),     // lien principal en pied de carte
 *   actions: [{ text, onClick }] (optionnel) // boutons d'action
 * }
 */
function renderCard(data) {
  const card = document.createElement('article');
  card.className = 'card';

  // Titre
  if (data.title) {
    const title = document.createElement('h3');
    title.textContent = data.title;
    card.appendChild(title);
  }

  // Sous-titre
  if (data.subtitle) {
    const subtitle = document.createElement('p');
    subtitle.className = 'card-subtitle';
    subtitle.textContent = data.subtitle;
    card.appendChild(subtitle);
  }

  // Badge
  if (data.badge && data.badge.label) {
    const badge = document.createElement('span');
    badge.className = `badge badge-${data.badge.type || 'default'}`;
    badge.textContent = data.badge.label;
    card.appendChild(badge);
  }

  // Champs clé/valeur
  if (Array.isArray(data.fields) && data.fields.length > 0) {
    const list = document.createElement('ul');
    list.className = 'card-fields';

    for (const field of data.fields) {
      const li = document.createElement('li');
      const label = document.createElement('strong');
      label.textContent = field.label + ' : ';
      li.appendChild(label);
      li.appendChild(document.createTextNode(
        (field.value === null || field.value === undefined || field.value === '')
          ? '—'
          : String(field.value)
      ));
      list.appendChild(li);
    }
    card.appendChild(list);
  }

  // Lien principal
  if (data.link && data.link.href) {
    const link = document.createElement('a');
    link.href = data.link.href;
    link.className = 'button';
    link.textContent = data.link.text || 'Voir';
    card.appendChild(link);
  }

  // Boutons d'action
  if (Array.isArray(data.actions) && data.actions.length > 0) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'card-actions';

    for (const action of data.actions) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = action.text;
      btn.addEventListener('click', action.onClick);
      actionsDiv.appendChild(btn);
    }
    card.appendChild(actionsDiv);
  }

  return card;
}

// --- Grille de cartes ---

/**
 * Remplit un conteneur existant avec des cartes.
 * Accepte des descripteurs OU des éléments DOM déjà construits.
 * Renvoie le conteneur. Affiche emptyMessage si la liste est vide.
 */
function renderCardGrid(containerId, cardsData, emptyMessage) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`renderCardGrid : conteneur #${containerId} introuvable.`);
    return null;
  }

  container.replaceChildren();
  container.classList.add('card-grid');

  if (!Array.isArray(cardsData) || cardsData.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = emptyMessage || 'Aucun résultat.';
    container.appendChild(empty);
    return container;
  }

  for (const data of cardsData) {
    container.appendChild(data instanceof HTMLElement ? data : renderCard(data));
  }

  return container;
}