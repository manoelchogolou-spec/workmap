### Jeu de données fictif

> Toutes les personnes, organisations, coordonnées et références sont **fictives**.

> **Note :** Tous les mots de passe fictifs ci-dessous correspondent au mot de passe en clair `Password123!`, haché avec l'algorithme **bcrypt** (cost 12).

### Utilisateurs

| ID | Prénom | Nom | Téléphone | Email | Password | Statut | Rôle |
| `usr-001` | Afi | Dossou | `+2290197000001` | `afi.dossou@example.test` | `$2a$12$e8xO.P1R/eQJqF1m9yH8e.6aA5Z3W...` | active | contributeur |
| `usr-002` | Boris | Houngbédji | `+2290197000002` | `boris.h@example.test` | `$2a$12$K1mL2oP8qR3sT4uV5wX6y.9bC2D1E...` | active | vérificateur |
| `usr-003` | Carine | Kora | `+2290197000003` | `carine.kora@example.test` | `$2a$12$z9Y8x7W6v5U4t3S2r1Q0o.3fG4H5I...` | active | modérateur |
| `usr-004` | David | Soglo | `+2290197000004` | `david.soglo@example.test` | `$2a$12$pO9iU8yT7rE6wQ5aS4dF3.8jK9L0M...` | active | gestionnaire |
| `usr-005` | Estelle | Bio | `+2290197000005` | `estelle.bio@example.test` | `$2a$12$nB8vC7xC6zL5kJ4hG3fD2.1sA2S3D...` | active | administrateur |
| `usr-006` | Firmin | Zinsou | `+2290197000006` | `firmin.zinsou@example.test` | `$2a$12$mN7bV6cX5zA4sD3fG2hJ1.0kL9K8J...` | suspended | aucun |

### Référentiels
#### Départements

| ID | Nom |
| `dep-001` | Littoral |
| `dep-002` | Atlantique |

#### Communes

| ID | Département | Nom |
| `com-001` | `dep-001` | Cotonou |
| `com-002` | `dep-002` | Abomey-Calavi |
| `com-003` | `dep-002` | Ouidah |

#### Secteurs d’activité

| ID | Nom | Statut |
| `sec-001` | Transformation agroalimentaire | active |
| `sec-002` | Services numériques | active |

### Rôles
| ID | Nom |
| `rol-001` | contributor |
| `rol-002` | verifier |
| `rol-003` | moderator |
| `rol-004` | user_manager |
| `rol-005` | administrator |

### Affectations des rôles

| Utilisateur | Rôle | Attribué par |
| `usr-001` | `rol-001` | `usr-005` |
| `usr-002` | `rol-002` | `usr-005` |
| `usr-003` | `rol-003` | `usr-005` |
| `usr-004` | `rol-004` | `usr-005` |
| `usr-005` | `rol-005` | `usr-005` |

### Permissions

Permissions existantes :

submit_contribution
review_contribution
verify_organization
review_correction
publish_organization
manage_users
manage_roles
view_audit_logs

Permissions ajoutées :

view_public_pending_contributions
hide_public_contribution
restore_public_contribution
review_contribution_report
manage_public_visibility

Attributions minimales recommandées :

| Rôle | Permissions principales |
| contributor | `submit_contribution` |
| verifier | `review_contribution`, `verify_organization` |
| moderator | `review_correction`, `hide_public_contribution`, `restore_public_contribution`, `review_contribution_report`, `manage_public_visibility` |
| user_manager | `manage_users` |
| administrator | Toutes les permissions |

### Organisations

| ID | Nom fictif | Type | Département / commune | Quartier | Statut |
| `org-001` | Atacora Numérique SARL | private_profit | Littoral / Cotonou | Ganhi | published |
| `org-002` | Association Espoir du Littoral | private_nonprofit | Atlantique / Abomey-Calavi | Zogbadjè | published |
| `org-003` | Agence Communale des Initiatives Locales | public | Atlantique / Ouidah | Centre-ville | published |
| `org-004` | Saveurs du Mono | private_profit | Atlantique / Abomey-Calavi | Tankpè | draft |
| `org-005` | Fondation Horizon Bénin | private_nonprofit | Littoral / Cotonou | Akpakpa | suspended |
| `org-006` | Atelier Sèmè Innovation | private_profit | Atlantique / Ouidah | Pahou | pending |

