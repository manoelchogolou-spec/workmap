# Plan de réalisation — MVP WorkMap (de 0)

Objectif : livrer le MVP **local, simple, complet fonctionnellement**, avec base SQLite, sans OAuth, sans JWT, sans UI soignée. Tests **uniquement en fin de phase**.

## 0. Règles du projet (ne pas les casser)

1. Contributions ≠ organisations officielles.
2. Contribution publique = mention **« Informations non vérifiées »**.
3. Identité / coordonnées du contributeur **jamais** affichées au public.
4. Justificatifs **hors base**, privés.
5. Une correction **n’écrit pas** directement l’organisation : validation d’abord, puis historique.
6. Rôles via `user → rôle → permission`.
7. Pas de Gmail, Passport, React, Prisma, JWT, Tailwind.
8. Une phase = un livrable testable. On ne commence pas la suivante tant que les tests de fin de phase ne passent pas.

## 1. Stack figée

| Couche | Choix | Rôle |
|---|---|---|
| Runtime | Node.js (LTS) | Serveur |
| HTTP | **Express** | Routes, JSON, fichiers statiques |
| Base | **SQLite** + `better-sqlite3` | Données, synchrone, simple |
| Mots de passe | **bcryptjs** (cost 12) | Aligné avec le seed |
| Session | Cookie `httpOnly` + table `sessions` | Login / rôles / logout |
| IDs | `crypto.randomUUID()` | Natif, pas de lib `uuid` |
| Front | HTML + 1 CSS + JS `fetch` | Interface minimale |
| Validation | Contrôles manuels dans les handlers | Zod **hors MVP** |

**Interdit pour ce MVP :** JWT, OAuth, framework front, ORM, Docker obligatoire, upload cloud.

## 2. Structure de dossiers (à créer dès la phase 0)

```
workmap/
├── .gitignore
├── package.json
├── README.md                  # rempli en phase 14, stub dès le début
├── db/
│   ├── schema.sql
│   ├── seed.sql
│   └── workmap.sqlite         # généré, gitignored
├── scripts/
│   └── init-db.js
├── server/
│   ├── server.js
│   ├── db.js
│   ├── auth.js
│   ├── helpers.js
│   └── modules/
│       ├── users.js
│       ├── organizations.js
│       ├── contributions.js
│       ├── reports.js
│       ├── corrections.js
│       ├── verifications.js
│       └── stats.js
├── public/
│   ├── index.html
│   ├── organization.html
│   ├── contribution.html
│   ├── contribute.html
│   ├── report.html
│   ├── correction.html
│   ├── login.html
│   ├── dashboard.html
│   ├── style.css
│   └── js/
│       ├── api.js
│       ├── home.js
│       ├── contribute.js
│       ├── login.js
│       └── dashboard.js
├── private/                   # pièces jointes, gitignored
└── docs/                      # tes markdown existants


Convention d’un module (`contributions.js`, etc.) :

1. Accès SQL  
2. Règles métier  
3. Handlers Express (`req, res`)

## Phase 0 — Squelette du projet

**But :** un dossier npm qui démarre, sans métier.

### Tâches
1. `git init`, `.gitignore` (`node_modules/`, `db/workmap.sqlite`, `private/`)
2. `npm init -y`
3. Installer **uniquement** : `express`, `better-sqlite3`, `bcryptjs`, `cookie-parser`
4. Créer les dossiers vides
5. `package.json` scripts :
   - `"init-db": "node scripts/init-db.js"`
   - `"start": "node server/server.js"`
6. `README.md` d’une ligne : « WorkMap MVP — installation en phase 14 »

### Tests de fin de phase
- `npm start` échoue encore (pas de serveur) **ou** tu laisses un `server.js` qui écoute et répond `ok` — au choix, mais **pas de routes métier**.
- `node_modules` ignoré par Git.

## Phase 1 — Base de données SQLite

**But :** fichier `workmap.sqlite` avec les **20 tables** + seed, vérifiable dans un client SQLite.

### Tâches
1. Traduire `docs/database.md` dans `db/schema.sql` :
   - `PRAGMA foreign_keys = ON;`
   - UUID → `TEXT PRIMARY KEY`
   - ENUM → `TEXT` + `CHECK (...)`
   - BOOLEAN → `INTEGER CHECK (x IN (0, 1))`
   - TIMESTAMP → `TEXT` ISO-8601
   - JSON → `TEXT` (si besoin)
2. **Ajouter** la table `sessions` (absente du métier, nécessaire à l’auth simple) :

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
```

