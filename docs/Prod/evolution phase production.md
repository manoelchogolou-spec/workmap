# 📋 Bilan de la Phase 15 — Inscription publique et promotion de rôles

**Contexte :** les phases 0 à 14 (MVP) sont terminées. Nous sommes désormais dans le **plan de production (phases 15 à 21)** défini dans `Etapes plan-production.md`. La phase 15 est la première de ce plan.

## 1. Objectif atteint

Permettre à un inconnu de créer un compte contributeur, et à un gestionnaire de promouvoir/retraiter les rôles depuis l'interface.

## 2. Fichiers créés
| Fichier | Contenu |
|---|---|
| `server/modules/accounts.js` | Validation, unicité email, hash bcrypt cost 12, création user + rôle `contributor` en transaction, `logAudit` avec `actor_type = 'user'` (le nouvel utilisateur = acteur de sa propre inscription), flag `REGISTRATION_OPEN` (prêt pour `.env` en phase 19) |
| `public/register.html` | Formulaire : prénom, nom, email, mot de passe, confirmation |
| `public/js/register.js` | Soumission, gestion des 400/403/409, redirection vers login |

## 3. Fichiers modifiés
| Fichier | Modification |
|---|---|
| `server/server.js` | `POST /api/auth/register` (public, sans middleware) ; vérification de l'ordre des routes `/api/users/roles` **avant** `/api/users/:id` |
| `server/modules/users.js` | Garde-fou B2 : `administrator` (rol-005) attribuable/retirable uniquement par un porteur de `manage_roles` ; `assertCanManageAdministrator` exporté |
| `public/users.html` | Dialog d'attribution avec `<select id="role-select">` + formulaire |
| `public/js/users.js` | `renderRoleSelect()`, `loadUsers()` consolidé, suppression du bug `meData is not defined` (fusion de versions) |
| `public/login.html` | Lien « Créer un compte » |
| `db/seed.sql` | Déplacement cosmétique de rp-023 |

