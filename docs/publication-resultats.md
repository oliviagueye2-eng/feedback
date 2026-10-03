# Publication des résultats : que publier, et comment

Étude du 2026-10-03. **Décisions du 2026-10-03** : design B « Le relevé » avec les pourcentages ; 10 avis sur les 3 derniers mois, mis à jour chaque mois ; commentaires écrits non publiés au lancement ; migration 0007 acceptée. Maquettes : planche `A-resultats-publics.dc.html` du canevas (chiffres fictifs). Page construite : `/resultats/{établissement}` (section 4), mise à jour en **version 2** le 2026-10-03 (section 5).

## 1. Ce qu'on publie

| Information | Publier ? | Pourquoi |
|---|---|---|
| **Part d'usagers satisfaits** (« très satisfait » + « satisfait »), dite « 7 usagers sur 10 » | **Oui, c'est le résultat principal** | Compris par tout le monde, même sans lire de pourcentage. Une moyenne « 3,8 sur 5 » est abstraite et ressemble aux étoiles des sites commerciaux. |
| Détail des 5 réponses (nombre et part) | Oui, en dessous | Montre une visite mitigée ; permet de vérifier le chiffre principal. |
| Nombre d'avis et période | Oui, toujours à côté du résultat | Un résultat sans nombre d'avis ne veut rien dire. |
| « Avez-vous obtenu ce que vous étiez venu(e) chercher ? » | Oui, là où la question est posée | C'est la mesure la plus concrète pour un service public. Pas pour un restaurant (la question n'y est pas posée). |
| Thèmes « Bien » et « Pas bien » de l'écran 2b | **Version 2 : seulement 2 points forts et 2 points à améliorer au plus**, ceux que la marge d'erreur confirme (section 5) | Dit **pourquoi** les usagers sont satisfaits ou non. La liste complète est réservée au futur espace établissement (choix A du 2026-10-03). |
| Évolution | **Version 2 : trimestre précédent et trimestre publié** | Un mois seul a trop peu d'avis : ses variations sont surtout du hasard. Un trimestre sous le seuil affiche « pas assez d'avis ». |
| Commentaires écrits | **Non au lancement** | Ils doivent être relus avant publication (noms, injures, accusations) : il n'y a pas encore d'outil de modération. Plus tard : quelques extraits relus. |
| Texte de « Autre » | Jamais | Sert seulement à repérer les thèmes qui manquent (déjà décidé). |
| Réponses « Avez-vous signalé cette situation ? » | Non sur la page publique | Utile aux organismes, mais pas au grand public. |
| Questions détaillées (attente, reçu, nombre de venues…) | Plus tard | Beaucoup de questions différentes selon le secteur ; à ajouter une fois le principe validé. |
| Classement entre établissements | **Non au lancement** | Risque de comparer des lieux qui ne se comparent pas (petit poste de santé et hôpital) ; à voir avec l'organisme porteur. |

## 2. Règles de publication (validées le 2026-10-03)

1. **Seuil : 10 avis.** Sous ce nombre, aucun résultat (anonymat et fiabilité). On affiche « Pas encore assez d'avis » avec le nombre reçu et le bouton « Donner mon avis sur cet établissement ».
2. **Période : les 3 derniers mois, mis à jour chaque mois.** Avec « 10 avis par mois », une petite mairie ne serait presque jamais publiée. Trois mois glissants publient plus de lieux, et la promesse de l'accueil (« publiés chaque mois ») reste vraie. L'évolution mois par mois garde le seuil de 10 pour chaque mois.
3. **Avis comptés** : réponse à la question essentielle, visite de moins d'un mois (déjà la règle), établissement validé (pas `pending_review`).
4. **Organisme** (Senelec, Dem Dikk…) : une note regroupée (décision déjà prise), puis la liste de ses lieux avec leur résultat. **Pas encore construit** : aujourd'hui la fiche « en général » d'un organisme n'a que ses propres avis.
5. **Résultat obtenu** (version 2) : toutes les questions de la catégorie « Résultat obtenu » (migration 0009) posées au lieu, chacune seulement si elle a au moins 10 réponses sur la période. Les réponses « ne s'applique pas » (pas de bagage enregistré, rien de prescrit) ne sont pas comptées.

