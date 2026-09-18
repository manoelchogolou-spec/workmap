# Work Map — Document de référence du MVP

## 1. Vision du projet
**Work Map** est une application web destinée à constituer et rendre accessible au public une base structurée des organisations présentes sur le territoire du Bénin.

Le MVP couvre le cycle suivant :

Collecte
  → Prépublication signalée
  → Vérification
      ├─ Rejet
      ├─ Doublon
      └─ Validation
           → Publication officielle
           → Correction
           → Historique


Une contribution peut être rendue publique avant son traitement, mais elle demeure distincte d’une organisation officielle.

Deux niveaux d’information publique existent donc :

1. les contributions provisoires portant la mention **« Informations non vérifiées »** ;
2. les organisations officiellement publiées après traitement.

La visibilité d’une contribution ne constitue jamais une validation de ses informations par Work Map.

## 2. Objectifs fonctionnels
Le MVP doit permettre de :

1. collecter les informations relatives aux organisations ;
2. prépublier certaines contributions en attente ;
3. signaler clairement leur caractère non vérifié ;
4. vérifier les informations collectées ;
5. publier officiellement les organisations validées ;
6. rechercher et filtrer les organisations et contributions publiques ;
7. signaler une contribution provisoire problématique ;
8. recevoir et traiter les corrections d’organisations officielles ;
9. conserver l’historique des modifications ;
10. contrôler les actions sensibles par rôles et permissions ;
11. assurer la traçabilité des opérations importantes ;
12. présenter l’activité continue de la plateforme sans confondre activité et fiabilité.

## 3. Principes fondamentaux
- Les organisations `PUBLISHED` et certaines contributions `PENDING` peuvent être visibles publiquement.
- Toute contribution publique non vérifiée doit être clairement signalée comme telle.
- Une contribution reste distincte d’une organisation officielle.
- Une contribution publique n’est modifiable que par les processus internes autorisés.
- La visibilité ne signifie ni validation ni garantie de Work Map.
- Une correction ne modifie jamais directement une organisation officielle.
- Toute modification importante conserve l’ancienne valeur.
- Les données publiques sont séparées des données internes.
- L’identité et les coordonnées privées du contributeur ne sont jamais affichées.
- Les justificatifs, observations internes, audits et données de modération restent privés.
- La plateforme doit pouvoir masquer rapidement une contribution problématique.
- Les opérations sensibles nécessitent les permissions appropriées.
- Un compte utilisateur ne représente pas automatiquement une organisation.
- Un contributeur n’est pas nécessairement le promoteur ou représentant légal de l’organisation proposée.
- L’authentification doit être gérée par un système sécurisé distinct de la base métier.

## 4. Objets publics et niveaux de fiabilité

La consultation publique distingue deux objets.

| Objet public | Nature | Indication obligatoire |
|---|---|---|
| Organisation `PUBLISHED` | Fiche officielle ayant satisfait aux règles de publication | « Organisation vérifiée/publiée » |
| Contribution `PENDING` publique | Proposition encore non traitée | « Informations non vérifiées » |

Une contribution provisoire doit être affichée directement à partir de `contributions`. Sa prépublication ne doit pas entraîner automatiquement la création d’un enregistrement dans `organizations`.

Après validation et publication officielle, sa fiche provisoire est retirée ou redirigée vers la fiche de l’organisation correspondante.

## 5. Types d’organisations
Toutes les organisations officielles partagent une entité centrale contenant notamment :

- identifiant ;
- nom ;
- type ;
- description ;
- département ;
- commune ;
- quartier ;
- adresse ;
- téléphone ;
- email ;
- site web ;
- statut ;
- dates de création, modification et publication.

Les informations inconnues peuvent rester absentes lorsque les données minimales sont disponibles.

### 5.1 Privée à but lucratif

Exemples : société, commerce ou entreprise individuelle.

Données spécialisées :

- IFU de l’organisation ;
- RCCM ;
- forme juridique ;
- secteur d’activité.

### 5.2 Privée à but non lucratif

Exemples : association, ONG ou fondation.

Données spécialisées :