## 4. Bugs corrigés pendant la phase
1. **404 sur `/api/auth/register`** — fichier `server.js` non enregistré avant relance du serveur.
2. **Tableau vide connecté en David** — `ReferenceError: meData is not defined` ligne 104 de `users.js` (variable d'une ancienne version restée dans `loadUsers`), corrigé par consolidation de `loadUsers()` + ajout de `renderRoleSelect()`.
3. **Conflit potentiel de routes** — `/api/users/:id` interceptait `/api/users/roles` ; ordre inversé (route spécifique avant route paramétrée). **Règle à retenir : toujours déclarer les routes statiques avant les routes paramétrées.**

## 5. Tests de fin de phase — tous passés ✅
- Inscription : succès, 409 email dupliqué, 400 (champs, mot de passe < 10, confirmation ≠), connexion du nouveau compte avec rôle `contributor`.
- B2 : David ne peut ni attribuer ni retirer `administrator` (403) ; Estelle peut.
- Audit : traces d'inscription, d'attribution et de retrait avec les bons `user_id` / `actor_type`.
- Afi : 403 sur toutes les routes de gestion.
- Hash jamais exposé ; Firmin toujours `suspended`.
- Nettoyage effectué : Afi revenue à `contributor` seul.

## 6. Règles absolues (inchangées, à garder en tête)
1. Le schéma SQL fait foi (`users.password`, `audit_logs.user_id + actor_type`, `contributions.public_visibility + is_hidden`).
2. Handlers dans les modules, jamais de nom nu dans `server.js`.
3. Tests uniquement en fin de phase.
4. Toute action sensible appelle `logAudit()`.
5. Pas de nouvelle dépendance npm (sauf dotenv en phase 19).
6. Ne pas exposer le hash ; coordonnées des contributeurs jamais publiques.


# 🚀 Instructions — Phase 16 : Refonte CSS et navigation dynamique

**But :** uniformiser l'apparence des 11+ pages et rendre la navigation cohérente selon le rôle et l'état de connexion. **Aucune logique métier nouvelle, aucune dépendance.**

### 1. `public/style.css` — refonte
- Palette simple, cohérente : badges (vert « Officiel », orange « Non vérifié », rouge suspendu).
- Styles réutilisables : `.card`, `.message.success`, `.message.error`, formulaires, tableaux, boutons.
- Responsive de base : débordement géré à 375px (test final).

### 2. `public/js/nav.js` (nouveau) — navigation dynamique
- Fonction `initNav()` : appelle `/api/auth/me` :
  - **non connecté** → Accueil, Connexion, Inscription ;
  - **connecté** → Dashboard + liens selon permissions (`review_contribution` → Examen, `review_report`/`review_correction` → Modération, `manage_users` → Utilisateurs, `view_stats` → Admin) + Déconnexion ;
- `<header>` identique sur toutes les pages, avec `<script src="/js/nav.js">` puis appel `initNav()`.
- Nettoyage au passage (vigilance 8) : `dashboard.js` n'affiche « Mes contributions » que si l'utilisateur existe, message propre sinon.

### 3. Pages à homogénéiser
`index.html`, `organization.html`, `contribution.html`, `contribute.html`, `report.html`, `correction.html`, `login.html`, `register.html`, `dashboard.html`, `users.html`, `review.html`, `moderation.html`, `admin.html`.

### 4. À ne PAS faire en phase 16
- ❌ Pas de polices CDN — Lora et Inter seront téléchargées et posées dans `public/fonts/` (je te donnerai les liens).
- ❌ Pas de graphiques, pas de framework, pas de nouvelle dépendance.
- ❌ Pas de refonte des listes en cartes : c'est la **phase 18**.

### Tests de fin de phase 16
| Cas | Attendu |
|---|---|
| Visiteur non connecté sur index | Nav = Accueil / Connexion / Inscription uniquement |
| Afi connectée | Dashboard visible, aucun lien admin |
| Boris connecté | Lien Examen visible, pas Utilisateurs |
| Carine | Lien Modération visible |
| David | Lien Utilisateurs visible, pas Examen/Modération |
| Estelle | Tous les liens |
| Déconnexion | Retour nav visiteur, cookie invalide |
| Aucune page n'a de layout cassé à 375px | Pas de scroll horizontal |
| Toutes les pages ont le même header | Vérification visuelle |

---

Avant de commencer : `npm run init-db && npm start`, vérifier `/api/health`. Confirme et j'attaque la phase 16.

### Bilan complet — Phase 16 : Interface et navigation dynamique

**Date de validation : 16 septembre 2026**  
**Statut : terminée et testée avec succès ✅**

#### Objectif atteint

L’interface des pages publiques et internes a été homogénéisée. Une navigation dynamique affiche désormais uniquement les liens correspondant à l’état de connexion et aux permissions de l’utilisateur.

### Modifications réalisées

#### 1. Refonte CSS globale

Le fichier `public/style.css` a été uniformisé avec :

- palette cohérente ;
- styles communs pour les boutons, formulaires et tableaux ;
- composants `.card`, `.message.success` et `.message.error` ;
- badges visuels :
  - vert pour les organisations officielles ;
  - orange pour les informations non vérifiées ;
  - rouge pour les comptes suspendus ;
- adaptation mobile jusqu’à `375px` ;
- protection contre les débordements horizontaux.

Aucun framework CSS ni aucune nouvelle dépendance n’ont été ajoutés.

#### 2. Navigation dynamique

Le fichier suivant a été ajouté :

```text
public/js/nav.js
```

La fonction `initNav()` :

1. interroge `/api/auth/me` ;
2. identifie l’état de connexion ;
3. construit la navigation selon les permissions ;
4. gère la déconnexion ;
5. revient à la navigation publique lorsque la session n’est plus valide.

Navigation obtenue :

| Profil | Liens spécifiques |
|---|---|
| Visiteur | Accueil, Connexion, Inscription |
| Afi | Dashboard |
| Boris | Dashboard, Examen |
| Carine | Dashboard, Modération |
| David | Dashboard, Utilisateurs |
| Estelle | Dashboard, Examen, Modération, Utilisateurs, Admin |

Les liens sensibles ne sont pas simplement désactivés : ils ne sont pas affichés aux utilisateurs non autorisés.

#### 3. Pages homogénéisées

Le même en-tête et le chargement de `nav.js` ont été appliqués aux pages suivantes :

```text
index.html
organization.html
contribution.html
contribute.html
report.html
correction.html
login.html
register.html
dashboard.html
users.html
review.html
moderation.html
admin.html
```

Chaque page utilise maintenant une structure visuelle et une navigation cohérentes.

#### 4. Ajustement du dashboard

`public/js/dashboard.js` a été sécurisé visuellement :

- « Mes contributions » n’est affiché que lorsqu’un utilisateur valide est connecté ;
- une session absente ou expirée produit un message propre ;
- aucun élément réservé n’est affiché sans permission.

### Contraintes respectées

- aucune nouvelle logique métier ;
- aucune modification du schéma SQL ;
- aucune nouvelle dépendance npm ;
- aucun framework frontend ou CSS ;
- aucune police chargée depuis un CDN ;
- aucune transformation des listes en cartes — réservée à la phase 18 ;
- aucun graphique ajouté.

### Résultats des tests

Tous les tests de fin de phase sont positifs :

- navigation publique correcte ;
- liens adaptés pour Afi, Boris, Carine, David et Estelle ;
- déconnexion fonctionnelle ;
- cookie de session invalidé ;
- même en-tête sur toutes les pages ;
- aucun lien administratif exposé sans autorisation ;
- aucun layout cassé ni débordement horizontal à `375px`.

## Conclusion

**La phase 16 est officiellement clôturée et validée.** Le projet peut passer à la **phase 17** sans revenir sur cette phase, sauf découverte ultérieure d’un bug.

---

### Transmission pour la phase 17

```text
Tu reprends WorkMap, un MVP Node.js/Express/SQLite sans framework frontend.

Les phases 0 à 16 sont terminées et testées.

Phase 16 validée :
- CSS global homogénéisé ;
- navigation dynamique dans public/js/nav.js ;
- header commun sur les 13 pages ;
- liens affichés selon les permissions ;
- dashboard nettoyé ;
- responsive validé à 375px ;
- aucune dépendance ou logique métier ajoutée.

Règles absolues :
1. Le schéma SQL fait foi.
2. Les handlers restent dans les modules.
3. Tests uniquement à la fin de la phase.
4. Toute action sensible appelle logAudit().
5. Aucune nouvelle dépendance, sauf autorisation explicite.
6. Ne jamais exposer les mots de passe ou coordonnées privées.
7. Ne pas commencer la phase suivante sans validation.

Avant de modifier le projet :
- lancer npm run init-db ;
- lancer npm start ;
- vérifier /api/health ;
- consulter le descriptif exact de la phase 17.
```


# 📋 Bilan de la Phase 17 — Navigation dynamique et responsive

**Date de validation : 17 septembre 2026**
**Statut : terminée et testée avec succès ✅**

## Objectif atteint

Une navigation unique, injectée par `nav.js`, affichant uniquement les liens correspondant à l'état de connexion et aux permissions de l'utilisateur, avec un menu hamburger fonctionnel sur mobile (≤ 768px).

## Constat initial important

Le volet « liens selon permissions » de la phase 17 avait été largement réalisé lors de la phase 16. Le diagnostic a révélé **deux manques** :
1. le menu hamburger (absent) ;
2. la suppression des liens de rôle dans `dashboard.js` (déclarée faite en phase 16 mais **non appliquée** — dette détectée et corrigée).

## Fichiers modifiés

| Fichier | Modification |
|---|---|
| `public/js/nav.js` | Ajout de `createNavToggle()` : bouton « ☰ Menu » injecté avant `#main-nav`, toggle via classe CSS `.nav-open`, fermeture au clic sur un lien/bouton du menu et au clic extérieur, attributs `aria-expanded` / `aria-controls` |
| `public/style.css` | Ajout de la section responsive : `#nav-toggle` masqué au-delà de 768px (`display: none`), `#main-nav a, #main-nav button` cachés en mobile sauf si `.nav-open` ; le CSS mobile existant (600px, colonnes, tableaux scrollables) conservé |
| `public/js/dashboard.js` | Suppression du bloc `#role-links` (liens Examiner / Modération / Utilisateurs / Administration) — désormais générés uniquement par `nav.js` ; élimination des liens en doublon sur le dashboard |

## Fichiers non modifiés

- `server/server.js`, tous les modules serveur — aucune logique métier touchée ;
- Les 13 pages HTML — le point d'ancrage `#main-nav` était déjà en place partout.

## Écart documenté (accepté)

Le plan stipulait que `nav.js` « injecte le `<nav>` ». L'implémentation existante utilise un élément `#main-nav` vide déjà présent dans chaque page, que `nav.js` remplit dynamiquement. Résultat strictement équivalent (aucun lien en dur dans le HTML), sans retoucher 13 pages. Écart documenté et accepté.

## Point technique documenté — le 401 de `/api/auth/me`

Pour un visiteur non connecté, `GET /api/auth/me` répond **401**. Le navigateur l'affiche en rouge dans la console (log réseau automatique pour toute réponse 4xx/5xx) — ce n'est **pas une erreur JavaScript** : `getCurrentUser()` intercepte ce 401 et construit la nav visiteur correctement. La sémantique HTTP est correcte et cohérente avec le reste de l'API. **Décision : ne rien changer**, documenter. *(Une réponse 200 `{authenticated: false}` casserait `dashboard.js` et n'apporte rien.)*

