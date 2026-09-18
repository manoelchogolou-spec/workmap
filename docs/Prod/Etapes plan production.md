```markdown
# 🚀 Plan de mise en production — MVP WorkMap

**Date de rédaction : 14 septembre 2026**
**Contexte :** phases 0 à 14 terminées et testées en local. Objectif :
rendre l'application exploitable sur un sous-domaine avec de vrais
utilisateurs et de vraies organisations béninoises.

---

## Rappel des contraintes non négociables

Stack figée : Node.js, Express, SQLite (better-sqlite3), bcryptjs,
cookie-parser, sessions en table SQL, HTML/CSS/JS natif en fetch, CommonJS.

Interdit : React, Vue, JWT, OAuth, ORM, Tailwind, Bootstrap, IA,
upload réel de fichiers, toute nouvelle dépendance npm sauf mention
explicite ci-dessous.

Règles absolues conservées :
1. Le schéma SQL fait foi : ne jamais inventer un nom de colonne.
   `audit_logs` utilise `user_id` + `actor_type` (pas `actor_id`).
   `users` utilise `password` (pas `password_hash`).
   `organizations.status` ∈ draft/pending/published/suspended/archived.
   `contributions` utilise `public_visibility` + `is_hidden`
   (pas `moderation_status`).
2. Les contributions restent séparées des organisations officielles.
3. Une contribution publique affiche toujours « Informations non vérifiées ».
4. Les coordonnées des contributeurs ne sont jamais publiques.
5. Les justificatifs restent hors base, dans `private/`.
6. Les handlers vivent dans les modules, jamais de nom nu dans `server.js`.
7. Toute action sensible appelle `logAudit()`.
8. Tests uniquement en fin de phase, jamais au fur et à mesure.
9. Ne pas commencer une phase avant validation explicite de la précédente.

---

## Décisions verrouillées le 14/09/2026

| Réf | Sujet | Décision |
|---|---|---|
| A1 | Attribution des rôles | **Cumul** conservé (`user_roles` reste many-to-many). L'UI liste les rôles actuels avec un bouton « retirer » et un `<select>` pour ajouter. Pas de remplacement destructif. |
| B2 | Rôle `administrator` | **Réservé.** Seul un utilisateur possédant `manage_roles` (per-007) peut attribuer ou retirer `rol-005`. `manage_users` seul ne suffit pas. Empêche David de s'auto-promouvoir. |
| C3+C1 | Premier admin en production | Un `seed-reference.sql` (référentiels seuls) + un script CLI `create-admin.js`. Reporté en **phase 19**. |
| D1 | Inscription publique | **Ouverte**, mais pilotée par un flag `REGISTRATION_OPEN` (défaut `true`), lu depuis `.env` en phase 19. Tout inscrit reçoit uniquement `contributor`. |
| E1 | Mot de passe oublié | **Réinitialisation par le gestionnaire** (pas d'email). Reporté en **phase 19**. Détail en annexe. |

---

## Phase 15 — Inscription publique et promotion de rôles

**But :** permettre à un inconnu de créer un compte contributeur, et à un
gestionnaire de le promouvoir depuis l'interface.

### Fichiers créés
- `server/modules/accounts.js` — validation, unicité email, hash, création
  user + rôle contributor en transaction, `logAudit`.
- `public/register.html` — formulaire d'inscription.
- `public/js/register.js` — soumission et gestion des erreurs.

### Fichiers modifiés
- `server/server.js` — route `POST /api/auth/register` (publique).
- `server/modules/users.js` — garde-fou B2 dans `addRoleToUser` et
  `removeRoleFromUser`.
- `public/users.html` / `public/js/users.js` — `<select>` des rôles
  assignables, liste des rôles actuels, bouton retirer.
- `public/login.html` — lien « Créer un compte ».
- `db/seed.sql` — déplacement cosmétique de `rp-023` dans le bon bloc.

### Route ajoutée

| Méthode | Route | Auth | Rôle |
|---|---|---|---|
| POST | `/api/auth/register` | aucune | Création d'un compte contributeur |

Réponses : `201 { ok: true }`, `400` (validation), `409` (email pris),
`403` (inscriptions fermées), `500`.

### Règles de validation
- `first_name`, `last_name` : trim, non vides, max 100.
- `email` : lowercase, format simple, max 255, unique.
- `password` : minimum 10 caractères.
- `password_confirm` : identique.
- Hash bcrypt cost 12 via `hashPassword()` existant.
- Statut initial `active`, rôle initial récupéré **par nom** `contributor`.
- Pas de connexion automatique : redirection vers `login.html`.

### Tests de fin de phase
- Inscription valide → 201, compte visible dans `users.html` avec le rôle
  contributor, connexion possible.
- Email déjà pris → 409, message clair.
- Mots de passe différents → 400.
- Mot de passe trop court → 400.
- Le hash n'apparaît jamais dans une réponse API.
- David promeut le nouveau compte en `verifier` → visible après
  reconnexion, `audit_logs` renseigné.
- David tente d'attribuer `administrator` → **403**.
- Estelle attribue `administrator` → **201**.
- Afi (contributeur) sur `/api/users` → **403**.

---

## Phase 16 — Charte graphique et refonte CSS

**But :** appliquer la direction artistique « Travail d'une vie » sans
framework CSS.

### Fichiers créés
- `public/css/theme.css` — variables `:root`, typographie, composants.

### Contenu
- Variables : `--vert-profond #087443`, `--jaune-ocre #E5A900`,
  `--rouge-terre #C84B31`, `--ivoire #F8F5ED`, `--brun-fonce #25231F`.