Les organisations `org-004`, `org-005` et `org-006` ne sont pas des fiches officielles publiques.

#### Informations communes

| ID | Description | Téléphone | Email |
| `org-001` | Solutions numériques pour les petites entreprises | `+2290140000101` | `contact@atacora-numerique.example.test` |
| `org-002` | Accompagnement éducatif des jeunes | `+2290140000102` | `contact@espoir-littoral.example.test` |
| `org-003` | Appui fictif aux initiatives économiques locales | `+2290140000103` | `contact@acil.example.test` |
| `org-004` | Transformation de produits agricoles locaux | `+2290140000104` | `contact@saveurs-mono.example.test` |
| `org-005` | Actions communautaires et environnementales | `+2290140000105` | `contact@horizon-benin.example.test` |
| `org-006` | Ateliers fictifs d’innovation locale | `+2290140000106` | `contact@seme-innovation.example.test` |


### Spécialisations

Les trois spécialisations minimales sont rattachées aux trois organisations publiées :

organization_private_profit
- organization_id    : org-001
- ifu                : 3202600000001
- rccm               : RB/COT/26 B 00001
- legal_form         : SARL
- activity_sector_id : sec-002

organization_private_nonprofit
- organization_id    : org-002
- raf_number         : RAF-FICTIF-ATL-2026-001
- ifu                : 3202600000002
- organization_form  : Association
- activity_sector_id : sec-001
- promoter_name      : Nadège Hounsa
- promoter_phone     : +2290140000201
- promoter_email     : nadege.hounsa@example.test

organization_public
- organization_id       : org-003
- creation_act          : Arrêté communal fictif
- creation_act_reference: ACIL/2026/001
- creation_date         : 2026-01-15

### Contributions

| ID | Compte | Identité privée | Organisation proposée | Statut | Publique | Modération |
| `ctr-001` | `usr-001` | Afi Dossou | Coopérative Nouvelle Récolte | pending | oui | visible |
| `ctr-002` | — | Mariam Adjovi | Centre artisanal Wémè | pending | oui | visible |
| `ctr-003` | `usr-001` | Afi Dossou | Ferme Solidaire Atlantique | pending | non | visible |
| `ctr-004` | `usr-001` | Afi Dossou | Comptoir Littoral Plus | pending | oui | hidden |
| `ctr-005` | `usr-001` | Afi Dossou | Saveurs du Mono | validated | non | visible |
| `ctr-006` | `usr-001` | Afi Dossou | Centre Commercial du Littoral | rejected | non | visible |
| `ctr-007` | `usr-001` | Afi Dossou | Atacora Numérique | duplicate | non | visible |

#### Visibilité et dates

| ID | `public_visibility` | `published_at` | `withdrawn_at` | `moderation_reason` |
| `ctr-001` | TRUE | `2026-09-07T09:00:00+01:00` | — | — |
| `ctr-002` | TRUE | `2026-09-07T10:00:00+01:00` | — | — |
| `ctr-003` | FALSE | — | — | — |
| `ctr-004` | TRUE | `2026-09-07T11:00:00+01:00` | — | Signalement de donnée personnelle à examiner |
| `ctr-005` | FALSE | `2026-09-06T08:00:00+01:00` | `2026-09-08T11:00:00+01:00` | — |
| `ctr-006` | FALSE | `2026-09-06T09:00:00+01:00` | `2026-09-08T11:30:00+01:00` | — |
| `ctr-007` | FALSE | `2026-09-06T10:00:00+01:00` | `2026-09-08T12:00:00+01:00` | — |

Pour `ctr-002`, utiliser :

