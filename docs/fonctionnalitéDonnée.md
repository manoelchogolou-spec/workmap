### Données minimales de test par fonctionnalité

| Fonctionnalité | Données nécessaires |
| **Consultation publique** | 3 organisations `published`, une par type, 2 contributions `pending` publiques et 1 organisation `draft` invisible |
| **Distinction des fiches** | 1 organisation officielle avec badge « Publiée » et 1 contribution provisoire avec badge « Non vérifiée » |
| **Prépublication** | 1 contribution `pending`, `public_visibility = TRUE`, `moderation_status = visible` et `published_at` renseigné |
| **Contribution privée** | 1 contribution `pending` avec `public_visibility = FALSE`, absente du site public |
| **Recherche** | Organisations et contributions publiques portant des noms différents |
| **Filtres** | 2 départements, 3 communes, 2 secteurs, les 3 types d’organisation et des données vérifiées/non vérifiées |
| **Filtre de fiabilité** | Résultats permettant de tester « Toutes », « Vérifiées uniquement » et « Non vérifiées » |
| **Classement des résultats** | 1 organisation officielle et 1 contribution provisoire correspondante, l’organisation officielle apparaissant en premier |
| **Fiche officielle** | Données communes et une spécialisation conforme au type de l’organisation |
| **Fiche provisoire** | Données publiques d’une contribution, date de soumission et avertissement, sans identité du contributeur ni données internes |
| **Soumission d’une contribution** | 1 contributeur et 1 contribution `pending`, avec confirmation de la possible prépublication |
| **Contribution sans compte** | Identité minimale directement enregistrée dans `contributions`, avec `contributor_id = NULL` |
| **Examen d’une contribution** | 1 vérificateur et 3 contributions permettant de tester `validated`, `rejected` et `duplicate` |
| **Détection d’un doublon** | 1 contribution et 1 organisation existante ayant un nom normalisé, une commune ou un téléphone similaire |
| **Validation** | 1 contribution `validated`, 1 revue et 1 organisation créée ou enrichie |
| **Retrait après validation** | Contribution validée avec fiche provisoire retirée, `withdrawn_at` renseigné et redirection vers l’organisation officielle |
| **Rejet** | Contribution `rejected`, retirée du public sans création d’organisation |
| **Doublon** | Contribution `duplicate`, revue référençant obligatoirement l’organisation existante, puis retrait ou redirection |
| **Vérification** | 1 organisation, 1 vérificateur, 1 vérification globale et 1 vérification de champ avec statut, méthode et date |
| **Publication officielle** | 1 organisation vérifiée en `pending` ou `draft`, puis passée à `published` avec `published_at` |
| **Masquage** | 1 contribution publique passant de `moderation_status = visible` à `hidden`, avec motif et audit |
| **Restauration** | 1 contribution masquée restaurée en `visible`, avec audit |
| **Signalement public** | 1 contribution publique et 1 `contribution_report` en `pending` avec motif et détails |
| **Traitement d’un signalement** | 1 signalement `resolved` ayant entraîné un masquage et 1 signalement `dismissed` sans masquage |
| **Correction publique** | 1 organisation publiée et 1 demande `pending`, avec champ, ancienne valeur et valeur proposée |
| **Approbation d’une correction** | 1 modérateur, 1 correction `approved` et 1 entrée dans `organization_changes` |
| **Rejet d’une correction** | 1 correction `rejected`, sans modification de l’organisation |
| **Historique** | 2 modifications successives d’une même organisation |
| **Authentification** | 1 utilisateur actif et 1 suspendu ; mécanisme d’authentification sécurisé séparé de la base métier |
| **Rôles et permissions** | 5 rôles, permissions générales et nouvelles permissions de visibilité et de modération |
| **Contrôle d’accès** | 1 visiteur, 1 contributeur, 1 vérificateur, 1 modérateur, 1 gestionnaire et 1 administrateur |
| **Protection des données** | Contribution publique contenant identité et téléphone du contributeur en base, mais jamais dans la réponse publique |
| **Justificatifs privés** | 1 contribution et 1 correction possédant chacune une pièce jointe privée distincte |
| **Audit utilisateur** | Journaux avec `actor_type = user` et `user_id` renseigné pour les actions humaines |
| **Audit système** | Journaux avec `actor_type = system` et `user_id = NULL` pour la prépublication automatique |
| **Statistiques** | Contributions réparties par statut, visibilité et modération ; signalements par statut ; corrections et organisations publiées |

### Jeu de données minimal conseillé

Utilisateurs : 6
- 1 contributeur
- 1 vérificateur
- 1 modérateur
- 1 gestionnaire des utilisateurs
- 1 administrateur
- 1 utilisateur suspendu

Référentiels :
- 2 départements
- 3 communes correctement rattachées
- 2 secteurs d’activité

Rôles : 5
- contributeur
- vérificateur
- modérateur
- gestionnaire des utilisateurs
- administrateur

Permissions :
- permissions métier générales
- view_public_pending_contributions
- hide_public_contribution
- restore_public_contribution
- review_contribution_report
- manage_public_visibility

Organisations : 6
- 3 PUBLISHED :
  - 1 privée lucrative
  - 1 privée non lucrative
  - 1 publique
- 1 DRAFT
- 1 PENDING
- 1 SUSPENDED

Spécialisations : 3
- 1 organization_private_profit
- 1 organization_private_nonprofit
- 1 organization_public

Contributions : 7
- 2 PENDING, publiques et visibles
- 1 PENDING, privée
- 1 PENDING, masquée
- 1 VALIDATED
- 1 REJECTED
- 1 DUPLICATE

Revues de contribution : 3
- 1 VALIDATED
- 1 REJECTED
- 1 DUPLICATE référençant une organisation existante

Signalements de contribution : 3
- 1 PENDING
- 1 RESOLVED
- 1 DISMISSED

Vérifications : 2
- 1 vérification globale : field_name = NULL
- 1 vérification du téléphone : field_name = "phone"

Demandes de correction : 3
- 1 PENDING
- 1 APPROVED
- 1 REJECTED

Pièces jointes : 2
- 1 rattachée uniquement à une contribution
- 1 rattachée uniquement à une correction

Historique :
- 2 changements successifs sur une même organisation

Audit :
- 1 prépublication automatique
- 1 masquage
- 1 restauration
- 1 validation
- 1 rejet
- 1 classement comme doublon
- 1 redirection
- 1 correction approuvée
- 1 changement de rôle
```

### Valeurs indispensables pour les contributions de test

```text
Contribution publique visible :
- status = 'pending'
- public_visibility = TRUE
- moderation_status = 'visible'
- published_at IS NOT NULL
- withdrawn_at IS NULL

Contribution privée :
- status = 'pending'
- public_visibility = FALSE
- published_at IS NULL

Contribution masquée :
- status = 'pending'
- public_visibility = TRUE
- moderation_status = 'hidden'
- moderation_reason IS NOT NULL

Contribution validée, rejetée ou dupliquée :
- public_visibility = FALSE
- withdrawn_at IS NOT NULL
```

> Ce jeu couvre les **20 tables**, la prépublication signalée, la modération, les signalements, la séparation entre contribution et organisation officielle, ainsi que les nouveaux besoins d’audit et de confidentialité.