## Tests de fin de phase 17 — tous passés

| Cas | Attendu | Résultat |
|---|---|---|
| Fenêtre > 768px | Nav complète, aucun bouton « ☰ Menu » | ✅ |
| Fenêtre ≤ 768px | Seul « ☰ Menu » visible, liens cachés | ✅ |
| Clic sur « ☰ Menu » | Liens en colonne, `aria-expanded="true"` | ✅ |
| Clic sur un lien | Navigation + menu refermé | ✅ |
| Clic extérieur | Menu refermé | ✅ |
| 375px (devtools mobile) | Hamburger fonctionnel, aucun scroll horizontal | ✅ |
| Visiteur | Aucun lien réservé, jamais avant réponse de `/api/auth/me` | ✅ |
| Afi (contributeur) | Pas de lien Administration / Examen | ✅ |
| Boris (vérificateur) | Examen visible, pas Utilisateurs | ✅ |
| David (gestionnaire) | Utilisateurs visible, pas Examen/Modération | ✅ |
| Estelle (admin) | Tous les liens | ✅ |
| Dashboard Estelle | Liens de rôle présents **une seule fois** (via nav) | ✅ |
| Console | Aucune erreur JS (le 401 est un log réseau attendu) | ✅ |

## Conclusion

**La phase 17 est officiellement clôturée et validée.** Le projet peut passer à la phase 18 sans revenir sur cette phase, sauf découverte ultérieure d'un bug.