## 3. Où on le montre

- Une page par établissement : `/resultats/{établissement}`.
- Un lien « Voir les résultats » sur l'écran « Merci » (après l'avis, pour ne pas influencer la réponse).
- Plus tard : une page « Résultats » avec la même recherche que l'accueil, et le lien « Résultats par établissement » prévu dans la maquette d'accueil.

## 4. Ce qui est construit, et pourquoi ce choix technique

### En bref

Chaque nuit, la base fait les comptes : pour chaque établissement, chaque service et chaque mois, combien d'usagers ont choisi chaque réponse, et combien ont dit « Bien » ou « Pas bien » sur chaque thème. La page de résultats additionne ensuite les 3 mois voulus et applique le seuil de 10 avis au moment de l'affichage.

Exemple : la Mairie de Grand Yoff a 15 avis en juillet, 14 en août et 19 en septembre. La base garde ces trois lignes. Le 1er octobre, la page additionne juillet à septembre (48 avis), au-dessus de 10 : le résultat est publié.

### Ce que fait la migration 0007 (`src/db/migrations/0007_published_counts.sql`)

| Objet | Rôle |
|---|---|
| `published_feedback` (vue simple) | La liste des avis qui comptent : mois de visite connu (pas « plus d'un mois »), question essentielle répondue ; l'avis d'un établissement fusionné compte pour celui qui le remplace. Écrite une seule fois, utilisée par les deux vues ci-dessous. |
| `monthly_answer_counts` (vue matérialisée) | Une ligne par établissement, service, mois, question et réponse : le nombre de fois où la réponse a été choisie. Les textes libres ne sont jamais comptés. |
| `monthly_topic_counts` (vue matérialisée) | Une ligne par établissement, service, mois et thème : nombre de « Bien » et de « Pas bien ». Le thème « Autre » est exclu (ce que l'usager y écrit n'est jamais publié). |

Rien n'est modifié dans les tables existantes : la migration ajoute seulement trois vues. La vue `monthly_stats` (moyenne) reste en place.

### Pourquoi ce choix

1. **Compter une fois par nuit, pas à chaque visite de la page.** Une vue matérialisée est un tableau de résultats que la base recalcule à heure fixe (le calcul de nuit existe déjà, à 2 h). La page lit quelques dizaines de lignes déjà comptées au lieu de parcourir tous les avis : elle reste rapide en 3G, même avec des millions d'avis. C'est la même méthode que `monthly_stats`, déjà en place.
2. **Garder le mois comme unité, appliquer les règles à la lecture.** La période (3 mois) et le seuil (10 avis) ne sont pas écrits dans la base mais dans le code (`src/domain/stats/results.ts`). Passer à 6 mois ou à 20 avis demain se fait sans migration ni recalcul.
3. **Une vue générale pour toutes les questions.** Comme chaque question de la banque a le même code et les mêmes réponses dans tous les secteurs, une seule vue compte toutes les réponses. Publier plus tard le temps d'attente ou « Vous a-t-on donné un reçu ? » sera une simple lecture, sans nouvelle migration.
4. **Des comptes, pas des moyennes.** Avec les nombres de chaque réponse, on peut additionner des mois et des services sans erreur (on ne peut pas faire la moyenne de moyennes), et calculer les pourcentages du tableau.
5. **L'anonymat protégé par construction.** Sous 10 avis, la page et l'API ne renvoient que le nombre d'avis, jamais le détail. Un établissement pas encore vérifié (`pending_review`) n'a pas de résultats publiés. Les mois sont des mois complets : les chiffres ne bougent pas pendant le mois et un avis du jour ne peut pas être repéré.
6. **Testé sur les vraies migrations.** Les tests appliquent 0001 à 0007 sur une base en mémoire et vérifient : addition des 3 mois et des services, seuil, établissement non vérifié, « Autre » jamais publié, fusion, pourcentages qui font toujours 100.

### Alternatives écartées

- **Ajouter des colonnes à `monthly_stats`** (une par réponse) : il aurait fallu une migration à chaque nouvelle question publiée, et la supprimer puis la recréer.
- **Calculer en direct à chaque affichage** : simple, mais de plus en plus lent avec le nombre d'avis, sur le serveur partagé de Neon.
- **Stocker directement les résultats sur 3 mois** : changer la période aurait demandé une migration et un recalcul complet.

### Fichiers

- `src/db/migrations/0007_published_counts.sql` : les vues.
- `src/db/stats.ts` : recalcul de nuit des trois vues, lectures des comptes.
- `src/domain/stats/results.ts` : règles (période, seuil, pourcentages qui font 100 %).
- `app/(public)/resultats/[id]/` : la page (design B), textes dans `app/_i18n/fr.ts` (`results`).
- Écran « Merci » : lien « Voir les résultats de cet établissement ».
- `GET /webapi/establishments/{id}/stats` renvoie les mêmes résultats que la page.

### Reste à faire

- `CRON_SECRET` dans Vercel (le calcul de nuit est protégé par ce secret).
- Note regroupée d'un organisme (section 2, point 4).
- Page « Résultats » avec recherche, et lien depuis l'accueil.

## 5. Les deux propositions de design

- **A « Sur 10 usagers »** : dix visages (les mêmes qu'à l'écran 2) et une phrase « 7 usagers sur 10 sont satisfaits ». Fait pour le grand public, y compris les personnes peu à l'aise avec les chiffres. Peu de chiffres, beaucoup de phrases.
- **B « Le relevé » (retenu le 2026-10-03)** : une fiche comme le ticket de l'accueil, tamponnée « Publié » avec la date. Pourcentages, tableaux, barres « Pas bien / Bien » de part et d'autre d'un axe. Plus complet, pour les responsables et les journalistes.

## 5. Version 2 (2026-10-03)

Décisions d'Olivia du 2026-10-03, après une relecture statistique (`/mnt/project-files/resultats-publics/analyse-statistique-version-2.md`).

| Élément | Règle | Pourquoi |
|---|---|---|
| Chiffre principal | « 71 % d'avis satisfaits ou très satisfaits » | Les avis sont volontaires : ce n'est pas un sondage représentatif de tous les usagers. |
| Points forts et points à améliorer | 2 au plus de chaque, thèmes avec au moins 10 notes. Point fort si même le bas de l'intervalle de confiance à 95 % (Wilson) atteint 60 % ; à améliorer si même le haut reste sous 50 %. Affichés en compteurs (demi-cercle en 3 zones : rouge sous 50 %, jaune de 50 à 60 %, vert au-dessus) | Avec 14 avis, « 36 % » peut valoir de 16 % à 61 % : on n'affiche pas publiquement un reproche que les chiffres ne confirment pas. Le pourcentage affiché reste le pourcentage simple ; la marge sert seulement à décider. |
| Évolution | Le trimestre précédent et le trimestre publié, pourcentages simples, sans « en hausse » ni « en baisse » | Même période que le reste de la fiche ; 3 fois plus d'avis qu'un mois. |
| Pied de fiche | « Résultats mis à jour chaque mois. » et le lien « Comment sont calculés ces résultats ? » (`/resultats/calcul`) | La page reste légère ; les règles restent consultables. |

Code : `topicHighlights` et `wilsonInterval` dans `src/domain/stats/results.ts` ; libellés courts des thèmes dans `app/_i18n/fr.ts` (`results.topicShort`), icônes dans `app/(public)/resultats/[id]/TopicGauge.tsx`. L'API `GET /webapi/establishments/{id}/stats` renvoie la même chose que la page : `outcomes`, `strengths`, `improvements` et `quarters` remplacent `goals`, `topics` et `months`.