- Typographie : **Lora** (titres) et **Inter** (texte), chargées en local
  depuis `public/fonts/` — **pas de CDN Google Fonts** (dépendance externe,
  latence, RGPD).
- Répartition : ivoire et vert dominants, ocre et rouge terre en touches.
- Uniformisation : `border-radius`, `box-shadow`, états `:hover` et
  `:focus-visible` sur tous les éléments interactifs.
- Composants : boutons (primaire, secondaire, danger), formulaires,
  badges, cartes, messages.

### Fichiers modifiés
- Toutes les pages de `public/` pour lier `theme.css`.

### Tests de fin de phase
- Cohérence visuelle sur les 11 pages.
- Contraste texte/fond conforme WCAG AA.
- Aucune police chargée depuis un domaine tiers.
- Navigation au clavier visible sur tous les champs et boutons.

---

## Phase 17 — Navigation dynamique et responsive

**But :** une barre de navigation unique, adaptée au rôle et au mobile.

### Fichiers créés
- `public/js/nav.js` — injecte le `<nav>`, appelle `/api/auth/me`, adapte
  les liens selon les permissions, gère le menu hamburger.

### Comportement
- Visiteur : Accueil, Contribuer, Se connecter.
- Connecté : + Tableau de bord, Déconnexion.
- Selon permissions : Examiner, Modération, Utilisateurs, Administration.
- Mobile (`@media max-width: 768px`) : menu hamburger en CSS + toggle JS,
  fermeture à la sélection d'un lien.
- Attributs `aria-expanded` et `aria-controls` sur le bouton.

### Fichiers modifiés
- Toutes les pages de `public/` : suppression des menus dupliqués,
  ajout d'un point d'ancrage unique.
- `public/js/dashboard.js` : suppression de la génération des liens de rôle
  (désormais dans `nav.js`).

### Tests de fin de phase
- Un visiteur ne voit aucun lien réservé.
- Un contributeur ne voit pas « Administration ».
- Estelle voit tous les liens.
- Le hamburger fonctionne à 375px de large.
- Aucun lien réservé n'apparaît avant la réponse de `/api/auth/me`.

---

## Phase 18 — Cartes, recherche unifiée et retours visuels

**But :** rendre les listes utilisables sur mobile et clarifier la
distinction officiel / non vérifié.

### Fichiers créés
- `public/js/ui.js` — `toast(message, type)`, `setLoading(button, bool)`,
  `renderCard(data)`.

### Refonte de `index.html`
- Une **liste unique** de résultats en cartes.
- Deux cases à cocher en tête : `[X] Organisations officielles` (cochée),
  `[ ] Contributions non vérifiées` (décochée).
- Badge vert « Officiel » ou badge orange « ⚠️ Informations non vérifiées »
  sur chaque carte.
- Filtres existants conservés : département, commune, type, texte.

### Refonte des listes internes
- `review.html`, `moderation.html`, `users.html`, `admin.html` :
  remplacement des `<table>` par des cartes en grille CSS.
- Desktop : `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`.
- Mobile : une carte par ligne.

### Retours visuels
- Bouton `disabled` + texte « Chargement… » pendant chaque `fetch`.
- Toasts verts (succès) et rouges (erreur), disparition après 4 s,
  `role="status"` pour les lecteurs d'écran.

### Tests de fin de phase
- Aucun débordement horizontal à 375px sur les 11 pages.
- Case « contributions » décochée → aucune contribution affichée.
- Les deux cases cochées → badges correctement différenciés.
- Double clic sur un bouton de soumission → une seule requête envoyée.
- Un toast d'erreur apparaît si le serveur est arrêté.

