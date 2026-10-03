# Publication des résultats : que publier, et comment

Étude du 2026-10-03. **Rien n'est décidé** : ce document prépare les choix à faire avec la porteuse du projet. Maquettes : `app/(public)/maquettes/resultats/a` et `b` (chiffres fictifs, aucune lecture de la base).

## 1. Ce qu'on publie

| Information | Publier ? | Pourquoi |
|---|---|---|
| **Part d'usagers satisfaits** (« très satisfait » + « satisfait »), dite « 7 usagers sur 10 » | **Oui, c'est le résultat principal** | Compris par tout le monde, même sans lire de pourcentage. Une moyenne « 3,8 sur 5 » est abstraite et ressemble aux étoiles des sites commerciaux. |
| Détail des 5 réponses (nombre et part) | Oui, en dessous | Montre une visite mitigée ; permet de vérifier le chiffre principal. |
| Nombre d'avis et période | Oui, toujours à côté du résultat | Un résultat sans nombre d'avis ne veut rien dire. |
| « Avez-vous obtenu ce que vous étiez venu(e) chercher ? » | Oui, là où la question est posée | C'est la mesure la plus concrète pour un service public. Pas pour un restaurant (la question n'y est pas posée). |
| Thèmes « Bien » et « Pas bien » de l'écran 2b | Oui : les 3 points forts et les 3 points à améliorer | Dit **pourquoi** les usagers sont satisfaits ou non : c'est ce qui aide un responsable à agir. |
| Évolution mois par mois | Oui | Montre si les choses s'améliorent. Un mois sous le seuil affiche « pas assez d'avis ». |
| Commentaires écrits | **Non au lancement** | Ils doivent être relus avant publication (noms, injures, accusations) : il n'y a pas encore d'outil de modération. Plus tard : quelques extraits relus. |
| Texte de « Autre » | Jamais | Sert seulement à repérer les thèmes qui manquent (déjà décidé). |
| Réponses « Avez-vous signalé cette situation ? » | Non sur la page publique | Utile aux organismes, mais pas au grand public. |
| Questions détaillées (attente, reçu, nombre de venues…) | Plus tard | Beaucoup de questions différentes selon le secteur ; à ajouter une fois le principe validé. |
| Classement entre établissements | **Non au lancement** | Risque de comparer des lieux qui ne se comparent pas (petit poste de santé et hôpital) ; à voir avec l'organisme porteur. |

## 2. Règles de publication (à valider)

1. **Seuil : 10 avis.** Sous ce nombre, aucun résultat (anonymat et fiabilité). On affiche « Pas encore assez d'avis » avec le nombre reçu et le bouton « Donner mon avis sur cet établissement ».
2. **Période : les 3 derniers mois, mis à jour chaque mois.** Avec « 10 avis par mois », une petite mairie ne serait presque jamais publiée. Trois mois glissants publient plus de lieux, et la promesse de l'accueil (« publiés chaque mois ») reste vraie. L'évolution mois par mois garde le seuil de 10 pour chaque mois.
3. **Avis comptés** : réponse à la question essentielle, visite de moins d'un mois (déjà la règle), établissement validé (pas `pending_review`).
4. **Organisme** (Senelec, Dem Dikk…) : une note regroupée (décision déjà prise), puis la liste de ses lieux avec leur résultat.

## 3. Où on le montre

- Une page par établissement : `/resultats/{établissement}`.
- Un lien « Voir les résultats » sur l'écran « Merci » (après l'avis, pour ne pas influencer la réponse).
- Plus tard : une page « Résultats » avec la même recherche que l'accueil, et le lien « Résultats par établissement » prévu dans la maquette d'accueil.

## 4. Ce qu'il faudra construire (après accord)

- **Migration 0007** : la vue `monthly_stats` ne garde aujourd'hui que la moyenne. Il faut y ajouter le nombre de chaque réponse (5 niveaux), les réponses « Oui / En partie / Non », et une vue des thèmes (nombre de « Bien » et « Pas bien »).
- La page de résultats, ses textes dans `fr.ts`, et ses tests.
- `CRON_SECRET` dans Vercel (le calcul de nuit est déjà en place).

## 5. Les deux propositions de design

- **A « Sur 10 usagers »** : dix visages (les mêmes qu'à l'écran 2) et une phrase « 7 usagers sur 10 sont satisfaits ». Fait pour le grand public, y compris les personnes peu à l'aise avec les chiffres. Peu de chiffres, beaucoup de phrases.
- **B « Le relevé »** : une fiche comme le ticket de l'accueil, tamponnée « Publié » avec la date. Pourcentages, tableaux, barres « Pas bien / Bien » de part et d'autre d'un axe. Plus complet, pour les responsables et les journalistes.
