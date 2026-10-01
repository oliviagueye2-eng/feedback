# Architecture de la base de données
Plateforme nationale de satisfaction des usagers des services publics (Sénégal)

Version de travail, construite en parallèle des maquettes (variante A).
Hypothèse technique : PostgreSQL, avec les extensions `pg_trgm` (recherche approchée) et `unaccent` (recherche sans accents).

Le schéma est créé par les migrations SQL de [`src/db/migrations/`](../src/db/migrations/) (`npm run db:migrate`). En cas d'écart entre ce document et les migrations, ce sont les migrations qui font foi.

**Règle des migrations :** tant que la base n'est déployée nulle part, on modifie directement `0001_schema.sql` (schéma) et `0002_reference_data.sql` (données de référence). Après le premier déploiement, toute modification passe par une nouvelle migration numérotée, sans jamais modifier une migration déjà appliquée.

## Convention de nommage

- Tout ce qui est dans la base est **en anglais** : tables, colonnes, valeurs d'énumération, codes.
- Noms en `snake_case`, tables au singulier (`establishment`, pas `establishments`).
- Clés étrangères : `<table>_id` (`establishment_id`).
- Dates : suffixe `_at` (`created_at`), booléens : préfixe `is_` (`is_active`).
- Les textes affichés à l'usager (libellés, questions) ne sont pas dans les colonnes de code : ils passent par une table de traduction propre à chaque table (`sector_translation`, `question_translation`…), une ligne par langue.
- Ce document reste rédigé en français ; seuls les identifiants sont en anglais.
- Les valeurs d'énumération sont stockées en `text` avec une contrainte `CHECK`, plus simples à faire évoluer que les types `ENUM` de PostgreSQL.

---

## 1. Principes

1. **L'établissement est au centre.** Un avis porte toujours sur un établissement. Le service est une information complémentaire.
2. **Anonymat.** Aucune donnée personnelle n'est stockée : pas de nom, de téléphone, d'adresse IP ni d'identifiant d'appareil durable.
3. **Enregistrement immédiat.** Chaque réponse est enregistrée dès qu'elle est donnée. Un avis abandonné juste après la question essentielle reste exploitable.
4. **Jamais d'impasse.** Un usager peut saisir un établissement absent du référentiel. Celui-ci est créé avec le statut `pending_review`.
5. **Questionnaires versionnés.** On ne modifie jamais une question déjà utilisée : on crée une nouvelle version. Les anciens avis restent lisibles.
6. **Multilingue.** Tous les textes affichés à l'usager ont une traduction par langue.

---

## 2. Vue d'ensemble

```mermaid
erDiagram
    REGION ||--o{ DEPARTMENT : contains
    DEPARTMENT ||--o{ MUNICIPALITY : contains
    MUNICIPALITY ||--o{ ESTABLISHMENT : locates
    SECTOR ||--o{ ESTABLISHMENT_TYPE : groups
    SECTOR ||--o{ SERVICE : groups
    ESTABLISHMENT_TYPE ||--o{ ESTABLISHMENT : classifies
    ESTABLISHMENT ||--o{ ESTABLISHMENT_SERVICE : offers
    SERVICE ||--o{ ESTABLISHMENT_SERVICE : "offered by"
    ESTABLISHMENT ||--o{ QR_CODE : displays
    SERVICE |o--o{ QR_CODE : "narrows (optional)"
    SERVICE |o--o{ QUESTIONNAIRE : "detailed by type"
    QUESTIONNAIRE ||--o{ QUESTION : contains
    QUESTION ||--o{ ANSWER_OPTION : offers
    ESTABLISHMENT ||--o{ FEEDBACK : receives
    QR_CODE |o--o{ FEEDBACK : "origin (optional)"
    FEEDBACK ||--o{ ANSWER : contains
    QUESTION ||--o{ ANSWER : "answered by"
    ANSWER_OPTION |o--o{ ANSWER : "choice (optional)"
    FEEDBACK ||--o| COMMENT : "may have"
    FEEDBACK ||--o{ FEEDBACK_TOPIC : "tagged with"
    TOPIC ||--o{ FEEDBACK_TOPIC : "chosen in"
    TOPIC ||--o{ TOPIC_SECTOR : "shown for"
    SECTOR ||--o{ TOPIC_SECTOR : "shows"
```