3. `scripts/init-db.js` :
   - supprime / recrée `db/workmap.sqlite`
   - exécute `schema.sql`
   - exécute `seed.sql`
4. `db/seed.sql` à partir de `docs/donnée seed.md` :
   - **régénérer les 6 hashs bcrypt** pour `Password123!` (les hashs du markdown sont tronqués, inutilisables)
   - rôles, permissions, `role_permissions`, `user_roles`
   - référentiels (départements, communes, secteurs)
   - organisations / contributions / signalements / corrections / audits du jeu fictif
5. Ne **pas** stocker les PDF en base : chemins `private/...` seulement.

### Compte de test (tous : `Password123!`)

| Email | Rôle | Statut |
|---|---|---|
| `afi.dossou@example.test` | contributeur | active |
| `boris.h@example.test` | vérificateur | active |
| `carine.kora@example.test` | modérateur | active |
| `david.soglo@example.test` | gestionnaire | active |
| `estelle.bio@example.test` | administrateur | active |
| `firmin.zinsou@example.test` | aucun | suspended |

### Tests de fin de phase
Ouvrir la base (DB Browser for SQLite ou `sqlite3`) :

- 20 tables métier + `sessions`
- `PRAGMA foreign_keys;` = 1
- 6 users, hashs `$2a$12$...` complets
- au moins 1 org `published`, 1 contribution `pending` publique
- utilisateur suspendu présent
- `SELECT COUNT(*)` sur chaque table seedée > 0 si le seed le prévoit

**Ne pas** lancer le serveur métier ici.

## Phase 2 — Serveur Express minimal

**But :** pages HTML statiques + 1 API JSON.

### Tâches
1. `server/db.js` : une seule connexion `better-sqlite3`, `pragma foreign_keys = on`
2. `server/helpers.js` : `sendJson`, `sendError`, `parse` query, `nowIso()`
3. `server/server.js` :
   - `express.json()`
   - `cookie-parser`
   - `express.static('public')`
   - `GET /api/health` → `{ ok: true }`
4. Pages vides cliquables : `index.html`, `login.html`, `dashboard.html` (titres seulement)
5. `public/style.css` : lisible, pas de design (contraste, formulaires, tableaux)
6. `public/js/api.js` : `api(path, { method, body })` avec `credentials: 'include'`

### Tests de fin de phase
- `npm start` → port 3000
- `http://localhost:3000/` affiche l’accueil
- navigation entre 2–3 pages HTML
- `GET /api/health` → JSON
- fichier CSS chargé
- **aucun** login encore

## Phase 3 — Authentification (cookie + bcrypt)

**But :** se connecter avec un user du seed et voir un écran différent selon le rôle.

### Tâches
1. `server/auth.js` :
   - `hashPassword` / `verifyPassword` (bcryptjs)
   - `createSession(userId)` → insert `sessions` + cookie `wm_sid` (`httpOnly`, `SameSite=Lax`, 7 jours)
   - `destroySession`
   - `loadUser(req)` : cookie → session non expirée → user `active` → rôles → permissions
   - `requireAuth(req, res, next)`
   - `requirePermission('...')`
   - refuser `suspended` / `disabled`
2. Routes :
   - `POST /api/auth/login` `{ email, password }`
   - `POST /api/auth/logout`
   - `GET /api/auth/me`
3. `login.html` + `login.js`
4. `dashboard.html` : si non connecté → redirect login ; sinon message + rôle(s)
5. Ne pas exposer `password` dans `/me`