contributor_id         : NULL
contributor_first_name : Mariam
contributor_last_name  : Adjovi
contributor_phone      : +2290197111002

Ces données personnelles ne doivent jamais apparaître sur sa fiche publique.

### Revues des contributions

| ID | Contribution | Vérificateur | Décision | Organisation liée |
| `rev-001` | `ctr-005` | `usr-002` | validated | `org-004` |
| `rev-002` | `ctr-006` | `usr-002` | rejected | — |
| `rev-003` | `ctr-007` | `usr-002` | duplicate | `org-001` |

`ctr-007` doit rediriger vers `org-001`. La validation de `ctr-005` ne publie pas automatiquement `org-004`.

### Signalements de contributions

| ID | Contribution | Motif | Statut | Examiné par | Effet |
| `rpt-001` | `ctr-001` | duplicate | pending | — | Aucun |
| `rpt-002` | `ctr-004` | personal_data | resolved | `usr-003` | Contribution masquée |
| `rpt-003` | `ctr-002` | false_information | dismissed | `usr-003` | Aucun masquage |


### Vérifications

| ID | Organisation | Champ | Vérificateur | Statut | Méthode | Date |
| `ver-001` | `org-004` | `NULL` | `usr-002` | verified | Examen d’un document | `2026-09-08T10:30:00+01:00` |
| `ver-002` | `org-001` | `phone` | `usr-002` | verified | Vérification téléphonique | `2026-09-08T15:00:00+01:00` |

Pour tester la publication officielle, faire passer `org-004` de `draft` à `published`, puis renseigner `published_at`.

### Demandes de correction

| ID | Organisation | Champ | Ancienne valeur | Valeur proposée | Statut |
| `cor-001` | `org-001` | phone | `+2290140000101` | `+2290140000191` | pending |
| `cor-002` | `org-002` | address | Zogbadjè | Rue fictive des Écoliers, Zogbadjè | approved |
| `cor-003` | `org-003` | name | Agence Communale des Initiatives Locales | Agence Nationale des Initiatives | rejected |

La correction rejetée ne modifie pas `org-003`.

### Historique des modifications

| ID | Organisation | Champ | Ancienne valeur | Nouvelle valeur | Source |
| `chg-001` | `org-002` | address | Zogbadjè | Rue fictive des Écoliers, Zogbadjè | correction |
| `chg-002` | `org-002` | phone | `+2290140000102` | `+2290140000182` | administration |

### Journaux d’audit

| Action | Type d’acteur | Utilisateur | Entité |
| `contribution_auto_published` | system | — | `ctr-001` |
| `public_contribution_hidden` | user | `usr-003` | `ctr-004` |
| `public_contribution_restored` | user | `usr-003` | `ctr-004` |
| `contribution_validated` | user | `usr-002` | `ctr-005` |
| `contribution_rejected` | user | `usr-002` | `ctr-006` |
| `duplicate_identified` | user | `usr-002` | `ctr-007` |
| `contribution_redirected` | system | — | `ctr-007` |
| `correction_approved` | user | `usr-003` | `cor-002` |
| `role_assigned` | user | `usr-005` | `usr-004` |

> Pour assurer la cohérence finale, l’événement de restauration de `ctr-004` doit précéder son dernier masquage, lequel peut être associé à la résolution de `rpt-002`.

### Pièces jointes privées

att-001
- contribution_id       : ctr-005
- correction_request_id : NULL
- file_name             : justificatif-fictif-saveurs-mono.pdf
- file_path             : private/contributions/ctr-005/justificatif.pdf
- mime_type             : application/pdf
- uploaded_at           : 2026-09-07T14:00:00+01:00

att-002
- contribution_id       : NULL
- correction_request_id : cor-002
- file_name             : preuve-fictive-adresse.pdf
- file_path             : private/corrections/cor-002/preuve-adresse.pdf
- mime_type             : application/pdf
- uploaded_at           : 2026-09-07T15:00:00+01:00

Chaque pièce jointe possède exactement un parent. Les fichiers demeurent privés et stockés hors de la base.