---

## Phase 19 — Configuration, sécurité et amorçage production

**But :** rendre le déploiement possible et sûr. Phase la plus sensible.

### Nouvelle dépendance autorisée
`dotenv` uniquement. Aucune autre.

### Fichiers créés
- `.env.example` — modèle versionné, sans valeur secrète.
- `server/config.js` — lecture et validation des variables au démarrage.
- `db/seed-reference.sql` — départements, communes, secteurs, rôles,
  permissions, `role_permissions`. **Aucun utilisateur, aucune organisation
  fictive.**
- `scripts/create-admin.js` — CLI interactif : prénom, nom, email, mot de
  passe (saisie masquée), crée le compte + rôle `administrator` + `logAudit`.
- `scripts/init-db-prod.js` — `schema.sql` + `seed-reference.sql` seulement.
- `public/change-password.html` + `public/js/change-password.js`.

### Variables d'environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | 3000 | Port d'écoute |
| `NODE_ENV` | development | Bascule les cookies en `secure` |
| `SESSION_COOKIE_NAME` | wm_sid | Nom du cookie |
| `SESSION_DURATION_DAYS` | 7 | Durée de session |
| `REGISTRATION_OPEN` | true | Ouverture des inscriptions |
| `DB_PATH` | ./db/workmap.sqlite | Chemin de la base |

### Modification du schéma
```sql
ALTER TABLE users
  ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0
  CHECK (must_change_password IN (0, 1));
```
À intégrer aussi directement dans `db/schema.sql`.

### Routes ajoutées

| Méthode | Route | Permission | Rôle |
|---|---|---|---|
| POST | `/api/users/:id/reset-password` | manage_users | Génère un mot de passe temporaire, détruit les sessions, force le changement |
| POST | `/api/auth/change-password` | authentifié | Changement par l'utilisateur lui-même |

### Sécurité durcie
- Cookie : `httpOnly: true`, `sameSite: 'lax'`, `secure: NODE_ENV === 'production'`.
- `app.set('trust proxy', 1)` si reverse proxy.
- En-têtes manuels (sans helmet) : `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`.
- Limitation basique des tentatives de connexion : compteur en mémoire par
  IP, 10 essais par 15 minutes, réponse 429.
- Suppression de `db/workmap.sqlite` du dépôt si jamais versionné.
- Vérification que `private/` n'est pas servi par `express.static`.

### Tests de fin de phase
- Démarrage sans `.env` → valeurs par défaut, aucun crash.
- `NODE_ENV=production` → cookie `Secure` présent.
- `REGISTRATION_OPEN=false` → `/api/auth/register` renvoie 403 et le lien
  disparaît de `login.html`.
- `init-db-prod` → base sans aucun utilisateur ni organisation fictive.
- `create-admin` → connexion possible, rôle administrator effectif.
- Réinitialisation par le gestionnaire → sessions détruites, mot de passe
  temporaire affiché une seule fois, changement forcé à la connexion.
- 11 tentatives de connexion échouées → 429.
- Accès direct à `/private/...` → 404.

---

## Phase 20 — Déploiement et exploitation

**But :** mettre en ligne sur le sous-domaine et pouvoir exploiter
l'application dans la durée.

### Prérequis d'hébergement
- Serveur avec **système de fichiers persistant** et accès SSH.
  VPS type Hetzner, Contabo, Ionos, ou hébergement Node.js avec disque
  persistant. **À exclure : Vercel, Netlify, Heroku free** (système de
  fichiers éphémère, SQLite serait effacé).
- Node.js 18 ou supérieur.
- Certificat SSL Let's Encrypt.

### Fichiers créés
- `scripts/backup-db.js` — copie horodatée de la base via
  l'API `backup()` de better-sqlite3, rotation sur 14 jours.
- `docs/DEPLOIEMENT.md` — procédure pas à pas.

### Étapes de déploiement
1. Créer le sous-domaine et le faire pointer vers le serveur.
2. Installer Node.js et cloner le dépôt.
3. `npm ci --omit=dev`.
4. Créer `.env` avec `NODE_ENV=production`.
5. `node scripts/init-db-prod.js` puis `node scripts/create-admin.js`.
6. Lancer via un gestionnaire de processus (`pm2` ou service `systemd`)
   pour le redémarrage automatique.
7. Reverse proxy Nginx : HTTPS, redirection HTTP → HTTPS, `proxy_pass`
   vers le port local, en-têtes `X-Forwarded-*`.
8. Sauvegarde quotidienne par `cron` + copie hors serveur.

