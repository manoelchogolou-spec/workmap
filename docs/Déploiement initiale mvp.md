Voici le plan d'action complet et détaillé pour préparer la mise en ligne du MVP de WorkMap. 

Ce document est conçu comme un cahier des charges technique clair, prêt à être transmis à n'importe quel développeur ou modèle d'IA pour exécution, tout en respectant strictement la règle du **"Zéro framework complexe (ni React, ni Tailwind)"**.

---

# 🚀 Plan de Préparation à la Mise en Ligne (MVP WorkMap)

**Contexte :** Le socle technique (Phases 1 à 12) est terminé et fonctionnel en local. L'objectif est maintenant de rendre l'application prête pour une utilisation réelle sur un serveur de production (sous-domaine), avec de vrais utilisateurs, tout en gardant une interface simple, responsive et ergonomique.

## 1. Nouvelles Fonctionnalités : Inscription et Gestion des Rôles
Puisque le fichier `seed.sql` ne sera plus utilisé pour créer les utilisateurs, il faut un flux d'intégration (onboarding) complet.

*   **Création de la page d'inscription (`register.html`) :**
    *   **Formulaire :** Nom, Prénom, Email, Mot de passe, Confirmation du mot de passe.
    *   **Backend :** Création d'une nouvelle route API (ex: `POST /api/auth/register`). Par sécurité, tout nouvel utilisateur inscrit reçoit automatiquement le rôle le plus bas (ex: `contributor` ou `visitor`).
*   **Évolution de l'interface Gestionnaire (Rôle : David) :**
    *   Actuellement, le gestionnaire peut suspendre des comptes. Il faut ajouter une fonctionnalité de **modification de rôle**.
    *   **UI :** Dans la liste des utilisateurs, ajouter un menu déroulant (`<select>`) permettant d'assigner un nouveau rôle (Contributeur, Vérificateur, Modérateur, etc.) et un bouton "Mettre à jour".
    *   **Backend :** Route sécurisée (ex: `PUT /api/users/:id/role`) qui loggue obligatoirement l'action via `logAudit()`.

## 2. Navigation et Interface Utilisateur (UI / UX)
L'interface doit faire "vrai site" et être parfaitement utilisable sur smartphone, toujours en CSS pur et JavaScript natif.

*   **Navigation dynamique globale (`<nav>`) :**
    *   Mettre en place une barre de navigation fixe en haut de toutes les pages.
    *   **Logique :** Le JavaScript appelle `/api/auth/me` au chargement. Selon le rôle de l'utilisateur, les liens du menu s'adaptent (ex: un Visiteur voit "Accueil/Contribuer", un Vérificateur voit en plus "Espace Vérification").
    *   **Mobile :** En CSS (via `@media query`), transformer le menu horizontal en un menu "Hamburger" (bouton qui déroule les liens) sur petit écran.
*   **Refonte de l'affichage des listes (Cartes au lieu de Tableaux) :**
    *   Les `<table>` HTML débordent sur mobile. Il faut transformer l'affichage des données (Organisations, Audit, Signalements) en un système de **Cartes (Cards)**.
    *   **Desktop :** Disposition en grille (ex: 3 cartes par ligne avec `display: grid` ou `flex`).
    *   **Mobile :** 1 seule carte par ligne, occupant 100% de la largeur.
*   **Retours visuels (Feedback UX) :**
    *   Désactiver les boutons de soumission (attribut `disabled`) et afficher "Chargement..." pendant les requêtes `fetch()` pour éviter les doubles clics.
    *   Créer un système de notifications simples (Toasts) : des petits encarts verts (succès) ou rouges (erreur) qui apparaissent temporairement en haut de l'écran lors des actions (ex: "Connecté avec succès", "Erreur réseau").
*   **Charte graphique minimale :**
    *   Définir des variables CSS (`:root`) pour 3 ou 4 couleurs fixes (Primaire, Secondaire, Succès, Avertissement).
    *   Uniformiser les bordures arrondies (`border-radius`) et les ombres légères (`box-shadow`) sur les boutons et les formulaires.

## 3. Affichage et Recherche des Organisations (Solution A adoptée)
Pour éviter qu'un visiteur sur mobile n'ait à faire défiler des centaines d'organisations vérifiées avant de voir les contributions en attente, les listes ne doivent plus être simplement empilées.

*   **Interface de Recherche Unifiée (`index.html`) :**
    *   Une seule grande liste de résultats (sous forme de cartes) mise à jour dynamiquement.
    *   **Filtres de recherche :** Ajout de cases à cocher (Checkboxes) bien visibles en haut de la page :
        *   `[X] Organisations Officielles` (Coché par défaut)
        *   `[ ] Contributions non vérifiées` (Décoché par défaut)
*   **Identification visuelle claire :**
    *   Chaque carte d'organisation doit porter un **badge de couleur distinctif** : Vert ("Officiel") ou Orange ("⚠️ Informations non vérifiées").
    *   Si l'utilisateur coche les deux cases, la liste affiche les deux types mélangés, mais le badge visuel empêche toute confusion (Respect de la règle absolue n°2 du MVP).

## 4. Prérequis d'Hébergement et DevOps (Mise en production)
Le code doit être adapté pour tourner de manière sécurisée sur un hébergement public.

*   **Variables d'environnement (`.env`) :**
    *   Supprimer toute donnée codée en dur.
    *   Créer un module de configuration pour charger les variables : `PORT`, `SESSION_SECRET` (pour signer les cookies), `NODE_ENV` (qui passera de `development` à `production`).
*   **Persistance de la Base de Données (SQLite) :**
    *   S'assurer que l'hébergement choisi ne réinitialise pas le système de fichiers à chaque redémarrage (éviter Vercel/Heroku standard). Le fichier `workmap.sqlite` doit être persistant sur le serveur.
*   **Sécurité et HTTPS :**
    *   L'hébergement doit configurer un certificat SSL (HTTPS) gratuit (ex: Let's Encrypt).
    *   Les cookies de session (`wm_sid`) doivent avoir les attributs `httpOnly: true`, `SameSite: 'Lax'` (ou `Strict`), et `secure: true` (uniquement si HTTPS est activé).

---
*Fin du document de spécifications.*