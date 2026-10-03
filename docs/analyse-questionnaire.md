# Analyse du questionnaire : questions, thèmes et méthode

Analyse du 2026-10-03, faite sur les données de référence des migrations 0001 à 0007 (banque de questions, listes, thèmes, secteurs, types d'établissement, services). **Rien n'est modifié** : ce document propose, Olivia décide.

## 1. En bref

- La méthode à trois étages (une note globale, des thèmes « Bien / Pas bien », des questions de fait) est **une bonne méthode**, courante pour les services publics. Mais aujourd'hui les trois étages **se recouvrent** à plusieurs endroits : la même chose est mesurée deux fois, avec deux réponses qui peuvent se contredire.
- **Des thèmes inadaptés** s'affichent dans certains lieux, parce que les 9 thèmes « communs » sont pensés pour un guichet administratif et qu'un type d'établissement est mal rangé (le centre des permis reçoit « Sécurité à bord »).
- **Il n'y a pas de catégorie d'évaluation** (personnel, locaux, délais…) dans la base. Ni les questions ni les thèmes ne sont rattachés à une catégorie : on ne peut pas calculer un résultat « Personnel » ou « Délais » pour un établissement, ni comparer deux secteurs sur la même catégorie.
- Seule la question globale est une métrique standard (**CSAT** sur 5 niveaux). Il n'y a ni NPS ni CES au sens strict ; « Recommanderiez-vous… ? » ressemble au NPS mais n'en est pas un.

## 2. Comment les questions sont choisies aujourd'hui

| Étage | Ce que voit l'usager | D'où ça vient |
|---|---|---|
| 1. Question essentielle | « Êtes-vous satisfait(e) du service reçu ? », 5 réponses | liste `ESSENTIAL`, pour tout le monde |
| 2. Thèmes (écran 2b) | « Comment ça s'est passé ? » : pour chaque thème, « Bien », « Pas bien » ou rien | 9 thèmes communs + ceux du secteur de l'avis (`topic_sector`). **Un seul secteur** : celui du service, sinon du type, sinon de l'établissement |
| 3. Questions détaillées (écran 6) | 2 à 5 questions de fait | **plusieurs listes additionnées** : celle du secteur, celle du type d'établissement et celle du service (`question_set_item`) ; `GENERIC` quand le secteur n'a pas de liste à lui |
| 3b. Questions communes (écran 6b) | « Avez-vous signalé cette situation ? » puis « Pourquoi ? » | liste `COMMON`, seulement après « Peu » ou « Pas du tout satisfait(e) » |

À noter : les thèmes suivent **un seul** secteur, les questions **plusieurs** listes. Un avis sur le service « Un vol » dans un aéroport reçoit les questions de l'aéroport **et** du vol, mais les thèmes du seul secteur Transport.

## 3. À quoi sert chaque étage, et est-ce une bonne méthode ?

| Étage | Rôle | Type de mesure | Verdict |
|---|---|---|---|
| Question essentielle | **Le résultat** : l'usager est-il satisfait ? | CSAT, échelle de 5. On publie la part de « satisfait » + « très satisfait » (« top 2 box »), la norme du CSAT | Bon. Courte, comparable entre tous les secteurs |
| Thèmes « Bien / Pas bien » | **Les raisons** : qu'est-ce qui explique la note ? | Jugement en 2 valeurs, facultatif, choisi par l'usager | Bonne idée (c'est ce qui permet d'agir), mais à cadrer, voir 3.1 |
| Questions détaillées | **Les faits** : combien de temps, reçu donné ou non, coupures | Faits vérifiables, pas des opinions | Bon : un fait est plus solide qu'une opinion et un responsable peut agir dessus (« 40 % n'ont pas eu de reçu ») |

Ces trois étages répondent à trois questions différentes : **quoi** (la note), **pourquoi** (les thèmes), **qu'est-ce qui s'est passé** (les faits). Les baromètres de services publics fonctionnent ainsi : une note globale, puis les « moteurs » de la satisfaction (délais, compétence, courtoisie, équité, résultat obtenu), puis des indicateurs de fait. **La double méthode est donc justifiée en principe.** Le problème est dans l'exécution.

### 3.1 Les thèmes en deux valeurs : ce qui va, ce qui ne va pas

Ce qui va :
- deux réponses, c'est rapide et compris par tout le monde, y compris les personnes peu à l'aise avec l'écrit ;
- une visite mitigée peut se dire (« Bien » pour l'accueil, « Pas bien » pour l'attente).