---

## Transmission pour la phase suivante

```text
Tu reprends WorkMap, un MVP Node.js/Express/SQLite sans framework frontend.

Les phases 0 à 17 sont terminées et testées.

Phase 17 validée :
- nav.js complet : liens selon /api/auth/me et permissions ;
- hamburger ≤ 768px avec aria-expanded/aria-controls ;
- fermeture au clic lien + clic extérieur ;
- liens de rôle retirés de dashboard.js (doublon éliminé) ;
- responsive 375px sans scroll horizontal ;
- 401 de /api/auth/me documenté comme log réseau attendu, pas un bug.

Stack figée : Node.js, Express, better-sqlite3, bcryptjs, cookie-parser,
sessions en table SQL, HTML/CSS/JS vanilla en fetch, CommonJS.
Interdit : React, JWT, OAuth, ORM, Tailwind, IA, nouvelle dépendance npm
sauf autorisation explicite.

Règles absolues :
1. Le schéma SQL fait foi.
2. Les handlers restent dans les modules.
3. Tests uniquement à la fin de la phase.
4. Toute action sensible appelle logAudit().
5. Ne jamais exposer mots de passe ou données privées.
6. Ne pas commencer la phase suivante sans validation.

Avant de modifier le projet :
- npm run init-db && npm start ;
- vérifier /api/health ;
- consulter le descriptif exact de la phase 18.
```

# 📋 Bilan de la Phase 18 — Cartes, recherche unifiée et retours visuels

**Date : 17 septembre 2026**
**Statut : ✅ Validée**

## Rappel de l'objectif initial

Rendre les listes utilisables sur mobile et clarifier la distinction officiel / non vérifié :

- `public/js/ui.js` — helpers `toast()`, `setLoading()`, `renderCard()`, `renderCardGrid()`
- Accueil : liste unique en cartes + badges « Officiel » / « ⚠️ Non vérifié » + cases à cocher
- Refonte des listes internes en cartes (review, moderation, users, admin)
- Retours visuels : bouton « Chargement… », toasts, anti double-clic, `role="status"`

## Ce qui a été fait — et les écarts par rapport au plan

### 1. Fichiers créés

| Fichier | Contenu |
|---|---|
| `public/js/ui.js` | `toast(message, type)`, `setLoading(button, bool)`, `renderCard(data)`, `renderCardGrid(id, cards, emptyText)` |
| `public/js/api.js` | Helpers partagés `getJson()` / `postJson()` — factorisation des `fetch` dupliqués dans chaque page |