- numéro RAF ;
- IFU de l’organisation ;
- forme de l’organisation ;
- secteur d’activité ;
- nom, téléphone et email du promoteur.

### 5.3 Publique ou étatique

Données spécialisées :

- type d’acte ou décret de création ;
- référence de l’acte ;
- date de création.

Une organisation ne peut avoir qu’une spécialisation conforme à son type.

## 6. Identifiants administratifs

### 6.1 IFU

L’IFU est une donnée textuelle. Le système doit distinguer l’IFU d’une organisation de celui d’une personne physique.

Il ne doit pas supposer qu’une société, une entreprise individuelle et son représentant partagent nécessairement le même IFU.

### 6.2 RCCM et RAF

Ces identifiants sont stockés sous forme textuelle. Le MVP ne leur applique pas de format métier restrictif tant que les règles administratives exactes ne sont pas confirmées.


## 7. Consultation publique

Un visiteur sans compte peut :

- consulter les organisations officielles publiées ;
- consulter les contributions provisoires autorisées ;
- rechercher une organisation ou une contribution ;
- appliquer des filtres ;
- consulter une fiche détaillée officielle ;
- consulter une fiche provisoire ;
- signaler une contribution provisoire ;
- signaler une erreur sur une organisation officielle ;
- proposer une correction.

### 7.1 Filtres minimaux

- type d’organisation ;
- département ;
- commune ;
- secteur d’activité pour les organisations privées concernées ;
- niveau de fiabilité.

Niveau de fiabilité :
- Toutes
- Vérifiées uniquement
- Non vérifiées

Les organisations officielles devraient être classées avant les contributions non vérifiées.

### 7.2 Présentation des résultats provisoires

Chaque contribution publique doit afficher :

- le badge **« Non vérifiée »** ;
- sa date de soumission ;
- un avertissement sur son statut provisoire ;
- l’absence de garantie de Work Map ;
- une action permettant de la signaler.

La consultation publique doit exclure :

- les contributions masquées ;
- les organisations non publiées ;
- l’identité et les coordonnées privées des contributeurs ;
- les observations internes ;
- les données de vérification ou de modération réservées ;
- les justificatifs ;
- les journaux d’audit.

## 8. Contribution

Toute personne peut proposer une organisation, même sans compte Work Map.

### 8.1 Identité minimale du contributeur

- prénom ;
- nom ;
- téléphone.

Si la personne possède un compte, la contribution peut aussi référencer son utilisateur. Cette référence reste facultative.

Ces informations servent à la traçabilité interne et ne doivent pas être affichées sur la fiche provisoire.

### 8.2 Informations proposées

Le formulaire peut notamment recevoir :

- nom et type présumé de l’organisation ;
- département, commune et quartier ;
- adresse ;
- secteur présumé ;
- téléphone et email de l’organisation ;
- description ;
- autres informations disponibles ;
- justificatifs éventuels.

Les coordonnées publiques proposées pour l’organisation doivent être distinguées des coordonnées privées du contributeur.

### 8.3 Information et consentement

Avant l’envoi, le formulaire doit :

- indiquer que certaines informations sur l’organisation pourront être publiées avant vérification ;
- demander une confirmation du contributeur ;
- interdire la transmission de données personnelles, confidentielles ou sensibles non nécessaires ;
- expliquer que l’identité personnelle du contributeur ne sera pas affichée ;
- préciser que Work Map peut masquer la contribution.

### 8.4 Données enregistrées

Chaque contribution reçoit automatiquement :

- un identifiant ;
- l’identité privée du contributeur ;
- une date et une heure de soumission ;
- un statut initial ;
- un indicateur de visibilité publique ;
- une date de prépublication éventuelle ;
- une date de retrait éventuelle ;
- un état et un motif de modération éventuels.

## 9. Statuts et visibilité des contributions

### 9.1 Statuts métier

PENDING
VALIDATED
REJECTED
DUPLICATE

### 9.2 Données de visibilité

La table `contributions` doit notamment contenir :

