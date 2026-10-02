# Processus de récolte d'un avis

Canevas de la récolte d'un avis, étape par étape, construit sur la taxonomie de Bloom. Il fixe, pour chaque avis, ce qu'on demande, dans quel ordre, ce qui est obligatoire et ce qui est enregistré.

Document de travail (2026-09-30), à valider. Les écrans cités sont ceux du parcours A (voir `HANDOFF.md`) ; les données, celles de `architecture-base-de-donnees.md`.

---

## 1. Principe : Bloom appliqué à l'usager

La taxonomie de Bloom range les opérations de pensée de la plus simple à la plus exigeante :

| Niveau | Verbe | Ce que fait l'usager |
|---|---|---|
| 1 | Se souvenir | Il rappelle des faits : où, quoi, quand |
| 2 | Comprendre | Il explique avec ses mots ce qui s'est passé |
| 3 | Appliquer | Il compare son cas à une attente précise : ai-je obtenu ce que je venais chercher ? |
| 4 | Analyser | Il distingue les aspects : l'accueil, l'attente, les explications… |
| 5 | Évaluer | Il porte un jugement : satisfait ou non |
| 6 | Créer | Il propose une amélioration |

Règle qu'on en tire : **on commence par ce qui demande le moins d'effort (des faits, des choix fermés) et on finit par ce qui en demande le plus (écrire, proposer)**. Les étapes exigeantes sont facultatives.

Une exception voulue : le **jugement global (niveau 5) vient tôt**, juste après les faits. Voir la section 4.

---

## 2. Le canevas

Chaque avis passe par ces étapes, dans cet ordre.

### Partie essentielle (environ 1 minute)