### 2. Pages publiques — cartes (comme prévu) ✅

- **`index.html` + `home.js`** : liste unique de cartes, deux cases à cocher (officielles cochées, non vérifiées décochées), badge vert/orange par carte, filtres conservés (département, commune, type, texte).
- Les cartes sont conservées **uniquement** pour les pages de consultation grand public (accueil, fiches).

### 3. Pages back-office — **écart assumé par rapport au plan** ⚠️

Le plan initial prévoyait des cartes partout. Décision prise en cours de phase (avec toi) : **les pages de travail back-office restent en tableaux**, car ce sont des interfaces de professionnels qui comparent des lignes en masse.

| Page | Interface finale |
|---|---|
| `index.html` (public) | **Cartes** ✅ |
| `review.html` | **Tableau** |
| `moderation.html` | **Tableau** (signalements + corrections) |
| `users.html` | **Tableau** |
| `admin.html` | **Tableau** (organisations + audit) |

Compensation mobile : conteneur `.table-scroll { overflow-x: auto; }` — le tableau défile dans sa boîte sans casser la page à 375px.

### 4. Corrections de bugs rencontrés en phase

1. **`CORRECTABLE_FIELD_LABELS` déclaré deux fois** dans `moderation.js` (reliquat du collage cartes → tableaux) → `SyntaxError`, tableaux vides. Fix : suppression du doublon en tête de fichier.
2. **`renderCard is not defined`** dans `users.js` → chargement de `ui.js` manquant/chemin incorrect.
3. **Chemins relatifs `src="js/ui.js"`** dans `users.html` et `admin.html` → corrigés en `/js/ui.js`. **Règle : toujours des chemins absolus depuis la racine.**
4. **Meta viewport manquante** sur certaines pages (`admin.html`, `moderation.html`) → ajoutée partout (indispensable pour que les tests 375px soient fiables).
5. **Bloc « vérification de champ » supprimé de `review.html`/`review.js`** : la route `POST /api/review/contributions/:id/verifications` n'existe pas dans le serveur ; la seule route réelle cible une organisation. Les vérifications de champ se font depuis la fiche organisation, pas pendant l'examen d'une contribution.

### 5. Retours visuels (conformes au plan) ✅

- Bouton `disabled` + « Chargement… » via `setLoading()` sur toutes les actions fetch ;
- Toasts verts/rouges, disparition après 4 s, `role="status"` ;
- Anti double-clic : bouton désactivé pendant la requête → une seule requête envoyée ;
- Gestion 401/403/409 : messages propres, plus de redirections silencieuses sur les pages protégées.

## Tests de fin de phase — tous validés ✅

- Aucun débordement horizontal à 375px sur les 11 pages ;
- Case « contributions » décochée → aucune contribution affichée ;
- Deux cases cochées → badges correctement différenciés ;
- Double-clic → une seule requête ;
- Serveur arrêté → toast rouge ;
- Parcours complets : Carine (masquer/restaurer/approuver/refuser), David (suspension, rôles), Estelle (archivage + audit + stats) ;
- Afi exclue des pages protégées ;
- Zéro erreur console sur toutes les pages.

## Texte à transmettre au prochain modèle

```text
Tu reprends le projet WorkMap, MVP local sans framework.

Stack figée : Node.js, Express, SQLite (better-sqlite3), bcryptjs,
cookie-parser, sessions en table SQL, HTML/CSS/JS simple en fetch, CommonJS.
Interdit : React, JWT, OAuth, ORM, Tailwind, IA, upload réel, nouvelle dépendance npm.

Phases 0 à 13 terminées et testées (cycle complet Collecte → Vérification →
Modération → Publication → Archivage, rôles, audit, stats).
Phase 17 : nav.js — navigation dynamique selon permissions, hamburger mobile.
Phase 18 ✅ : ui.js (toast/setLoading/renderCard/renderCardGrid) + api.js
(getJson/postJson partagés).

Décision de conception phase 18 : CARTES pour le public (index.html),
TABLEAUX pour le back-office (review, moderation, users, admin).
Tableaux emballés dans .table-scroll (overflow-x: auto) pour le mobile.
Toutes les pages ont la meta viewport et des chemins de script absolus (/js/...).

Règles à respecter :
- Le schéma fait foi : ne jamais inventer de nom de colonne.
- Aucune donnée dans innerHTML : DOM natif (createElement/textContent).
- Un seul déclaratif par constante par fichier (attention aux collages).
- logAudit() sur toute action sensible.
```

