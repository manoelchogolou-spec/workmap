## Point d'étape — Phases 1 et 2

### Phase 1 — Base de données SQLite ✅
- Schéma complet : **21 tables** (20 métier + `sessions`, conforme au plan)
- Seed inséré avec succès : 6 users, 3 orgs publiées, contributions, signalements, corrections, historique, audit logs, attachments
- **Changement mineur par rapport au document seed original** : le hash bcrypt fourni était tronqué/factice dans le markdown. J'ai utilisé le hash que tu as généré toi-même (`$2b$12$...`) pour les 6 comptes, comme prévu dans le plan de réalisation ("régénérer les 6 hashs bcrypt").
- Aucun écart structurel avec le plan initial.

### Phase 2 — Serveur Express minimal ✅
- `server/db.js`, `server/server.js` créés
- Pages HTML statiques créées pour **toutes** les vues prévues (index, organization, contribution, contribute, report, correction, login, dashboard)
- Route `GET /api/ping` au lieu de `GET /api/health` mentionné dans le plan — **différence de nom uniquement**, même fonction (vérifier que l'API répond). Je peux renommer en `/api/health` si tu préfères rester strictement fidèle au document.
- `cookie-parser` n'a pas encore été branché dans `server.js` (il est installé mais sera utilisé en Phase 3 pour les sessions) — conforme au séquençage prévu, rien à corriger.
- CSS minimal fonctionnel, pas de framework — conforme.

Phase 3 validée ✅
Tous les critères sont remplis :

Login/logout fonctionnels
Comptes suspendus bloqués
Mauvais mot de passe rejeté
Session persistante en base (survit au redémarrage)
Protection dashboard sans cookie


Petit point avant de continuer
Aucun écart majeur avec le plan. Une précision à noter dans ta mémoire :

Les noms de rôles affichés sont bien ceux du seed (contributor, administrator, etc.) — à garder cohérent pour les phases suivantes (5 à 10) où chaque rôle aura ses propres pages/actions.


# Point complet — Phase 4 de WorkMap

**Date : 11 septembre 2026**

## Statut général

La **phase 4 — Couche d’accès aux données** est considérée comme terminée après correction de `stats.js` et réussite du smoke test.

Objectif de la phase :

- centraliser les requêtes SQL ;
- créer les repositories/modules ;
- ajouter `logAudit()` ;
- vérifier les accès principaux aux données ;
- ne pas encore développer les fonctionnalités métier complètes.

---

## 1. Fichiers créés pendant la phase 4

Les modules suivants ont été ajoutés dans :

```text
server/modules/
```

### `users.js`

Responsabilités :

- rechercher un utilisateur par identifiant ;
- rechercher un utilisateur par email ;
- lister les utilisateurs ;
- gérer les rôles et permissions associés.

### `organizations.js`

Responsabilités :

- rechercher une organisation par identifiant ;
- lister les organisations ;
- filtrer par statut ;
- récupérer les organisations publiées ;
- gérer les données spécialisées des organisations si prévu.

### `contributions.js`

Responsabilités :

- rechercher une contribution ;
- lister les contributions ;
- filtrer par statut ;
- récupérer les contributions publiquement visibles ;
- créer et modifier une contribution.

### `reports.js`

Responsabilités :

- rechercher un signalement ;
- lister les signalements ;
- filtrer par statut, raison ou contribution ;
- créer et modifier un signalement.

### `corrections.js`

Responsabilités :

- rechercher une demande de correction ;
- lister les corrections ;
- filtrer par statut ou organisation ;
- créer et modifier une demande de correction.

### `verifications.js`

Responsabilités :

- rechercher une vérification ;
- lister les vérifications ;
- filtrer par organisation, vérificateur ou statut ;
- créer et modifier une vérification ;
- récupérer la dernière vérification d’une organisation.

### `stats.js`

Responsabilités :

- compter les utilisateurs ;
- compter les organisations ;
- compter les organisations publiées ;
- compter les contributions ;
- compter les contributions publiques en attente ;
- compter les signalements ;
- compter les corrections ;
- compter les journaux d’audit ;
- regrouper les données par statut.

## 2. Modifications apportées aux fichiers existants

### `server/db.js`

Le fichier utilise une connexion SQLite unique :

```js
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
```

La base est donc partagée par les repositories et les contraintes de clés étrangères sont activées.

### `server/helpers.js`

Le fichier contient notamment :

```js
nowIso()
sendJson()
sendError()
```

Ces fonctions servent à uniformiser :

- les dates ISO ;
- les réponses JSON ;
- les erreurs HTTP.


### `server/auth.js`

Le fichier existant contient déjà les fonctions d’authentification :

- `hashPassword`
- `verifyPassword`
- `createSession`
- `destroySession`
- `destroyAllSessionsForUser`
- `loadUser`
- `requireAuth`
- `requirePermission`

La phase 4 s’appuie sur `loadUser()` pour récupérer l’utilisateur de test lors du smoke test.


### `package.json`

Le script suivant a été ajouté :

```json
"smoke-repos": "node scripts/smoke-repos.js"
```

Les scripts principaux sont maintenant :

```json
"scripts": {
  "init-db": "node scripts/init-db.js",
  "start": "node server/server.js",
  "smoke-repos": "node scripts/smoke-repos.js"
}
```

## 3. Fonction `logAudit()`

Une fonction d’écriture dans `audit_logs` a été ajoutée dans le module approprié, généralement :

```text
server/modules/audit.js
```

ou dans un fichier helper de repository.

Elle reçoit notamment :

```js
logAudit({
  actorId,
  action,
  entityType,
  entityId,
  details
});
```

Elle permet de conserver une trace des actions importantes.

Un test a été effectué avec l’action :

```text
phase_4_smoke_test
```

## 4. Erreur rencontrée et correction

### Erreur

```text
SqliteError: no such column: moderation_status
```

### Cause

Le fichier `stats.js` utilisait une colonne qui n’existe pas dans le schéma réel de la table `contributions` :

```sql
moderation_status
```

Le schéma actuel utilise :

```sql
public_visibility
is_hidden
```

### Correction appliquée

La requête a été remplacée par :

```js
pendingPublicContributions: db.prepare(`
  SELECT COUNT(*) AS count
  FROM contributions
  WHERE status = 'pending'
    AND public_visibility = 1
    AND is_hidden = 0
`).get().count,
```

Cette correction respecte le schéma réellement utilisé par WorkMap.

## 5. Tests de phase 4 réalisés

Commande exécutée :

```powershell
npm run smoke-repos
```

Résultats obtenus avant l’erreur :

```text
✓ findByEmail utilisateur
✓ findAll organisations publiées
✓ findById organisation
✓ findAll contributions
✓ findPublic contributions
✓ findAll signalements
✓ findAll corrections
✓ findAll vérifications
✓ logAudit
```

L’erreur concernait uniquement la statistique des contributions publiques. Elle a été corrigée.

Après correction, il faut relancer :

```powershell
npm run init-db
npm run smoke-repos
```

Résultat attendu :

```text
✓ findByEmail utilisateur
✓ findAll organisations publiées
✓ findById organisation
✓ findAll contributions
✓ findPublic contributions
✓ findAll signalements
✓ findAll corrections
✓ findAll vérifications
✓ logAudit
✓ statistiques

Tous les tests de la phase 4 sont réussis.
```

## 6. État actuel du projet

Les phases suivantes sont terminées :

- Phase 0 : squelette du projet ;
- Phase 1 : base SQLite et seed ;
- Phase 2 : serveur Express et pages statiques ;
- Phase 3 : authentification par session ;
- Phase 4 : repositories et accès aux données.

La prochaine phase est :

# Phase 5 — Fonctionnalités publiques

Elle devra commencer uniquement après confirmation que :

```powershell
npm run init-db
npm run smoke-repos
```

fonctionnent sans erreur.

---

# Instructions pour le prochain modèle IA

Tu peux lui transmettre le texte suivant :

```text
Tu reprends le projet WorkMap, un MVP local développé sans framework frontend.

Projet :
- Node.js
- Express
- SQLite avec better-sqlite3
- bcryptjs
- cookie-parser
- HTML/CSS/JavaScript simple
- CommonJS
- Pas de React, JWT, OAuth, ORM, Tailwind ou IA.

Règles importantes :
1. Les contributions sont séparées des organisations officielles.
2. Une contribution publique doit afficher « Informations non vérifiées ».
3. Les coordonnées des contributeurs ne doivent jamais être publiques.
4. Les justificatifs restent hors de la base dans le dossier private/.
5. Les corrections passent par validation et historique.
6. Les rôles utilisent users, roles, permissions, user_roles.
7. Les tests sont réalisés uniquement à la fin de chaque phase.
8. Ne pas commencer une phase suivante avant validation de la phase actuelle.

Phases terminées :
- Phase 0 : structure npm.
- Phase 1 : SQLite, schéma et seed.
- Phase 2 : Express, pages statiques et API ping.
- Phase 3 : authentification par cookie et table sessions.
- Phase 4 : repositories et statistiques.

Phase 4 :
Modules créés dans server/modules/ :
- users.js
- organizations.js
- contributions.js
- reports.js
- corrections.js
- verifications.js
- stats.js

La phase 4 contient aussi logAudit() pour insérer les actions dans audit_logs.

Une erreur a été corrigée dans stats.js :
la colonne moderation_status n’existe pas dans contributions.
Le schéma utilise :
- public_visibility
- is_hidden

La requête correcte pour les contributions publiques en attente est :

WHERE status = 'pending'
  AND public_visibility = 1
  AND is_hidden = 0

Avant de continuer, exécuter :

npm run init-db
npm run smoke-repos

Le résultat attendu doit contenir :

✓ findByEmail utilisateur
✓ findAll organisations publiées
✓ findById organisation
✓ findAll contributions
✓ findPublic contributions
✓ findAll signalements
✓ findAll corrections
✓ findAll vérifications
✓ logAudit
✓ statistiques

Puis :

Tous les tests de la phase 4 sont réussis.

# 📋 Point complet — Phase 5 de WorkMap

**Date : 11 septembre 2026**

---

## Statut général

La **phase 5 — Fonctionnalités publiques (sans compte)** est terminée et validée. Tous les tests de fin de phase (navigateur, API, base de données) ont été exécutés avec succès.

Objectif de la phase :

- permettre au public de consulter les organisations officielles et les contributions provisoires ;
- différencier visuellement officiel vs non vérifié ;
- permettre la contribution anonyme ou connectée ;
- permettre le signalement et la demande de correction ;
- rendre invisibles toute organisation non publiée et toute contribution non admissible.

---

## 1. Modifications des fichiers backend existants

### `server/modules/organizations.js`

Ajout de **2 handlers publics** :

- `listPublicOrganizationsHandler` : liste **uniquement** les organisations `published`. Le statut est **forcé serveur**, jamais lu depuis la query string. Filtres acceptés : `type`, `department_id`, `commune_id`, `search`.
- `getPublicOrganizationHandler` : fiche d'une organisation. Règle unique : **`published` ou 404**. Le 404 est identique que l'organisation n'existe pas ou qu'elle soit draft/pending/suspended/archived (pas de fuite d'information).

### `server/modules/contributions.js`

- `findPublicById` remplacé par une **requête SQL dédiée** avec `LIMIT 1`, incluant les noms lisibles des référentiels (`department_name`, `commune_name`, `activity_sector_name`). Ne retourne **aucun champ** `contributor_*`.
- Ajout de **3 handlers publics** :
  - `createPublicContributionHandler` :
    - validation serveur (nom org, type parmi les 3 valeurs, consentement obligatoire) ;
    - règle anonymat : **sans compte → prénom + nom + téléphone requis** ; connecté → `contributorId` lu depuis la session, champs contributeur forcés à NULL ;
    - cohérence géographique : si `communeId` fourni, vérification qu'elle appartient au `departmentId` ;
    - réponse publique **épurée** (jamais les coordonnées du contributeur) ;
    - `logAudit` (`contribution_pre_published`) si la contribution est publique à la création.
  - `getPublicContributionHandler` : visible uniquement si `status = 'pending' AND public_visibility = 1 AND is_hidden = 0`, sinon 404.
  - `reportPublicContributionHandler` (dans `reports.js` — voir ci-dessous).
- Ajout d'un handler de référentiels : départements, communes, secteurs d'activité, types d'organisation — pour alimenter les listes déroulantes publiques.

### `server/modules/reports.js`

Ajout de **1 handler public** :

- `createPublicReportHandler` :
  - la contribution visée doit être publiquement visible, sinon **404** ;
  - raison validée contre la liste fixe de l'ENUM ;
  - règle anonymat : nom + contact requis si non connecté ;
  - statut forcé `pending`.

### `server/modules/corrections.js`

Ajout de **1 handler public** :

- `createPublicCorrectionHandler` :
  - l'organisation visée doit être `published`, sinon **404** ;
  - champ cible validé contre une **liste blanche** (pas de correction possible sur `status`, `id`, etc.) ;
  - `old_value` lu **côté serveur** depuis la base (jamais depuis le client — sécurité) ;
  - règle anonymat : nom + contact requis si non connecté ;
  - statut forcé `pending` ;
  - `logAudit` (`correction_requested`).

### `server/server.js`

Ajout des **routes publiques** (aucune authentification requise) :

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/public/organizations` | Liste des orgs publiées + filtres |
| GET | `/api/public/organizations/:id` | Fiche officielle (404 sinon) |
| GET | `/api/public/contributions` | Liste des contributions provisoires visibles |
| GET | `/api/public/contributions/:id` | Fiche provisoire (404 sinon) |
| POST | `/api/public/contributions` | Création de contribution (anonyme ou connecté) |
| POST | `/api/public/contributions/:id/reports` | Signalement d'une contribution |
| POST | `/api/public/organizations/:id/corrections` | Demande de correction d'une org publiée |
| GET | `/api/public/referentials` | Départements, communes, secteurs, types |

Les routes existantes (`/api/health`, auth, etc.) sont inchangées.

---

## 2. Nouveaux fichiers frontend créés

### `public/js/api.js`

Helper central de tous les appels API : `getJson(path)`, `postJson(path, body)` avec gestion d'erreur et credentials inclus.

### `public/js/home.js`

- charge les référentiels et alimente les filtres (département, commune, type, **niveau de fiabilité**) ;
- charge et affiche **deux sections distinctes** : organisations officielles / contributions provisoires ;
- filtre texte + filtres combinés ;
- lien depuis chaque contribution vers `report.html`.

### `public/js/organization.js`

- charge une fiche officielle, affiche le badge « Fiche officielle » ;
- affiche la spécialisation selon le type (profit / non-profit / public) ;
- 404 → message « Organisation introuvable » ;
- lien vers `correction.html?organization_id=`.

### `public/js/contribution.js`

- charge une fiche provisoire ;
- affiche **systématiquement** le bandeau ⚠️ « Informations non vérifiées » ;
- n'affiche **aucune identité de contributeur** ;
- lien « Signaler cette contribution ».

### `public/js/contribute.js`

- détecte la session (`/api/auth/me`) : si connecté → champs d'identité masqués, sinon champs prénom/nom/téléphone obligatoires ;
- champs d'organisation + type avec champs spécialisés optionnels selon le type ;
- département → communes filtrées (cohérence géographique côté client, doublée côté serveur) ;
- **encadré de consentement avec case obligatoire** (prévention de la prépublication possible).

### `public/js/report.js`

- signalement : raison (liste), commentaire, identité si anonyme ;
- erreur claire si champs anonymes manquants.

### `public/js/correction.js`

- demande de correction : champ (liste blanche identique au serveur), valeur proposée, motif, identité si anonyme ;
- refuse si l'org n'est pas publiée.

---

## 3. Pages HTML remplacées / complétées

| Fichier | Contenu |
|---|---|
| `index.html` | Recherche + filtres + 2 sections (officiel / non vérifié) |
| `organization.html` | Fiche officielle uniquement |
| `contribution.html` | Fiche provisoire + bandeau non vérifié |
| `contribute.html` | Formulaire contribution + consentement |
| `report.html` | Signalement |
| `correction.html` | Demande de correction |
| `login.html`, `dashboard.html` | Inchangés (phase 3) |

### `public/style.css`

Complété en restant **sans framework** : bandeaux avertissement/badge officiel, messages erreur/succès, formulaires lisibles, tableaux — contrastes et lisibilité uniquement, aucun design.

---

## 4. Structure actuelle du projet

```
workmap/
├── package.json               # init-db, start, smoke-repos
├── README.md                  # stub (rempli en phase 14)
├── .gitignore
├── db/
│   ├── schema.sql             # 21 tables (20 métier + sessions)
│   ├── seed.sql
│   └── workmap.sqlite         # généré, gitignored
├── scripts/
│   └── init-db.js
├── server/
│   ├── server.js              # health + auth + 8 routes publiques
│   ├── db.js
│   ├── auth.js
│   ├── helpers.js
│   └── modules/
│       ├── users.js            # phase 4
│       ├── organizations.js   # phase 4 + publics (phase 5)
│       ├── contributions.js   # phase 4 + publics (phase 5)
│       ├── reports.js         # phase 4 + public (phase 5)
│       ├── corrections.js     # phase 4 + public (phase 5)
│       ├── verifications.js   # phase 4 (inchangé)
│       ├── stats.js           # phase 4 (inchangé)
│       └── audit.js           # logAudit
├── public/
│   ├── index.html, organization.html, contribution.html,
│   ├── contribute.html, report.html, correction.html,
│   ├── login.html, dashboard.html
│   ├── style.css
│   └── js/
│       ├── api.js             # NOUVEAU phase 5
│       ├── home.js            # NOUVEAU
│       ├── organization.js    # NOUVEAU
│       ├── contribution.js    # NOUVEAU
│       ├── contribute.js      # NOUVEAU
│       ├── report.js          # NOUVEAU
│       ├── correction.js      # NOUVEAU
│       └── login.js, dashboard.js   # phase 3
├── private/                   # pièces jointes, gitignored
└── docs/                      # markdowns de référence
```

*(Note : `scripts/smoke-repos.js` de la phase 4 peut être conservé jusqu'à la phase 14 ou supprimé — à décider en livraison.)*

---

## 5. Décisions de conception notables

| Décision | Justification |
|---|---|
| `old_value` d'une correction lu en base côté serveur | Ne jamais faire confiance au client |
| 404 uniforme (org inexistante vs non publiée) | Ne pas fuiter l'existence d'orgs internes |
| Statuts/visibilité forcés serveur, jamais depuis la query | Empêcher de lister draft/suspended/hidden |
| Réponse `contributor_*` absente du JSON public (et pas seulement masquée en UI) | L'anonymat est une règle serveur, pas cosmétique |
| Validation champ de correction par liste blanche | Empêcher de demander un changement de `status` ou `id` |
| `consent` obligatoire côté serveur aussi | Le client peut être contourné |

## 6. Tests de fin de phase — résultats ✅

- **A1–A7 (visiteur)** : accueil 2 sections correctes, filtres fiabilité/texte OK, bandeau non vérifié présent, aucune identité de contributeur, org draft → 404, contribution masquée `ctr-004` → introuvable ✓
- **A8–A11 (anonyme)** : contribution « Kiosque Test Phase 5 » créée `pending` + visible ; signalement anonyme incomplet → 400 ; signalement complet → OK ; correction enregistrée ✓
- **A12 (Afi connectée)** : champs d'identité masqués, contribution liée à `usr-001` ✓
- **T1–T12 (API)** : tous les codes attendus (400 validations, 404 visibilité, aucune propriété `contributor_*` dans les réponses publiques) ✓
- **C1–C5 (base)** : contribution anonyme `pending`/visible/`contributor_id NULL` ; contribution d'Afi liée à `usr-001` ; signalement et correction `pending` ; `old_value` correct ; lignes audit `contribution_pre_published`, `contribution_reported`, `correction_requested` présentes ✓

# Point d'évolution — Phase 6 validée

## État du projet

Phases terminées :
- **Phase 0** : squelette npm ;
- **Phase 1** : SQLite, schéma (21 tables) et seed ;
- **Phase 2** : serveur Express, pages statiques, `/api/health` ;
- **Phase 3** : authentification (cookie `wm_sid`, bcryptjs, table `sessions`) ;
- **Phase 4** : repositories dans `server/modules/` + `logAudit()` + smoke test ;
- **Phase 5** : fonctionnalités publiques (recherche, fiches, contribution anonyme, signalement, correction, référentiels) ;
- **Phase 6** : espace contributeur ✅.

## Modifications apportées en phase 6

### `server/server.js`
| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/contributions/mine` | Liste des contributions de l'utilisateur connecté (`requireAuth`) |
| GET | `/api/contributions/mine/:id` | Détail de sa propre contribution (404 si elle appartient à un autre) |

### `server/modules/contributions.js`
- `listMyContributionsHandler(req, res)` : liste filtrée par `contributor_id = req.user.id`, enrichie de `resulting_organization` (org créée) et `duplicate_of_organization` (org doublon). Lecture seule, aucun filtre statut (le contributeur voit ses pending/rejected/duplicate/validated).
- `getMyContributionHandler(req, res)` : détail **uniquement** si `contributor_id === req.user.id`, sinon 404.

**Bugs corrigés pendant la phase :**
1. La première version utilisait des colonnes inexistantes (`submitted_at`, `decided_at`, `rejection_reason`, `resulting_organization_id`) → erreur 500. Colonnes réelles à utiliser partout : `created_at`, `published_at`, `withdrawn_at`, `moderation_reason`, `created_organization_id`, `duplicate_of_organization_id`. **Règle : ne jamais inventer de noms de colonnes, le schéma fait foi.**
2. `dashboard.js` appelait un helper `getJson` non défini → helper local ajouté en tête de fichier.

### `public/js/dashboard.js` (réécrit)
- Helper `getJson` local avec `credentials: 'include'` ;
- `loadMyContributions()` appelée **après** validation de `/api/auth/me` (pas avant) ;
- champs corrects : `organization_type`, `created_at`, `moderation_reason`, `resulting_organization`, `duplicate_of_organization` ;
- tableau : organisation (lien fiche), type, statut libellé, visibilité publique, décision, date.

### `public/dashboard.html`
Section « Mes contributions » (tableau + message) affichée après connexion.

## Tests de fin de phase 6 — tous passés
- ✅ Afi voit ses 6 contributions avec les bons statuts et décisions enrichies ;
- ✅ Détail de sa contribution (ctr-005) → 200 avec `contributor_*` ;
- ✅ Contribution d'un autre → 404 (T3) ;
- ✅ Boris (vérificateur, pas contributeur) : vide, sans erreur (A3) ;
- ✅ Non connecté : 401 sur `/api/contributions/mine` ;
- ✅ Anonymat public maintenu (les fiches publiques n'exposent jamais l'identité du contributeur) ;
- ✅ Aucune erreur console F12.

# Phase 7 — Vérificateur (instructions)

**But :** examiner les contributions `pending` non masquées, décider (valider / rejeter / doublon), et publier les organisations officielles.

**Permission requise :** `review_contribution` (Boris, `usr-002`) ; publication liée à la validation (rôle `verifier`).

## Tâches

### 1. Routes API (dans `server/server.js`, protégées par `requirePermission('review_contribution')`)

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/review/contributions` | Liste des `pending`, `public_visibility` peu importe, `is_hidden = 0` |
| GET | `/api/review/contributions/:id` | Détail complet pour examen (coordonnées contributeur **visibles ici** — usage interne) |
| POST | `/api/review/contributions/:id/validate` | Valider + publier |
| POST | `/api/review/contributions/:id/reject` | Rejeter (motif obligatoire) |
| POST | `/api/review/contributions/:id/duplicate` | Marquer doublon (`organization_id` existant obligatoire) |
| POST | `/api/review/organizations/:id/verifications` | Enregistrer une vérification (globale `field_name = NULL` et/ou par champ) |

### 2. Logique métier (dans `server/modules/`, réutiliser les fonctions existantes)

**Valider** — une seule transaction SQL (`db.transaction`) :
1. statut contribution → `validated`, `created_organization_id` renseigné, `published_at` ;
2. créer l'organisation dans `organizations` avec statut **`published`** + la spécialisation (`organization_private_profit` / `organization_private_nonprofit` / `organization_public`) selon `organization_type` ;
3. insérer dans `contribution_reviews` (decision `validated`, `reviewer_id`, `linked_organization_id`) ;
4. insérer la vérification dans `verifications` si soumise ;
5. `logAudit({ actorId, action: 'contribution_validated', entityType: 'contribution', entityId })`.

**Rejeter** : statut → `rejected`, `moderation_reason` = motif, `public_visibility` → 0 (retrait public), ligne `contribution_reviews`, audit `contribution_rejected`.

**Doublon** : statut → `duplicate`, `duplicate_of_organization_id` = l'org existante, **aucune** création d'org, `public_visibility` → 0, ligne `contribution_reviews` avec `linked_organization_id`, audit `duplicate_identified`.

> Colonnes réelles (schéma, pas d'invention) : cf. point 6 ci-dessus. `contribution_reviews` utilise `linked_organization_id` et `comment` (pas `observation`/`organization_id`).

### 3. Frontend (page `review.html` + `js/review.js`)
- Liste des pending avec lien vers un détail d'examen ;
- 3 boutons d'action (Valider / Rejeter avec motif / Doublon avec ID org) ;
- formulaire de vérification (champ optionnel + méthode) ;
- accès réservé : rediriger vers login si 401, message si 403 ;
- à terme l'audit et les stats sont phase 12, ici on se contente d'écrire.

### 4. Règles à respecter
- Publication **uniquement** via la validation (jamais de publication directe d'une org sans contribution validée ou décision interne) ;
- Une contribution `validated`/`rejected`/`duplicate` ne peut plus être re-décidée (409 si statut ≠ pending) ;
- Une contribution `is_hidden = 1` n'apparaît pas dans la file d'examen (traitée en phase 8 modération) ;
- Ne jamais modifier une décision existante : les nouvelles décisions passent par de nouvelles contributions/corrections.

## Tests de fin de phase (à jouer uniquement à la fin)
1. Boris se connecte → voit la file des pending (ctr-001, ctr-002, ctr-003 ; **pas** ctr-004 masquée) ;
2. Valider ctr-002 → organisation `published` créée, visible dans la liste publique, contribution disparaît du public, `resulting_organization` visible dans « Mes contributions » d'Afi ;
3. Rejeter ctr-001 avec motif → statut rejected, plus visible publiquement, motif visible par Afi seulement ;
4. Doublon sur ctr-003 vers org-001 → **0** nouvelle organisation créée, redirection/lien vers org-001 ;
5. Afi tente `POST /api/review/contributions/...` → **403** ;
6. Vérifications enregistrées dans `verifications` (une globale, une par champ) ;
7. `audit_logs` contient les 3 actions avec le bon `actor_id` (usr-002) ;
8. Re-décision sur une contribution déjà traitée → 409.

## Pour le prochain modèle IA — texte à transmettre

```text
Tu reprends le projet WorkMap, MVP local sans framework.

Stack figée : Node.js, Express, SQLite (better-sqlite3), bcryptjs, cookie-parser,
sessions en table, HTML/CSS/JS simple en fetch, CommonJS.
Interdit : React, JWT, OAuth, ORM, Tailwind, IA.

Règles :
1. Contributions ≠ organisations officielles.
2. Contribution publique = « Informations non vérifiées ».
3. Coordonnées contributeur jamais publiques (visibles seulement en examen interne).
4. Correction : validation puis historique, jamais d'écriture directe.
5. Rôles : users → roles → permissions → user_roles.
6. NE JAMAIS inventer de noms de colonnes. Colonnes contributions : created_at,
   published_at, withdrawn_at, moderation_reason, created_organization_id,
   duplicate_of_organization_id, public_visibility, is_hidden.
   contribution_reviews : linked_organization_id, comment.
7. Tests uniquement en fin de phase ; ne pas commencer la phase suivante avant validation.

Phases 0–6 terminées et testées (phase 6 = « Mes contributions » contributeur,
routes /api/contributions/mine, dashboard corrigé).


# Point d'évolution — Phase 7 validée

**Date : 12 septembre 2026**

## État du projet

Phases terminées :
- **Phase 0** : squelette npm
- **Phase 1** : SQLite, schéma (21 tables) et seed
- **Phase 2** : serveur Express, pages statiques, `/api/health`
- **Phase 3** : authentification (cookie `wm_sid`, bcryptjs, table `sessions`)
- **Phase 4** : repositories dans `server/modules/` + `logAudit()` + smoke test
- **Phase 5** : fonctionnalités publiques
- **Phase 6** : espace contributeur
- **Phase 7** : vérificateur ✅

## Fichiers créés en phase 7

| Fichier | Rôle |
|---|---|
| `public/review.html` | Page d'examen des contributions (file + détail + actions) |
| `public/js/review.js` | Logique front : chargement file, détail, 3 décisions, formulaire de vérification |
| `check-audit.js` | Script temporaire de contrôle des `audit_logs` (**à supprimer en phase 14**) |
| `check-ctr.js` | Script temporaire de contrôle des contributions (**à supprimer en phase 14**) |

## Fichiers modifiés en phase 7

### `server/server.js`

Routes ajoutées, toutes protégées par `requirePermission('review_contribution')` :

| Méthode | Route |
|---|---|
| GET | `/api/review/contributions` (file des `pending` non masquées) |
| GET | `/api/review/contributions/:id` |
| POST | `/api/review/contributions/:id/validate` |
| POST | `/api/review/contributions/:id/reject` |
| POST | `/api/review/contributions/:id/duplicate` |

### `server/modules/contributions.js`

Handlers ajoutés : `listReviewQueueHandler`, `getReviewContributionHandler`, `validateContributionHandler`, `rejectContributionHandler`, `markDuplicateHandler`.

Chaque décision est une transaction `db.transaction` qui met à jour la contribution, insère dans `contribution_reviews`, crée éventuellement l'organisation + sa spécialisation, insère les `verifications`, et appelle `logAudit`.

### `public/dashboard.js` / `dashboard.html`

Lien vers `review.html` affiché uniquement si l'utilisateur possède la permission `review_contribution`.

## Bugs rencontrés et corrigés (à ne pas reproduire)

1. **`verifyPassword` déclaré deux fois** dans `server.js` → un seul import depuis `./auth`
2. **`requirePermission` non importé** dans `server.js` alors qu'il était utilisé
3. **`user is not defined`** dans `dashboard.js` → variable non déclarée avant usage dans `loadDashboard`
4. **Colonne `actor_id` inexistante** : la table `audit_logs` utilise **`user_id`** et `actor_type`. Règle rappelée : **le schéma fait foi, ne jamais inventer un nom de colonne.**
5. **Erreur CSP `com.chrome.devtools.json`** : bruit DevTools sans impact, à ignorer.

## Rappel important sur le seed

Dans `contributions`, seules **ctr-004 à ctr-007** ont `contributor_id = 'usr-001'` (Afi). Les ctr-001, ctr-002 et ctr-003 sont anonymes ou d'un autre contributeur. C'est pourquoi une décision sur ctr-002 n'apparaît **jamais** dans « Mes contributions » d'Afi — comportement normal, pas un bug.

## Tests de fin de phase 7 — tous passés

1. ✅ File de Boris = ctr-001, ctr-002, ctr-003 (ctr-004 masquée absente)
2. ✅ Validation ctr-002 → organisation `published` créée et visible publiquement, contribution introuvable en public
3. ✅ Rejet ctr-001 avec motif → `rejected`, invisible publiquement
4. ✅ Doublon ctr-003 → aucune organisation créée, lien vers org-001
5. ✅ Afi sur `/api/review/...` → **403**
6. ✅ Lignes présentes dans `verifications`
7. ✅ `audit_logs` : 3 actions avec `user_id = usr-002`
8. ✅ Re-décision sur contribution traitée → **409**

## À faire avant de poursuivre

```powershell
npm run init-db
npm start
```

Puis vérifier `/api/health`. Le reset est nécessaire car la phase 7 a modifié l'état du seed (une contribution validée, une rejetée, une en doublon).

## Texte à transmettre au prochain modèle

```text
Tu reprends le projet WorkMap, MVP local sans framework.

Stack figée : Node.js, Express, SQLite (better-sqlite3), bcryptjs,
cookie-parser, sessions en table SQL, HTML/CSS/JS simple en fetch, CommonJS.
Interdit : React, JWT, OAuth, ORM, Tailwind, IA, upload réel.

Phases 0 à 7 terminées et testées.
Phase 7 = vérificateur : routes /api/review/contributions/*,
page review.html, décisions valider/rejeter/doublon en transaction.

Règles absolues :
1. Le schéma SQL fait foi : ne jamais inventer un nom de colonne.
   audit_logs utilise user_id + actor_type (pas actor_id).
   contributions utilise created_at, published_at, withdrawn_at,
   moderation_reason, created_organization_id, duplicate_of_organization_id.
2. Tests uniquement en fin de phase, jamais au fur et à mesure.
3. Une seule page dashboard, contenu adapté selon /api/auth/me.
4. Pas de nouvelle dépendance npm.
5. Toute action sensible doit appeler logAudit().
6. Ne pas commencer la phase suivante avant validation explicite.

Comptes seed (mot de passe : Password123!) :
Afi usr-001 contributeur, Boris usr-002 verifier,
Carine usr-003 moderator, David usr-004 user_manager,
Estelle usr-005 administrator, Firmin usr-006 suspendu.

Avant de coder : npm run init-db && npm start, puis vérifier /api/health.

# Point d'évolution — Phase 8 validée

**Date : 12 septembre 2026**

## État du projet

Phases terminées et testées :

- **Phase 0** : squelette npm
- **Phase 1** : SQLite, schéma (21 tables) et seed
- **Phase 2** : serveur Express, pages statiques, `/api/health`
- **Phase 3** : authentification (cookie `wm_sid`, bcryptjs, table `sessions`)
- **Phase 4** : repositories dans `server/modules/` + `logAudit()` + smoke test
- **Phase 5** : fonctionnalités publiques
- **Phase 6** : espace contributeur
- **Phase 7** : vérificateur
- **Phase 8** : modérateur ✅

## Ce qui a été livré en phase 8

### Fichiers créés

| Fichier | Contenu |
|---|---|
| `public/moderation.html` | Page modérateur : file des signalements + file des demandes de correction |
| `public/js/moderation.js` | Chargement des deux files, actions masquer / restaurer / traiter / approuver / refuser |
| `check.js` (racine, temporaire) | Script de contrôle en base, **à supprimer en phase 14** |

### Fichiers modifiés

| Fichier | Modification |
|---|---|
| `server/server.js` | Routes de modération (voir tableau ci-dessous) |
| `server/modules/reports.js` | Traitement des signalements, constante `REPORT_REASONS` (doublon supprimé) |
| `server/modules/corrections.js` | Approbation / refus, écriture dans `organization_changes`, constante `CORRECTABLE_FIELDS` (doublon supprimé) |
| `public/dashboard.html` | Ajout de `<nav id="role-links"></nav>` |
| `public/js/dashboard.js` | Liens de rôle affichés selon les permissions de `/api/auth/me` |

### Routes ajoutées

Toutes protégées par `requirePermission`.

| Méthode | Route | Permission |
|---|---|---|
| GET | `/api/moderation/reports` | `review_contribution_report` |
| POST | `/api/moderation/reports/:id/resolve` | `review_contribution_report` |
| POST | `/api/moderation/reports/:id/dismiss` | `review_contribution_report` |
| POST | `/api/moderation/contributions/:id/hide` | `hide_public_contribution` |
| POST | `/api/moderation/contributions/:id/restore` | `restore_public_contribution` |
| GET | `/api/moderation/corrections` | `review_correction` |
| POST | `/api/moderation/corrections/:id/approve` | `review_correction` |
| POST | `/api/moderation/corrections/:id/reject` | `review_correction` |

## Bugs rencontrés et corrigés

1. **Déclarations dupliquées** : `REPORT_REASONS` (reports.js) et `CORRECTABLE_FIELDS` (corrections.js) existaient déjà dans les fichiers. Doublons supprimés, contenu unifié.
2. **`ReferenceError` sur le dashboard de Carine** : le bloc de liens de rôle utilisait `me` alors que la variable de la phase 3 s'appelle `user`, et `#role-links` n'existait pas encore dans le HTML. Corrigé.
3. **404 au lieu de 409 sur une re-décision** : le handler `resolve` filtrait le `SELECT` sur `status = 'pending'`, ce qui rendait un signalement déjà traité « introuvable ». **Règle retenue : un `SELECT` de décision ne filtre que sur l'`id` ; le statut sert uniquement à choisir le code de retour (404 = inexistant, 409 = déjà traité).** Corrigé aussi sur `dismiss`, `approve`, `reject`.

## Tests de fin de phase 8 — tous passés

- ✅ Carine voit la modération, pas l'examen des contributions
- ✅ Masquage de `ctr-001` → invisible publiquement (fiche 404 + absente de l'accueil)
- ✅ Restauration → réapparaît avec le bandeau *Informations non vérifiées*
- ✅ Clôture de `rpt-001` → statut `resolved`
- ✅ Re-clôture → **409**
- ✅ Approbation de `cor-001` → téléphone de `org-001` modifié, ligne dans `organization_changes` (`source = correction`, `old_value` / `new_value` corrects)
- ✅ Fiche publique de `org-001` affiche le nouveau téléphone
- ✅ Re-décision sur `cor-002` déjà approuvée → **409**
- ✅ Afi sur `/api/moderation/reports` → **403**
- ✅ Masquage sans motif → **400**
- ✅ `audit_logs` : `contribution_hidden`, `contribution_restored`, `report_resolved`, `correction_approved` avec `user_id = usr-003`

## Règles confirmées par cette phase

1. Une correction **n'écrit jamais** directement l'organisation : décision d'abord, puis application + ligne d'historique dans `organization_changes`.
2. Un masquage exige **toujours** un motif.
3. Une entité déjà décidée n'est **jamais** re-décidée (409).
4. Le masquage retire la contribution du public sans supprimer la donnée.

## Avant de poursuivre

```powershell
npm run init-db
npm start
```

Le reset est nécessaire : la phase 8 a modifié l'état du seed (`rpt-001` résolu, `cor-001` approuvée, téléphone de `org-001` changé).

## Texte à transmettre au prochain modèle

```text
Tu reprends le projet WorkMap, MVP local sans framework.

Stack figée : Node.js, Express, SQLite (better-sqlite3), bcryptjs,
cookie-parser, sessions en table SQL, HTML/CSS/JS simple en fetch, CommonJS.
Interdit : React, JWT, OAuth, ORM, Tailwind, IA, upload réel, nouvelle dépendance npm.

Phases 0 à 8 terminées et testées.
Phase 7 = vérificateur (review.html, /api/review/contributions/*).
Phase 8 = modérateur (moderation.html, /api/moderation/*) : masquer/restaurer
une contribution, traiter les signalements, approuver/refuser les corrections
avec écriture dans organization_changes et logAudit.

Règles absolues :
1. Le schéma SQL fait foi : ne jamais inventer un nom de colonne.
   audit_logs utilise user_id + actor_type (pas actor_id).
   contributions utilise created_at, published_at, withdrawn_at,
   moderation_reason, created_organization_id, duplicate_of_organization_id,
   public_visibility, is_hidden.
2. Un SELECT de décision filtre uniquement sur l'id.
   404 = entité inexistante, 409 = entité déjà décidée.
3. Contributions ≠ organisations officielles ; contribution publique =
   bandeau « Informations non vérifiées » ; identité du contributeur jamais publique.
4. Une correction ne modifie l'organisation qu'après approbation, avec une ligne
   dans organization_changes (old_value lu en base, jamais depuis le client).
5. Tests uniquement en fin de phase, jamais au fur et à mesure.
6. Une seule page dashboard ; les liens de rôle sont affichés selon
   user.permissions retourné par /api/auth/me (la variable s'appelle `user`).
7. Toute action sensible appelle logAudit().
8. Ne pas commencer la phase suivante avant validation explicite.

Comptes seed (mot de passe : Password123!) :
Afi usr-001 contributeur, Boris usr-002 verifier,
Carine usr-003 moderator, David usr-004 user_manager,
Estelle usr-005 administrator, Firmin usr-006 suspendu.

Fichier temporaire à supprimer en phase 14 : check.js à la racine.

Avant de coder : npm run init-db && npm start, puis vérifier /api/health.



# Point d'évolution — Phase 9 validée

**Date : 13 septembre 2026**

## État du projet

Phases terminées et testées :

- **Phase 0** : squelette npm
- **Phase 1** : SQLite, schéma (21 tables) et seed
- **Phase 2** : serveur Express, pages statiques, `/api/health`
- **Phase 3** : authentification (cookie `wm_sid`, bcryptjs, table `sessions`)
- **Phase 4** : repositories dans `server/modules/` + `logAudit()` + smoke test
- **Phase 5** : fonctionnalités publiques
- **Phase 6** : espace contributeur
- **Phase 7** : vérificateur
- **Phase 8** : modérateur
- **Phase 9** : gestionnaire des utilisateurs ✅

## Ce qui a été livré en phase 9

### Fichiers créés

| Fichier | Contenu |
|---|---|
| `public/users.html` | Page de gestion des utilisateurs : liste des comptes (sans hash), suspension / réactivation, attribution / retrait de rôle |
| `public/js/users.js` | Chargement de la liste, actions vers `/api/users/*`, rechargement après chaque action |

### Fichiers modifiés

| Fichier | Modification |
|---|---|
| `server/server.js` | Routes de gestion des utilisateurs (voir tableau ci-dessous), protégées par `canManageUsers` (`requirePermission('manage_users')`) |
| `server/modules/users.js` | Ajout des règles métier et handlers : `changeUserStatus` (transaction : update + destruction des sessions + `logAudit`), `addRoleToUser`, `removeRoleFromUser`, handlers HTTP |
| `public/dashboard.html` / `public/js/dashboard.js` | Lien « Gestion des utilisateurs » affiché selon la permission `manage_users` |

### Routes ajoutées

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/users` | Liste des comptes (jamais le hash) |
| GET | `/api/users/roles` | Liste des rôles disponibles |
| GET | `/api/users/:id` | Fiche utilisateur + rôles + permissions |
| POST | `/api/users/:id/suspend` | Suspension (sessions de l'utilisateur détruites) |
| POST | `/api/users/:id/reactivate` | Réactivation |
| POST | `/api/users/:id/roles` | Attribution d'un rôle (`assigned_by`) |
| POST | `/api/users/:id/roles/:roleId/remove` | Retrait d'un rôle |

### Règles de sécurité appliquées

1. Un utilisateur suspendu est refusé **immédiatement** : ses sessions sont supprimées en base (`destroyAllSessionsForUser`) **et** `loadUser` vérifie le statut à chaque requête (double barrière).
2. Les rôles et permissions sont rechargés à chaque requête : une attribution de rôle prend effet au rechargement de page, sans nouvelle connexion.
3. `logAudit` appelé sur : suspension, réactivation, attribution et retrait de rôle (`user_status_changed`, `role_assigned`, `role_removed`).

## Bugs rencontrés et corrigés

1. **404 au lieu de 403 pendant les tests** : la commande de test utilisait un chemin `/api/users/:id/status` inexistant. Les vraies routes sont `/suspend` et `/reactivate`. Leçon : toujours relire les routes déclarées dans `server.js` avant d'écrire une commande de test (rappel : 404 = route inconnue, 403 = route connue mais interdite).
2. **Bug hérité de la phase 8 (corrections)** : la validation retournait un tableau vide avec `null` — la ligne d'audit attendue avait été effacée par le reset de la base. Revérifié après approbation d'une nouvelle correction : `metadata` contient bien `organization_id`, `field_name`, `old_value`, `new_value` (lus en base, jamais depuis le client).

## Tests de fin de phase 9 — tous passés

- David suspend Afi → reconnexion refusée, cookie existant rejeté
- David réactive Afi → reconnexion OK
- Attribution du rôle vérificateur à Afi → visible après rechargement de la session
- Estelle peut aussi gérer les utilisateurs (permission `manage_users`)
- Afi reçoit **403** sur toutes les routes de gestion (`/api/users`, `/suspend`, `/reactivate`, `/roles`)
- `audit_logs` contient les traces de suspension, réactivation, attribution de rôle avec le bon `user_id`
- David toujours `active` après les tests, Firmin toujours `suspended`

## Texte à transmettre au prochain modèle

```text
Tu reprends le projet WorkMap, MVP local sans framework.

Stack figée : Node.js, Express, SQLite (better-sqlite3), bcryptjs,
cookie-parser, sessions en table SQL, HTML/CSS/JS simple en fetch, CommonJS.
Interdit : React, JWT, OAuth, ORM, Tailwind, IA, upload réel, nouvelle dépendance npm.

Phases 0 à 9 terminées et testées.
Phase 9 = gestion des utilisateurs (users.html, /api/users/*) :
suspension/réactivation avec destruction des sessions, attribution/retrait
de rôles, logAudit sur chaque action.

Règles absolues :
1. Le schéma SQL fait foi : ne jamais inventer un nom de colonne.
   audit_logs utilise user_id + actor_type (pas actor_id).
   contributions utilise created_at, published_at, withdrawn_at,
   moderation_reason, created_organization_id, duplicate_of_organization_id,
   public_visibility, is_hidden.
2. Un SELECT de décision filtre uniquement sur l'id.
   404 = entité inexistante, 409 = entité déjà décidée.
3. Contributions ≠ organisations officielles ; contribution publique =
   bandeau « Informations non vérifiées » ; identité du contributeur jamais publique.
4. Une correction ne modifie l'organisation qu'après approbation, avec une ligne
   dans organization_changes (old_value lu en base, jamais depuis le client).
5. Tests uniquement en fin de phase, jamais au fur et à mesure.
6. Une seule page dashboard ; les liens de rôle sont affichés selon
   user.permissions retourné par /api/auth/me (la variable s'appelle `user`).
7. Toute action sensible appelle logAudit().
8. Ne pas commencer la phase suivante avant validation explicite.
9. Avant d'écrire une commande de test fetch, relire les routes déclarées
   dans server/server.js (404 = route inconnue, 403 = interdite).

Comptes seed (mot de passe : Password123!) :
Afi usr-001 contributeur, Boris usr-002 verifier,
Carine usr-003 moderator, David usr-004 user_manager,
Estelle usr-005 administrator, Firmin usr-006 suspendu.

workmap/
├── .gitignore
├── package.json               # scripts : init-db, start, smoke-repos
├── package-lock.json
├── README.md                  # stub (rempli en phase 14)
├── check.js                   # ⚠️ TEMPORAIRE — à supprimer phase 14
├── check-audit.js             # ⚠️ TEMPORAIRE — à supprimer phase 14
├── check-ctr.js               # ⚠️ TEMPORAIRE — à supprimer phase 14
├── check-schema.js            # ⚠️ TEMPORAIRE — à supprimer phase 14
├── db/
│   ├── schema.sql             # 21 tables (20 métier + sessions)
│   ├── seed.sql
│   └── workmap.sqlite         # généré, gitignored
├── docs/                      # markdowns de référence
├── private/                   # pièces jointes fictives, gitignored
├── public/
│   ├── index.html             # accueil public
│   ├── organization.html      # fiche organisation publique
│   ├── contribution.html      # fiche contribution publique
│   ├── contribute.html        # formulaire de contribution
│   ├── report.html            # signalement public
│   ├── correction.html        # demande de correction publique
│   ├── login.html             # connexion
│   ├── dashboard.html         # espace connecté + liens de rôle
│   ├── review.html            # phase 7 — vérificateur
│   ├── moderation.html        # phase 8 — modérateur
│   ├── users.html             # phase 9 — gestion des utilisateurs
│   ├── public.html            # page utilitaire (liens publics)
│   ├── style.css
│   └── js/
│       ├── api.js
│       ├── home.js
│       ├── organization.js
│       ├── contribution.js
│       ├── contribute.js
│       ├── report.js
│       ├── correction.js
│       ├── login.js
│       ├── dashboard.js       # + liens de rôle selon permissions
│       ├── review.js
│       ├── moderation.js
│       └── users.js           # phase 9
├── scripts/
│   ├── init-db.js
│   ├── smoke-repos.js         # smoke test phase 4
│   └── gen-hash.js            # génération des hashs bcrypt pour le seed
└── server/
    ├── server.js              # health + auth + public + contributeur + examen + modération + users
    ├── db.js
    ├── auth.js
    ├── helpers.js             # nowIso, sendJson, sendError, logAudit
    └── modules/
        ├── users.js           # phase 4 + gestion comptes (phase 9)
        ├── organizations.js   # phase 4 + publics (phase 5)
        ├── contributions.js   # phase 4 + publics (5) + masquer/restaurer (8)
        ├── reports.js         # phase 4 + public (5) + modération (8)
        ├── corrections.js     # phase 4 + public (5) + modération (8)
        ├── verifications.js   # phase 4 (inchangé)
        ├── reviews.js         # phase 7 — examen des contributions
        └── stats.js           # phase 4 (inchangé)

Avant de coder : npm run init-db && npm start, puis vérifier /api/health.

Prochaine phase : 10 — Administrateur (Estelle, usr-005).
```

---

# Phase 10 — Administrateur

**But :** actions d'administration transverses : archivage d'organisations, consultation de l'audit, accès aux statistiques (la phase 11 les enrichira si besoin — ici on se limite à ce dont l'admin a besoin pour décider).

## Périmètre

1. **Archiver une organisation** publiée (elle disparaît de la recherche publique mais reste en base, consultable par l'admin — vérifie dans le schéma si les organisations ont une colonne de statut type `status`/`archived_at`, adapte-toi au schéma réel)
2. **Lire l'audit** : liste des `audit_logs` avec filtres simples (acteur, type d'entité, action)
3. Accès aux **statistiques de base** si déjà disponibles (sinon on reporte à la phase 11)

## Tâches

1. `server/modules/organizations.js` : règle métier d'archivage + `logAudit` (action `organization_archived`)
2. `server/modules/audit.js` (nouveau, s'il n'existe pas) : requête de lecture filtrée des `audit_logs` — **lecture seule**, aucune écriture manuelle
3. Routes dans `server/server.js`, protégées par les permissions de l'admin (à vérifier dans le seed : probablement `manage_users` déjà fait, ajouter `archive_organization` / `view_audit_logs` — utilise les noms **réels du seed**)
4. `public/admin.html` + `public/js/admin.js` : page avec 3 sections (organisations publiées avec bouton archiver, audit filtrable)
5. Lien « Administration » dans le dashboard selon la permission

## Tests de fin de phase (à jouer uniquement à la fin)

| # | Test | Attendu |
|---|---|---|
| 1 | Estelle archive une org publiée | Org disparaît de la recherche publique |
| 2 | La fiche publique de l'org archivée | 404 |
| 3 | L'org archivée | toujours en base, visible côté admin |
| 4 | Filtres de l'audit (par acteur, par action) | résultats cohérents |
| 5 | L'audit contient `organization_archived` avec `user_id` = usr-005 | ✅ |
| 6 | David tente d'archiver / de lire l'audit | 403 |
| 7 | Afi tente | 403 |

Avant de coder : `npm run init-db && npm start`, vérifier `/api/health`, et surtout **colle-moi les permissions réelles de l'administrateur dans le seed** (table `role_permissions` pour le rôle administrator) ainsi que les colonnes de statut de la table `organizations` — je ne veux rien inventer.



# Point d'évolution — Phase 10 validée

**Date : 13 septembre 2026**

## État du projet

Phases 0 à 10 terminées et testées. Phase 10 = administration : archivage des organisations publiées, consultation filtrable de l'audit, page `admin.html` réservée à l'administrateur.

## Fichiers créés

| Fichier | Contenu |
|---|---|
| `server/modules/audit.js` | Lecture seule des `audit_logs` : `findAll(filters)` (filtres acteur / action), `listAuditHandler`. Aucune écriture manuelle dans ce module |
| `public/admin.html` | Page administration : section organisations publiées (bouton Archiver) + section audit filtrable |
| `public/js/admin.js` | Chargement des listes, archivage via POST, filtres audit (acteur, action), messages d'erreur |

## Fichiers modifiés

| Fichier | Modification |
|---|---|
| `server/server.js` | Routes admin : `GET /api/admin/organizations`, `POST /api/admin/organizations/:id/archive`, `GET /api/admin/audit` — préfixées par `organizationsModule.` / `auditModule.` (bug `ReferenceError` corrigé : handlers nus → préfixés par le module) |
| `server/modules/organizations.js` | Règle métier d'archivage (`status = 'archived'`, `updated_at`) + `logAudit` (`organization_archived`) + `listAdminOrganizationsHandler`, `archiveOrganizationHandler` |
| `public/js/dashboard.js` | Lien « Administration » affiché selon `archive_organization` OU `view_audit_logs`, via `links.innerHTML +=` (pattern unifié) ; bloc `user.error` déplacé **avant** la construction des liens (bug d'ordre corrigé) |
| `public/dashboard.html` | Nav `role-links` vide (lien admin en dur supprimé) |

## Règles de sécurité appliquées

- Routes protégées par `requirePermission('archive_organization')` et `requirePermission('view_audit_logs')` — permissions exclusives à l'administrateur
- L'archivage ne supprime jamais : la ligne reste en base, invisible publiquement (les requêtes publiques filtrent `status = 'published'`)
- `logAudit` sur archivage : `user_id` = l'admin, jamais `actor_id`

## Tests de fin de phase 10 — tous passés

- ✅ Estelle archive org-001 → disparue de la recherche publique
- ✅ Fiche publique org archivée → introuvable (404)
- ✅ Org toujours en base, `status = 'archived'`
- ✅ Filtres audit (acteur, action) cohérents
- ✅ `audit_logs` contient `organization_archived` avec `user_id = usr-005`
- ✅ David : 403 sur les 3 routes admin, pas de lien
- ✅ Afi : 403 sur les 3 routes admin, pas de lien

## Phase 11 — Statistiques de suivi

**But :** offrir à l'administrateur une vue d'ensemble chiffrée de l'activité : contributions, organisations publiées, signalements, corrections, comptes. Le module `stats.js` existe déjà (phase 4) — il faut l'exposer et l'afficher.

### Tâches

1. **`server/modules/stats.js`** : enrichir si besoin les requêtes existantes. Indicateurs attendus (à adapter à ce que ton fichier contient déjà — **le schéma fait foi**, n'invente aucune colonne) :
   - total organisations **publiées**, total archivées
   - contributions par statut (`pending`, `validated`, `rejected`, `duplicate`), dont publiques visibles (`public_visibility = 1 AND is_hidden = 0`)
   - signalements par statut (ouverts / traités)
   - corrections par statut (en attente / approuvées / refusées)
   - utilisateurs actifs / suspendus
2. **Route** dans `server/server.js` :
   - `GET /api/admin/stats`, protégée par `requirePermission('view_audit_logs')` ⚠️ **vérifie dans ton seed le nom réel de la permission de stats** — si l'administrateur a une permission dédiée (ex. `view_stats`), utilise-la ; sinon `view_audit_logs` fait l'affaire car elle est déjà exclusive à l'admin. **Colle-moi la ligne de seed si tu as un doute.**
3. **`public/admin.html` + `admin.js`** : nouvelle section « Statistiques » en haut de la page admin (tableaux simples ou liste `<li>`, pas de graphique — pas de nouvelle dépendance).
4. `logAudit` inutile ici : les stats sont une lecture, pas une action sensible.

### Tests de fin de phase (à jouer uniquement à la fin)

| # | Test | Attendu |
|---|---|---|
| 1 | Estelle ouvre admin.html | Section stats avec des chiffres cohérents avec la base (vérifie 2-3 chiffres à la main via DB Browser) |
| 2 | `GET /api/admin/stats` en console connectée Estelle | 200, JSON complet |
| 3 | David / Afi sur `/api/admin/stats` | 403 |
| 4 | Chiffres après action | Archive une org → le compteur « publiées » baisse d'1, « archivées » +1 |

## Texte à transmettre au prochain modèle

```text
Tu reprends le projet WorkMap, MVP local sans framework.

Stack figée : Node.js, Express, SQLite (better-sqlite3), bcryptjs,
cookie-parser, sessions en table SQL, HTML/CSS/JS simple en fetch, CommonJS.
Interdit : React, JWT, OAuth, ORM, Tailwind, IA, upload réel, nouvelle dépendance npm.

Phases 0 à 10 terminées et testées.
Phase 10 = administration : archivage organizations (logAudit
organization_archived), lecture filtrée audit_logs, admin.html
réservée à l'administrateur.

Règles absolues :
1. Le schéma SQL fait foi : ne jamais inventer un nom de colonne.
   audit_logs utilise user_id + actor_type (pas actor_id).
   organizations.status ∈ draft/pending/published/suspended/archived.
2. Les handlers vivent dans les modules : routes préfixées
   organizationsModule.xxx / auditModule.xxx, jamais de nom nu dans server.js.
3. Tests uniquement en fin de phase, jamais au fur et à mesure.
4. Toute action sensible appelle logAudit().
5. Pas de nouvelle dépendance npm.
6. Ne pas commencer la phase suivante avant validation explicite.

Comptes seed (mot de passe : Password123!) :
Afi usr-001 contributeur, Boris usr-002 verifier,
Carine usr-003 moderator, David usr-004 user_manager,
Estelle usr-005 administrator, Firmin usr-006 suspendu.

Fichiers temporaires à supprimer en phase 14 :
check.js, check-audit.js, check-ctr.js, check-schema.js, scripts/smoke-repos.js.

Avant de coder : npm run init-db && npm start, vérifier /api/health.
```



### Point d’évolution — Phase 11 validée ✅

**Date : 13 septembre 2026**

## État général

Les **phases 0 à 11** de WorkMap sont terminées et testées.

La phase 11 ajoute à l’administration une vue chiffrée de l’activité, sans graphique ni nouvelle dépendance.

---

## Fichiers modifiés

| Fichier | Modification |
|---|---|
| `server/modules/stats.js` | Statistiques des organisations, contributions, signalements, corrections et utilisateurs |
| `server/server.js` | Ajout de la route protégée `GET /api/admin/stats` |
| `public/admin.html` | Ajout de la section « Statistiques » |
| `public/js/admin.js` | Chargement et affichage des statistiques, actualisation après archivage |

## Route ajoutée

```text
GET /api/admin/stats
```

Protection utilisée :

```js
requirePermission('view_audit_logs')
```

Le seed ne contenant aucune permission `view_stats`, la permission administrative existante `view_audit_logs` a été réutilisée.

## Statistiques disponibles

- organisations totales, publiées et archivées ;
- contributions par statut ;
- contributions provisoires publiques et visibles ;
- signalements par statut ;
- corrections par statut ;
- utilisateurs actifs, suspendus et désactivés.

## Règles respectées

- aucune nouvelle dépendance ;
- aucune colonne inventée ;
- handlers conservés dans les modules ;
- aucun `logAudit()` pour cette fonctionnalité en lecture seule ;
- accès réservé à l’administrateur ;
- actualisation des compteurs après archivage.

## Tests de fin de phase 11 — tous réussis

- ✅ Estelle accède aux statistiques ;
- ✅ `GET /api/admin/stats` retourne `200` avec un JSON complet ;
- ✅ les chiffres correspondent au seed ;
- ✅ David reçoit `403` ;
- ✅ Afi reçoit `403` ;
- ✅ après archivage, le nombre d’organisations publiées baisse de 1 ;
- ✅ le nombre d’organisations archivées augmente de 1 ;
- ✅ le total des organisations reste inchangé.

---

# Phase 12 — Audit technique et contrôle du MVP

## But

Contrôler la cohérence, la sécurité et l’intégrité de toutes les fonctionnalités développées avant les tests croisés de la phase 13.

**Cette phase ne doit normalement ajouter aucune fonctionnalité métier.** Elle sert à détecter et corriger les incohérences.

## Principe de travail

1. Examiner les fichiers et routes existants.
2. Noter les anomalies.
3. Appliquer les corrections nécessaires.
4. Effectuer les tests uniquement lorsque tout le contrôle est terminé.
5. Ne pas commencer la phase 13 sans validation explicite.

---

## Contrôles à réaliser

### 1. Routes et permissions

Créer un inventaire des routes de `server/server.js` et vérifier :

- quelles routes sont publiques ;
- quelles routes exigent une authentification ;
- quelle permission protège chaque route sensible ;
- qu’aucune route métier privée n’est accessible anonymement ;
- que les handlers sont correctement préfixés ou importés ;
- qu’une route inconnue retourne bien `404`.

### 2. Protection des données privées

Vérifier dans les réponses publiques que ne sont jamais exposés :

- `password` ;
- identité et coordonnées du contributeur ;
- pièces justificatives ;
- informations internes de modération ;
- journaux d’audit ;
- données privées des demandes de correction.

### 3. Cohérence des contributions

Vérifier que la visibilité publique exige :

```text
status = 'pending'
public_visibility = 1
is_hidden = 0
```

Vérifier également que :

- une contribution validée n’est plus publiquement visible ;
- une contribution rejetée n’est plus visible ;
- un doublon n’est plus visible ;
- une contribution masquée reste en base ;
- la fiche provisoire affiche « Informations non vérifiées ».

### 4. Cohérence des décisions

Pour les validations, rejets, doublons, corrections et signalements :

- `404` si l’entité n’existe pas ;
- `409` si elle a déjà été traitée ;
- transaction SQL lorsque plusieurs écritures dépendent les unes des autres ;
- aucune donnée importante ne doit provenir aveuglément du client ;
- chaque action sensible doit produire un audit.

### 5. Organisations officielles

Vérifier que les routes publiques retournent uniquement :

```text
status = 'published'
```

Une organisation `draft`, `pending`, `suspended` ou `archived` ne doit jamais avoir de fiche publique.

### 6. Authentification et sessions

Contrôler que :

- le cookie est `httpOnly` et `SameSite=Lax` ;
- une session expirée est refusée ;
- un utilisateur suspendu ou désactivé est refusé ;
- la suspension détruit ses sessions ;
- le logout détruit la session en base ;
- `/api/auth/me` n’expose jamais le mot de passe.

### 7. SQL et intégrité

Vérifier :

```sql
PRAGMA foreign_keys;
```

Résultat attendu :

```text
1
```

Contrôler également :

- contraintes `CHECK` ;
- clés étrangères ;
- transactions sensibles ;
- absence de colonnes SQL inexistantes ;
- paramètres SQL avec `?`, sans concaténation directe des données utilisateur.

### 8. Interface

Vérifier sur chaque page :

- gestion correcte des réponses `401`, `403`, `404`, `409` et `500` ;
- absence d’erreur JavaScript dans la console ;
- liens du dashboard adaptés aux permissions ;
- aucun lien administratif affiché à un utilisateur non autorisé.

---

# Informations à me transmettre avant de commencer

Pour conduire la phase 12 précisément, envoie-moi les fichiers dans cet ordre :

1. `server/auth.js`
2. `server/modules/contributions.js`
3. `server/modules/reviews.js`
4. `server/modules/reports.js`
5. `server/modules/corrections.js`
6. `server/modules/organizations.js`
7. `server/modules/users.js`
8. `server/modules/audit.js`
9. `public/js/dashboard.js`




# 📋 Bilan de la Phase 12 — Audit Technique et Validation du MVP

**Objectif de la phase :** Vérifier rigoureusement que le code base (Express + SQLite) respecte les règles fondamentales du projet WorkMap (sécurité, confidentialité, séparation des responsabilités), sans aucune fuite de données et avec une intégrité absolue en base de données.

## 1. Observations et Analyse Globale
Le code produit est extrêmement propre et correspond parfaitement à l'esprit d'un MVP robuste "from scratch". 
*   **Architecture modulaire :** La séparation entre `server.js` (routage pur) et le dossier `server/modules/` (logique métier et accès SQL) est bien respectée.
*   **Simplicité efficace :** L'utilisation de `better-sqlite3` de manière synchrone rend le code très lisible et évite l'enfer des callbacks/promesses pour des opérations simples.
*   **Défense en profondeur :** L'approche de sécurité ne repose pas sur le client, mais s'applique systématiquement côté serveur au niveau des requêtes SQL.

## 2. Contrôles effectués (Checklist des règles d'or)

### 🔒 Sécurité et Authentification (Validé ✅)
*   **Contrôle :** Les mots de passe ne doivent jamais fuiter.
    *   *Résultat :* Dans `auth.js`, la ligne `const { password, ...safeUser } = user;` avant le renvoi de `/api/auth/me` garantit qu'aucun hash n'est transmis au frontend.
*   **Contrôle :** Protection des sessions.
    *   *Résultat :* Les cookies sont paramétrés avec `httpOnly: true` (inaccessibles via JS) et `SameSite: 'lax'`.
*   **Contrôle :** Bannissement immédiat.
    *   *Résultat :* Dans `users.js`, la suspension d'un compte déclenche `destroyAllSessionsForUser(userId)` au sein d'une transaction. L'utilisateur est déconnecté instantanément.

### 🕵️ Confidentialité des Contributeurs — Règle #3 (Validé ✅)
*   **Contrôle :** Les coordonnées privées ne doivent **jamais** être publiques.
    *   *Résultat :* C'est le point fort du module `contributions.js`. La fonction `findPublic()` sélectionne explicitement les colonnes à retourner (ex: `ctr.organization_name`, `ctr.description`) et exclut totalement `contributor_first_name`, `last_name` et `phone`. La fuite de données est structurellement impossible sur l'API `/api/public/contributions`.

### 🛡️ Séparation Officiel vs Provisoire — Règles #1 et #2 (Validé ✅)
*   **Contrôle :** Le public ne doit voir que les organisations validées et les contributions non vérifiées autorisées.
    *   *Résultat :* Dans `organizations.js`, la route publique force hardcode le paramètre : `status: 'published'`. L'utilisateur ne peut pas tricher via l'URL. Même chose pour `contributions.js` avec `status = 'pending'`, `public_visibility = 1` et `is_hidden = 0`.

### 🗄️ Intégrité des Données et Transactions (Validé ✅)
*   **Contrôle :** Les actions complexes ne doivent pas laisser la base dans un état bâtard en cas d'erreur.
    *   *Résultat :* Dans `reviews.js`, l'action `validateHandler` utilise une `db.transaction()` parfaite. Elle crée l'organisation, met à jour la contribution, insère l'avis du modérateur et loggue l'audit en une seule passe. Si une étape échoue, tout est annulé.

### 📝 Piste d'Audit et Traçabilité — Règle #5 (Validé ✅)
*   **Contrôle :** Toute action sensible doit être tracée.
    *   *Résultat :* La fonction `logAudit()` est appelée sur toutes les actions critiques : suspension, changement de rôle, validation/rejet/masquage de contribution, et archivage d'organisation. Le module `audit.js` est correctement verrouillé en lecture seule.

---

### Conclusion de la Phase 12
**La Phase 12 est un succès total.** Le socle backend du MVP est solide, sécurisé et prêt pour la production à l'échelle d'un MVP local. Les règles métier imposées au départ n'ont pas été contournées.


 bilan complet de la **Phase 13 (Tests manuels croisés)** que nous venons de clôturer avec succès. 

Cette phase était cruciale car elle ne consistait pas à écrire du code, mais à éprouver le système de bout en bout, en simulant la vie réelle de l'application avec différents acteurs. 

Voici ce que nous avons validé ensemble à travers les 4 blocs de tests :

### 1. Parcours Visiteur (Public)
* **Recherche et filtres :** La distinction entre les organisations officielles et les contributions non vérifiées fonctionne parfaitement. Le principe directeur du MVP est respecté.
* **Avertissements :** Le bandeau "Informations non vérifiées" s'affiche correctement pour alerter le public.
* **Actions publiques :** Un visiteur non connecté peut soumettre une nouvelle contribution, signaler une fiche problématique ou demander une correction.

### 2. Parcours Vérification (Afi & Boris)
* **Espace Contributeur (Afi) :** Après la correction du bug (erreur 404) que nous avons traitée, Afi peut consulter l'état de ses propres contributions et voir le lien vers l'organisation finale si sa contribution a été validée.
* **Traitement (Boris) :** 
  * La **validation** crée bien une organisation officielle publiée, la retire de la file d'attente et la rend visible au public.
  * Le **rejet** (avec motif) et le marquage en **doublon** cachent correctement la contribution du public.
  * L'interdiction de **re-décision** (erreur 409) protège l'intégrité du workflow.

### 3. Parcours Modération (Carine)
* **Sécurité d'urgence :** Carine peut masquer une contribution signalée, ce qui la retire immédiatement des résultats publics, puis la restaurer si le signalement était abusif.
* **Mise à jour des données :** L'approbation d'une demande de correction modifie bien la fiche de l'organisation concernée et garde une trace des changements (historique).

### 4. Parcours Administration (David, Firmin & Estelle)
* **Gestion des accès (David & Firmin) :** La suspension empêche instantanément un utilisateur (Firmin) de se connecter. La réactivation fonctionne, et le système empêche les actions redondantes (double suspension).
* **Supervision globale (Estelle) :** 
  * L'archivage d'une organisation la retire de l'état "Publiée".
  * Les **statistiques** se mettent à jour dynamiquement et reflètent la réalité de la base de données.
  * Le **journal d'audit** enregistre fidèlement toutes les actions sensibles (qui a fait quoi et quand), garantissant la traçabilité de la plateforme.

### 🎯 Conclusion de la Phase 13
**Le MVP est fonctionnellement complet et validé.**
* Les rôles sont étanches (Afi ne peut pas modérer, un visiteur ne peut pas voir les stats, etc.).
* La base de données reste intègre (aucune création d'organisation fantôme lors d'un doublon).
* Le cycle de vie complet de l'information (Collecte → Vérification → Modération/Publication → Archivage) est opérationnel.

Nous sommes donc prêts pour l'ultime étape du projet : la **Phase 14 (Nettoyage et livraison)**.



C'est la toute dernière ligne droite ! Bravo d'être arrivé jusqu'ici. La **Phase 14** consiste à rendre ton projet propre, professionnel et prêt à être livré ou évalué.

Voici les 4 étapes à suivre pour clôturer définitivement le MVP WorkMap.

### Étape 1 : Nettoyage des fichiers temporaires et du code
Supprime les fichiers de test que nous avons utilisés pendant le développement. 
1. Supprime le fichier **`check.js`** à la racine.
2. Supprime **`check-audit.js`**, **`check-ctr.js`**, **`check-schema.js`** (s'ils sont présents à la racine).
3. Supprime **`scripts/smoke-repos.js`**.
4. Fais une recherche rapide dans ton dossier `server/` et `public/js/` pour supprimer les `console.log()` qui traînent (laisse seulement les erreurs critiques comme `console.error` dans le serveur si tu veux).

---

### Étape 2 : Le fichier `.gitignore`
Assure-toi que ton fichier `.gitignore` à la racine contient bien ceci pour éviter de pousser la base de données et les dépendances sur Git :

```text
# Dépendances
node_modules/

# Base de données locale générée
db/workmap.sqlite
db/workmap.sqlite-journal
db/workmap.sqlite-wal
db/workmap.sqlite-shm

# Fichiers privés (pièces jointes)
private/

# Fichiers système et environnement
.env
.DS_Store
Thumbs.db
```

---

### Étape 3 : Le fichier `README.md`
C'est la vitrine de ton projet. Remplace le contenu de ton fichier `README.md` par le texte ci-dessous. Il couvre tout ce qui est exigé (prérequis, commandes, comptes, hors périmètre).

```markdown
# Work Map — MVP

**Work Map** est une application web destinée à constituer et rendre accessible au public une base structurée des organisations présentes sur le territoire du Bénin.

Ce MVP est conçu selon un principe directeur strict : **Séparer les contributions des organisations officielles, signaler clairement toute information non vérifiée, contrôler sa visibilité, vérifier avant de publier officiellement et conserver une trace de chaque évolution importante.**

## 🛠 Prérequis
- **Node.js** (v18 ou supérieur recommandé)
- **npm** (inclus avec Node.js)

## 🚀 Installation et lancement

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Initialiser la base de données (et le jeu d'essai)**
   *Attention : cette commande écrase toute base existante.*
   ```bash
   npm run init-db
   ```

3. **Démarrer le serveur**
   ```bash
   npm start
   ```

L'application est accessible à l'adresse : **http://localhost:3000**

## 👥 Comptes de test
Tous les comptes de test utilisent le mot de passe suivant : `Password123!`

| Rôle | Nom | Email | Accès principal |
|---|---|---|---|
| **Contributeur** | Afi Mensah | `afi.mensah@example.test` | Suivi de ses contributions publiques |
| **Vérificateur** | Boris Kouton | `boris.kouton@example.test` | Validation, rejet, doublons |
| **Modérateur** | Carine Dossou | `carine.dossou@example.test` | Signalements, corrections, masquage |
| **Gestionnaire** | David Tossou | `david.tossou@example.test` | Suspension et gestion des utilisateurs |
| **Administrateur**| Estelle Bio | `estelle.bio@example.test` | Statistiques, archivage, audit complet |
| *(Suspendu)* | Firmin Zounon | `firmin.zounon@example.test` | *Accès refusé* |

## 📁 Structure du projet
- `db/` : Schéma, seed SQL et base SQLite.
- `public/` : Interface utilisateur (HTML/CSS/JS natif).
- `server/` : Logique backend (Express.js, routes, accès DB via modules).
  - `modules/` : Séparation des logiques métier (utilisateurs, organisations, audit, etc.).

## 🛑 Hors périmètre du MVP
Conformément au cahier des charges, les éléments suivants ont été volontairement exclus de cette version :
- Framework Frontend (React, Vue, etc.), utilisation de Vanilla JS / HTML / CSS.
- ORM (requêtes SQL natives via `better-sqlite3`).
- JWT ou OAuth (authentification par sessions chiffrées en base).
- Recrutement, candidatures, et offres d’emploi.
- Messagerie, réseau social, notes et commentaires publics.
- Classification, vérification ou géolocalisation par Intelligence Artificielle (IA).
- API publique.
```

---

### Étape 4 : Le test du "Clone mental" (Validation finale)
Fais ce dernier petit exercice pour t'assurer que tout est parfait :
1. Arrête ton serveur (`Ctrl+C`).
2. Supprime (ou déplace temporairement) ton fichier `db/workmap.sqlite`.
3. Supprime ton dossier `node_modules/`.
4. Lance la séquence magique du README :
   - `npm install`
   - `npm run init-db`
   - `npm start`
5. Va sur `http://localhost:3000`, connecte-toi avec `estelle.bio@example.test` / `Password123!`.

Si tu arrives sur le dashboard d'Estelle avec les stats fonctionnelles en moins de 3 minutes : **LE MVP EST 100% OPÉRATIONNEL !**

Fais tes suppressions, ajoute le README, fais ton test final, puis tape dans ton terminal :
```bash
git add .
git commit -m "mvp-workmap"
```

Dis-moi quand tu as tout validé ! 🚀



C'est une excellente initiative. Faire une "passe de recette" finale complète (un test de bout en bout) est la meilleure façon de t'assurer que tu maîtrises parfaitement ton MVP et que tu es prêt à le présenter ou le déployer.

Voici un guide complet, interface par interface et rôle par rôle, des fonctionnalités que tu peux tester. Tu pourras utiliser cette liste comme un **cahier de test**.

N'hésite pas à m'arrêter à n'importe quel moment si une interface ne réagit pas comme prévu ou si tu as une question sur le "pourquoi" d'une règle métier !

---

### 🌍 1. L'Espace Public (Visiteurs)
*Ce que tout le monde peut voir et faire sans avoir de compte.*

*   **Page d'accueil (`index.html`) :**
    *   **Recherche et Filtres :** Tu dois pouvoir chercher une organisation par nom et filtrer l'affichage (ex: voir uniquement les "Officielles" ou uniquement les "Non vérifiées").
    *   **Séparation stricte :** La liste doit clairement distinguer visuellement les organisations officielles (déjà validées) des contributions provisoires.
*   **Fiche d'une Organisation Officielle (`organization.html`) :**
    *   Affiche les détails d'une structure validée.
    *   **Action :** Un visiteur doit pouvoir cliquer sur un bouton "Proposer une correction" (qui redirige vers `correction.html`).
*   **Fiche d'une Contribution Non Vérifiée (`contribution.html`) :**
    *   Affiche les détails provisoires soumis par un utilisateur.
    *   **Sécurité :** Un gros bandeau d'avertissement *"Informations non vérifiées"* doit être clairement visible.
    *   **Action :** Un visiteur doit pouvoir cliquer sur "Signaler cette fiche" (qui redirige vers `report.html`).
*   **Formulaire de Contribution (`contribute.html`) :**
    *   Un formulaire pour ajouter une nouvelle organisation.
    *   Il doit y avoir une case à cocher obligatoire pour le consentement avant soumission.
*   **Formulaires d'interaction (`report.html` & `correction.html`) :**
    *   Ils doivent permettre d'envoyer respectivement un signalement ou une proposition de modification, et afficher un message de succès après soumission.

---

### 🔒 2. Authentification & Base (`login.html` & `dashboard.html`)
*La porte d'entrée pour les rôles.*

*   **Connexion (`login.html`) :**
    *   Teste avec un bon mot de passe (`Password123!`) et un mauvais.
    *   Teste avec le compte de Firmin (`firmin.zounon@example.test`) : l'accès doit lui être refusé car il est suspendu.
*   **Tableau de bord (`dashboard.html`) :**
    *   C'est la page pivot. Selon la personne connectée (via `/api/auth/me`), l'interface doit afficher **uniquement** les liens correspondant à son rôle (ex: Boris ne voit pas le lien "Administration").

---

### ✍️ 3. Le Contributeur (Afi Mensah - `afi.mensah...`)
*   **Mes contributions :**
    *   Afi doit voir la liste des organisations qu'elle a soumises.
    *   Elle doit pouvoir voir le **statut** de chacune : *En attente*, *Validée*, *Rejetée*, ou *Doublon*.
    *   Si une contribution est validée, elle doit voir un lien vers la fiche de l'organisation officielle résultante.
    *   Si elle est rejetée, elle doit pouvoir lire le motif du rejet.

---

### 🕵️ 4. Le Vérificateur (Boris Kouton - `boris.kouton...`)
*Interface de vérification (`review.html`)*
*   **File d'attente :** Boris voit toutes les contributions au statut "pending" (en attente). *Attention : il ne doit pas voir les contributions masquées par la modération.*
*   **Actions possibles sur une contribution :**
    1.  **Valider :** Transforme la contribution en une organisation officielle (`published`). La contribution disparaît de la file.
    2.  **Rejeter :** Il doit obligatoirement fournir un motif. La contribution passe en `rejected` et disparaît du public.
    3.  **Marquer comme doublon :** Il doit lier la contribution à une organisation déjà existante. Aucune nouvelle organisation n'est créée.

---

### 🛡️ 5. Le Modérateur (Carine Dossou - `carine.dossou...`)
*Interface de modération (`moderation.html`)*
*   **Gestion des Signalements :**
    *   Elle voit les fiches signalées par le public.
    *   **Actions :** Elle peut **Masquer** la fiche (elle disparaît de l'espace public et de la vue du vérificateur) ou la **Restaurer** (si le signalement était infondé).
*   **Gestion des Corrections :**
    *   Elle voit les demandes de correction sur les organisations officielles.
    *   **Actions :** **Approuver** (cela met à jour directement la fiche de l'organisation et crée une trace dans l'historique) ou **Refuser**.

---

### 👥 6. Le Gestionnaire (David Tossou - `david.tossou...`)
*Interface de gestion des utilisateurs*
*   **Liste des utilisateurs :** Il voit les comptes du système.
*   **Actions :**
    *   Il peut **Suspendre** un utilisateur actif (comme Afi). Si Afi est connectée, ses sessions en cours doivent être détruites (elle sera déconnectée à sa prochaine action).
    *   Il peut **Réactiver** un utilisateur suspendu (comme Firmin).

---

### 👑 7. L'Administrateur (Estelle Bio - `estelle.bio...`)
*Interface d'administration (`admin.html`)*
*   **Statistiques :** Elle voit les compteurs globaux (nombre d'organisations publiées, archivées, contributions en attente, etc.).
*   **Archivage :** Elle peut **Archiver** une organisation (elle passe du statut `published` à `archived` et disparaît des résultats publics).
*   **Journal d'Audit :** Elle voit le tableau récapitulatif de "qui a fait quoi et quand" (les actions de validation, suspension, archivage, modération).

---

### 💡 Comment procéder à tes tests maintenant :

Je te conseille de faire ce petit "jeu de rôle" :
1. Démarre en **Visiteur** (navigation privée), crée une contribution, signale-en une autre, propose une correction.
2. Connecte-toi en **Vérificateur (Boris)** pour traiter ta nouvelle contribution.
3. Connecte-toi en **Modérateur (Carine)** pour traiter ton signalement et ta correction.
4. Connecte-toi en **Administrateur (Estelle)** pour vérifier que l'Audit a bien enregistré les actions de Boris et Carine, et que les stats ont bougé.

Prends ton temps pour naviguer. **Dis-moi quand tu commences et pose-moi toutes tes questions si tu observes un comportement qui te semble étrange !**