public_visibility BOOLEAN NOT NULL DEFAULT TRUE
published_at TIMESTAMP NULL
withdrawn_at TIMESTAMP NULL

moderation_status ENUM(
  'visible',
  'hidden'
) NOT NULL DEFAULT 'visible'

moderation_reason TEXT NULL

### 9.3 Règle de prépublication

Une contribution est publiquement visible lorsque :

status = PENDING
AND public_visibility = TRUE
AND moderation_status = 'visible'

Un contrôle minimal de sécurité doit précéder sa prépublication.

### 9.4 Effet des statuts

| Statut | Comportement public |
| `PENDING` | Visible avec avertissement lorsque les règles de visibilité sont satisfaites |
| `VALIDATED` | Fiche provisoire retirée puis redirigée vers l’organisation officielle lorsqu’elle est publiée |
| `REJECTED` | Contribution retirée de l’espace public |
| `DUPLICATE` | Contribution retirée ou redirigée vers l’organisation existante |

Une contribution validée peut servir à créer ou enrichir une organisation. La contribution originale doit toujours être conservée.

## 10. Fiche publique provisoire

Une contribution publique possède une page distincte de la fiche officielle, par exemple :

/contributions/{id}


Elle doit afficher de façon visible :

> ⚠️ Cette fiche provient d’une contribution publique. Ses informations n’ont pas encore été vérifiées par Work Map.

Elle peut présenter les informations proposées sur l’organisation, mais ne doit jamais afficher :

- le nom du contributeur ;
- son téléphone ou son email ;
- les justificatifs ;
- les observations internes ;
- les informations d’audit ;
- les informations réservées à la vérification ou à la modération.

Son design doit être clairement différent de celui d’une organisation officiellement publiée.

## 11. Contrôle minimal et modération
Avant toute prépublication, le système doit empêcher autant que possible l’exposition de :

- données personnelles non nécessaires ;
- informations confidentielles ou sensibles ;
- justificatifs ;
- contenus frauduleux, abusifs ou manifestement illégaux ;
- contenus susceptibles de constituer une usurpation ou une diffamation.

Une contribution peut être masquée sans attendre la décision de vérification métier.

Le masquage :

- ne supprime pas la contribution ;
- conserve son statut métier ;
- exige un motif lorsque cela est applicable ;
- doit être audité ;
- peut être annulé par un utilisateur autorisé.

## 12. Examen et doublons

Un vérificateur examine chaque contribution en attente et peut :

- la valider ;
- la rejeter ;
- l’identifier comme doublon ;
- la masquer immédiatement si nécessaire.

La revue conserve :

- la contribution concernée ;
- le vérificateur ;
- la décision ;
- l’observation éventuelle ;
- la date ;
- l’organisation existante en cas de doublon.

### 12.1 Prévention des doublons

Avant la prépublication, une recherche simple de similitudes doit pouvoir porter sur :

- le nom normalisé ;
- la commune ;
- le téléphone.

Lorsqu’une correspondance est détectée, le système peut :

- avertir le contributeur ;
- déclasser ou regrouper visuellement les propositions similaires ;
- soumettre la contribution à un examen.

La détection automatique avancée reste hors périmètre du MVP.

### 12.2 Décision de doublon

En cas de doublon :

- aucune nouvelle organisation n’est créée ;
- la contribution reste conservée ;
- l’organisation correspondante est référencée ;
- la fiche provisoire est retirée ou redirigée vers l’organisation existante ;
- la décision est tracée avec l’identité du vérificateur et la date.

## 13. Vérification
Une vérification enregistre :

- l’organisation ;
- le vérificateur ;
- le statut ;
- la méthode ;
- une observation éventuelle ;
- la date.

Les méthodes peuvent inclure :

- consultation d’une source officielle ;
- vérification téléphonique ;
- contact avec l’organisation ;
- examen d’un document ;
- autre méthode.

### 13.1 Portée de la vérification

field_name = NULL       → vérification globale
field_name = "phone"    → vérification du téléphone

Le système accepte les vérifications globales et celles portant sur un champ précis. Une vérification passée n’est jamais considérée comme définitivement vraie.