## Instructions pour la suite

La phase 18 clôturait le dernier chantier d'interface du plan de production. Concrètement, il te reste trois options selon ton plan d'origine :

1. **Vérifier s'il reste des phases du plan** (le plan de production semblait s'arrêter à 18) — si oui, colle-les moi.
2. **Phase de livraison finale** (équivalent de la phase 14 des plans précédents, appliquée à la production) :
   - Supprimer `check.js` à la racine si encore présent ;
   - Nettoyer les éventuelles fonctions mortes dans `ui.js` / `api.js` / anciens JS ;
   - Vérifier `.gitignore` (`db/workmap.sqlite`, `node_modules`) ;
   - Relire le `README.md` : procédure d'installation (`npm install`, `npm run init-db`, `npm start`), comptes de test, récapitulatif des routes ;
   - Test de bout en bout final sur base vierge (`npm run init-db` puis parcours complet Visiteur → Boris → Carine → Estelle).
3. **Rédiger le dossier de livrable** si le MVP doit être évalué : capture du cycle de vie d'une contribution, liste des permissions par rôle, schéma des 21 tables.


L'arborescence confirme le bilan, avec trois corrections importantes par rapport à ce que j'avais écrit. Voici le point définitif.

---

# Bilan définitif de la phase 19 — Configuration, sécurité, amorçage production

## 1. Corrections apportées à mon bilan précédent

L'arborescence réelle m'oblige à corriger trois points :

**Le throttling n'est PAS persisté en base.** Il vit dans `server/rateLimit.js`, un module dédié que je n'avais pas identifié. Il fonctionne donc **en mémoire**, ce qui explique pourquoi tu avais un `rateLimit.reset(req)` à placer dans le handler de login. Conséquence concrète : **un redémarrage du serveur remet tous les compteurs à zéro**. C'est acceptable pour un MVP, mais c'est une limite à connaître et à documenter pour la production.

**`scripts/init-db-prod.js` existe bien.** C'est le fichier que tu avais demandé de créer plutôt que de complexifier `init-db.js`. Je l'avais omis.

**Il n'y a pas de fichier `server/users.js` à la racine de `server/`.** Le garde-fou administrator est dans `server/modules/users.js`. Mon bilan précédent citait un chemin inexact.

## 2. Architecture réelle de la phase 19

```
WorkMap/
├── .env                      ← valeurs réelles, NON versionné
├── .env.example              ← modèle versionné
├── .gitignore                ← exclut .env et *.sqlite*
├── server/
│   ├── config.js             ← NOUVEAU — point d'entrée unique de la config
│   ├── rateLimit.js          ← NOUVEAU — throttling en mémoire
│   ├── auth.js               ← modifié — cookies, throttling, sessions
│   ├── db.js
│   ├── helpers.js
│   ├── server.js             ← modifié — consomme config
│   └── modules/              ← 10 modules métier
│       └── users.js          ← modifié — garde-fou administrator
├── scripts/
│   ├── bootstrap-admin.js    ← NOUVEAU — premier administrateur
│   ├── init-db.js            ← modifié — dev, refuse en production
│   ├── init-db-prod.js       ← NOUVEAU — structure seule
│   └── gen-hash.js
└── db/
    ├── schema.sql
    ├── seed-reference.sql
    ├── seed.sql
    ├── workmap.sqlite
    ├── workmap.sqlite-wal    ← mode WAL actif
    ├── workmap.sqlite-shm
    └── workmap.sqlite.dev    ← ⚠️ à vérifier
```

## 3. Rôle précis de chaque script d'initialisation

C'est le point que tu voulais voir clarifié. Il y a maintenant **trois scripts distincts** qui ne doivent jamais être confondus.

