// Navigation commune de WorkMap

async function getCurrentUser() {
  const response = await fetch('/api/auth/me', {
    credentials: 'include'
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function createNavLink(href, label) {
  const link = document.createElement('a');
  link.href = href;
  link.textContent = label;
  return link;
}

async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } finally {
    window.location.href = '/login.html';
  }
}

// --- Menu hamburger (mobile) ---

function createNavToggle(nav) {
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'nav-toggle';
  button.textContent = '☰ Menu';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'main-nav');

  button.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('nav-open');
    button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Fermeture à la sélection d'un lien (ou bouton) du menu
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a, button')) {
      nav.classList.remove('nav-open');
      button.setAttribute('aria-expanded', 'false');
    }
  });

  // Fermeture au clic extérieur
  document.addEventListener('click', (event) => {
    if (!event.target.closest('#main-nav') && !event.target.closest('#nav-toggle')) {
      nav.classList.remove('nav-open');
      button.setAttribute('aria-expanded', 'false');
    }
  });

  // Inséré juste avant le nav, dans le header
  nav.parentNode.insertBefore(button, nav);
}

async function initNav() {
  const nav = document.getElementById('main-nav');

  if (!nav) {
    console.warn('Navigation impossible : élément #main-nav absent.');
    return;
  }

  // Bouton hamburger (invisible en desktop via CSS)
  createNavToggle(nav);

  nav.replaceChildren();
  nav.appendChild(createNavLink('/index.html', 'Accueil'));
  nav.appendChild(createNavLink('/contribute.html', 'Contribuer'));

  try {
    const user = await getCurrentUser();

    // Visiteur non connecté
    if (!user) {
      nav.appendChild(createNavLink('/login.html', 'Connexion'));
      nav.appendChild(createNavLink('/register.html', 'Inscription'));
      return;
    }

    const permissions = Array.isArray(user.permissions)
      ? user.permissions
      : [];

    // Utilisateur connecté
    nav.appendChild(createNavLink('/dashboard.html', 'Tableau de bord'));

    nav.appendChild(createNavLink('/change-password.html', 'Mot de passe'));

    if (permissions.includes('review_contribution')) {
      nav.appendChild(
        createNavLink('/review.html', 'Examen des contributions')
      );
    }

    if (
      permissions.includes('review_contribution_report') ||
      permissions.includes('review_correction')
    ) {
      nav.appendChild(createNavLink('/moderation.html', 'Modération'));
    }

    if (permissions.includes('manage_users')) {
      nav.appendChild(
        createNavLink('/users.html', 'Gestion des utilisateurs')
      );
    }

    if (
      permissions.includes('archive_organization') ||
      permissions.includes('view_audit_logs')
    ) {
      nav.appendChild(createNavLink('/admin.html', 'Administration'));
    }

    const logoutButton = document.createElement('button');
    logoutButton.type = 'button';
    logoutButton.textContent = 'Déconnexion';
    logoutButton.addEventListener('click', logout);

    nav.appendChild(logoutButton);
  } catch (error) {
    console.error('Erreur de chargement de la navigation :', error);

    nav.appendChild(createNavLink('/login.html', 'Connexion'));
    nav.appendChild(createNavLink('/register.html', 'Inscription'));
  }
}