| # | Étape | Bloom | Question posée à l'usager | Réponse | Obligatoire | Écran | Donnée enregistrée | État |
|---|---|---|---|---|---|---|---|---|
| 1 | **Où ?** L'établissement | 1. Se souvenir | « Dans quel établissement êtes-vous allé(e) ? » (ou QR code scanné) | Recherche, choix dans une liste, ou saisie libre | Oui | 0 à 0c, ou QR | `establishment_id`, `channel`, `qr_code_id` | Fait |
| 2 | **Quoi ?** Le service | 1. Se souvenir | « Sur quoi porte votre avis ? » | Liste des services de l'établissement, ou « Autre démarche » | Non (déjà connu par le QR code du guichet) | 1 | `service_id` | Fait |
| 3 | **Quand ?** La période | 1. Se souvenir | « À quand remonte votre expérience ? » | Aujourd'hui / moins d'une semaine / moins d'un mois / plus d'un mois | Oui, sauf QR code (= aujourd'hui) | 1 | `visit_period`, `visit_month` | Fait |
| 4 | **Le jugement global** | 5. Évaluer | « Êtes-vous satisfait(e) du service reçu ? » | 5 niveaux, un toucher | **Oui** : c'est la réponse qui compte dans les résultats | 2 | `answer` (`OVERALL_SATISFACTION`) | Fait |
| 5 | **Les aspects** | 4. Analyser | « Comment ça s'est passé ? » | Pour chaque thème du secteur : « Bien », « Pas bien » ou rien ; « Autre » à préciser | Non | 2b | `feedback_topic` (avec `sentiment`) | Fait |
| 6 | **Le récit** | 2. Comprendre | « Détail de votre expérience » (aide : points positifs, points négatifs, suggestions d'amélioration) | Texte libre, 500 caractères | Non | 2b | `comment` (relu avant publication) | Fait |

### Partie détaillée (enchaînée après l'écran 2b quand des questions s'appliquent, sans écran de choix)

| # | Étape | Bloom | Question posée à l'usager | Réponse | Obligatoire | Écran | Donnée enregistrée | État |
|---|---|---|---|---|---|---|---|---|
| 7 | **Le résultat de la démarche** | 3. Appliquer | « Avez-vous obtenu ce que vous étiez venu(e) chercher ? » (santé : « Avez-vous reçu les soins… ? ») | Oui / en partie / non | Non | 6 | `answer` (`GOAL_ACHIEVED`, `CARE_RECEIVED`) | Fait là où la question a du sens |
| 8 | **Les faits mesurables** | 3. Appliquer | Selon le secteur, ex. « Combien de temps avez-vous attendu avant d'être reçu(e) ? » | Choix fermés (tranches) | Non | 6 | `answer` (`WAIT_TIME`…) | Fait |
| 9 | **La proposition** | 6. Créer | Ex. « Qu'est-ce qui aurait rendu votre visite plus simple ? » | Texte libre court | Non | 6 | `answer` (question `text`) | **Écartée** (2026-10-01 : l'écran 2b demande déjà un texte libre) |
| — | **Remerciement** | | « Merci » | | | 7 | `feedback.step`, `feedback.completed_at` (arrondi à l'heure) | Fait |

**Organisation des questions (refaite le 2026-10-02 avant la mise en ligne, « solution 3 »)** :

- **Une banque de questions** : chaque question est écrite une seule fois (34 questions), avec ses réponses. Une question posée dans plusieurs secteurs est la même question (même code, mêmes réponses), donc ses résultats se comparent d'un secteur à l'autre.
- **Des listes** : une liste est une sélection ordonnée de questions de la banque. Une liste peut être rattachée à un **secteur**, à un **type d'établissement** ou à un **service**.
- **Les listes s'additionnent**, du plus général au plus précis : celle du secteur, puis celle du type, puis celle du service. Une question présente dans deux listes n'est posée qu'une fois, à sa première place. Tout est sur une seule page (écran 6), tout est facultatif : on passe une question en n'y répondant pas. Sans aucune liste, l'écran 6 est sauté.
- **`GENERIC`** : la liste des 7 secteurs privés, posée aussi quand le secteur de l'établissement est inconnu.
- **Conditions** : une question peut ne s'afficher qu'après certaines réponses (« Prévenu(e) avant les coupures ? » seulement s'il y a eu des coupures). Elle apparaît dès que la réponse est touchée, sans JavaScript. Une réponse qui ne s'applique plus est effacée à la fin de l'avis.
- Règle : ne jamais demander ce que l'établissement choisi dit déjà (moyen de transport, secteur…).

Source unique : `src/db/migrations/0004_questions.sql` (générée à partir d'une seule description pour éviter les erreurs de recopie). Détail des tables : `docs/architecture-base-de-donnees.md`, section 5.

**Contenu validé le 2026-10-02** (numéros de la page de validation) :

| Liste | Rattachée à | Questions |
|---|---|---|
| `ESSENTIAL` | tous (écran 2) | 1 Êtes-vous satisfait(e) du service reçu ? |
| `COMMON` | tous, écran 6b, si mécontent | 2 Avez-vous signalé cette situation à l'établissement (accueil, service client, direction…) ? ; 3 Pourquoi ? (si « Non ») |
| `FILE_SERVICES` | secteurs Administration et état civil, Impôts et domaines, Justice, Emploi et protection sociale ; type Centre des permis et cartes grises (0005) | 4 Avez-vous obtenu ce que vous étiez venu(e) chercher ? ; 6 Combien de fois êtes-vous venu(e) pour cette démarche ? ; 5 Combien de temps avez-vous attendu avant d'être reçu(e) ? ; 7 Saviez-vous à l'avance quels papiers apporter ? ; 8 Vous a-t-on donné un reçu pour ce que vous avez payé ? |
| `HEALTH` | secteur Santé | 11 Pour qui êtes-vous venu(e) ? ; 12 Avez-vous reçu ce pour quoi vous étiez venu(e) (soins, médicaments, examen) ? (reformulée le 2026-10-02 pour les pharmacies, laboratoires et centres d'imagerie, migration 0005) ; 5 attente ; 13 Les médicaments ou examens prescrits étaient-ils disponibles sur place ? ; 8 reçu |
| `BANKING_INSURANCE` | secteur Banques et assurances | 4 démarche obtenue ; 5 attente ; 9 Les frais vous ont-ils été expliqués clairement ? |
| `EDUCATION` | secteur Éducation | 14 Vous êtes : ; 15 Les cours ont-ils eu lieu comme prévu ces dernières semaines ? ; 16 Combien d'élèves y a-t-il dans la classe ? ; 17 Les toilettes et l'eau fonctionnent-elles ? ; 8 reçu |
| `ELECTRICITY` | secteur Électricité | 18 Votre avis porte surtout sur : ; 19 Combien de coupures avez-vous eues ce mois-ci ? ; 21 Avez-vous été prévenu(e) avant les coupures ? (si coupures) ; 22 Avez-vous un compteur Woyofal (prépayé) ? |
| `WATER` | secteur Eau | 18 sujet ; 20 Combien de jours sans eau ce mois-ci ? ; 21 prévenu(e) (si jours sans eau) |
| `TELECOM` | secteur Télécoms | 23 Votre avis porte surtout sur : ; 24 À quelle fréquence perdez-vous le réseau ? |
| `LAND_TRIP` | service « Un trajet en bus ou en train » | 25 Combien de temps avez-vous attendu à l'arrêt ou en gare ? ; 26 Le véhicule était-il bondé ? ; 27 Vous a-t-on donné un ticket pour votre trajet ? |
| `BOAT_CROSSING` | service « Une traversée en bateau » | 28 Le bateau est-il parti à l'heure prévue ? (devenue « Êtes-vous parti(e) à l'heure prévue ? » en 0006) ; 29 L'embarquement s'est-il bien passé ? ; 30 Aviez-vous une place correspondant à votre billet (siège, couchette, cabine) ? ; 31 Les consignes de sécurité (gilets, exercices) ont-elles été présentées ? |
| `TICKET_PURCHASE` | service « Achat d'un ticket ou d'une carte d'abonnement » | 4 démarche obtenue ; 5 attente ; 10 Avez-vous pu payer comme vous le souhaitiez (espèces, paiement mobile…) ? |
| `AIRPORT` | type Aéroport (0005) | 35 Avez-vous trouvé facilement votre chemin (panneaux, annonces, indications) ? (Oui / Avec difficulté / Non) ; 36 Combien de temps avez-vous attendu aux contrôles (police, sécurité, douane) ? ; 37 Avez-vous trouvé une place assise pour attendre ? ; 38 Les toilettes étaient-elles propres et en état de marche ? (+ « Je n'y suis pas allé(e) ») ; 39 Avez-vous trouvé facilement un transport pour venir ou repartir ? |
| `BUS_STATION` | type Gare routière (0005) | 35 chemin ; 37 place assise ; 38 toilettes ; 39 transport pour venir ou repartir |
| `FLIGHT` | service « Un vol » (Air Sénégal, 0006) | 28 Êtes-vous parti(e) à l'heure prévue ? (formulation commune au bateau et à l'avion depuis 0006) ; 40 Avez-vous été informé(e) du retard ou de l'annulation ? ; 42 Avez-vous été pris(e) en charge pendant l'attente (repas, hôtel, autre vol) ? (Oui / En partie / Non / Ce n'était pas nécessaire) (40 et 42 seulement après un retard ou une annulation ; pas posées pour le bateau, son choix du 2026-10-02) ; 29 embarquement ; 41 Avez-vous récupéré vos bagages complets et en bon état ? (+ « Pas de bagage en soute ») |
| `TICKET_PURCHASE` (bis) | service « Achat ou modification d'un billet » (Air Sénégal, 0006) | mêmes questions que l'achat d'un ticket |
| `GENERIC` | secteurs Commerce, Culture, Hôtellerie, Immobilier, Restauration, Sport, Tourisme ; secteur inconnu | 32 Le prix vous a-t-il semblé juste ? ; 33 Vous a-t-on donné un reçu ou une facture ? ; 34 Recommanderiez-vous cet établissement à un proche ? |

Sans liste pour l'instant : secteur **Sécurité** (en attente de l'organisme porteur), secteur **Transport** (aucune question ne vaut pour tous les moyens de transport : les questions viennent du service ou du type de lieu), service **État civil** (n'ajoute rien aux questions des services à dossier). **Lieux de passage (aéroport, gare routière, 2026-10-02)** : version courte de ses 15 questions par lieu, regroupées en questions de fait. **Règle** : une question porte sur ce que gère celui qu'on évalue. Le lieu (gestionnaire de l'aéroport ou de la gare) : chemin, attente, toilettes, accès ; les contrôles de police et de douane ont lieu dans l'aéroport et s'y évaluent. La compagnie ou le transporteur (plus tard, un organisme avec un service « Un vol ») : bagages, prix, heure de départ. Écartés pour cette raison : « bagages complets et en bon état ? », « payer plus que le prix affiché ? ». Écartés aussi : stationnement, restauration et commerces (autres sociétés), accès des personnes à mobilité réduite (thème « Accès pour tous »), qualité générale (question essentielle).

Écarté : « Vous a-t-on demandé de payer en dehors de la caisse ? » (trop sensible sans l'accord de l'organisme porteur) ; « Par peur des conséquences » (réponse à « Pourquoi ? »).

**Organisation du transport (validée le 2026-10-02)** :

```
Qui ?       l'opérateur          = un organisme (Dem Dikk, BRT, TER, AFTU, COSAMA), note globale regroupée
Lequel ?    la ligne ou la gare  = un site de l'opérateur (comme les agences de Senelec), avec son QR code
Quoi ?      la démarche          = un service : « Un trajet en bus ou en train », « Une traversée en bateau »,
                                   « Achat d'un ticket ou d'une carte d'abonnement » (+ « Autre démarche »)
```

- Une ligne n'est **pas** un service : un service est une démarche partagée par plusieurs établissements (« État civil » pour toutes les mairies) ; une ligne n'appartient qu'à un opérateur.
- **Règle générale** : un service décrit ce que l'usager est venu faire ou a utilisé, **jamais le fait de se plaindre**. « Réclamation » écarté (une réclamation porte sur un trajet ou un achat ; déjà couvert par les thèmes « Pas bien », le texte et « Avez-vous signalé cette situation… ? »). « Objets perdus » écarté (rare ; « Autre démarche » suffit).
- Organismes : **Dem Dikk** (Dakar Dem Dikk, devenu Dem Dikk S.A. le 11 septembre 2026), **BRT** (Dakar Mobilité), **TER** (SETER), **AFTU** (minibus Tata), **COSAMA**, chacun avec sa fiche « en général » ; site de la COSAMA : **Aline Sitoë Diatta (bateau Dakar – Ziguinchor)** (le *Diambogne* et l'*Aguène* non ajoutés, à sa demande). Un **service par mode** (option B ; découper le transport en trois secteurs reste possible plus tard). Questions du bateau et de l'achat : proposées par moi, laissées à mon choix par elle (« pas de préférence »), à revoir si besoin. « Un vol » : fait avec **Air Sénégal** (migration 0006, 2026-10-02) : organisme avec sa fiche « en général », services « Un vol » et « Achat ou modification d'un billet » ; agences et comptoirs d'enregistrement (lieux avec QR code) plus tard. Les bagages relèvent de la compagnie, même sous-traités à une société d'assistance au sol : c'est à elle que l'usager les a confiés.

**À prévoir pour le transport** :
- **les lignes** (ligne 1, ligne 23…) : à proposer à l'écran 1 dans « Sur quoi porte votre avis ? », à partir des listes publiées par les opérateurs (numéro, trajet, terminus). **Pas de liste déroulante** (plusieurs dizaines de lignes par opérateur) : un champ « Numéro de la ligne » (clavier numérique), qui affiche le trajet dès que le numéro correspond (« Ligne 23 : Parcelles Assainies – Palais ») pour vérifier ; lignes à lettres (express, TER…) trouvées aussi par le début du nom ; « Je ne connais pas le numéro » possible (l'avis compte pour l'opérateur) ; sans JavaScript, le serveur vérifie le numéro. **Chemin principal : un QR code dans chaque bus ou à l'arrêt**, qui porte la ligne : rien à taper (recommandation validée le 2026-10-01) ;
- **cars rapides, Ndiaga Ndiaye, taxis** : pas d'établissement nommé ; il faudrait décider quel organisme les représente (AFTU ? CETUD ?) : à voir avec l'organisme porteur.

Le « sujet de l'avis » de l'électricité, l'eau et les télécoms (coupure, facture, mobile money…) pourrait de même devenir des services à l'écran 1 ; gardé dans les questions pour l'instant, plus simple.

**Questions communes** (`COMMON`) : dans tous les secteurs, **sur leur propre page (écran 6b, `/donner/{id}/questionnaire/commun`) après l'écran 6**, pour que « cette situation » ne soit pas lue comme le sujet de la question précédente, et **seulement après « Peu satisfait(e) » ou « Pas du tout satisfait(e) »**. Un usager mécontent sans questions à l'écran 6 va directement de l'écran 2b à l'écran 6b ; un usager satisfait ne la voit pas.

| Code | Question | Réponses | Affichée si |
|---|---|---|---|
| `REPORTED` | Avez-vous signalé cette situation à l'établissement (accueil, service client, direction…) ? | Oui, et on m'a répondu / Oui, mais sans réponse / J'ai essayé, sans réussir à les joindre / Non | satisfaction = peu ou pas du tout satisfait(e) |
| `REPORT_WHY` | Pourquoi ? | Je ne savais pas à qui m'adresser / Je pensais que ça ne servirait à rien / Autre raison | `REPORTED` = Non (apparaît dès que « Non » est touché) |

---

## 3. Fiche d'un avis

Ce que contient un avis complet, et ce qu'il ne contient jamais.

**Identifié par** un numéro unique créé par le téléphone (`feedback.id`) : un envoi répété après une coupure de réseau met à jour le même avis, sans doublon.

**Contient :**
- l'établissement, le service (s'il est connu), le canal d'arrivée (QR code ou recherche) ;
- la période de visite et le mois de visite (calculé une fois pour toutes) ;
- la réponse à la question essentielle ;
- les thèmes touchés, chacun « Bien » ou « Pas bien », et le commentaire (facultatifs) ;
- les réponses détaillées (facultatives) ;
- la langue, l'étape atteinte (`essential`, `detailed`, `completed`), l'heure de début arrondie à l'heure.

**Ne contient jamais :** nom, numéro de téléphone, adresse, position GPS, date ou heure exacte de la visite. Un commentaire qui contient un nom n'est pas publié (relecture).

**Compte dans les résultats publiés si :**
- la question essentielle a une réponse ;
- la visite date de moins d'un mois (`over_month` est gardé mais exclu) ;
- l'établissement a au moins 10 avis dans le mois (seuil à confirmer).

---

## 4. Pourquoi le jugement global vient avant l'analyse

Un ordre strictement conforme à Bloom placerait « Êtes-vous satisfait(e) ? » après les thèmes et le récit (étapes 5 et 6). On le place avant, pour trois raisons :

1. **Ne rien perdre.** Beaucoup d'usagers s'arrêtent après une ou deux réponses. La réponse qui compte dans les résultats doit être enregistrée tout de suite, d'un seul toucher.
2. **Ne pas influencer le jugement.** Faire détailler les défauts avant de demander une note globale peut tirer la note vers le bas. On demande d'abord l'impression générale, puis le détail.
3. **Situer le détail.** La réponse globale donne le cadre ; les « Bien » et « Pas bien » par thème disent ensuite ce qui l'explique, y compris quand la visite est mitigée.

---

## 5. Décisions à prendre

1. **Questions encore à rédiger** : Sécurité (avec l'organisme porteur), Aéroport.
2. **Seuil de publication** : 10 avis par mois et par établissement, à confirmer.
