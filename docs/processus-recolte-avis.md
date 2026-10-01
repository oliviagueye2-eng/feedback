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

### Partie détaillée (enchaînée après l'écran 2b quand un questionnaire est publié, sans écran de choix)

| # | Étape | Bloom | Question posée à l'usager | Réponse | Obligatoire | Écran | Donnée enregistrée | État |
|---|---|---|---|---|---|---|---|---|
| 7 | **Le résultat de la démarche** | 3. Appliquer | « Avez-vous obtenu ce que vous étiez venu(e) chercher ? » | Oui / en partie / non | Non | 6 | `answer` (`GOAL_ACHIEVED`) | Fait pour la santé ; à rédiger ailleurs (secteurs où la question a du sens) |
| 8 | **Les faits mesurables** | 3. Appliquer | Selon le secteur, ex. « Combien de temps avez-vous attendu ? » | Choix fermés (tranches) | Non | 6 | `answer` (`WAIT_TIME`…) | Fait pour la santé ; à rédiger ailleurs |
| 9 | **La proposition** | 6. Créer | Ex. « Qu'est-ce qui aurait rendu votre visite plus simple ? » | Texte libre court | Non | 6 | `answer` (question `text`) | **Écartée pour la santé** (2026-10-01 : l'écran 2b demande déjà un texte libre) |
| — | **Remerciement** | | « Merci » | | | 7 | `feedback.step`, `feedback.completed_at` (arrondi à l'heure) | Fait |

Les questions des étapes 7 à 9 dépendent du service (questionnaire détaillé du service, sinon du secteur, sinon `GENERIC`). Toutes sur une seule page (écran 6), toutes facultatives : on passe une question en n'y répondant pas.

**Santé** (questionnaire `HEALTH`, migration 0012, validé le 2026-10-01), pour tous les établissements de santé (repli du secteur, aucun service de santé n'étant défini) :

| Code | Question | Réponses |
|---|---|---|
| `PATIENT` | Pour qui êtes-vous venu(e) ? | Pour moi / Pour mon enfant / Pour un autre proche |
| `GOAL_ACHIEVED` | Avez-vous reçu les soins pour lesquels vous étiez venu(e) ? | Oui / En partie / Non |
| `WAIT_TIME` | Combien de temps avez-vous attendu avant d'être reçu(e) ? | Moins de 30 minutes / 30 minutes à 1 heure / 1 à 2 heures / 2 à 4 heures / Plus de 4 heures |
| `PRESCRIPTION_AVAILABLE` | Les médicaments ou examens prescrits étaient-ils disponibles sur place ? | Oui, tous / Une partie / Non, aucun / Rien n'a été prescrit |
| `RECEIPT_GIVEN` | Vous a-t-on donné un reçu pour ce que vous avez payé ? (formulation de 0015) | Oui, pour tout / Pour une partie / Non / Je n'ai rien payé |

Écarté : « Vous a-t-on demandé de payer en dehors de la caisse ? » (trop sensible sans l'accord de l'organisme porteur).

**Administration et état civil** (questionnaire `ADMINISTRATION`, migration 0016, validé le 2026-10-01), pour tous les établissements du secteur (repli du secteur, « État civil » des mairies compris). Mêmes codes et mêmes réponses que la santé quand la question est la même, pour comparer les secteurs :

| Code | Question | Réponses |
|---|---|---|
| `GOAL_ACHIEVED` | Avez-vous obtenu ce que vous étiez venu(e) chercher ? | Oui / En partie / Non |
| `VISITS_COUNT` | Combien de fois êtes-vous venu(e) pour cette démarche ? | 1 fois / 2 fois / 3 fois ou plus |
| `WAIT_TIME` | Combien de temps avez-vous attendu avant d'être reçu(e) ? | *mêmes tranches que la santé* |
| `DOCUMENTS_KNOWN` | Saviez-vous à l'avance quels papiers apporter ? | Oui / En partie / Non |
| `RECEIPT_GIVEN` | Vous a-t-on donné un reçu pour ce que vous avez payé ? | Oui, pour tout / Pour une partie / Non / Je n'ai rien payé |

**Propositions pour les autres secteurs (2026-10-01, non validées)** : Impôts et domaines, Justice, Emploi et protection sociale : même base que l'Administration ; Sécurité : attente, nombre de venues, document remis (à valider avec l'organisme porteur) ; Éducation : vous êtes (élève, parent, autre), cours tenus, effectif de la classe, toilettes et eau, reçu ; Électricité et Eau : sujet de l'avis, nombre de coupures (ou de jours sans eau), prévenu avant la coupure (si coupures), compteur Woyofal (électricité) ; Télécoms : sujet de l'avis, fréquence des pertes de réseau ; Transport : attente à l'arrêt, véhicule bondé, ticket (« quel transport ? » retiré le 2026-10-01 : l'établissement évalué, Dakar Dem Dikk, BRT, TER…, le dit déjà) ; Banques et assurances : démarche obtenue, attente, frais expliqués ; secteurs privés (commerce, hôtellerie, restauration, tourisme, culture, sport, immobilier) : questionnaire `GENERIC` (prix juste, reçu ou facture, recommanderiez-vous).