### Tests de fin de phase
| Cas | Attendu |
|---|---|
| Login Afi | 200, cookie, `/me` = contributeur |
| Login Estelle | administrateur |
| Login Firmin | 403 / message compte suspendu |
| Mauvais mot de passe | 401 |
| Logout | `/me` → 401 |
| Redémarrer Node | session encore valide (table `sessions`) |
| Page dashboard sans cookie | redirigé vers login |

## Phase 4 — Couche d’accès aux données

**But :** SQL centralisé, handlers encore minces. **Pas de nouvelles pages.**

### Tâches
Pour chaque module, uniquement `findById`, `findAll(filters)`, `create`, `update` (et ce qui est évident) :

- `users.js` : users, roles, permissions, user_roles
- `organizations.js` + tables de spécialisation (profit / nonprofit / public)
- `contributions.js`
- `reports.js`
- `corrections.js`
- `verifications.js`
- `helpers.js` : `logAudit({ actorId, action, entityType, entityId, details })`

Pas de logique HTTP riche. Un smoke test interne possible : petites fonctions appelées depuis un script **temporaire** `scripts/smoke-repos.js` (à supprimer plus tard) **ou** simplement vérifier en lisant le code + 2 appels manuels via Node REPL.

### Tests de fin de phase
- `findById` d’une org seedée retourne la bonne ligne
- `findAll({ status: 'published' })` ne mélange pas les contributions
- `logAudit` insère une ligne `audit_logs`
- **aucune** nouvelle route métier obligatoire (tu peux exposer temporairement `GET /api/debug/orgs` puis la retirer)

## Phase 5 — Fonctionnalités publiques (sans compte)

**But :** cahier des charges visiteur (section 7 / objectifs publics).

### Pages
| Page | Rôle |
|---|---|
| `index.html` | Recherche + filtres (texte, commune, type, **niveau de fiabilité** : officiel / non vérifié) |
| `organization.html?id=` | Fiche officielle `published` uniquement |
| `contribution.html?id=` | Fiche provisoire + bandeau **Informations non vérifiées** |
| `contribute.html` | Création contribution `PENDING` (avec ou sans compte) |
| `report.html` | Signalement d’une contribution |
| `correction.html` | Demande de correction d’une org officielle |

### API (exemples)
- `GET /api/public/organizations`
- `GET /api/public/organizations/:id`
- `GET /api/public/contributions` (pending **et visibles**, pas hidden/rejected/duplicate)
- `GET /api/public/contributions/:id`
- `GET /api/public/referentials` (départements, communes, secteurs)
- `POST /api/public/contributions`
- `POST /api/public/contributions/:id/reports`
- `POST /api/public/organizations/:id/corrections`

### Règles
- Contributeur anonyme autorisé ; si connecté, lier `user_id` sans l’afficher.
- Prévenir dans le formulaire : la contribution **peut être prépubliée**.
- Org `draft` / `pending` / `suspended` / `archived` **invisibles** au public.
- Upload : option **chemins texte** pour le MVP (pas d’upload binaire si ça complexifie). Sinon `multipart` minimal vers `private/`.

### Tests de fin de phase
- Liste publique : orgs publiées + contributions pending visibles
- Filtre « officiel » vs « non vérifié »
- Fiche contribution : bandeau obligatoire, **pas** d’email/téléphone du contributeur
- Création anonyme → ligne `PENDING`
- Signalement et demande de correction s’enregistrent
- Org non publiée : 404 public
- Contribution masquée / rejetée / doublon : absente de la liste publique

## Phase 6 — Contributeur

**But :** « mes contributions » + suivi de statut.

### Tâches
- Permission : utilisateur connecté avec rôle contributeur (ou toute personne connectée qui a créé des contributions — coller au CDC)
- `GET /api/me/contributions`
- Dashboard : tableau id / nom / statut (`PENDING`, `VALIDATED`, `REJECTED`, `DUPLICATE`) / date
- Lecture seule : pas d’édition libre d’une contribution déjà publique (processus internes seulement)

