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
| — | **Confirmation** | | « Votre avis est enregistré » | Terminer ou continuer (proposé seulement si un questionnaire détaillé est publié) | | 4-5 | `feedback.step`, `feedback.completed_at` (arrondi à l'heure) | Fait |

### Partie détaillée (facultative, proposée après la confirmation)

| # | Étape | Bloom | Question posée à l'usager | Réponse | Obligatoire | Écran | Donnée enregistrée | État |
|---|---|---|---|---|---|---|---|---|
| 7 | **Le résultat de la démarche** | 3. Appliquer | « Avez-vous obtenu ce que vous étiez venu(e) chercher ? » | Oui / en partie / non | Non | 6 | `answer` (`GOAL_ACHIEVED`) | À rédiger (secteurs où la question a du sens) |
| 8 | **Les faits mesurables** | 3. Appliquer | Selon le secteur, ex. « Combien de temps avez-vous attendu ? » | Choix fermés (tranches) | Non | 6 | `answer` (`WAIT_TIME`…) | À rédiger |
| 9 | **La proposition** | 6. Créer | Ex. « Qu'est-ce qui aurait rendu votre visite plus simple ? » | Texte libre court | Non | 6 | `answer` (question `text`) | **Proposition, à valider** |
| — | **Remerciement** | | « Merci » | | | 7 | | Fait |

Les questions des étapes 7 à 9 dépendent du service (questionnaire détaillé du service, sinon du secteur, sinon `GENERIC`). Aucune n'est encore rédigée.

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

1. **Étape 9 (Créer)** : ajouter une question de proposition à la fin des questionnaires détaillés ? Libellé à choisir.
2. **Étapes 7 et 8** : rédiger les questionnaires détaillés, en commençant par les secteurs prioritaires (santé, administration, éducation).
3. **Seuil de publication** : 10 avis par mois et par établissement, à confirmer.