### Tests de fin de phase
- Le site répond en HTTPS sur le sous-domaine.
- `/api/health` renvoie `{ ok: true }`.
- Inscription, connexion, contribution, validation testées en réel.
- Redémarrage du serveur → sessions et données conservées.
- Le fichier de sauvegarde est bien généré et restaurable.
- Aucune page ne charge de ressource externe.

---

## Phase 21 — Contenus légaux et finalisation

**But :** le minimum indispensable pour une application publique.

### Fichiers créés
- `public/mentions-legales.html` — éditeur, hébergeur, contact.
- `public/confidentialite.html` — données collectées, finalité, durée de
  conservation, droits, rappel que les coordonnées des contributeurs ne
  sont jamais publiques.
- `public/a-propos.html` — mission, méthode de vérification, signification
  des badges « Officiel » et « Informations non vérifiées ».
- `public/404.html`.

### Fichiers modifiés
- Ajout d'un pied de page commun sur toutes les pages.
- `README.md` : section déploiement et sauvegarde.

### Tests de fin de phase
- Les trois pages légales sont accessibles depuis le pied de page.
- Une URL inexistante affiche la page 404.
- Le sens des badges est expliqué et accessible en un clic depuis l'accueil.

---

## Annexe — Mot de passe oublié, détail du choix

Aucun envoi d'email n'est possible dans le périmètre du MVP (pas de SMTP,
intégrations externes interdites). Trois options ont été examinées :

- **Jeton par email** : impossible sans SMTP.
- **Question secrète** : écartée, faille de sécurité classique, réponses
  devinables, alourdit l'inscription.
- **Réinitialisation par le gestionnaire** : retenue.

Flux retenu (phase 19) :
1. L'utilisateur contacte le gestionnaire hors ligne.
2. Le gestionnaire clique « Réinitialiser le mot de passe » dans `users.html`.
3. Le serveur génère un mot de passe aléatoire (`crypto.randomBytes`), le
   hash, détruit toutes les sessions, positionne `must_change_password = 1`,
   et renvoie le mot de passe **en clair une seule fois** dans la réponse.
4. Le mot de passe en clair n'est ni stocké, ni journalisé.
5. À la connexion suivante, l'utilisateur est redirigé vers
   `change-password.html` tant que `must_change_password = 1`.

Ce choix est adapté à une équipe restreinte et connue. Le jour où un SMTP
sera disponible, seule l'étape 3 change : l'envoi remplace l'affichage,
la route et la logique restent identiques.

---

## Récapitulatif des phases

| Phase | Objet | Dépendance ajoutée |
|---|---|---|
| 15 | Inscription et promotion de rôles | aucune |
| 16 | Charte graphique CSS | aucune |
| 17 | Navigation dynamique et responsive | aucune |
| 18 | Cartes, recherche unifiée, toasts | aucune |
| 19 | Configuration, sécurité, amorçage prod | `dotenv` |
| 20 | Déploiement et sauvegarde | `pm2` (système, hors npm projet) |
| 21 | Pages légales et finalisation | aucune |

---

## Texte à transmettre au prochain modèle

```text
Tu reprends le projet WorkMap, MVP local sans framework, en cours de
préparation pour la mise en production.

Stack figée : Node.js, Express, SQLite (better-sqlite3), bcryptjs,
cookie-parser, sessions en table SQL, HTML/CSS/JS natif en fetch, CommonJS.
Interdit : React, JWT, OAuth, ORM, Tailwind, IA, upload réel.
Seule dépendance nouvelle autorisée : dotenv, en phase 19 uniquement.

Phases 0 à 14 terminées et testées.
Plan de production : phases 15 à 21 (voir plan-production.md).

Décisions verrouillées : A1 cumul des rôles, B2 administrator réservé à
manage_roles, C3+C1 amorçage prod en phase 19, D1 inscription ouverte avec
flag REGISTRATION_OPEN, E1 mot de passe oublié par le gestionnaire.

Règles absolues :
1. Le schéma SQL fait foi. users.password (pas password_hash).
   audit_logs.user_id + actor_type. contributions.public_visibility +
   is_hidden.
2. Les handlers vivent dans les modules, jamais de nom nu dans server.js.
3. Tests uniquement en fin de phase.
4. Toute action sensible appelle logAudit().
5. Ne pas commencer une phase avant validation explicite.
6. Ne jamais exposer le hash du mot de passe.
7. Les coordonnées des contributeurs ne sont jamais publiques.

Avant de coder : npm run init-db && npm start, vérifier /api/health.
```

*Fin du plan de mise en production.*
```