| Script | Ce qu'il fait | Quand l'utiliser |
|---|---|---|
| **`init-db.js`** | Supprime la base, applique `schema.sql`, puis `seed-reference.sql`, puis `seed.sql` | **Développement uniquement.** Il refuse de s'exécuter si `NODE_ENV=production`. C'est le garde-fou anti-catastrophe. |
| **`init-db-prod.js`** | Crée la base, applique `schema.sql` et `seed-reference.sql`. **Aucune donnée de test.** Ne supprime rien. | **Première installation en production.** Il donne une base vide mais utilisable : les référentiels (départements, communes, secteurs, rôles, permissions) sont indispensables au fonctionnement, ce ne sont pas des données de test. |
| **`bootstrap-admin.js`** | Crée le premier compte administrateur avec mot de passe généré, `must_change_password = 1` | **Juste après `init-db-prod.js`.** Sans lui, aucune connexion possible. Il refuse de créer un doublon si un admin existe déjà — comportement que tu as observé. |

La séquence de mise en production est donc :

```
init-db-prod.js  →  bootstrap-admin.js  →  connexion  →  changement de mot de passe forcé
```

Cette séparation garantit qu'aucune donnée de test ne puisse jamais atterrir en production, et qu'on puisse recréer un admin sans détruire la base.

## 4. Les trois fichiers de configuration

**`.env`** contient les valeurs réelles de ton installation : le port, l'environnement, le secret de session, le chemin de la base. Il est exclu par `.gitignore` et ne doit jamais être partagé ni versionné.

**`.env.example`** est le modèle versionné. Il liste toutes les clés attendues avec des valeurs factices. Quelqu'un qui récupère le projet le copie en `.env` et remplit ses propres valeurs. C'est la documentation vivante de la configuration.

**`server/config.js`** est le seul endroit du code qui lit `process.env`. Il charge `dotenv`, applique les valeurs par défaut, expose `DB_PATH`, `IS_PRODUCTION`, `SESSION_COOKIE_NAME`, le port. Cette centralisation a résolu un bug d'ordre de chargement : `dotenv` était appelé après certains `require`, les variables arrivaient donc vides.

## 5. Erreurs majeures rencontrées et leurs causes

| Erreur | Cause réelle | Résolution |
|---|---|---|
| **500 sur `/api/auth/change-password`** | L'erreur la plus longue de la phase. Incohérence entre le nom de colonne utilisé dans la requête et celui du schéma — `users.password`, pas `password_hash`. | Alignement strict sur `schema.sql` |
| **Cookie `secure` bloquant la session en local** | En HTTP, un cookie `secure` n'est jamais renvoyé par le navigateur → déconnexion instantanée | `secure: config.IS_PRODUCTION` |
| **Variables d'environnement vides** | `dotenv` chargé après les `require` | Centralisation dans `config.js` |
| **Throttling cru inactif** | Test arrêté pile au seuil de la 11e tentative | Faux négatif, retest concluant |
| **`bootstrap-admin` refusant de s'exécuter** | Un admin existait déjà dans le seed (`estelle.bio@example.test`) | Comportement correct, pas un bug |
| **Escalade de privilèges** | Un `user manager` pouvait réinitialiser le mot de passe d'un administrateur | Double garde-fou dans `modules/users.js` |
| **Variables déclarées non lues** | `targetIsAdmin` / `actorIsAdmin` calculées mais inutilisées | Logique de contrôle complétée |

## 6. Ajouts hors plan initial

Quatre éléments ont débordé du périmètre annoncé :

1. **`server/rateLimit.js`** — module de throttling complet, non prévu comme fichier dédié.
2. **`scripts/init-db-prod.js`** — né de ta remarque pertinente sur l'absurdité de complexifier `init-db.js` avec des conditions de production.
3. **Le double garde-fou administrator** — interdire la modification du rôle ne sert à rien si on peut voler le compte en changeant son mot de passe. La faille que tu as toi-même découverte en testant avec David.
4. **Le mécanisme `must_change_password`** — forçage du changement de mot de passe à la première connexion, avec la page `change-password.html` et son JS.

## 7. Deux points d'attention avant la phase 20

**`db/workmap.sqlite.dev`** — ce fichier traîne dans l'arborescence. Vérifie s'il s'agit d'un reliquat ou d'un basculement de chemin resté en place. Si c'est un résidu, supprime-le : une base fantôme est une source de confusion garantie.

**Le throttling en mémoire** — à documenter explicitement comme limite connue. En production sous pm2, un `pm2 restart` réinitialise tous les compteurs de blocage.

---

## Instructions pour le prochain modèle