### 13.2 Traitement après validation

Contribution VALIDATED
  → Création ou enrichissement de l’organisation
  → Organisation PENDING ou PUBLISHED
  → Retrait de la fiche provisoire
  → Redirection vers la fiche officielle lorsqu’elle est publiée

La validation d’une contribution n’entraîne pas nécessairement la publication immédiate de l’organisation. Les conditions de publication doivent être satisfaites séparément.

## 14. Publication officielle

Une organisation possède l’un des statuts suivants :

DRAFT
PENDING
PUBLISHED
SUSPENDED
ARCHIVED

Seul le statut `PUBLISHED` transforme l’organisation en fiche officielle accessible dans la base publique.

Une organisation officiellement publiée doit être clairement distinguée d’une contribution provisoire.

Elle peut ensuite être corrigée ou mise à jour suivant les processus autorisés.


## 15. Corrections et signalements publics

Il faut distinguer deux procédures :

| Procédure | Objet concerné | Effet possible |
| Correction | Organisation officielle | Modification après approbation |
| Signalement | Contribution provisoire | Examen, masquage, rejet ou classement en doublon |

### 15.1 Correction d’une organisation officielle

Depuis une fiche officielle, un visiteur peut proposer une correction contenant notamment :

- le champ concerné ;
- la valeur actuelle ;
- la valeur proposée ;
- la raison ;
- ses coordonnées ;
- un justificatif éventuel.

La demande est enregistrée séparément et ne modifie jamais immédiatement l’organisation.

Une correction est recevable si :

submitted_by est renseigné
OU
submitter_name et au moins un contact sont renseignés

Un contact correspond au téléphone ou à l’email.

Ses statuts sont :

PENDING
APPROVED
REJECTED

Lorsqu’elle est approuvée :

1. la valeur officielle est modifiée ;
2. l’ancienne valeur est conservée ;
3. la nouvelle valeur est enregistrée ;
4. la source et le motif sont conservés ;
5. le validateur est identifié ;
6. la date du changement est enregistrée.

Une correction rejetée ne modifie pas l’organisation.

### 15.2 Signalement d’une contribution provisoire

Un visiteur peut signaler notamment :

- une fausse information ;
- un doublon ;
- une donnée personnelle ;
- un contenu abusif ;
- une usurpation ;
- une organisation inexistante.

Ces signalements sont enregistrés dans une entité dédiée, recommandée sous le nom `contribution_reports`.

## 16. Historique des modifications

Chaque modification importante d’une organisation doit enregistrer :

- l’organisation ;
- le champ modifié ;
- l’ancienne valeur ;
- la nouvelle valeur ;
- la source du changement ;
- l’utilisateur ou le processus responsable ;
- le motif ;
- la date et l’heure.

L’historique est réservé aux utilisateurs possédant les permissions nécessaires.

Les changements de visibilité des contributions relèvent principalement de l’audit et, si nécessaire, d’un historique de modération dédié.

## 17. Utilisateurs, rôles et permissions

Un utilisateur connecté possède un compte personnel comprenant notamment :

- identifiant ;
- prénom et nom ;
- téléphone ;
- email ;
- statut ;
- dates de création et de modification.

Un utilisateur peut n’avoir aucun rôle ou en cumuler plusieurs.

### 17.1 Rôles du MVP

| Rôle | Responsabilités principales |
| **Contributeur** | Proposer et consulter ses contributions |
| **Vérificateur** | Examiner les contributions, décider et effectuer les vérifications |
| **Modérateur** | Traiter les signalements et corrections, masquer ou restaurer une contribution |
| **Gestionnaire des utilisateurs** | Gérer les comptes et certains accès |
| **Administrateur** | Administrer organisations, utilisateurs, rôles, permissions, visibilité et traçabilité |

Le modérateur peut masquer une contribution sans effectuer lui-même sa vérification métier.

### 17.2 Modèle d’autorisation

Utilisateur → Rôle → Permissions