### Tests de fin de phase
- Afi voit **ses** lignes, pas celles des autres
- Boris (vérificateur) n’a pas cette vue contributeur **sauf** s’il a aussi le rôle
- Visiteur non connecté : 401 sur `/api/me/contributions`
- Statuts du seed corrects

## Phase 7 — Vérificateur

**But :** examiner, décider, publier.

### Tâches
- Liste des contributions à examiner (`PENDING`, non masquées)
- Actions :
  - **valider** → org officielle `published` + contribution `VALIDATED` + `published_at` + audit
  - **rejeter** → `REJECTED`, motif, plus visible publiquement
  - **doublon** → `DUPLICATE` + `organization_id` existant, **aucune** nouvelle org
- Formulaire de vérification globale **et/ou** par champ (table verifications)
- Publication **uniquement** après validation

### Tests de fin de phase
- Valider une pending du seed → org `published` visible au public
- Rejeter → disparaît du public
- Doublon → 0 nouvelle org, lien vers l’existante
- Afi ne peut pas valider (403)
- Vérifications enregistrées
- Audit écrit

## Phase 8 — Modérateur

**But :** signalements, visibilité, corrections.

### Tâches
- Liste des signalements + traitement
- Masquer / restaurer une contribution (`hide_public_contribution` / `restore_public_contribution`)
- Demandes de correction : approuver / rejeter
- Si approuvée :
  1. snapshot ancienne valeur → `organization_changes`
  2. appliquer la nouvelle valeur à l’org
  3. audit
- Le modérateur **ne** vérifie **pas** métier (pas de valider/rejeter contribution ici)

### Tests de fin de phase
- Masquer → fiche absente du public
- Restaurer → réapparaît avec « non vérifiée »
- Correction approuvée → org mise à jour **et** historique
- Correction rejetée → org inchangée
- Carine peut masquer ; Afi ne peut pas

## Phase 9 — Gestionnaire des utilisateurs

**But :** comptes et rôles, pas le contenu métier.

### Tâches
- Liste users (sans hash mot de passe)
- Suspendre / réactiver (`active` / `suspended`)
- Attribuer / retirer un rôle (`user_roles` + `assigned_by`)
- Un user suspendu : login refusé **immédiatement** (session : soit delete sessions, soit `loadUser` vérifie le statut à chaque requête — **préférer les deux**)

### Tests de fin de phase
- David suspend Afi → Afi ne se reconnecte plus ; cookie existant rejeté
- Attribution rôle vérificateur à Afi → elle voit les actions vérificateur après **rechargement** (session recharge les rôles à chaque requête : c’est pour ça qu’on n’utilise pas JWT)
- Estelle peut aussi le faire si le CDC le dit ; Afi 403

## Phase 10 — Administrateur

**But :** CRUD orgs, rôles/permissions, traçabilité globale.

### Tâches
- CRUD organisations + changement de statut (`draft` → `published` → `suspended` / `archived`)
- Gestion rôles et permissions (`roles`, `permissions`, `role_permissions`)
- Vue `audit_logs` (filtres simples : date, acteur, action)
- Org non publiée **jamais** présentée comme fiche officielle publique

### Tests de fin de phase
- Admin publie / archive une org
- Org archivée invisible au public
- Modification des permissions d’un rôle
- Audit lisible
- Non-admin : 403

## Phase 11 — Statistiques

**But :** indicateurs de la section 21 du CDC, page tableau de bord **chiffres bruts**.

### Tâches
- `server/modules/stats.js` : requêtes d’agrégation SQL
- `GET /api/stats` (permission admin et/ou gestionnaire — coller au CDC)
- Dashboard : blocs texte/tableaux (nombre d’orgs publiées, contributions pending, validées, rejetées, doublons, signalements ouverts, corrections, users actifs, etc.)
- Rappeler visuellement : **activité ≠ fiabilité**