```text
Projet WorkMap — MVP local sans framework frontend, préparation mise en
production. Développé sous Windows, chemin local
C:\Users\LENOVO\OneDrive\Desktop\WorkMap

STACK FIGÉE
Node.js, Express 5, SQLite (better-sqlite3), bcryptjs, cookie-parser,
dotenv, sessions en table SQL, HTML/CSS/JS natif avec fetch, CommonJS.
INTERDIT : React, Vue, JWT, OAuth, ORM, Tailwind, IA, upload réel.
Aucune nouvelle dépendance npm sans validation explicite de l'utilisateur.
Contrainte budgétaire stricte : aucune solution payante, aucun SaaS.

ÉTAT : phases 0 à 19 terminées et testées.

ARCHITECTURE RÉELLE
server/     : config.js, rateLimit.js, auth.js, db.js, helpers.js,
              server.js + modules/ (accounts, audit, contributions,
              corrections, organizations, reports, reviews, stats,
              users, verifications)
scripts/    : bootstrap-admin.js, init-db.js, init-db-prod.js, gen-hash.js
db/         : schema.sql, seed-reference.sql, seed.sql, workmap.sqlite
public/     : 16 pages HTML + js/ (17 fichiers) + style.css + fonts/
docs/       : documentation projet + docs/Prod/ pour la production

ACQUIS DE LA PHASE 19
- .env (non versionné), .env.example (versionné), server/config.js
  seul point de lecture de process.env.
- Cookies de session : secure conditionné à config.IS_PRODUCTION.
- server/rateLimit.js : throttling EN MÉMOIRE, verrouillage 15 min après
  11 échecs. LIMITE CONNUE : un redémarrage du serveur remet les
  compteurs à zéro. rateLimit.reset() est appelé après login réussi.
- Trois scripts d'initialisation aux rôles distincts, à NE PAS fusionner :
  * init-db.js      → dev, détruit et reconstruit avec seed de test,
                      refuse de s'exécuter si NODE_ENV=production
  * init-db-prod.js → production, schema + seed-reference uniquement,
                      aucune donnée de test, ne détruit rien
  * bootstrap-admin.js → premier administrateur, refuse les doublons,
                      pose must_change_password = 1
  Séquence prod : init-db-prod → bootstrap-admin → login → changement
  de mot de passe forcé.
- Garde-fou double dans server/modules/users.js : un acteur sans le rôle
  administrator ne peut ni modifier les rôles administrator, ni
  réinitialiser le mot de passe d'un administrateur. Testé et validé.
- must_change_password exposé par /api/auth/me, page change-password.html.
- Base en mode WAL (fichiers -wal et -shm présents).

À VÉRIFIER AVANT DE COMMENCER
db/workmap.sqlite.dev : reliquat probable, à identifier puis supprimer
si confirmé.

PROCHAINE ÉTAPE : Phase 20 — Déploiement et sauvegarde.
Contenu attendu : gestion du processus en production, procédure de
sauvegarde et restauration SQLite en tenant compte du mode WAL,
checklist de mise en ligne.

AVANT DE RÉDIGER QUOI QUE CE SOIT, DEMANDER :
- type d'hébergement retenu et offre souscrite ;
- accès SSH disponible ou non ;
- version de Node.js côté serveur ;
- nom de domaine et certificat TLS prévus ou non ;
- système d'exploitation du serveur.
Le contenu de la phase 20 dépend entièrement de ces réponses.

RÈGLES ABSOLUES
1. Le schéma SQL fait foi. users.password (PAS password_hash) — cette
   confusion a causé la plus longue erreur de la phase 19.
   audit_logs.user_id + actor_type.
   contributions.public_visibility + is_hidden.
2. Les handlers vivent dans server/modules/, jamais dans server.js.
   server.js ne contient que le câblage des routes.
3. Tests uniquement en fin de phase, jamais au fil de l'eau.
4. Toute action sensible appelle logAudit().
5. Ne pas commencer une nouvelle phase sans validation explicite.
6. Ne jamais exposer un hash de mot de passe dans une réponse API.
7. Les coordonnées des contributeurs ne sont jamais publiques.
8. Aucun acteur non-administrator ne touche à un compte administrator.
9. L'utilisateur code manuellement : donner des instructions précises
   avec le chemin du fichier et l'emplacement exact de l'insertion.
   Ne jamais dire « adapte au nom de ta variable » — demander le code
   réel et fournir l'extrait exact.

VÉRIFICATION AU DÉMARRAGE
npm run init-db && npm start, puis contrôler /api/health.
```