Les tables se répartissent en quatre blocs :

| Bloc | Tables | Rôle |
|---|---|---|
| Référentiel | region, department, municipality, sector, establishment_type, establishment, service, establishment_service, qr_code | Ce que l'usager cherche et évalue |
| Questionnaires | questionnaire, question, answer_option, topic, topic_sector, tables `*_translation` | Ce qu'on demande à l'usager |
| Collecte | feedback, answer, comment, feedback_topic | Ce que l'usager répond |
| Exploitation | monthly_stats (vue), search_log, moderation_action | Résultats publiés, amélioration du référentiel |

---

## 3. Référentiel

### region, department, municipality
Découpage administratif (région, département, commune), chargé une fois et mis à jour rarement.

| Colonne | Type | Note |
|---|---|---|
| id | smallint / int | clé |
| code | text | code officiel |
| name | text | |
| region_id / department_id | fk | parent |

### Classement : secteur, type, établissement

Trois niveaux, du plus général au plus précis :

| Niveau | Table | Question | Exemples |
|---|---|---|---|
| Secteur | `sector` | Dans quel domaine ? | Santé, Éducation, Administration |
| Type d'établissement | `establishment_type` | Quel genre de lieu ? | Hôpital, poste de santé, lycée, mairie, centre d'état civil |
| Établissement | `establishment` | Quel lieu précis ? | Hôpital Le Dantec, Mairie de Grand-Yoff |

Le caractère **public ou privé** n'est ni un secteur ni un type : un hôpital ou une école peuvent être publics ou privés. C'est donc une propriété de chaque établissement (`establishment.ownership`).

### sector
Domaine général. Partagé par les types d'établissement et par les services.

| Colonne | Type | Note |
|---|---|---|
| id | smallint | |
| code | text unique | `HEALTH`, `EDUCATION`, `ADMINISTRATION`, `JUSTICE`, `SECURITY`, `TAX`, `ELECTRICITY`, `WATER`, `TRANSPORT`, `SOCIAL`, `FOOD_SERVICE`, `HOSPITALITY`, `REAL_ESTATE`, `RETAIL`, `BANKING_INSURANCE`, `CULTURE`, `SPORT`, `TELECOM`, `TOURISM` (agences de voyages, guides, sites touristiques ; l'hébergement reste en `HOSPITALITY`, les musées en `CULTURE`). `ELECTRICITY` et `WATER` remplacent l'ancien `UTILITIES` « Eau et électricité » (migration 0008). Un secteur n'est ni public ni privé : c'est `establishment.ownership` qui le précise |
| fallback_questionnaire_id | fk questionnaire | questionnaire utilisé quand on connaît le secteur mais pas le service (sinon GENERIC) |

Le libellé affiché passe par sa table de traduction (`*_translation`).

### establishment_type
Genre de lieu : mairie, centre d'état civil, hôpital, poste de santé, école primaire, lycée, commissariat, etc.

| Colonne | Type | Note |
|---|---|---|
| id | int | |
| code | text unique | `TOWN_HALL`, `CIVIL_REGISTRY_CENTER`, `HOSPITAL`, `HEALTH_POST`, `PRIMARY_SCHOOL`… |
| sector_id | fk sector | |

Le libellé affiché passe par sa table de traduction (`*_translation`).

À quoi sert le type :
1. **Comparer ce qui est comparable.** Les statistiques et les classements publiés comparent un hôpital à d'autres hôpitaux, pas à un poste de santé.
2. **Afficher un repère dans la recherche.** Sous le nom de l'établissement, on affiche son type (« Poste de santé ») pour lever les ambiguïtés entre lieux aux noms proches.
3. **Choisir un questionnaire de repli.** Pour un établissement saisi par un usager avec un type mais sans service connu, on utilise un questionnaire adapté au secteur du type plutôt que le questionnaire générique.
4. **Préremplir les services.** À la création d'un établissement dans le référentiel, on peut proposer les services habituels de son type (une mairie propose l'état civil).
5. **Écran 0c.** Le champ facultatif « Type » que remplit l'usager correspond à `establishment_type`.

