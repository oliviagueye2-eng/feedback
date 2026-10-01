# HANDOFF

Document de passation pour reprendre le travail avec un contexte vierge.
Dernière mise à jour : 2026-10-01 (écran 7 « Merci », écrans 4-5 supprimés, doublon après rechargement, nettoyage nocturne, anonymat confirmé).

---

## Objectif

Construire une **plateforme nationale de satisfaction des usagers** au Sénégal : l'usager donne son avis sur un **établissement** (service public ou privé : mairie, hôpital, école, banque, hôtel, restaurant…), principalement en **scannant un QR code** affiché au guichet, sinon en cherchant l'établissement depuis la page d'accueil.

Priorités fixées par la porteuse du projet : **simplicité, accessibilité, rapidité, compréhension par un public très large** (téléphones Android d'entrée de gamme, 3G, personnes peu à l'aise à l'écrit).

Dépôt : `oliviagueye2-eng/feedback` (public), branche `main`. Tout le projet est dans ce dépôt.
Le dépôt `oliviagueye2-eng/allo-pro-sn` est un **autre projet**, sans rapport : ne rien y mettre.

---

## Façon de travailler avec l'utilisatrice

- Elle écrit en **français** ; répondre en français, simplement, sans jargon (expliquer avec un exemple concret quand elle dit « je n'ai pas compris »).
- **Tout ce qui est dans la base et le code est en anglais** (tables, colonnes, enums, codes) ; la documentation et l'interface sont en français.
- **Ne pas ajouter de fonctionnalités non demandées** : un micro et des boutons « Écouter » ajoutés de ma propre initiative ont été refusés puis retirés. Proposer, puis attendre son accord.
- Design : elle veut un rendu **institutionnel et original, qui ne « fasse pas IA »**. Le skill **frontend-design** est installé dans ses Compétences : le charger (outil Skill) avant tout travail d'interface. Résumé plus bas au cas où il manquerait.
- Elle valide pas à pas : présenter des options courtes avec une recommandation, puis appliquer. Pour un choix visuel, lui **montrer des captures côte à côte** (Playwright, puis une page HTML qui assemble les images) : elle tranche vite.
- Elle répond souvent en quelques mots (« A et C », « ok pour les deux ») : n'appliquer que ce qu'elle a validé explicitement, et redemander pour le reste.
- Textes : phrases courtes, mots de tous les jours, pas de barre oblique (« organisme ou établissement » plutôt que « organisme/établissement »), deux-points suivis d'une minuscule, « voulez-vous » plutôt que « souhaitez-vous ».
- L'environnement de session impose une branche de travail (`ccr-…` ou `claude/…`) : y committer et pousser, puis fusionner dans `main` seulement quand elle dit « merge dans main ». Terminer les messages de commit par les lignes `Co-Authored-By` / `Claude-Session` demandées par l'environnement.

---

## État actuel

### Maquettes (terminées pour la variante A)
- Canevas Claude Design : https://claude.ai/artifact/FChdnQZ6GhpK52ZJqFxwQ7 (copie des fichiers dans `maquettes/`, voir `maquettes/README.md`).
- **Variante A « minimaliste institutionnelle » retenue** (B, C, D gardées pour mémoire, non mises à jour).
- Identité : police **Atkinson Hyperlegible**, vert `#0B6B3A`, encre `#13261C`, fond `#F3F6F4`, bandeau tricolore du drapeau, logo (voir 4g). Sur le site, **toute la palette est nommée dans `app/globals.css`** (aucune couleur en dur ailleurs) ; le bandeau tricolore reprend les couleurs du logo (`#137A36`, `#FACC15`, `#CD1E22`).
- **Page d'accueil = ticket de file d'attente** « C'est votre tour. » (N° 047), **filigrane tricolore en diagonale dans le coin haut gauche** (option « 2b »). Encoches du ticket : vraies découpes (mask CSS) sur ordinateur ; sur téléphone, demi-cercles centrés sur la bordure (corrigé le 2026-09-30). Sur ordinateur, la recherche est dans le talon du ticket.
- Parcours A :
  ```
  Accueil ─► 0. Recherche ─► 0a. Autocomplétion ─┬─► 1. Établissement identifié
                                                 ├─► 0b. Aucun résultat ─► 0c. Non répertorié ─► 1
                                                 └─► 0c. Non répertorié ─► 1
  QR code ─────────────────────────────────────────► 1
  1 ─► 2. Question essentielle ─► 2b. Thèmes + texte libre ─┬─► 6. Questionnaire détaillé (s'il est publié) ─► 7. Merci
                                                           └─► 7. Merci
  (écrans 3 et 4-5 de la maquette supprimés : voir « Décisions fonctionnelles »)
  ```

### Décisions fonctionnelles (toutes validées)
- **Recherche centrée sur l'établissement.** Si l'usager tape un service (« état civil »), on propose les établissements qui l'offrent + encadré « Précisez l'établissement ». Jamais d'impasse : « Je ne trouve pas mon établissement » → saisie libre (seul le nom est obligatoire) → statut `pending_review`.
- **Une seule question essentielle** pour tous les secteurs : « Êtes-vous satisfait(e) du service reçu ? » (5 niveaux). « Démarche obtenue » (`GOAL_ACHIEVED`) est déplacée dans les questionnaires détaillés des secteurs où elle a du sens (pas pour un restaurant).
- Écran 2b : **cases à cocher** (pas de pastilles, pas de tuiles à pictogrammes : jugé « trop IA ») pour les thèmes ; titre adapté à la note (« Ce qui vous a plu » / « Ce qui aurait pu être mieux » / « Ce qui n'a pas été ») ; **« Autre » ouvre un champ court** (50 car.) pour nommer le thème ; puis **texte libre facultatif** dont le libellé dépend de la réponse (« Qu'est-ce qui vous a plu ? » / « Que s'est-il passé ? »). L'ancien écran commentaire de fin est supprimé.
- **« À quand remonte votre expérience ? »** (ex-« Quand êtes-vous venu(e) ? » ; aujourd'hui / moins d'une semaine / moins d'un mois / plus d'un mois), seulement hors QR code. On stocke un **mois de visite** calculé une fois pour toutes ; « plus d'un mois » est gardé mais exclu des notes publiées.
- **Pas de micro, pas de lecture audio, pas de photo** (photo notée en « évolution future »).
- **Anonymat** : aucune donnée personnelle, `started_at` et `completed_at` arrondis à l'heure. **Confirmé le 2026-10-01** : pas de connexion, pas de coordonnées obligatoires (moins d'avis, avis moins francs, fichier à déclarer à la CDP). Les risques juridiques passent par la modération, les limites anti-abus et des journaux techniques courts. Idée pour plus tard, non décidée : contact facultatif « Voulez-vous être recontacté(e) ? » (rangé à part, effacé après un délai ; qui rappelle ? à voir avec l'organisme porteur). À faire valider par un juriste : obligations d'hébergeur (loi 2008-08), conditions d'utilisation.
- **Pas d'écran de choix ni de notion d'enregistrement visible (2026-10-01)** : les écrans 4-5 (« Votre avis est enregistré », « Terminer » / « Continuer le questionnaire ») ont été construits puis **retirés à sa demande** : « pour l'usager la notion d'enregistrement ou de questionnaires différents ne doit pas être visible ». Après 2b, « Continuer » mène au questionnaire détaillé s'il en existe un publié pour l'avis (`countDetailedQuestions`), sinon l'avis est terminé (`completeFeedback`) et l'écran 7 s'affiche. Phrase « Une question, puis c'est enregistré. » retirée de l'écran 2. Conséquence : **chaque question détaillée devra être facultative** (on doit pouvoir passer).
- **Écran 7 (2026-10-01)** : `/donner/{id}/merci`, coche verte, « Merci pour votre participation », « Vos réponses aideront à améliorer ce service. » (article impossible à accorder avec les vrais noms), « Vous pouvez fermer cette page. » ; pas de lien « Voir les résultats » tant que la page n'existe pas. Un avis non terminé est renvoyé à l'écran 2b.
- **Écran 2b, option D (2026-09-30)** : « Comment ça s'est passé ? (choisissez seulement ce qui vous concerne) », puis pour **chaque thème deux boutons 👍 Bien / 👎 Pas bien** (on peut n'en toucher aucun ; toucher à nouveau annule), « Autre » ouvre « Précisez » ; puis « **Détail de votre expérience** (facultatif) », bouton **« Continuer »** (ex-« Enregistrer mon avis » : on est au milieu du parcours), « Modifier » en haut à droite de l'encadré de la réponse (comme « Changer » à l'écran 1), « ‹ Précédent » en bas (vers l'écran 2), texte d'aide « Décrivez votre expérience : les points positifs, les points négatifs, vos suggestions d'amélioration… ». Remplace les cases à cocher sous « Ce qui vous a plu / Ce qui n'a pas été » : une visite mitigée se dit. Les **libellés de relance** (« Que s'est-il passé ? »…) ne sont plus affichés (gardés dans la base). Les notes par thème (étoiles) ont été écartées : trop longues ; des notes fines iront dans le questionnaire détaillé.
- **Recherche** : « Quel établissement ou organisme voulez-vous évaluer ? » (on peut évaluer un organisme sans lieu : opérateur, Senelec) ; aide « Recherche par nom, type ou commune » ; pas de titre au-dessus des résultats ; lien « Je ne le trouve pas dans la liste » / « Le saisir moi-même » ; sous le nom : commune puis secteur, **plus de « En général »** (un organisme dans son ensemble n'affiche que son secteur) ; plus de bouton « Rechercher » quand JavaScript fonctionne (Entrée marche) ; lien « ‹ Retour à l'accueil » sous l'encadré ; logo et nom de l'en-tête cliquables vers l'accueil.
- **Écran 1 (2026-10-01)** : mêmes textes pour un lieu et un organisme : lien « Changer » **en haut à droite** de l'encadré (sur la ligne « Vous évaluez »), « Sur quoi porte votre avis ? », « À quand remonte votre expérience ? », bouton **« Commencer »**, lien « ‹ Retour à l'accueil » en bas (choisi plutôt qu'une flèche en haut ; « Retour » et « Commencer » côte à côte déconseillés). Les messages d'erreur sont ceux du site, plus la bulle du navigateur (`app/_components/FormValidation.tsx`, aussi sur l'écran 0c) : **texte rouge gras de 14 px, collé sous le titre de la question**, sans encadré ni trait dans la marge (encadré rose et trait rouge essayés puis refusés).
- **Écran 2 (2026-10-01)** : lien « ‹ Précédent » en bas, qui ramène à l'écran 1 **du même avis** (`?avis={id}` sur `/avis/{établissement}` ou `/e/{code}` : date et motif pré-cochés, « Commencer » met à jour le même avis ; `findFeedbackToResume`, `app/(public)/_feedback/links.ts`). Le logo de l'en-tête des écrans 2 et suivants mène à l'accueil. Enregistrement d'un avis : créé à l'écran 1 (« Commencer »), réponse essentielle enregistrée dès le toucher à l'écran 2 (c'est elle qui compte), thèmes et commentaire ajoutés à l'écran 2b.
- **Saisie d'un établissement (0c)** : titre « Ajouter un organisme ou un établissement à évaluer », « Nom (minimum 3 lettres) » (**3 lettres au moins**, vérifié aussi côté serveur), « Localité ou quartier » (exemple « Dakar, Médina » : le quartier doit être dans la localité), « Il sera ajouté à la liste après validation. Votre avis compte dès maintenant. », bouton « Continuer avec « nom tapé » » (coupé après 30 caractères).
- **Accueil, textes** : accroche du ticket « Vous avez utilisé un service, public ou privé ? Dites-nous comment ça s'est passé. Ensemble, pour un Sénégal qui progresse. » (« qui change » écarté : *Sopi*, slogan politique) ; section « Un geste citoyen : donner son avis, c'est faire entendre la voix des usagers. » avec **Écouter / Comprendre / Améliorer** (cycle retenu, résumé de la taxonomie de Bloom) ; « Comment ça marche » : 1. « Trouvez l'établissement ou l'organisme à évaluer. » 3. « Votre avis est enregistré. C'est terminé ! » ; pied de page : « Une plateforme au service de la transparence et de la bonne gouvernance. »
- **Mis de côté pour une future page « À propos »** : la devise « Jub, Jubbal, Jubanti » (prudence : devise du programme du gouvernement actuel, à valider avec l'organisme porteur ; traductions à faire valider par un locuteur wolof) et la version Bloom en 6 étapes. Ne pas reprendre le slogan d'un produit anglais qu'elle avait collé (« Hear every citizen. Improve every service. »).

### Documentation
- `docs/architecture-base-de-donnees.md` : modèle complet (source de vérité fonctionnelle ; en cas d'écart, les migrations font foi).
- `docs/architecture-technique.md` : Next.js SSR, API REST `/webapi/`, organisation du code, hébergement, **textes et traductions**.
- `docs/processus-recolte-avis.md` : **canevas de la récolte d'un avis** selon la taxonomie de Bloom (étapes, question, obligatoire, écran, donnée, état), fiche d'un avis, pourquoi la satisfaction vient avant les thèmes, décisions en attente.
- `README.md` : démarrage, commandes, organisation, mise en ligne Vercel + Neon.

### Code (Next.js 16, TypeScript)
- Organisation (« voie intermédiaire ») :
  - `app/` = Next.js (pages `(public)`, `(admin)`, routes REST minces `app/webapi/`).
  - `src/domain/` = règles métier, **interdiction d'importer Next.js/React** (règle ESLint `no-restricted-imports`).
  - `src/db/` = accès PostgreSQL + `migrations/`.
  - `src/lib/` = utilitaires (normalisation de texte, validation).
  - `app/_i18n/` = **tous les textes de l'interface** dans `fr.ts`, rangés par écran (aucun texte en dur dans les pages). `getDictionary()` dans les composants serveur ; les composants client reçoivent leurs textes en props. Espaces insécables ajoutées au chargement du français ; `fill` ({nom}), `rich` (<b>, <a>), `plural` ({ one, other }). Méthode « dictionnaires » de la doc Next.js, sans bibliothèque (choix validé). Langue fixe `fr` : pas encore de choix de langue (adresse `/wo/…` ou réglage : non décidé).
- Pages : `/` (accueil ticket + écran d'ouverture à la 1re visite), `/avis` (recherche, fonctionne sans JS), `/avis/nouveau` (0c), `/avis/[id]` et `/e/[code]` (écran 1), `/donner/[id]` (écran 2), `/donner/[id]/precisions` (écran 2b), `/donner/[id]/questionnaire` (écran 6), `/donner/[id]/merci` (écran 7), `/admin` (vide).
- Routes `/webapi/` : qr, establishments (GET recherche, POST saisie usager), establishments/[id], stats, feedbacks/[id] (PUT), answers/[questionCode], topics, comment, questionnaire, internal/refresh-stats (cron).
- Tout est **câblé de bout en bout** et **les requêtes `src/db/` sont écrites** (2026-09-29) : recherche (trigrammes `<%` / `word_similarity` sur nom + alias, services → établissements, commune tapée → établissements de la commune en tête, `matchType = service` quand le service correspond au moins aussi bien qu'un nom), fiche établissement (un établissement fusionné mène à son remplaçant ; seuls `active` et `pending_review` acceptent des avis), QR code (actif et établissement actif), saisie usager (`pending_review`), statistiques publiées (services additionnés, seuil 10), avis (ré-envoi idempotent ; `visit_month` ne change que si la réponse « Quand êtes-vous venu(e) ? » change), réponses (question cherchée dans ESSENTIAL puis dans le questionnaire détaillé choisi ; la première réponse détaillée enregistre `detailed_questionnaire_id`), thèmes (remplacement en une instruction), commentaire (modifié → repasse en modération).
- `src/db/client.ts` : fonction `query()` unique ; erreurs PostgreSQL de clé étrangère / identifiant invalide traduites en 400/404 ; `useTestDatabase()` branche PGlite dans les tests.
- Pas encore fait : `search_log` n'est pas alimenté.
- **Logos des organismes** (mécanisme prêt, aucun logo) : fichier `public/logos/{code en minuscules avec tirets}.svg` (SENELEC → `senelec.svg`), liste `ORGANIZATIONS_WITH_LOGO` dans `app/_components/organizationLogo.ts` (un test vérifie fichier présent et < 10 Ko), aucune colonne en base ; affiché dans les résultats et sur l'écran 1, pour l'organisme et ses agences. **Vérifier l'accord des organismes** avant de publier un logo.
- Règles métier écrites et testées : mois de visite, choix du questionnaire (service → secteur → GENERIC), validation des thèmes/« Autre », normalisation de texte alignée sur `unaccent()` SQL (ligatures œ/æ incluses), SSL strict.
- **98 tests Vitest** (2026-10-01), dont `src/db/queries.test.ts` (requêtes testées de bout en bout via `src/domain`) et un test qui applique les vraies migrations sur un PostgreSQL en mémoire (**PGlite**, avec `pg_trgm` et `unaccent`).

### Base de données
- `src/db/migrations/0001_schema.sql` : toutes les tables, contraintes CHECK (enums en `text` + CHECK), triggers `search_text` (établissement : nom + alias ; service : libellé FR + synonymes), index trigrammes, vue matérialisée `monthly_stats` (suit les fusions, exclut `over_month`).
- `src/db/migrations/0002_reference_data.sql` : 18 secteurs (19 depuis 0008 : `UTILITIES` devenu `ELECTRICITY`, plus `WATER`), 9 thèmes (revus par 0010), questionnaire ESSENTIAL (question + 5 options + libellés de relance), GENERIC en brouillon.
- Migrations suivantes, **appliquées sur Neon jusqu'à 0012** (0013 au prochain build de production) : 0003 secteur de l'établissement, 0004 premiers établissements réels, 0005-0006 organismes, 0007 mots ignorés de la recherche, 0008 Eau / Électricité, 0009 « hôtel de ville » = « mairie », 0010 thèmes par secteur (voir 4j), **0011 `feedback_topic.sentiment`** (`positive` / `negative`, obligatoire ; les anciens thèmes ont reçu le sens qu'ils avaient à l'écran), **0012 questionnaire santé**, **0013 une table de traduction par table** (`sector_translation`, `establishment_type_translation`, `service_translation`, `topic_translation`, `question_translation`, `answer_option_translation` avec `follow_up_prompt` ; clé étrangère + `ON DELETE CASCADE`, clé `(élément, langue)` ; l'ancienne table polymorphe `translation` est supprimée : **les nouvelles migrations doivent écrire dans ces tables**).
- Choix de modèle : alias = colonne `establishment.aliases text[]` (pas de table), synonymes = `service.synonyms text[]` ; public/privé = `establishment.ownership` (pas un secteur) ; statuts d'établissement `active/pending_review/rejected/merged/closed`.
- `npm run db:migrate` (`scripts/migrate.mjs`) : une transaction par fichier, table `schema_migration`, verrou advisory, connexion directe `DATABASE_URL_UNPOOLED` si présente, conversion `sslmode=require` → `verify-full`.

### Hébergement (prototype en ligne)
- **Vercel** (dépôt connecté, région `fra1`) + **Neon** (projet `floral-credit-39387239`, région Frankfurt, PostgreSQL 17 conseillé). Variables `DATABASE_URL` (poolée) et `DATABASE_URL_UNPOOLED` (directe) configurées en « Secret ».
- Les migrations tournent au build de **production** uniquement (`npm run vercel-build`) ; les migrations **0001 à 0011 sont appliquées sur Neon** (dernier déploiement : commit `b0d6a04`, 2026-10-01, questionnaire santé, statut Vercel « success »).
- `vercel.json` : cron quotidien 2 h UTC sur `/webapi/internal/refresh-stats`.
- Production nationale : hébergement souverain au Sénégal ou cloud européen, en conteneur (non fait).

---

## Ce qui a marché

- Proposer 3 à 5 options courtes avec une recommandation, puis appliquer le choix.
- Ancrer le design dans le sujet (ticket de file d'attente, formulaire administratif à cases à cocher) plutôt que des motifs génériques.
- Lire la doc Next.js embarquée (`node_modules/next/dist/docs/`) : la version 16 diffère (`params`/`searchParams` sont des Promise, helpers globaux `PageProps`, `LayoutProps`, `RouteContext` générés par `next typegen`).
- Maquette sur le canevas **avant** de coder un choix visuel (loader, écran d'ouverture, réponses) : elle compare et tranche vite.
- Tester la migration sur un **vrai PostgreSQL 16 local** (binaires dans `/usr/lib/postgresql/16/bin`) et en continu avec **PGlite**.
- Vérifier chaque correctif par un test de contrôle (ex. avertissement SSL présent sans correctif, absent avec).

## Ce qui n'a pas marché (à ne pas refaire)

- **Neon CLI** (`neon login`, `neon link`, `neon deploy`…) : bloqué. Le réseau de l'environnement cloud refuse `*.neon.tech` (403 au proxy) et la connexion par navigateur est impossible depuis un conteneur. Il faudrait autoriser `*.neon.tech` dans les réglages réseau de l'environnement et fournir `NEON_API_KEY` comme variable d'environnement (jamais dans le chat). Ces étapes ne sont **pas nécessaires** au prototype.
- **PostgreSQL local** dans le scratchpad : l'environnement remet régulièrement les droits de `/tmp/claude-0` à `700`, ce qui arrête le serveur. Remède : `chmod o+x` sur chaque dossier parent, supprimer les fichiers `.s.PGSQL.5499*`, relancer `pg_ctl` en tant que `postgres` (initdb refuse root). Ne pas pousser un commit sans avoir relancé les tests si le serveur est tombé.
- `vitest` avec `@types/node@20` : conflit de dépendances → utiliser `@types/node@^22` (Node 22 est l'environnement).
- Empiler des migrations correctives (0003, 0004) avant tout déploiement : l'utilisatrice préfère modifier directement 0001/0002 tant que la base n'est déployée nulle part.
- Éléments de design refusés : fond vert franc derrière le ticket, fond « registre », tuiles à pictogrammes, pastilles, micro/audio.
- Modifier un fichier qu'elle fournit (vidéo, image) : **partir de son fichier et ne changer que ce qu'elle demande**. Trois essais ratés sur la vidéo du loader (animation refaite, mauvaise lettre retirée) avant de comprendre.
- `next/script` `beforeInteractive` avec un script **inline** : Next le met en file d'attente, il ne s'exécute **pas avant le premier affichage** → utiliser un `<script>` simple dans le `<head>` du layout racine. (L'avertissement React « Encountered a script tag » n'apparaît en dev qu'après une erreur 500, quand React reconstruit la page.)
- Modules CSS : une classe globale comme `.muted` doit s'écrire `:global(.muted)`, sinon la règle ne s'applique pas (corrigé le 2026-09-30).
- `pkill -f "next dev"` dans une commande qui contient elle-même ce texte tue le shell : arrêter le serveur dans une commande séparée.
- PostgreSQL local dans le scratchpad : s'arrête sans cesse (droits remis à 700). **Remède adopté** : données copiées dans `/opt/pgtest/data` (propriétaire `postgres`), socket dans `/var/run/postgresql`, serveur lancé avec l'outil Bash en `run_in_background` (timeout 7 200 000 ms) : `su postgres -c "/usr/lib/postgresql/16/bin/postgres -D /opt/pgtest/data -p 5499 -k /var/run/postgresql"` (supprimer `postmaster.pid` s'il reste). Le serveur `next dev` aussi en `run_in_background`. Tous deux s'arrêtent au bout de la limite de temps : les relancer. `/opt` ne survit pas à un nouveau conteneur : refaire `initdb` + `npm run db:migrate` si besoin.
- Changer un texte vérifié par un test (`app/_i18n/i18n.test.tsx`) sans relancer les tests : un commit rouge est parti le 2026-09-30, corrigé aussitôt. Toujours `npm test` avant de pousser.
- Elle avait écrit « Autres référence » sans pièce jointe : ne pas deviner, redemander.

---

## Prochaines étapes

⚠️ **La base Neon a maintenant reçu les migrations.** La règle documentée devient applicable : toute modification du schéma ou des données de référence doit passer par une **nouvelle migration** (`0003_…`), **sauf** si l'utilisatrice accepte de **réinitialiser la base Neon** (prototype sans données réelles) pour continuer à éditer 0001/0002. **Lui demander avant** de toucher aux migrations.

1. **Valider la liste des types d'établissement** (proposée : ~80 types sur les 18 secteurs ; Hôtellerie et Immobilier déjà discutés). Suggestion : commencer par les secteurs prioritaires (Santé, Administration, Éducation). Décisions en attente : daara en Éducation, pharmacie en Santé, mobile money en Télécoms, domaines/cadastre en Impôts, notaire en Justice, catégorie en étoiles pour les hôtels (colonne facultative).
2. ~~Écrire les requêtes `src/db/`~~ : fait le 2026-09-29 (branche `claude/serene-volta-82647w`, l'environnement de session impose cette branche ; la fusionner dans `main` quand elle le demande).
3. ~~Premiers établissements~~ : fait le 2026-09-29. **Elle veut de vraies données, pas de « démo »** : migration `0004_registry_first_establishments.sql`, 19 établissements publics **réels** vérifiés sur des sources publiques (commune laissée vide si incertaine ; Le Dantec exclu car fermé jusqu'en avril 2027) ; service `CIVIL_REGISTRY` (« État civil ») rattaché aux 4 mairies de commune ; codes de territoire ISO 3166-2 (`SN-DK`…) à réutiliser lors de l'import officiel.
4. **Écrans du parcours** dans l'application. Faits le 2026-09-29 : page d'accueil alignée sur la maquette (ordinateur et mobile), écrans de recherche 0, 0a, 0b, 0c (comportement dans `docs/parcours-recherche.md`), première version de l'écran 1 (`/avis/{id}`, affiche l'établissement). Reste : écran 1 complet (motif = liste des services, « Quand êtes-vous venu(e) ? »), 2, 2b, 3-5, 6, 7 ; arrivée par QR code (`/e/{code}`) ; file d'envoi hors connexion (service worker + IndexedDB, identifiant d'avis généré par le téléphone, `PUT` idempotents).
   - Éléments de la maquette d'accueil **volontairement absents** tant que leur destination n'existe pas : lien « Résultats par établissement », bouton de langue, section « Ce que vos avis ont changé », « Plateforme opérée par [...] » et liens du pied de page.
   - Migration **`0003_establishment_sector.sql`** (colonne `establishment.sector_id`, accord de l'utilisatrice) : appliquée sur Neon au prochain build de **production**, c'est-à-dire après fusion dans `main`.
4b. **Organismes** : migrations **`0005_organization.sql`** (table `organization` avec `name` usuel et `full_name` officiel ; colonnes `establishment.organization_id` et `scope` = `site`/`general` ; un seul « en général » par organisme, pas de QR code dessus) et **`0006_organizations.sql`** (11 organismes validés : Senelec, Sen'Eau, Orange, Yas, Expresso, La Poste en Télécoms, IPRES, DGID, CBAO, UBA, Société Générale ; chacun avec son établissement « en général », alias = nom complet, sigles, anciens noms). Décision : **note globale regroupée**. Reste : **agences réelles**, organisme par organisme, à partir des listes qu'ils publient ; sujets « en général » (coupures, facture, Woyofal…) ; écran 1 « Quand est-ce arrivé ? ». Société Générale Sénégal : rachat par l'État en cours, le nom peut changer.
4c. **Retours sur la version en ligne (2026-09-29)** : recherche à partir de 3 lettres, début de mot seulement à 3-4 lettres, fautes tolérées à partir de 5 ; « Sénégal » ignoré (migration **`0007_search_stop_words.sql`**, fonction `search_terms`, alignée sur `toSearchTerms` de `src/lib/text.ts`) ; nom affiché avant alias ; **refusé** : afficher « Aussi appelé : … » sous le nom ; transition animée du champ vers le haut (option A).
4d. **Secteurs** : « Eau et électricité » séparé en **Électricité** (`ELECTRICITY`, ancien `UTILITIES`) et **Eau** (`WATER`) — migration **`0008_split_water_electricity.sql`**, 19 secteurs. Écran 1 : « Ce n'est pas le bon organisme ? » pour un établissement « en général ». Recherche limitée à 8 résultats (3 suggestions).
4e. **Recherche** : « hôtel de ville » = « mairie » (migration **`0009_search_equivalents.sql`**, `SEARCH_EQUIVALENTS`) ; avec une commune tapée, les autres mots doivent correspondre (« mairie grand yoff » ne donne plus l'hôpital de Grand Yoff, qui passait de justesse à 61 % pour un seuil de 60 %) ; **seuls les résultats de la commune tapée** sont affichés quand il y en a (elle trouvait inutile la liste des autres mairies). Accueil : `next/form` pour éviter le flash blanc vers `/avis`. Transition du champ ralentie à 0,45 s (0,24 s jugé trop rapide).
4f. **Écran 1 complet** (2026-09-29) : composant partagé `app/(public)/_feedback/EstablishmentScreen.tsx`, action `startFeedback` (formulaire sans JavaScript), `/avis/{id}` et `/e/{code}` (QR) ; motif facultatif, date obligatoire sans présélection (choix par défaut à confirmer avec elle) ; `/donner/{feedbackId}` = page d'attente des écrans 2 à 7. Règle métier ajoutée : `visitPeriod` obligatoire hors QR code.
4g. **Logo et photo (2026-09-30)** : logo fourni en image, vectorisé (voir README « Logo et icônes ») ; symbole seul, sans le texte « JubFeedback » (à sa demande) ; en-tête, pied de page (blanc), favicon, icône Apple. Accueil : photo du BRT en bandeau (téléphone) / moitié droite (ordinateur), variante 1 retenue sur le canevas ; les tickets 045/046 sont retirés. **Crédit de la photo inconnu** (aucune métadonnée ; recherche d'image inversée conseillée) : publiée quand même sur le prototype, à sa demande. Le logo est une **image générée par IA** (métadonnée « Made with Google AI » dans un fichier qu'elle a ajouté, supprimé depuis car c'était un PNG de 1 Mo dans une enveloppe SVG) : pas de source vectorielle, conseiller de le faire redessiner par un graphiste avant adoption officielle. Versions : à plat (site), blanche (pied de page), avec dégradés (grands formats, `logo-degrade*`) ; version réduite supprimée (inutile). Recommandation acceptée : à plat sur le site.
4h. **Écran 2** (2026-09-30) : `/donner/{id}`, question essentielle, un toucher = enregistré (action `answerEssential`), `EssentialOptions` (état d'envoi via `useFormStatus`), en-tête `FeedbackHeader` ; `/donner/{id}/precisions` = attente de l'écran 2b. Espaces insécables avant ? ! : ; pour les textes de la base (`frenchSpaces`).
4i. **Animations, palette, réponses (2026-09-30)** :
   - Vidéo du loader : fichier MP4 fourni par elle, **seule la lettre ظ (et son losange) retirée**, le reste intact (son compris). Le logo contient un **ج** (losange dessous obligatoire) ; un autre logo proposé plus tard (lettre ح) a été écarté.
   - **Loader** (option « logo fixe + barre tricolore », `app/_components/Loader.tsx`, `PendingLoader.tsx`) : s'affiche après 0,3 s pendant les envois de formulaires et la 1re recherche ; pas de `loading.tsx` (ramènerait le flash blanc).
   - **Écran d'ouverture** (option 2, `app/(public)/_intro/`) : logo qui se construit + nom, 2,2 s, bouton « Passer » ; 1re visite de l'accueil seulement (`localStorage` `avis-intro-vue`), jamais par QR, jamais avec animations réduites. Déclenché par un **script inline dans le `<head>` du layout racine** (`introScript.ts`).
   - **Écran 2, version C** : visages dessinés (`SatisfactionFace.tsx`) et couleurs du vert au rouge (`--satisfaction-1..5`), la réponse choisie prend sa couleur. Elle a choisi C malgré ma recommandation B (couleur unique).
   - Planches ajoutées au canevas : `A-loader`, `A-premiere-visite`, `A-reponses-satisfaction`.
4j. **Thèmes et écran 2b (2026-09-30)** :
   - Migration **0010** : 10 thèmes communs + 19 thèmes de secteur (liste complète dans `docs/architecture-base-de-donnees.md`) ; Prix, Accessibilité, Sécurité, Qualité du service **désactivés**. **Règle de `topic_sector`** : un thème sans ligne est commun ; avec des lignes, seulement dans ces secteurs. Secteur de l'avis = celui du motif, sinon du type, sinon de l'établissement.
   - **Écran 2b** (`/donner/{id}/precisions`, action `saveDetails`) : titre « Ce qui vous a plu » (très satisfait / satisfait) ou « Ce qui n'a pas été » (autres) ; « Autre » ouvre un champ (`:has()`) ; commentaire facultatif sous le libellé de relance ; tout facultatif, un seul bouton « Enregistrer mon avis » ; au retour, choix pré-remplis ; thème d'un autre secteur ignoré sans erreur (2026-10-01, auparavant refusé) ; commentaire vidé supprimé.
4k. **Écran 6 et questionnaire santé (2026-10-01)** : migration **0012** (questionnaire `HEALTH` publié, 5 questions validées, repli du secteur Santé ; liste dans `docs/processus-recolte-avis.md`). Écran 6 `/donner/{id}/questionnaire` : toutes les questions sur **une page** (son choix), réponses en tuiles comme à l'écran 1 (deux par ligne, la dernière impaire sur toute la largeur ; **3 réponses côte à côte sur une ligne**, choisi sur captures), aide « Répondez seulement à ce qui vous concerne. », « Continuer » enregistre ce qui est répondu (`saveQuestionnaire`), termine l'avis et mène à l'écran 7 ; « ‹ Précédent » vers 2b. Refusés : question de proposition en texte libre (A), une question par écran (B), « payer en dehors de la caisse » (C). **Prochaine étape** : questionnaires administration et éducation, puis file d'envoi hors connexion.
4l. **Session du 2026-09-30 (soir)**, fusionnée dans `main` (`ab5cae8`) : corrections du parcours et textes (voir « Décisions fonctionnelles »), dictionnaire `fr.ts`, écran 2b option D + migration 0011, mécanisme des logos, canevas Bloom (`docs/processus-recolte-avis.md`). **Décisions en attente** :
   - étape 9 du canevas (niveau « Créer ») : ajouter une question de proposition à la fin des questionnaires détaillés (ex. « Qu'est-ce qui aurait rendu votre visite plus simple ? ») ;
   - rédiger les questionnaires détaillés (étapes 7-8 : `GOAL_ACHIEVED`, faits mesurables, notes fines sur 3-4 thèmes du secteur), en commençant par santé, administration, éducation ;
   - seuil de publication (10 avis par mois et par établissement ?) ;
   - accord des organismes pour leurs logos ;
   - page « À propos » (devise Jub Jubbal Jubanti, version Bloom en 6 étapes, bonne gouvernance développée) ;
   - langues au lancement et manière de retenir la langue choisie.
4m. **Faits le 2026-10-01 (anciens TODO)** :
   - **Doublon après rechargement de l'écran 1** : `ResumeFeedback.tsx` garde le numéro de l'avis envoyé depuis l'écran 1 dans `sessionStorage` (`avis-en-cours:{établissement}`) ; à un nouvel affichage, l'écran 1 se rouvre avec `?avis=` et met à jour le même avis. Un avis terminé n'est jamais repris (`findFeedbackToResume`) : une nouvelle visite après « Merci » crée un nouvel avis. Vérifié dans le navigateur (retour + rechargement + « Commencer » = un seul avis).
   - **Nettoyage nocturne** : le cron `/webapi/internal/refresh-stats` supprime d'abord les avis commencés depuis plus de 7 jours sans réponse à la question essentielle (`ABANDONED_FEEDBACK_DAYS`, `deleteAbandonedFeedbacks`), puis recalcule les statistiques.
   - **Erreur générale de l'écran 2b** : même style que les autres messages (texte rouge gras de 14 px, sans encadré) ; couleurs `--error-tint` / `--error-ink` retirées. Un thème qui ne correspond plus à l'avis (ancienne page 2b revenue par le bouton retour après un changement de motif, thème désactivé) est **ignoré sans erreur**, le reste est gardé : le message ne reste que pour un texte trop long ou un envoi trafiqué. Nouveau texte : « Une réponse n'a pas été acceptée. Vérifiez vos réponses, puis appuyez de nouveau sur « Continuer ». » Une coupure réseau à l'envoi donne encore la page d'erreur du navigateur : c'est la file d'envoi hors connexion qui la réglera.
5. **Plus tard / à noter** : *nice to have* : journal des recherches (`search_log`, une ligne quand l'usager choisit ou saisit un établissement, jamais à chaque lettre) ; ajouter `CRON_SECRET` dans Vercel (noté dans le README) ; questions du questionnaire GENERIC ; import du territoire et du référentiel (sources : ministères, ANSD, OpenStreetMap sous ODbL) ; back-office et authentification des agents ; versionnement `/webapi/v1` ; décision d'hébergement de production (obligation d'hébergement au Sénégal ? loi 2008-12, CDP).

---

## Skills disponibles dans les sessions cloud

Vérifié le 2026-09-29 (outils `ListSkills` / `ListPlugins` et dossier `~/.claude/skills/synced/`) :
- **Arrivent dans la session** : les skills d'Anthropic (pdf, docx, xlsx, pptx, docs, skill-creator, deep-research…) et les skills **importés par l'utilisatrice elle-même** dans Compétences (« Les vôtres »), comme **frontend-design**, même ajoutés en cours de session.
- **N'arrivent pas** : les 38 skills « Depuis les marketplaces que vous avez ajoutées » (Mattpocock skills : handoff, grill-me, teach… ; Andrej Karpathy skills) et les **plugins** (`ListPlugins` vide, dossier `~/.claude/plugins/synced/` vide), y compris **claude-handoff** (Anthropic Directory, activé). Les plugins ne sont peut-être chargés qu'au démarrage : **à vérifier en début de nouvelle session** (lister skills et plugins, le lui dire).
- Contournement expliqué et validé pour frontend-design : télécharger le skill (bouton ⤓), puis Compétences → **+ Ajouter** → importer le `.zip`.
- claude-handoff dépend de Claude Code CLI et Python 3 (hooks) : conçu pour un usage local, peu utile ici. Pour une passation, elle demande « fais un handoff » → mettre à jour ce fichier.

---

## Commandes utiles

```bash
npm install
npm run dev            # http://localhost:3000
npm run lint           # inclut la règle d'indépendance de src/
npm run typecheck      # next typegen && tsc --noEmit
npm test               # Vitest + migrations sur PGlite
npm run build
npm run db:migrate     # DATABASE_URL / DATABASE_URL_UNPOOLED
```

Base locale de test (scratchpad, port 5499, base `reg`) : voir « Ce qui n'a pas marché » pour la relancer ; serveur : `DATABASE_URL=postgres://postgres@localhost:5499/reg npx next dev -p 3100`. Tests navigateur : Playwright avec `executablePath: "/opt/pw-browsers/chromium"`.

**Fusion dans `main`** : seulement quand elle le dit (« merge dans main ») ; vérifier que c'est une avance rapide, lancer tests + `npm run build`, puis `git push origin HEAD:main` et suivre le statut « Vercel » du commit (`https://api.github.com/repos/oliviagueye2-eng/feedback/commits/<sha>/status`).

## Rappel du skill « frontend-design » (installé dans ses Compétences)

Ancrer le design dans le sujet ; une typographie choisie (pas les polices par défaut) ; un seul élément marquant, le reste sobre ; la structure visuelle doit porter de l'information (numérotation seulement pour une vraie séquence). Éviter : fond crème `#F4F1EA` avec accent terracotta, kit de cartes identiques avec ombre douce, dégradés décoratifs, libellés en MAJUSCULES espacées, textes « A · B · C », « → » dans les boutons, police monospace pour les petits libellés, mot unique mis en valeur dans un titre. Textes : du point de vue de l'usager, boutons qui disent ce qui se passe, même mot tout au long du parcours. Qualité minimale : focus visible, contraste, cibles tactiles ≥ 44 px.