### Tests de fin de phase
- Chiffres cohérents avec un `COUNT` manuel SQL
- Pas de fuite de données privées dans les stats publiques (stats = espace connecté)

## Phase 12 — Audit & historique (bouclage)

**But :** toutes les actions sensibles passent par `logAudit()` ; historique org complet.

### Tâches
1. Checklist d’appels `logAudit` :
   - login échoué (optionnel) / login ok si tu veux
   - création contribution
   - prépublication / changement visibilité
   - validation / rejet / doublon
   - masquage / restauration
   - correction approuvée
   - changement statut user / rôles
   - CRUD org admin
2. Vérifier `organization_changes` sur chaque correction approuvée du seed + 1 test manuel
3. Aucune action critique « silencieuse »

### Tests de fin de phase
- Rejouer 5 actions sensibles → 5 lignes audit
- Correction : ancienne + nouvelle valeur présentes
- Justificatifs toujours hors JSON public

## Phase 13 — Tests manuels croisés

**But :** section 23 (flux) + section 26 (acceptation), **avec le jeu de données**.

Méthode : `npm run init-db` pour reset, puis checklist papier.

### Parcours minimum (dans l’ordre)
1. Visiteur cherche / filtre officiel vs non vérifié  
2. Visiteur ouvre une contribution → bandeau non vérifié  
3. Visiteur contribue sans compte  
4. Visiteur signale  
5. Visiteur demande une correction  
6. Afi : mes contributions  
7. Boris : valide une, rejette une, marque un doublon  
8. Public : org nouvelle visible ; rejetée/doublon invisibles  
9. Carine : masque puis restaure  
10. Carine : approuve une correction → historique  
11. David : suspend Firmin (déjà suspendu) / suspend Afi puis réactive  
12. Estelle : archive une org, lit l’audit, consulte les stats  
13. Firmin : login refusé  

Cocher **chaque** critère de la section 26 un par un.

Échec = bugfix **dans la phase concernée**, puis rejouer le parcours cassé. Pas de nouvelle feature.

## Phase 14 — Nettoyage et livraison

### Tâches
- Supprimer routes debug, `console.log`, code mort
- Vérifier `.gitignore`
- `README.md` :
  - prérequis Node
  - `npm install`
  - `npm run init-db`
  - `npm start`
  - comptes de test
  - structure
  - hors périmètre (emploi, IA, géoloc, API publique…)
- Un commit Git propre : `mvp-workmap`

### Tests de fin de phase
- Clone mental : install → init-db → start → login Estelle en 3 minutes
- `workmap.sqlite` non versionné
- README suffisant pour un tiers


## Ordre et dépendances (rappel)

```
0 squelette
  → 1 SQLite + seed
    → 2 Express + pages vides
      → 3 auth cookie
        → 4 repositories + logAudit
          → 5 public
            → 6 contributeur
              → 7 vérificateur
                → 8 modérateur
                  → 9 gestionnaire
                    → 10 admin
                      → 11 stats
                        → 12 audit (contrôle)
                          → 13 tests croisés
                            → 14 livraison
```

Ne **pas** fusionner 5–10 : chaque rôle est une phase testable.

## Ce qui reste volontairement simple

| Sujet | Décision MVP |
|---|---|
| JWT / Zod | Non |
| Upload réel | Chemins fictifs du seed d’abord ; upload fichier seulement si un flux casse sans ça |
| CSS | Un fichier, pas de framework |
| Dashboard | **Une** page, contenu selon `/api/auth/me` |
| Sessions | Table SQL, pas mémoire (survit au restart) |
| Tests auto | Non (manuels en fin de phase, comme demandé) |
| Multi-instance / HTTPS prod | Hors MVP |


## Définition de « phase finie »

Une phase est finie seulement si :

1. les fichiers prévus existent ;
2. `init-db` + `start` fonctionnent encore ;
3. **tous** les tests de fin de phase sont cochés ;
4. les 7 règles du §0 tiennent.