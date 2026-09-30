# HANDOFF

Document de passation pour reprendre le travail avec un contexte vierge.
Dernière mise à jour : 2026-09-29.

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
- Elle valide pas à pas : présenter des options courtes avec une recommandation, puis appliquer.
- Commits directement sur `main` (dépôt créé vide par elle ; aucune branche imposée). Terminer les messages de commit par les lignes `Co-Authored-By` / `Claude-Session` demandées par l'environnement.

---

## État actuel

### Maquettes (terminées pour la variante A)
- Canevas Claude Design : https://claude.ai/artifact/FChdnQZ6GhpK52ZJqFxwQ7 (copie des fichiers dans `maquettes/`, voir `maquettes/README.md`).
- **Variante A « minimaliste institutionnelle » retenue** (B, C, D gardées pour mémoire, non mises à jour).
- Identité : police **Atkinson Hyperlegible**, vert `#0B6B3A`, encre `#13261C`, fond `#F3F6F4`, bandeau tricolore du drapeau, emblème étoile.
- **Page d'accueil = ticket de file d'attente** « C'est votre tour. » (N° 047), fond clair avec tickets N° 045/046 qui dépassent derrière et **filigrane tricolore en diagonale dans le coin haut gauche** (option « 2b »). Encoches du ticket = vraies découpes (mask CSS) + demi-cercles qui redessinent la bordure. Versions mobile et ordinateur. Sur ordinateur, la recherche est dans le talon du ticket.
- Parcours A :
  ```
  Accueil ─► 0. Recherche ─► 0a. Autocomplétion ─┬─► 1. Établissement identifié
                                                 ├─► 0b. Aucun résultat ─► 0c. Non répertorié ─► 1
                                                 └─► 0c. Non répertorié ─► 1
  QR code ─────────────────────────────────────────► 1
  1 ─► 2. Question essentielle ─► 2b. Thèmes + texte libre ─► 3. Enregistrement
    ─► 4-5. Confirmation + Terminer/Continuer ─► 6. Questionnaire détaillé ─► 7. Merci
  ```