Règle : ne jamais demander dans le questionnaire ce que l'établissement choisi dit déjà (moyen de transport, secteur…).

**À prévoir pour le transport** :
- **les lignes** (ligne 1, ligne 23…) : à proposer à l'écran 1 dans « Sur quoi porte votre avis ? », comme services de l'opérateur (comme « État civil » pour une mairie), à partir des listes publiées par les opérateurs (numéro, trajet, terminus), quand on ajoutera les opérateurs de transport. **Pas de liste déroulante** (plusieurs dizaines de lignes par opérateur) : un champ « Numéro de la ligne » (clavier numérique), qui affiche le trajet dès que le numéro correspond (« Ligne 23 : Parcelles Assainies – Palais ») pour vérifier ; lignes à lettres (express, TER…) trouvées aussi par le début du nom ; « Je ne connais pas le numéro » possible (l'avis compte pour l'opérateur) ; sans JavaScript, le serveur vérifie le numéro. Ce champ remplace la liste déroulante seulement pour les établissements qui ont beaucoup de services. **Chemin principal : un QR code dans chaque bus ou à l'arrêt**, qui porte la ligne (un QR code peut déjà porter un service) : rien à taper (recommandation validée le 2026-10-01) ;
- **cars rapides, Ndiaga Ndiaye, taxis** : pas d'établissement nommé, donc impossible à choisir dans la recherche ; il faudrait décider quel organisme les représente (AFTU pour les minibus Tata ? CETUD, autorité des transports urbains de Dakar ?) : à voir avec l'organisme porteur.

Le « sujet de l'avis » proposé pour l'électricité, l'eau et les télécoms (coupure, facture, mobile money…) pourrait de même devenir des services à l'écran 1 ; gardé dans le questionnaire pour l'instant, plus simple.

**Questions communes** (questionnaire `COMMON`, migration 0014, validé le 2026-10-01) : dans tous les secteurs, **sur leur propre page (écran 6b, `/donner/{id}/questionnaire/commun`) après celle du secteur**, pour que « cette situation » ne soit pas lue comme le sujet de la question précédente, et **seulement après « Peu satisfait(e) » ou « Pas du tout satisfait(e) »**. Un usager peu satisfait d'un secteur sans questionnaire propre va directement de l'écran 2b à l'écran 6b ; un usager satisfait ne la voit pas.

| Code | Question | Réponses | Affichée si |
|---|---|---|---|
| `REPORTED` | Avez-vous signalé cette situation à l'établissement (accueil, service client, direction…) ? (formulation de 0015) | Oui, et on m'a répondu / Oui, mais sans réponse / J'ai essayé, sans réussir à les joindre / Non | satisfaction = peu ou pas du tout satisfait(e) |
| `REPORT_WHY` | Pourquoi ? | Je ne savais pas à qui m'adresser / Je pensais que ça ne servirait à rien / Autre raison | `REPORTED` = Non (apparaît dès que « Non » est touché) |

Écarté : « Par peur des conséquences ». Une réponse qui ne s'applique plus (devenu satisfait, ou « Non » changé en « Oui ») est effacée à la fin de l'avis.

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