- Un utilisateur peut posséder plusieurs rôles.
- Un rôle peut appartenir à plusieurs utilisateurs.
- Un rôle contient plusieurs permissions.
- Une permission peut appartenir à plusieurs rôles.
- Les permissions ne sont pas intégrées directement aux comptes.

Permissions complémentaires :

view_public_pending_contributions
hide_public_contribution
restore_public_contribution
review_contribution_report
manage_public_visibility

Elles complètent notamment les permissions permettant de :

- créer ou modifier une organisation ;
- consulter ou examiner les contributions ;
- valider, rejeter ou identifier un doublon ;
- vérifier une information ;
- traiter une correction ;
- gérer les utilisateurs, rôles et permissions ;
- consulter les données de traçabilité.

## 18. Justificatifs

Un justificatif peut appartenir :

- soit à une contribution ;
- soit à une demande de correction ;
- jamais aux deux simultanément.

La base conserve uniquement :

- l’identifiant ;
- le parent associé ;
- le nom du fichier ;
- son emplacement ;
- son type MIME ;
- sa date de dépôt.

Les fichiers sont stockés hors de la base et ne sont jamais publiés automatiquement, y compris lorsque la contribution associée est visible.

## 19. Audit

Les opérations importantes doivent produire une trace, notamment :

- soumission d’une contribution ;
- prépublication automatique ;
- changement de visibilité ;
- masquage et restauration ;
- validations et rejets ;
- identification des doublons ;
- redirection vers une organisation officielle ;
- vérifications ;
- signalements ;
- corrections ;
- modifications d’organisations ;
- opérations administratives ;
- changements de rôles ou permissions.

Une trace contient, selon le contexte :

- l’utilisateur ou le système responsable ;
- l’action ;
- le type et l’identifiant de l’entité ;
- la date et l’heure ;
- les anciennes et nouvelles données pertinentes ;
- des métadonnées complémentaires.

Le journal doit distinguer clairement les actions humaines des actions automatiques.

## 20. Données géographiques

La hiérarchie minimale est :

Département → Commune → Quartier

- Les départements et communes sont structurés.
- Le quartier reste une valeur textuelle.
- Toute commune associée à une organisation ou contribution doit appartenir au département indiqué.

## 21. Statistiques minimales

L’administration doit pouvoir mesurer :

- le nombre de contributeurs ;
- le nombre total de contributions ;
- les contributions validées, rejetées et dupliquées ;
- les contributions publiques actuellement visibles ;
- les contributions publiques en attente ;
- les contributions masquées ;
- le délai moyen avant vérification ;
- le nombre de signalements reçus ;
- le taux de validation, rejet et doublon des contributions publiques ;
- le nombre d’organisations publiées ;
- le nombre total de corrections ;
- les corrections approuvées et rejetées.

Pour rendre l’activité visible au public, la plateforme peut afficher :

- les contributions reçues récemment ;
- les organisations ajoutées ce mois-ci ;
- les vérifications en cours.

Ces indicateurs doivent éviter de présenter une contribution non vérifiée comme une organisation officielle.

## 22. Modèle de données de référence
Le modèle comporte désormais **au moins 20 tables** :

1. `users`
2. `roles`
3. `permissions`
4. `user_roles`
5. `role_permissions`
6. `departments`
7. `communes`
8. `activity_sectors`
9. `organizations`
10. `organization_private_profit`
11. `organization_private_nonprofit`
12. `organization_public`
13. `contributions`
14. `contribution_reviews`
15. `verifications`
16. `correction_requests`
17. `organization_changes`
18. `audit_logs`
19. `attachments`
20. `contribution_reports`

## 23. Flux fonctionnels

### 23.1 Ajouter et prépublier une contribution

Personne
  → Contribution PENDING
  → Contrôle minimal de sécurité
      ├─ Contenu interdit ou sensible
      │    → Contribution masquée
      └─ Contenu acceptable
           → Fiche provisoire « Non vérifiée »
           → Examen
               ├─ REJECTED
               │    → Retrait public
               ├─ DUPLICATE
               │    → Retrait ou redirection
               └─ VALIDATED
                    → Création ou enrichissement
                    → Vérification
                    → Publication officielle
                    → Redirection de la fiche provisoire

