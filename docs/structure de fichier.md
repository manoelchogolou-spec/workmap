# Structure minimale du projet WorkMap

workmap/
│
├── .gitignore
├── package.json
├── README.md
│
├── db/
│   ├── schema.sql              # Création des 20 tables + contraintes CHECK
│   ├── seed.sql                # Données de test
│   └── workmap.sqlite          # Généré, ignoré par Git
│
├── scripts/
│   └── init-db.js              # Crée la base + exécute schema.sql + seed.sql
│
├── server/
│   ├── server.js                # Point d'entrée : http natif + routeur
│   ├── router.js                 # Table de routage URL/méthode → handler
│   ├── db.js                     # Connexion SQLite unique (partagée partout)
│   ├── auth.js                   # Hash mdp, session, vérif permission (tout l'auth)
│   ├── helpers.js                # parseBody, uuid, réponses JSON, audit log
│   │
│   └── modules/                  # Un fichier par domaine métier = SQL + règles + handlers
│       ├── users.js               # comptes, rôles, permissions, gestion utilisateurs
│       ├── organizations.js       # CRUD + spécialisations + publication
│       ├── contributions.js       # création, suivi, examen, validation/rejet/doublon
│       ├── reports.js             # signalements + masquage/restauration
│       ├── corrections.js         # demandes de correction + historique
│       ├── verifications.js       # vérifications globales/par champ
│       └── stats.js               # requêtes d'agrégation pour le dashboard
│
├── public/
│   ├── index.html                 # Accueil : recherche + filtres
│   ├── organization.html          # Fiche organisation officielle
│   ├── contribution.html          # Fiche contribution provisoire
│   ├── contribute.html            # Formulaire contribution
│   ├── report.html                # Formulaire signalement
│   ├── correction.html            # Formulaire correction
│   ├── login.html                 # Connexion
│   │
│   ├── dashboard.html              # Une seule page qui affiche du contenu différent
│   │                                # selon le rôle connecté (contributeur, vérificateur,
│   │                                # modérateur, gestionnaire, admin) via JS
│   │
│   ├── style.css                   # Un seul fichier CSS
│   │
│   └── js/
│       ├── api.js                   # fetch() générique réutilisé partout
│       ├── home.js
│       ├── contribute.js
│       ├── login.js
│       └── dashboard.js             # Logique d'affichage conditionnelle par rôle
│
└── docs/
    ├── Description projet.md
    ├── database.md
    ├── donnée seed.md
    ├── fonctionnalitéDonnée.md
    └── Etape de réalisation projet.md

## Contenu type d'un fichier module (exemple)

Pour que tu visualises comment `contributions.js` sera organisé en interne (toujours dans le même fichier, mais avec des sections claires) :

```js
// server/modules/contributions.js

// --- Accès aux données ---
function findById(id) { ... }
function findAll(filters) { ... }
function create(data) { ... }
function updateStatus(id, status) { ... }

// --- Règles métier ---
function canBeReviewedBy(user) { ... }
function validateContribution(id, reviewerId) {
  // change le statut + crée l'organisation + logAudit()
}

// --- Handlers HTTP (appelés par router.js) ---
function handleCreate(req, res) { ... }
function handleList(req, res) { ... }
function handleReview(req, res) { ... }

module.exports = { handleCreate, handleList, handleReview, ... };
```

Cette convention (3 sections dans un même fichier) sera répétée dans chaque module — tu gardes la clarté de la séparation des responsabilités sans multiplier les fichiers.

## Bilan du nombre de fichiers

- **Structure minimale** : **~25 fichiers**