Ce qui ne va pas :
- **les thèmes sont facultatifs et choisis par l'usager.** On ne mesure pas « ce que pensent les usagers de l'accueil », mais « ce qu'en pensent ceux qui ont eu envie d'en parler ». Les mécontents parlent plus volontiers de ce qui les a gênés. Un thème non coché ne veut pas dire « rien à signaler ».
- Conséquence pour la page publique : **ne jamais afficher des nombres bruts** (16 « Bien » contre 4 « Pas bien ») comparés d'un thème à l'autre, mais la **part de « Bien » parmi ceux qui ont noté ce thème**, avec ce nombre : « Accueil et politesse : 80 % positifs (20 avis) ». Avec un seuil par thème (proposé : 10 avis), sinon « pas assez d'avis ».
- « Bien / Pas bien » convient au formulaire. Sur la page de résultats, le vocabulaire habituel est « avis positifs / avis négatifs ».

### 3.2 Les recouvrements entre thèmes et questions

La même chose est mesurée deux fois dans ces cas :

| Ce qui est mesuré | Thème (opinion) | Question (fait) | Où |
|---|---|---|---|
| Attente | `WAIT_TIME` « Temps d'attente » | `WAIT_TIME` « Combien de temps avez-vous attendu… ? » (**même code**) ; `CHECKS_WAIT`, `STOP_WAIT` | partout / Santé, Banques, Services à dossier, Aéroport, Trajets |
| Soins obtenus | `CARE_RECEIVED` « Soins reçus » | `CARE_RECEIVED` « Avez-vous reçu ce pour quoi vous étiez venu(e) ? » (**même code**) | Santé |
| Médicaments | `MEDICINE_AVAILABILITY` | `PRESCRIPTION_AVAILABLE` | Santé |
| Coupures | `POWER_CUTS`, `WATER_CUTS` | `CUTS_COUNT`, `DAYS_WITHOUT_WATER` | Électricité, Eau |
| Réseau | `NETWORK_QUALITY` | `NETWORK_LOSS` | Télécoms |
| Ponctualité | `PUNCTUALITY` | `DEPARTURE_ON_TIME` | Vol, Traversée |
| Frais, reçu | `FEES` « Frais payés (montant, reçu) » | `RECEIPT_GIVEN`, `RECEIPT_OR_INVOICE`, `FEES_EXPLAINED`, `FAIR_PRICE` | presque partout |
| Démarche | `PROCEDURE` « Simplicité de la démarche (papiers, allers-retours) » | `VISITS_COUNT`, `DOCUMENTS_KNOWN` | Services à dossier |
| Propreté | `CLEANLINESS` « Propreté et confort des locaux » | `TOILETS`, `FACILITIES` | Aéroport, Gare, Éducation |
| Cours | `TEACHING_QUALITY` | `CLASSES_HELD` | Éducation |