### 23.2 Consulter les données publiques
Visiteur
  → Recherche ou filtres
  → Organisations PUBLISHED
    + Contributions PENDING publiquement visibles
  → Fiche officielle ou fiche provisoire

### 23.3 Corriger une organisation officielle
Visiteur
  → Demande de correction PENDING
  → Examen
      ├─ REJECTED
      └─ APPROVED
           → Modification officielle
           → Historique
           → Fiche actualisée

### 23.4 Signaler une contribution provisoire

Visiteur
  → Signalement
  → Examen par un modérateur
      ├─ Signalement rejeté
      ├─ Contribution maintenue
      └─ Contribution masquée
           → Vérification ou décision ultérieure

### 23.5 Vérifier une organisation
Organisation
  → Vérification globale ou par champ
  → Statut + méthode + observation + date
  → Enregistrement du vérificateur

## 24. Exigences de sécurité et d’intégrité

1. Un visiteur ne modifie jamais directement une organisation ou une contribution.
2. Une contribution visible ne devient jamais automatiquement officielle.
3. Toute contribution provisoire affiche clairement son absence de vérification.
4. Une correction ne modifie jamais directement la fiche officielle.
5. L’identité privée du contributeur n’est jamais exposée publiquement.
6. Les données internes et justificatifs sont privés par défaut.
7. Toute contribution publique peut être rapidement masquée.
8. Les actions sensibles sont contrôlées par permissions.
9. Les modifications importantes sont historisées et auditées.
10. Les anciennes valeurs importantes ne sont jamais perdues.
11. Les utilisateurs accèdent uniquement aux données autorisées.
12. L’authentification est sécurisée et séparée de la base métier.
13. Une spécialisation correspond obligatoirement au type de l’organisation.
14. Un doublon référence une organisation existante.
15. Un justificatif possède exactement un parent.
16. Les actions automatiques sont distinguées des actions humaines.
17. Une validation de contribution ne vaut pas nécessairement publication officielle.
18. Une contribution rejetée ou dupliquée n’est plus présentée comme fiche provisoire active.

## 25. Hors périmètre du MVP
- recrutement et offres d’emploi ;
- candidatures ;
- messagerie et réseau social ;
- notes et commentaires publics ;
- abonnements ;
- marketplace et publicité ;
- API publique ;
- réputation algorithmique ;
- géolocalisation avancée ;
- vérification automatisée avancée ;
- classification ou vérification par intelligence artificielle ;
- détection avancée et automatisée des doublons.

## 26. Critères globaux d’acceptation
Le MVP est conforme lorsque :

- une personne peut contribuer avec ou sans compte ;
- le contributeur est informé de la possible prépublication ;
- son identité personnelle n’est jamais affichée ;
- une contribution admissible peut être prépubliée avec la mention « Non vérifiée » ;
- une contribution provisoire demeure distincte d’une organisation officielle ;
- les organisations officielles et contributions provisoires sont visuellement différenciées ;
- les contributions masquées, rejetées ou dupliquées ne restent pas publiquement actives ;
- le public peut filtrer les résultats par niveau de fiabilité ;
- le public peut signaler une contribution provisoire ;
- un modérateur autorisé peut masquer ou restaurer une contribution ;
- les contributions suivent le processus de décision prévu ;
- les doublons n’engendrent pas de nouvelle organisation ;
- les organisations non publiées ne sont pas présentées comme fiches officielles ;
- les vérifications globales et par champ sont enregistrables ;
- une correction exige une validation avant application ;
- chaque correction approuvée produit un historique ;
- les justificatifs restent privés et hors de la base ;
- les rôles et permissions protègent les opérations sensibles ;
- les prépublications et changements de visibilité sont auditables ;
- les statistiques minimales peuvent être produites.

## 27. Principe directeur

Toute décision de conception doit préserver la règle suivante :

> **Séparer les contributions des organisations officielles, signaler clairement toute information non vérifiée, contrôler sa visibilité, vérifier avant de publier officiellement et conserver une trace de chaque évolution importante.**