### establishment
| Colonne | Type | Note |
|---|---|---|
| id | uuid | |
| name | text | nom officiel affiché |
| aliases | text[] | autres noms de l'établissement (voir plus bas) |
| search_text | text | nom + alias, en minuscules et sans accents, rempli automatiquement (index trigramme) |
| type_id | fk establishment_type | nullable si saisi par un usager |
| organization_id | fk organization | organisme auquel appartient l'établissement (une agence Senelec pointe vers Senelec) ; vide pour un établissement indépendant |
| scope | enum | `site` (lieu physique, par défaut) ou `general` (l'organisme « en général », sans lieu : voir `organization`) |
| sector_id | fk sector | secteur quand le type est inconnu : choisi par l'usager à l'écran 0c (facultatif). Si les deux existent, le secteur du type prime |
| ownership | enum | `public`, `private`, `community` (établissements communautaires, confessionnels…) |
| municipality_id | fk municipality | nullable si saisi par un usager |
| address | text | facultatif |
| status | enum | `active`, `pending_review`, `rejected`, `merged`, `closed` |
| closed_at | timestamptz | date de fermeture (status = closed) |
| source | enum | `registry`, `user` |
| raw_input | text | texte tapé par l'usager (source = user) |
| municipality_input | text | commune tapée librement par l'usager |
| merged_into_id | fk establishment | si c'était un doublon d'un établissement existant |
| created_at, updated_at | timestamptz | |

Un établissement saisi par un usager (écran 0c) est créé avec `status = pending_review` et `source = user`. L'avis y est rattaché tout de suite. Après vérification, l'établissement est soit validé (`active`), soit rattaché à un existant (`merged`, et ses avis suivent), soit rejeté (`rejected`).

Un établissement qui ferme ses portes passe en `closed` et on renseigne `closed_at`. On ne le supprime jamais :
- ses avis passés restent dans la base et dans les statistiques des mois où il était ouvert ;
- il n'est plus proposé dans la recherche ;
- ses QR codes sont désactivés (`is_active = false`). Un QR code encore affiché mène à un message « Cet établissement est fermé » au lieu du formulaire.

Résumé des statuts :

| status | Proposé dans la recherche | Accepte de nouveaux avis | Avis conservés |
|---|---|---|---|
| `active` | oui | oui | oui |
| `pending_review` | non | oui (celui qui l'a créé) | oui |
| `rejected` | non | non | oui, mis de côté |
| `merged` | non (on propose celui qui le remplace) | non | oui, rattachés au remplaçant |
| `closed` | non | non | oui |

### Alias (colonne `establishment.aliases`)
Autres noms sous lesquels les gens connaissent **un établissement précis**. Le nom officiel ne suffit pas : l'usager tape le nom qu'il utilise au quotidien.

Exemples :

| name (nom officiel) | aliases |
|---|---|
| Centre hospitalier universitaire Aristide Le Dantec | {Le Dantec, hôpital Le Dantec} |
| Hôpital Principal de Dakar | {Principal, hôpital militaire} |
| Centre d'état civil de Grand-Yoff | {mairie de Grand-Yoff, état civil Grand-Yoff} |

- Un établissement peut avoir autant d'alias que nécessaire : chaque alias est un élément de la liste.
- Un alias désigne toujours **un seul** établissement.
- `search_text` est recalculé automatiquement (trigger ou colonne générée) à chaque modification de `name` ou `aliases`. C'est le seul champ utilisé pour chercher un établissement par son nom.

**D'où viennent les alias :** de l'import du référentiel officiel (sigles, noms courts) et de la saisie par les agents dans l'outil d'administration. Quand un agent fusionne un établissement saisi par un usager (`merged`), il peut ajouter à la main le texte tapé par l'usager (`raw_input`) aux alias de l'établissement retenu.

Si plus tard on veut que la plateforme propose des alias automatiquement à partir des recherches, il faudra une table dédiée (avec la source et le statut de validation de chaque alias).

### service
Catalogue national des services : état civil (extrait de naissance, mariage…), consultations, inscription scolaire, etc.

| Colonne | Type | Note |
|---|---|---|
| id | int | |
| code | text unique | `CIVIL_REGISTRY_BIRTH` |
| sector_id | fk sector | domaine du service |
| detailed_questionnaire_id | fk questionnaire | questionnaire propre à ce type de service |
| synonyms | text[] | mots que l'usager peut taper pour désigner ce service (voir plus bas) |
| search_text | text | libellé français + synonymes, en minuscules et sans accents, rempli automatiquement (index trigramme) |

### Synonymes (colonne `service.synonyms`)
Mots que l'usager peut taper pour désigner **un type de service**, et non un lieu. Un synonyme mène donc à **plusieurs** établissements : tous ceux qui proposent ce service.

Exemples :

| code | synonyms |
|---|---|
| CIVIL_REGISTRY_BIRTH | {état civil, extrait de naissance, acte de naissance, déclaration de naissance} |
| CIVIL_REGISTRY_MARRIAGE | {mariage, acte de mariage} |
| HEALTH_CONSULTATION | {consultation, médecin, dispensaire} |

- Les synonymes peuvent être en français ou en langues nationales, mélangés dans la même liste : la recherche porte sur tous, quelle que soit la langue.
- Ce sont des données, pas des identifiants : ils ne suivent pas la règle « tout en anglais ».
- `search_text` est recalculé automatiquement à chaque modification du libellé ou des synonymes, comme pour les établissements.

Quand l'usager tape « extrait de naissance », la recherche reconnaît le service CIVIL_REGISTRY_BIRTH, puis renvoie les établissements qui le proposent (via `establishment_service`). C'est dans ce cas que l'écran 0a affiche l'encadré « Précisez l'établissement ».

**Différence avec les alias :** un alias est un autre nom d'**un** établissement (« Le Dantec » → un seul hôpital). Un synonyme est un autre nom d'**un service** (« extrait de naissance » → toutes les mairies et centres d'état civil).

### establishment_service
Quels services chaque établissement propose (relation plusieurs à plusieurs).

| Colonne | Type |
|---|---|
| establishment_id | fk |
| service_id | fk |

### qr_code
Un QR code par guichet ou par établissement.

| Colonne | Type | Note |
|---|---|---|
| id | uuid | |
| code | text unique | court, contenu dans l'URL du QR |
| establishment_id | fk | obligatoire |
| service_id | fk | facultatif : un QR peut viser un guichet précis |
| location_label | text | « Guichet 2 », « Hall d'entrée » |
| is_active | boolean | |

---

### organization
Organisme qui a plusieurs établissements : Senelec, Sen'Eau, La Poste, opérateurs téléphoniques, caisses sociales, impôts… (migration 0005).

| Colonne | Type | Note |
|---|---|---|
| id | smallint | |
| code | text unique | `SENELEC`… |
| name | text | nom usuel, affiché partout : Senelec |
| full_name | text | nom complet officiel quand il diffère : Société nationale d'électricité du Sénégal |
| sector_id | fk sector | |

Le nom complet, les sigles et les anciens noms (Free pour Yas, SGBS pour Société Générale) sont aussi des **alias** de l'établissement « en général » : ils le font trouver par la recherche.

Premiers organismes (migration 0006, liste validée le 2026-09-29) : Senelec, Sen'Eau, Orange, Yas, Expresso, La Poste (secteur Télécoms), IPRES, DGID, CBAO, UBA, Société Générale.

Un organisme s'évalue de deux façons :
- **dans une de ses agences** : un établissement ordinaire (`scope = site`) rattaché à l'organisme ;
- **« en général »** (coupures, factures, service client, application…) : un établissement particulier de l'organisme, `scope = general`, sans adresse ni commune. Un seul par organisme, jamais de QR code (règles vérifiées par la base).

Chaque avis reste ainsi rattaché à un établissement. Dans la recherche, à score égal, l'organisme « en général » passe avant ses agences ; une commune tapée fait passer l'agence de cette commune en tête.

**Note globale d'un organisme** (décision du 2026-09-29) : tous les avis de tous ses établissements regroupés (« en général » et agences), avec le détail par établissement.

**Écran 1** : depuis le 2026-10-01, mêmes textes pour un lieu et pour un organisme « en général » : « À quand remonte votre expérience ? » (mêmes réponses, même calcul du mois) et « Sur quoi porte votre avis ? ».

## 4. Recherche d'établissement (écrans 0 et 0a)

La recherche porte sur l'établissement. En arrière-plan, le texte tapé est comparé à trois sources :

1. **Nom et alias de l'établissement** (`establishment.search_text`) : correspondance approchée (trigrammes, avec `word_similarity` pour ne pas pénaliser les textes longs), sans accents.
2. **Libellés et synonymes de service** (`service.search_text`) : si le texte correspond à un service (« état civil »), on renvoie les établissements qui proposent ce service, via `establishment_service`.
3. **Commune** (`municipality.name`) : si le texte contient un nom de commune (« état civil Grand-Yoff »), on classe d'abord les établissements de cette commune.

La réponse de l'API indique au front si le texte ressemble à un service (`match_type = service`). C'est ce qui déclenche l'encadré « Précisez l'établissement » dans l'écran 0a.

Quand rien n'est trouvé, une recherche plus souple compare chaque mot de 3 lettres ou plus séparément et propose au plus 3 établissements (« Vouliez-vous dire », écran 0b). Le comportement complet des écrans est décrit dans `docs/parcours-recherche.md`.

Seuls les établissements au statut `active` sont proposés. Ceux en `pending_review` ne le sont pas, pour éviter de diffuser des doublons ou des erreurs, et ceux en `closed` non plus.

Index à prévoir :
- `gin (search_text gin_trgm_ops)` sur establishment ;
- `gin (search_text gin_trgm_ops)` sur service.

---

## 5. Questionnaires

### questionnaire
| Colonne | Type | Note |
|---|---|---|
| id | int | |
| code | text | `ESSENTIAL`, `CIVIL_REGISTRY`, `GENERIC`… |
| version | int | |
| status | enum | `draft`, `published`, `archived` |
| published_at | timestamptz | |

Trois sortes de questionnaires :
- **ESSENTIAL** : une seule question, posée à tout le monde et dans tous les secteurs : `OVERALL_SATISFACTION`. Elle est suivie d'un texte libre facultatif dont le libellé dépend de la réponse (voir `answer_option` et `comment`).
- **Détaillé par service** : relié au service via `service.detailed_questionnaire_id`. C'est là que se trouve `GOAL_ACHIEVED` (« Avez-vous obtenu ce que vous étiez venu(e) chercher ? ») pour les secteurs où la question a du sens (administration, état civil…). Elle n'est pas posée dans un restaurant ou un hôtel.
- **GENERIC** : utilisé quand le service est inconnu (établissement saisi par l'usager sans type).

### question
| Colonne | Type | Note |
|---|---|---|
| id | int | |
| questionnaire_id | fk | |
| code | text | `OVERALL_SATISFACTION`, `GOAL_ACHIEVED`, `WAIT_TIME`… |
| type | enum | `scale_5`, `yes_partial_no`, `single_choice`, `text` |
| position | smallint | ordre d'affichage |
| is_required | boolean | |

### answer_option
| Colonne | Type | Note |
|---|---|---|
| id | int | |
| question_id | fk | |
| code | text | `VERY_SATISFIED`, `YES`, `UNDER_15_MIN`… |
| value | smallint | pour les calculs (1 à 5, etc.) |
| position | smallint | |

Chaque option de `OVERALL_SATISFACTION` a aussi un **libellé de relance** (colonne `follow_up_prompt` de `answer_option_translation`). Il était affiché au-dessus du texte libre de l'écran 2b ; depuis le 2026-09-30 (option D), ce texte libre a un libellé unique, « Détail de votre expérience », et les libellés de relance ne sont plus affichés (gardés pour un usage futur) :

| Option | Libellé de relance |
|---|---|
| `VERY_SATISFIED`, `SATISFIED` | Qu'est-ce qui vous a plu ? |
| `NEUTRAL` | Qu'est-ce qui aurait pu être mieux ? |
| `DISSATISFIED`, `VERY_DISSATISFIED` | Que s'est-il passé ? |

### topic
Thèmes proposés après la question essentielle (écran 2b), sous « Comment ça s'est passé ? ». Pour chaque thème, l'usager peut toucher « Bien » ou « Pas bien », ou ne rien toucher (option D, 2026-09-30) : une visite mitigée se dit (bon accueil, attente trop longue).

| Colonne | Type | Note |
|---|---|---|
| id | smallint | |
| code | text unique | voir la liste ci-dessous |
| position | smallint | ordre d'affichage |
| is_active | boolean | |

Liste revue le 2026-09-30 (migration `0010_topics_by_sector.sql`). **Thèmes communs**, affichés partout :

| code | Libellé (dans `topic_translation`) |
|---|---|
| `STAFF` | Accueil et politesse |
| `PROFESSIONALISM` | Professionnalisme du personnel |
| `WAIT_TIME` | Temps d'attente |
| `INFORMATION` | Explications reçues |
| `PROCEDURE` | Simplicité de la démarche (papiers, allers-retours) |
| `OPENING_HOURS` | Horaires d'ouverture |
| `FEES` | Frais payés (montant, reçu) |
| `CLEANLINESS` | Propreté et confort des locaux |
| `ACCESS_FOR_ALL` | Accès pour tous (personnes handicapées, âgées) |
| `OTHER` | Autre (toujours en dernier) |

**Thèmes d'un secteur**, affichés après les thèmes communs, seulement dans ces secteurs (`topic_sector`) :

| code | Libellé | Secteurs |
|---|---|---|
| `CARE_RECEIVED` | Soins reçus | Santé |
| `MEDICINE_AVAILABILITY` | Médicaments et examens disponibles | Santé |
| `PRIVACY` | Respect de l'intimité | Santé |
| `TEACHING_QUALITY` | Qualité de l'enseignement | Éducation |
| `STUDENT_SUPERVISION` | Encadrement des élèves | Éducation |
| `PUNCTUALITY` | Ponctualité | Transport |
| `ONBOARD_SAFETY` | Sécurité à bord | Transport |
| `VEHICLE_CONDITION` | État des véhicules | Transport |
| `POWER_CUTS` | Coupures de courant | Électricité |
| `WATER_CUTS` | Coupures d'eau | Eau |
| `WATER_QUALITY` | Qualité de l'eau | Eau |
| `NETWORK_QUALITY` | Qualité du réseau | Télécoms |
| `INTERVENTION_TIME` | Délai d'intervention | Électricité |
| `BILLING` | Factures (exactes et faciles à comprendre) | Électricité, Eau, Télécoms |
| `REQUEST_HANDLING` | Prise en compte de la demande | Sécurité |
| `RIGHTS_RESPECT` | Respect des droits | Sécurité |
| `PROCESSING_TIME` | Délai de traitement du dossier | Administration, Justice, Impôts, Social, Sécurité, Banques et assurances |
| `CASE_TRACKING` | Suivi et transparence du dossier | Administration, Justice, Impôts, Social, Sécurité, Banques et assurances |
| `CUSTOMER_SERVICE` | Service client et réclamations | Transport, Électricité, Eau, Télécoms, Banques et assurances |

Désactivés le 2026-09-30, gardés pour les avis déjà donnés : `PRICE` (Prix), `ACCESSIBILITY` (Accessibilité), `SAFETY` (Sécurité), `SERVICE_QUALITY` (Qualité du service).

### topic_sector
Quels thèmes afficher selon le secteur. Un thème **sans ligne** dans cette table est commun : il s'affiche dans tous les secteurs. Un thème **avec des lignes** ne s'affiche que dans ces secteurs. Le secteur retenu est celui du service choisi, sinon celui de l'établissement.

| Colonne | Type |
|---|---|
| topic_id | fk |
| sector_id | fk |

### Tables de traduction (`*_translation`)
Une table par table traduite (migration 0013, 2026-10-01 ; elle remplace la table unique `translation`, dont le lien n'était pas vérifié par la base). Chaque table a une clé étrangère vers la ligne traduite (la traduction est supprimée avec elle) et une ligne par langue.

| Table | Clé | Colonnes de texte |
|---|---|---|
| `sector_translation` | `(sector_id, language)` | `label` |
| `establishment_type_translation` | `(establishment_type_id, language)` | `label` |
| `service_translation` | `(service_id, language)` | `label` (le libellé français alimente `service.search_text`, recalculé par trigger) |
| `topic_translation` | `(topic_id, language)` | `label` |
| `question_translation` | `(question_id, language)` | `label` |
| `answer_option_translation` | `(answer_option_id, language)` | `label`, `follow_up_prompt` (facultatif : libellé de relance) |

`language` : `fr`, `wo`, `ff`, `srr`… Ce qu'on traduit, ce sont les réponses **proposées** (`answer_option`) ; les réponses données par les usagers (`answer`) ne se traduisent pas. Les noms d'établissements et d'organismes ne sont pas traduits (noms propres).

---

## 6. Collecte

### feedback
Un avis : le passage d'un usager, de la première réponse à la fin.

| Colonne | Type | Note |
|---|---|---|
| id | uuid | **généré par le téléphone**, pour que l'envoi hors connexion ne crée pas de doublon |
| establishment_id | fk | obligatoire |
| service_id | fk | motif de la visite, facultatif |
| qr_code_id | fk | si l'usager est arrivé par QR code |
| channel | enum | `qr`, `search`, `link` |
| language | text | langue choisie |
| step | enum | `essential`, `detailed`, `completed` |
| detailed_questionnaire_id | fk | version utilisée pour la partie détaillée |
| visit_period | enum | `today`, `under_week`, `under_month`, `over_month` : réponse à « À quand remonte votre expérience ? » (anciennement « Quand êtes-vous venu(e) ? »). Vaut `today` automatiquement pour une arrivée par QR code |
| visit_month | date | mois de la visite, calculé à l'enregistrement à partir de `visit_period` et `started_at` (ex. 2026-03-01). Ne change plus ensuite |
| started_at | timestamptz | arrondi à l'heure pour limiter la réidentification |
| completed_at | timestamptz | |

**Date de visite.** On ne demande pas de date précise (plus simple pour l'usager, et moins de risque de le reconnaître). Exemple : un avis donné le 10 mars avec « il y a moins d'une semaine » donne `visit_month = 2026-03-01`. Cette valeur est fixée une fois pour toutes : dans six mois, l'avis comptera toujours pour mars. Les avis `over_month` sont conservés mais n'entrent pas dans les notes publiées.

### answer
Une ligne par question répondue. Écrite dès que l'usager répond (écran 3 : enregistrement immédiat).

| Colonne | Type | Note |
|---|---|---|
| feedback_id | fk | |
| question_id | fk | |
| option_id | fk answer_option | pour les questions à choix |
| text_value | text | pour les questions ouvertes |
| answered_at | timestamptz | |

Clé unique `(feedback_id, question_id)`. Si l'usager change de réponse ou si le téléphone renvoie la même réponse, on met à jour la ligne au lieu d'en créer une nouvelle.

### comment
Le texte libre demandé juste après la question essentielle (écran 2b). Il remplace le commentaire de fin de parcours, qui est supprimé. Séparé des réponses parce qu'il passe par la modération.

| Colonne | Type | Note |
|---|---|---|
| feedback_id | fk unique | un commentaire par avis |
| prompt_option_id | fk answer_option | option choisie à la question essentielle au moment où le texte a été écrit (avant l'option D, elle indiquait aussi le libellé affiché : « Qu'est-ce qui vous a plu ? », « Que s'est-il passé ? »…) |
| text | text | 500 caractères au plus |
| status | enum | `pending`, `published`, `hidden` |
| hidden_reason | text | ex. donnée personnelle, injure |

### feedback_topic
Thèmes touchés par l'usager, une ligne par thème, avec leur sens (migration `0011_topic_sentiment.sql`). Les thèmes enregistrés avant cette migration ont reçu le sens qu'ils avaient à l'écran : `positive` après « Très satisfait » ou « Satisfait », `negative` sinon.

| Colonne | Type | Note |
|---|---|---|
| feedback_id | fk | |
| topic_id | fk | |
| sentiment | enum | `positive` (« Bien ») ou `negative` (« Pas bien ») |
| other_text | text | seulement pour le thème `OTHER` : le thème précisé par l'usager en quelques mots (« Parking »), 50 caractères au plus |

Clé unique `(feedback_id, topic_id)`.

`other_text` sert à repérer les thèmes qui manquent dans la liste : si « Parking » revient souvent, on l'ajoute comme thème. Il n'est jamais publié et passe par la même modération que les commentaires, car il pourrait contenir un nom.

---

## 7. Exploitation

### monthly_stats (vue matérialisée)
Recalculée chaque nuit. C'est la source des résultats publiés.

| Colonne | Note |
|---|---|
| establishment_id, service_id, month | `month` = `feedback.visit_month` |
| feedback_count | nombre d'avis |
| avg_satisfaction | à partir de OVERALL_SATISFACTION |
| goal_achieved_rate | à partir de GOAL_ACHIEVED, seulement pour les secteurs où la question est posée |
| indicateurs détaillés | temps d'attente, accueil, etc. |

Seuls les avis dont `visit_period` n'est pas `over_month` sont comptés.

Règle de publication : ne rien publier sous un seuil d'avis (par exemple 10 par mois et par établissement), pour protéger l'anonymat et éviter les notes non représentatives.

### search_log (facultatif)
Pour améliorer le référentiel : terme tapé (`query`), nombre de résultats (`result_count`), établissement choisi (`selected_establishment_id`) ou saisi (`created_establishment_id`), date (`searched_at`). Aucune donnée d'identification. Utile pour repérer les établissements manquants et les synonymes à ajouter.

### agent
Agents du back-office : `id`, `email` (unique), `name`, `is_active`, `created_at`. L'authentification reste à concevoir.

### moderation_action
Historique des actions des agents : validation ou fusion d'un établissement saisi par un usager, masquage d'un commentaire.

| Colonne | Type |
|---|---|
| id | uuid |
| agent_id | fk agent |
| action | enum (`approve_establishment`, `merge_establishment`, `reject_establishment`, `close_establishment`, `hide_comment`…) |
| target_table, target_id | |
| reason | text |
| performed_at | timestamptz |

---

## 8. Lien avec les écrans

| Écran | Lecture | Écriture |
|---|---|---|
| 0. Accueil | | |
| 0a. Autocomplétion | establishment, service, establishment_service, municipality | search_log |
| 0b. Aucun résultat | establishment (approché) | search_log |
| 0c. Non répertorié | establishment_type, municipality | establishment (`pending_review`) |
| QR code scanné | qr_code, establishment | |
| 1. Établissement identifié | establishment, establishment_service | feedback (création, dont `visit_period` et `visit_month`) |
| 2. Question essentielle | questionnaire ESSENTIAL | answer |
| 2b. Thèmes et texte libre | topic, topic_sector, topic_translation | feedback_topic, comment |
| 3 à 5. Enregistrement, confirmation, choix | | feedback.step |
| 6. Questionnaire détaillé | service → questionnaire (ou GENERIC) | answer |
| 7. Remerciement | | feedback.completed_at |

---

## 9. Questions ouvertes

1. **Découpage territorial :** faut-il descendre jusqu'au village ou au quartier, ou s'arrêter à la commune ?
2. **Géolocalisation des établissements :** faut-il des coordonnées GPS (et PostGIS) pour une recherche « près de moi » plus tard ?
3. **Seuil de publication :** quel nombre minimum d'avis avant de publier une note ?
4. **Durée de conservation :** combien de temps garde-t-on les réponses brutes et les commentaires ?
5. **Langues :** quelles langues au lancement, et qui fournit les traductions ?
6. **Hébergement :** la loi sénégalaise sur les données personnelles (loi 2008-12, CDP) impose-t-elle un hébergement dans le pays ?

---

## 10. Évolutions futures

Pas au lancement. Notées ici pour que le modèle actuel ne les empêche pas.

### Photo facultative
- **Quand :** proposée seulement si l'usager a marqué `CLEANLINESS` (Propreté) ou `SAFETY` (Sécurité) « Pas bien ». Jamais obligatoire : un avis sans photo compte autant qu'un avis avec photo.
- **Avertissement affiché :** « Ne photographiez ni personnes ni documents. »
- **Traitement automatique à l'envoi :** suppression des métadonnées (position GPS, appareil, heure exacte), compression, floutage des visages.
- **Diffusion :** jamais publiée, visible uniquement par les agents.
- **Idéalement** rattachée à un futur parcours « signalement » (voir plus bas) plutôt qu'à l'avis de satisfaction.

Table à ajouter :

#### feedback_attachment
| Colonne | Type | Note |
|---|---|---|
| id | uuid | |
| feedback_id | fk | |
| storage_key | text | emplacement du fichier (stockage objet, pas dans la base) |
| mime_type | text | |
| size_bytes | int | |
| status | enum | `pending`, `approved`, `rejected` |
| rejected_reason | text | ex. visage, document personnel |
| uploaded_at | timestamptz | |

### Parcours « signalement »
Pour les problèmes qui appellent une action (hygiène, sécurité, paiement non prévu) : un parcours distinct de l'avis, avec un suivi par les agents. À concevoir.

### Alias proposés automatiquement
Si l'on veut que la plateforme apprenne des recherches des usagers, remplacer la colonne `establishment.aliases` par une table dédiée, avec la source (`registry`, `agent`, `usage`) et le statut de validation de chaque alias.