Ce n'est pas forcément une erreur : l'opinion (« l'attente était acceptable ») et le fait (« 1 à 2 heures ») ne disent pas la même chose. Mais pour l'usager, c'est **la même question posée deux fois** à deux écrans d'écart, ce qui allonge le questionnaire et lasse. Et deux réponses peuvent se contredire sans qu'on sache laquelle publier.

**Deux façons de régler ça** (au choix) :
- **A. Le thème sert à dire « pourquoi », la question à dire « combien ».** On garde les deux, mais on publie le fait (la question) et on retire le thème du formulaire là où une question de fait existe déjà. Moins de doublons, chaque chose mesurée une fois.
- **B. On garde tout et on l'assume.** La page publique montre le fait et l'opinion côte à côte (« Attente : 1 à 2 h pour 45 % ; jugée « Pas bien » par 60 % de ceux qui l'ont notée »). Plus riche, plus long à lire.

Recommandation : **A**, plus simple pour l'usager et plus clair à publier.

## 4. Questions et thèmes inadaptés, lieu par lieu

### 4.1 Les 9 thèmes communs ne sont pas communs à tous les lieux

Ils sont pensés pour un guichet (mairie, préfecture, banque). Ailleurs :

| Thème commun | Inadapté pour | Pourquoi |
|---|---|---|
| `PROCEDURE` Simplicité de la démarche (papiers, allers-retours) | restaurants, commerces, hôtels, culture, sport, tourisme, trajets en car ou en bus, coupures d'eau ou de courant | il n'y a pas de « papiers » ni de démarche |
| `OPENING_HOURS` Horaires d'ouverture | vol, traversée en bateau, trajet en car ; coupures, réseau télécom ; commissariat (souvent ouvert jour et nuit) | ce n'est pas un lieu qu'on visite à heure fixe |
| `CLEANLINESS` Propreté et confort des **locaux** | vol, traversée, trajet en car | on est dans un véhicule, pas dans des locaux (le thème Transport « État des véhicules » le couvre en partie) |
| `WAIT_TIME` Temps d'attente | avis sur une coupure ou le réseau (Électricité, Eau, Télécoms) | il n'y a pas d'attente au guichet ; « délai d'intervention » existe pour l'électricité, pas pour l'eau ni les télécoms |
| `FEES` Frais payés | école publique, mairie quand c'est gratuit | acceptable : l'usager ne coche pas ce qui ne le concerne pas |

### 4.2 Un type d'établissement mal rangé

- **Centre des permis et cartes grises** (`DRIVING_LICENCE_CENTER`) est rangé dans le secteur **Transport**. Il reçoit donc les thèmes « Ponctualité », « Sécurité à bord », « État des véhicules », « Service client et réclamations », mais **pas** « Délai de traitement du dossier » ni « Suivi du dossier », alors que c'est un service à dossier (il a d'ailleurs la liste de questions `FILE_SERVICES`). Il devrait être dans le secteur **Administration**.

### 4.3 Secteurs sans thème qui parle de leur cœur de métier

Restauration, hôtellerie, commerce, culture, sport, tourisme, immobilier n'ont **aucun thème de secteur**. L'usager d'un restaurant voit « Simplicité de la démarche » et « Horaires d'ouverture », mais rien sur les plats ; un client de supermarché rien sur les produits ou les prix. Le thème « Prix » a été désactivé le 2026-09-30 ; la question `FAIR_PRICE` (liste `GENERIC`) le remplace en partie.

### 4.4 Questions posées sans tenir compte de la réponse précédente

- **Électricité, Eau** : « Votre avis porte surtout sur : une coupure / une facture / un branchement / autre ». Ensuite, « Combien de coupures ce mois-ci ? » (ou « Combien de jours sans eau ? ») est posée **quelle que soit la réponse**, même à quelqu'un venu pour une facture. Idem pour « Avez-vous un compteur Woyofal ? ».
- **Télécoms** : « Votre avis porte surtout sur : … Mobile money / Facture ou crédit » puis « À quelle fréquence perdez-vous le réseau ? » posée à tous.
- Ces questions devraient dépendre de la réponse au sujet (le mécanisme existe déjà : `question_condition`).

### 4.5 Questions qui conviennent mal à certains types du même secteur

| Question | Liste | Type concerné | Problème |
|---|---|---|---|
| « Vous êtes : élève ou étudiant(e) / parent / autre » | Éducation | case des tout-petits, maternelle | un enfant de 3 à 5 ans ne répond pas lui-même |
| « Combien d'élèves dans la classe ? » | Éducation | université | « élèves » ; question gardée (décision du 2026-10-03) |
| « Combien de temps avez-vous attendu avant d'être reçu(e) ? » jusqu'à « plus de 4 heures » | Santé | pharmacie | on n'est pas « reçu(e) » en pharmacie ; tranches trop longues |
| « Recommanderiez-vous cet établissement à un proche ? » | Générique | bibliothèque, musée publics | utile pour un commerce (on peut choisir), peu pour un service public sans concurrent |

### 4.6 Lieux sans aucune question détaillée

Secteur **Sécurité** (police, gendarmerie), secteur **Transport** sans service choisi (une compagnie « en général »), service **État civil** : choix déjà faits et notés dans `docs/processus-recolte-avis.md`. Conséquence : pas de résultat « Démarche aboutie » pour ces lieux.

## 5. Les métriques : CSAT, NPS, CES

| Métrique | Ce qu'elle mesure | Dans le questionnaire |
|---|---|---|
| **CSAT** (satisfaction) | « Êtes-vous satisfait(e) ? », échelle de 5 | **Oui**, question essentielle, pour tous |
| **NPS** (recommandation) | « Recommanderiez-vous… ? » sur une échelle de **0 à 10** ; on soustrait les 0-6 des 9-10 | **Non.** `RECOMMEND` (Oui / Peut-être / Non, liste Générique) n'est pas un NPS et ne doit pas être appelé ainsi. Le NPS a peu de sens pour un service public sans concurrent |
| **CES** (effort) | « Était-ce facile de… ? », échelle de 5 à 7 | **Non**, mais des indices d'effort existent : `VISITS_COUNT` (nombre de venues), `DOCUMENTS_KNOWN`, le thème « Simplicité de la démarche » |

Pour les services à dossier (mairie, impôts, justice, social), l'effort est souvent ce qui compte le plus. Le nombre de venues (`VISITS_COUNT`) est déjà un bon indicateur d'effort, factuel et facile à publier (par exemple « 62 % ont tout réglé en une fois »).

## 6. Catégories d'évaluation

**Il n'y en a pas aujourd'hui.** Les tables `question` (id, code, type) et `topic` (code, position, actif) n'ont aucun lien vers une catégorie. Chaque question et chaque thème vit seul.

Ce qu'apporteraient des catégories :
- un résultat par catégorie sur la page publique (« Personnel : 85 % positifs ; Délais : 40 % ») ;
- comparer des secteurs différents sur la même catégorie, même si leurs questions diffèrent ;
- repérer les doublons (deux éléments de la même catégorie dans le même questionnaire) ;
- un cadre stable quand on ajoute des questions.

Proposition de 7 catégories, avec le rangement de l'existant :

| Catégorie | Thèmes | Questions |
|---|---|---|
| **Résultat obtenu** | Soins reçus, Qualité de l'enseignement, Prise en compte de la demande | `GOAL_ACHIEVED`, `CARE_RECEIVED`, `PRESCRIPTION_AVAILABLE`, `CLASSES_HELD`, `LUGGAGE` |
| **Délais** | Temps d'attente, Délai de traitement, Délai d'intervention, Ponctualité | `WAIT_TIME`, `CHECKS_WAIT`, `STOP_WAIT`, `DEPARTURE_ON_TIME` |
| **Personnel** | Accueil et politesse, Professionnalisme, Respect des droits, Respect de l'intimité, Encadrement des élèves | (aucune) |
| **Information et démarche** | Explications reçues, Simplicité de la démarche, Suivi du dossier, Service client | `DOCUMENTS_KNOWN`, `VISITS_COUNT`, `WAYFINDING`, `DELAY_INFORMED`, `CUT_NOTICE`, `SAFETY_BRIEFING` |
| **Coût et transparence** | Frais payés, Factures | `RECEIPT_GIVEN`, `RECEIPT_OR_INVOICE`, `FEES_EXPLAINED`, `FAIR_PRICE`, `TICKET_GIVEN`, `PAYMENT_AS_WISHED` |
| **Locaux, équipements et accès** | Propreté et confort, Accès pour tous, Horaires, État des véhicules, Sécurité à bord | `TOILETS`, `FACILITIES`, `SEAT_TO_WAIT`, `TRANSPORT_ACCESS`, `CROWDED`, `SEAT_AS_BOOKED`, `BOARDING` |
| **Continuité du service** (réseaux) | Coupures de courant, Coupures d'eau, Qualité de l'eau, Qualité du réseau | `CUTS_COUNT`, `DAYS_WITHOUT_WATER`, `NETWORK_LOSS` |

Hors catégorie (questions de profil, pour trier les réponses, pas pour évaluer) : `PATIENT`, `RESPONDENT`, `UTILITY_SUBJECT`, `TELECOM_SUBJECT`, `PREPAID_METER`, `CLASS_SIZE`, `REPORTED`, `REPORT_WHY`, `RECOMMEND`.

Ces catégories reprennent les « moteurs » habituels de la satisfaction dans les services publics : résultat, délais, compétence et courtoisie du personnel, information, coût, cadre.

Mise en œuvre : une table `evaluation_category` et une colonne `category_id` sur `question` et sur `topic`. C'est une **nouvelle migration**, donc seulement après votre accord.

## 7. Recommandations, par ordre d'importance

1. **Ranger le centre des permis dans le secteur Administration** (4.2). Petite migration, corrige des thèmes absurdes. **Validé le 2026-10-03, fait dans la migration 0008 (branche).**
2. **Rendre les thèmes communs moins universels** (4.1) : « Simplicité de la démarche » seulement pour les services à dossier ; « Horaires » et « Propreté des locaux » pas pour les trajets ni les réseaux. Il suffit d'ajouter des lignes `topic_sector` (le thème cesse alors d'être commun) : migration de données, sans changement de code. **Validé le 2026-10-03, fait dans la migration 0008 (branche)** : « Simplicité de la démarche » limité à 11 secteurs, « Horaires d'ouverture » retiré pour les vols, traversées et trajets (thèmes par service, option B), « Propreté et confort » sans « des locaux ».
3. **Supprimer les doublons thème / question** (3.2, option A) : retirer du formulaire les thèmes qui répètent une question de fait du même lieu.
4. **Conditionner les questions des réseaux** au sujet choisi (4.4) : des lignes `question_condition`, sans changement de code.
5. **Ajouter les catégories d'évaluation** (6) : une migration, puis un résultat par catégorie sur la page publique.
6. **Thèmes pour les secteurs marchands** (4.3) : restauration, commerce, hôtellerie… à écrire avec vous.
7. **Page publique** : thèmes en « % d'avis positifs » avec le nombre d'avis et un seuil de 10 par thème (3.1).

Le formulaire « Bien / Pas bien » et la question essentielle CSAT ne changent pas.