### Décisions fonctionnelles (toutes validées)
- **Recherche centrée sur l'établissement.** Si l'usager tape un service (« état civil »), on propose les établissements qui l'offrent + encadré « Précisez l'établissement ». Jamais d'impasse : « Je ne trouve pas mon établissement » → saisie libre (seul le nom est obligatoire) → statut `pending_review`.
- **Une seule question essentielle** pour tous les secteurs : « Êtes-vous satisfait(e) du service reçu ? » (5 niveaux). « Démarche obtenue » (`GOAL_ACHIEVED`) est déplacée dans les questionnaires détaillés des secteurs où elle a du sens (pas pour un restaurant).
- Écran 2b : **cases à cocher** (pas de pastilles, pas de tuiles à pictogrammes : jugé « trop IA ») pour les thèmes ; titre adapté à la note (« Ce qui vous a plu » / « Ce qui aurait pu être mieux » / « Ce qui n'a pas été ») ; **« Autre » ouvre un champ court** (50 car.) pour nommer le thème ; puis **texte libre facultatif** dont le libellé dépend de la réponse (« Qu'est-ce qui vous a plu ? » / « Que s'est-il passé ? »). L'ancien écran commentaire de fin est supprimé.
- **« Quand êtes-vous venu(e) ? »** (aujourd'hui / moins d'une semaine / moins d'un mois / plus d'un mois), seulement hors QR code. On stocke un **mois de visite** calculé une fois pour toutes ; « plus d'un mois » est gardé mais exclu des notes publiées.
- **Pas de micro, pas de lecture audio, pas de photo** (photo notée en « évolution future »).
- **Anonymat** : aucune donnée personnelle, `started_at` arrondi à l'heure.

### Documentation
- `docs/architecture-base-de-donnees.md` : modèle complet (source de vérité fonctionnelle ; en cas d'écart, les migrations font foi).
- `docs/architecture-technique.md` : Next.js SSR, API REST `/webapi/`, organisation du code, hébergement.
- `README.md` : démarrage, commandes, organisation, mise en ligne Vercel + Neon.

### Code (Next.js 16, TypeScript)
- Organisation (« voie intermédiaire ») :
  - `app/` = Next.js (pages `(public)`, `(admin)`, routes REST minces `app/webapi/`).
  - `src/domain/` = règles métier, **interdiction d'importer Next.js/React** (règle ESLint `no-restricted-imports`).
  - `src/db/` = accès PostgreSQL + `migrations/`.
  - `src/lib/` = utilitaires (normalisation de texte, validation).
- Pages : `/` (accueil ticket), `/avis` (recherche, fonctionne sans JS), `/e/[code]` (arrivée QR, squelette), `/admin` (vide).
- Routes `/webapi/` : qr, establishments (GET recherche, POST saisie usager), establishments/[id], stats, feedbacks/[id] (PUT), answers/[questionCode], topics, comment, questionnaire, internal/refresh-stats (cron).
- Tout est **câblé de bout en bout** et **les requêtes `src/db/` sont écrites** (2026-09-29) : recherche (trigrammes `<%` / `word_similarity` sur nom + alias, services → établissements, commune tapée → établissements de la commune en tête, `matchType = service` quand le service correspond au moins aussi bien qu'un nom), fiche établissement (un établissement fusionné mène à son remplaçant ; seuls `active` et `pending_review` acceptent des avis), QR code (actif et établissement actif), saisie usager (`pending_review`), statistiques publiées (services additionnés, seuil 10), avis (ré-envoi idempotent ; `visit_month` ne change que si la réponse « Quand êtes-vous venu(e) ? » change), réponses (question cherchée dans ESSENTIAL puis dans le questionnaire détaillé choisi ; la première réponse détaillée enregistre `detailed_questionnaire_id`), thèmes (remplacement en une instruction), commentaire (modifié → repasse en modération).
- `src/db/client.ts` : fonction `query()` unique ; erreurs PostgreSQL de clé étrangère / identifiant invalide traduites en 400/404 ; `useTestDatabase()` branche PGlite dans les tests.
- Pas encore fait : `search_log` n'est pas alimenté.
- Règles métier écrites et testées : mois de visite, choix du questionnaire (service → secteur → GENERIC), validation des thèmes/« Autre », normalisation de texte alignée sur `unaccent()` SQL (ligatures œ/æ incluses), SSL strict.
- **50 tests Vitest**, dont `src/db/queries.test.ts` (requêtes testées de bout en bout via `src/domain`) et un test qui applique les vraies migrations sur un PostgreSQL en mémoire (**PGlite**, avec `pg_trgm` et `unaccent`).

### Base de données
- `src/db/migrations/0001_schema.sql` : toutes les tables, contraintes CHECK (enums en `text` + CHECK), triggers `search_text` (établissement : nom + alias ; service : libellé FR + synonymes), index trigrammes, vue matérialisée `monthly_stats` (suit les fusions, exclut `over_month`).
- `src/db/migrations/0002_reference_data.sql` : **18 secteurs** (HEALTH, EDUCATION, ADMINISTRATION, JUSTICE, SECURITY, TAX, UTILITIES, TRANSPORT, SOCIAL, FOOD_SERVICE, HOSPITALITY, REAL_ESTATE, RETAIL, BANKING_INSURANCE, CULTURE, SPORT, TELECOM, TOURISM), 9 thèmes, questionnaire ESSENTIAL (question + 5 options + libellés de relance), GENERIC en brouillon.
- Choix de modèle : alias = colonne `establishment.aliases text[]` (pas de table), synonymes = `service.synonyms text[]` ; public/privé = `establishment.ownership` (pas un secteur) ; statuts d'établissement `active/pending_review/rejected/merged/closed`.
- `npm run db:migrate` (`scripts/migrate.mjs`) : une transaction par fichier, table `schema_migration`, verrou advisory, connexion directe `DATABASE_URL_UNPOOLED` si présente, conversion `sslmode=require` → `verify-full`.

### Hébergement (prototype en ligne)
- **Vercel** (dépôt connecté, région `fra1`) + **Neon** (projet `floral-credit-39387239`, région Frankfurt, PostgreSQL 17 conseillé). Variables `DATABASE_URL` (poolée) et `DATABASE_URL_UNPOOLED` (directe) configurées en « Secret ».
- Les migrations tournent au build de **production** uniquement (`npm run vercel-build`) ; les deux migrations **sont appliquées sur Neon** (vérifié : table `sector` avec `TRANSPORT`).
- `vercel.json` : cron quotidien 2 h UTC sur `/webapi/internal/refresh-stats`.
- Production nationale : hébergement souverain au Sénégal ou cloud européen, en conteneur (non fait).

---

## Ce qui a marché

- Proposer 3 à 5 options courtes avec une recommandation, puis appliquer le choix.
- Ancrer le design dans le sujet (ticket de file d'attente, formulaire administratif à cases à cocher) plutôt que des motifs génériques.
- Lire la doc Next.js embarquée (`node_modules/next/dist/docs/`) : la version 16 diffère (`params`/`searchParams` sont des Promise, helpers globaux `PageProps`, `LayoutProps`, `RouteContext` générés par `next typegen`).
- Tester la migration sur un **vrai PostgreSQL 16 local** (binaires dans `/usr/lib/postgresql/16/bin`) et en continu avec **PGlite**.
- Vérifier chaque correctif par un test de contrôle (ex. avertissement SSL présent sans correctif, absent avec).

## Ce qui n'a pas marché (à ne pas refaire)

- **Neon CLI** (`neon login`, `neon link`, `neon deploy`…) : bloqué. Le réseau de l'environnement cloud refuse `*.neon.tech` (403 au proxy) et la connexion par navigateur est impossible depuis un conteneur. Il faudrait autoriser `*.neon.tech` dans les réglages réseau de l'environnement et fournir `NEON_API_KEY` comme variable d'environnement (jamais dans le chat). Ces étapes ne sont **pas nécessaires** au prototype.
- **PostgreSQL local** dans le scratchpad : l'environnement remet régulièrement les droits de `/tmp/claude-0` à `700`, ce qui arrête le serveur. Remède : `chmod o+x` sur chaque dossier parent, supprimer les fichiers `.s.PGSQL.5499*`, relancer `pg_ctl` en tant que `postgres` (initdb refuse root). Ne pas pousser un commit sans avoir relancé les tests si le serveur est tombé.
- `vitest` avec `@types/node@20` : conflit de dépendances → utiliser `@types/node@^22` (Node 22 est l'environnement).
- Empiler des migrations correctives (0003, 0004) avant tout déploiement : l'utilisatrice préfère modifier directement 0001/0002 tant que la base n'est déployée nulle part.
- Éléments de design refusés : fond vert franc derrière le ticket, fond « registre », tuiles à pictogrammes, pastilles, micro/audio.

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
4g. **Logo et photo (2026-09-30)** : logo fourni en image, vectorisé (voir README « Logo et icônes ») ; symbole seul, sans le texte « JubFeedback » (à sa demande) ; en-tête, pied de page (blanc), favicon, icône Apple. Accueil : photo du BRT en bandeau (téléphone) / moitié droite (ordinateur), variante 1 retenue sur le canevas ; les tickets 045/046 sont retirés. **Crédit de la photo inconnu** : à obtenir avant publication. Demander le SVG d'origine du logo.
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

## Rappel du skill « frontend-design » (installé dans ses Compétences)

Ancrer le design dans le sujet ; une typographie choisie (pas les polices par défaut) ; un seul élément marquant, le reste sobre ; la structure visuelle doit porter de l'information (numérotation seulement pour une vraie séquence). Éviter : fond crème `#F4F1EA` avec accent terracotta, kit de cartes identiques avec ombre douce, dégradés décoratifs, libellés en MAJUSCULES espacées, textes « A · B · C », « → » dans les boutons, police monospace pour les petits libellés, mot unique mis en valeur dans un titre. Textes : du point de vue de l'usager, boutons qui disent ce qui se passe, même mot tout au long du parcours. Qualité minimale : focus visible, contraste, cibles tactiles ≥ 44 px.
