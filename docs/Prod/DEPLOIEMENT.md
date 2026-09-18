# DEPLOIEMENT.md — WorkMap (hébergement mutualisé cPanel Open BJ)

> Cible : workmap.travaildunevie.bj — hébergement Web partagé cPanel (Open BJ),
> Node.js via Passenger (« Setup Node.js App »), accès SSH par clé, Git disponible.

## 1. Prérequis
- Hébergement cPanel Open BJ actif, accès SSH par clé configuré
- Module cPanel « Setup Node.js App » disponible (Passenger)
- Version Node : **24.20.0** (la plus élevée proposée)
- Git Version Control disponible dans cPanel

## 2. Création du sous-domaine
cPanel → **Domains → Create A New Domain** (ou Subdomains)
- Domaine : `workmap.travaildunevie.bj`
- Document root : `public_html/workmap` (sera géré par l'app Node, on n'y dépose rien à la main)
- Vérifier que l'enregistrement DNS pointe bien vers l'hébergement (cPanel le fait automatiquement pour un sous-domaine du domaine hébergé).

## 3. Préparation du dépôt (en local)
1. Commiter tout le projet (déjà fait, tag v0.19-mvp).
2. Créer un dépôt distant (GitHub/GitLab gratuit en privé) et pousser :
   `git remote add origin <URL> && git push -u origin master`
3. `.env` n'est jamais versionné : le panneau cPanel servira de `.env` en production.

## 4. Import du projet sur l'hébergement
cPanel → **Git Version Control → Create** :
- Clone URL : l'URL du dépôt distant
- Repository name : `workmap`
- Ne PAS cocher « Checkout de ce dépôt dans le répertoire public ».
Le projet est cloné dans `/home/<user>/workmap`, **hors de public_html**.

## 5. Création de l'application Node
cPanel → **Setup Node.js App → Create Application** :
- Node.js version : **24.20.0**
- Application root : `workmap`
- Application URL : `workmap.travaildunevie.bj`
- Application startup file : `server/server.js`
- Variables d'environnement (bouton ADD, une par ligne) :
  - `NODE_ENV` = `production`
  - `SESSION_SECRET` (ou équivalent, cf. server/config.js) = valeur longue et aléatoire
  - `DB_PATH` (ou équivalent) = `/home/<user>/workmap/db/workmap.sqlite`
  - Recopier toutes les autres clés présentes dans `.env.example`
  - NE PAS définir `PORT` (Passenger l'injecte lui-même).
- Clic **CREATE**.

## 6. Installation des dépendances
Sur la page de l'application → **Run NPM Install**.
Ou en SSH :
```
source /home/<user>/nodevenv/workmap/24.20.0/bin/activate
cd /home/<user>/workmap
npm ci --omit=dev
```

## 7. Initialisation de la base de données
En SSH (même environnement virtuel activé que §6) :
```
cd /home/<user>/workmap
node scripts/init-db-prod.js
node scripts/bootstrap-admin.js
```
Vérifier : `db/workmap.sqlite` créé, admin bootstrappé.

## 8. Démarrage et vérification
Sur la page de l'app dans cPanel → **Restart** (Run JS App).
Test : `https://workmap.travaildunevie.bj` doit répondre.
Passenger relance l'app automatiquement si elle plante.

## 9. HTTPS
cPanel → **SSL/TLS Status** → sélectionner `workmap.travaildunevie.bj` → **Run AutoSSL**.
Puis forcer HTTPS si l'option existe (Domains → Force HTTPS Redirect).

## 10. Sauvegarde quotidienne (Cron Jobs)
cPanel → **Cron Jobs → Add New Cron Job** :
- Common settings : Once per day (03:00)
- Command :
```
sqlite3 /home/<user>/workmap/db/workmap.sqlite ".backup /home/<user>/backups/workmap-$(date +\%F).sqlite" && find /home/<user>/backups -name "workmap-*.sqlite" -mtime +7 -delete
```
- Créer d'abord le dossier `backups` dans l'explorateur de fichiers.
- Si `sqlite3` CLI indisponible : `cp` simple à froid, ou backup via cPanel Backup hebdomadaire.

## 11. Checklist post-déploiement (tests de fin de phase)
- [ ] HTTPS actif, certificat AutoSSL valide
- [ ] Page d'accueil se charge sans ressource externe bloquée
- [ ] Inscription + connexion utilisateur OK
- [ ] Connexion admin + bootstrap OK
- [ ] Soumission d'une contribution complète OK
- [ ] Le fichier `db/workmap.sqlite` n'est PAS accessible par URL directe
- [ ] `private/` non accessible par URL directe
- [ ] Redémarrage automatique Passenger vérifié (kill du process → relance)
- [ ] Cron de sauvegarde exécuté au moins une fois

## 12. Mise à jour future
1. Local : commit + push
2. cPanel → Git Version Control → Pull (ou SSH : `git pull`)
3. cPanel → Setup Node.js App → **Restart**
4. Si package.json modifié : refaire « Run NPM Install ».
5. Si schéma modifié : ne JAMAIS relancer init-db-prod.js sur une base existante — écrire une migration dédiée.
