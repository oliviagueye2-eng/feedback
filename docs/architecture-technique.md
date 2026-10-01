# Architecture technique

Version de travail. Complète [l'architecture de la base de données](architecture-base-de-donnees.md).

## 1. Décisions

| Sujet | Décision | Raison |
|---|---|---|
| Rendu des pages | **Next.js, rendu côté serveur (SSR)**, avec très peu de JavaScript côté navigateur | Arrivée par QR code en 3G sur des téléphones d'entrée de gamme : la page doit s'afficher vite. Les pages publiques (accueil, résultats) doivent être bien référencées |
| Style d'API | **REST** | Données simples (établissements, avis, réponses). Pas besoin de GraphQL |
| Emplacement de l'API | **Voie intermédiaire** : API intégrée à Next.js, logique métier dans un dossier indépendant de Next.js | Démarrage rapide, avec la possibilité d'extraire l'API dans un serveur séparé plus tard sans tout réécrire |
| Préfixe des routes d'API | **`/webapi/`** | |
| Base de données | PostgreSQL (`pg_trgm`, `unaccent`) | Voir le document de base de données |
| Hors connexion | Service worker et file d'envoi locale (IndexedDB) | Les réponses sont gardées sur le téléphone et renvoyées au retour du réseau |

## 2. Organisation du code

```
app/                        Next.js (App Router)
  (public)/                 pages usagers : accueil, recherche, formulaire, résultats
  (admin)/                  back-office des agents (derrière connexion)
  webapi/                   routes d'API REST : minces, elles appellent src/domain
    establishments/route.ts
    feedbacks/[id]/route.ts
    ...
  _i18n/                    textes de l'interface, un fichier par langue (fr.ts)
src/
  domain/                   logique métier : AUCUN import de Next.js
    establishment/          recherche, création d'un établissement saisi par l'usager
    feedback/               avis, réponses, thèmes, commentaire
    questionnaire/          choix du questionnaire selon le service ou le secteur
    stats/                  calcul des résultats mensuels
  db/                       accès PostgreSQL (requêtes, migrations)
  lib/                      utilitaires partagés (normalisation du texte, validation)
```

### La règle qui rend la séparation possible plus tard

1. **Les routes `app/webapi/...` sont minces.** Elles lisent la requête, valident les données, appellent une fonction de `src/domain`, puis renvoient la réponse. Aucune règle métier dans les routes.
2. **`src/domain` n'importe jamais Next.js** (`next/*`) : pas de `cookies()`, `headers()`, `NextRequest` ou `NextResponse`. Il reçoit des données simples et renvoie des données simples.
3. **Les pages rendues côté serveur appellent aussi `src/domain` directement**, sans passer par une requête HTTP vers `/webapi/`. Les routes `/webapi/` servent au navigateur (formulaire, autocomplétion, envoi hors connexion), au back-office et aux futurs canaux.

Une règle de lint (`no-restricted-imports` d'ESLint) peut interdire tout import de `next/*` dans `src/domain`, pour que la règle 2 soit vérifiée automatiquement.

Le jour où l'API doit devenir un serveur séparé, on déplace `src/domain` et `src/db` dans ce nouveau serveur et on y recrée les routes. La logique métier ne change pas.

### Textes et traductions

Deux sources, selon l'origine du texte :

- **Textes venant de la base** (questions, réponses, thèmes, services, secteurs, types d'établissement) : une table de traduction par table (`sector_translation`, `question_translation`, `answer_option_translation`…), une ligne par langue.
- **Textes de l'interface** (titres, boutons, messages, exemples) : `app/_i18n/fr.ts`, rangés par écran. Aucun texte d'interface n'est écrit directement dans les pages.

Fonctionnement (méthode des « dictionnaires » de la documentation Next.js, sans bibliothèque) :

- Les composants serveur appellent `getDictionary()` (`app/_i18n/index.ts`). Les composants client ne chargent jamais de dictionnaire : la page leur passe les textes dont ils ont besoin.
- Dans `fr.ts`, on écrit des espaces ordinaires : les espaces insécables (avant `? ! : ;` et à l'intérieur de `« »`) sont ajoutés au chargement.
- `{nom}` est remplacé par une valeur (`fill`), `<b>…</b>` est mis en gras (`rich`), `{ one, other }` donne le singulier ou le pluriel (`plural`), selon les règles de la langue.
- Ajouter une langue : copier `fr.ts` (par exemple `wo.ts`, typé `Dictionary` : un texte manquant est signalé par `npm run typecheck`), l'ajouter à `locales` et `dictionaries` dans `index.ts`.

Pas encore décidé : comment le site retient la langue choisie (adresse `/wo/…` ou réglage sur le téléphone ; le réglage garde la même adresse pour les QR codes imprimés), et quelles langues au lancement.

## 3. Routes de l'API

| Méthode et route | Rôle | Écran |
|---|---|---|
| `GET /webapi/qr/{code}` | Établissement (et service éventuel) lié à un QR code | QR scanné |

L'adresse imprimée dans les QR codes est la page `/e/{code}`, qui s'appuie sur la même logique métier.
| `GET /webapi/establishments?q=etat+civil` | Autocomplétion. La réponse indique `match_type` (`establishment` ou `service`) pour afficher l'encadré « Précisez l'établissement » | 0a |
| `POST /webapi/establishments` | Établissement saisi par l'usager (statut `pending_review`) | 0c |
| `GET /webapi/establishments/{id}` | Détail d'un établissement et services proposés | 1 |
| `PUT /webapi/feedbacks/{id}` | Crée ou met à jour l'avis (établissement, service, `visit_period`, langue) | 1 |
| `PUT /webapi/feedbacks/{id}/answers/{question_code}` | Enregistre une réponse dès qu'elle est donnée | 2, 6 |
| `PUT /webapi/feedbacks/{id}/topics` | Thèmes touchés, chacun `positive` (« Bien ») ou `negative` (« Pas bien »), avec le texte de « Autre » | 2b |
| `PUT /webapi/feedbacks/{id}/comment` | Texte libre | 2b |
| `GET /webapi/feedbacks/{id}/questionnaire` | Questionnaire détaillé adapté au service ou au secteur | 6 |
| `GET /webapi/establishments/{id}/stats` | Résultats publiés | Résultats |

### Pourquoi `PUT` et un identifiant généré par le téléphone

L'identifiant de l'avis (`id`, un UUID) est créé par le téléphone avant le premier envoi. Chaque envoi utilise `PUT` sur une adresse précise : renvoyer deux fois la même requête, par exemple après une coupure réseau, donne le même résultat et ne crée pas de doublon. C'est ce qui rend l'envoi hors connexion fiable.

### Réponses d'erreur

Format commun pour toutes les routes :

```json
{ "error": { "code": "ESTABLISHMENT_NOT_FOUND", "message": "..." } }
```

Codes HTTP : `400` données invalides, `404` introuvable, `409` conflit (par exemple un avis déjà terminé), `429` trop de requêtes.

## 4. Hébergement

| Étape | Hébergement | Pourquoi |
|---|---|---|
| Prototype | **Vercel** (application) et **Neon** (PostgreSQL), région **Francfort** | Mise en ligne immédiate, offres gratuites suffisantes pour un prototype |
| Pilote, production | Hébergement souverain au Sénégal ou cloud européen, application en conteneur Docker | Localisation des données, maîtrise des journaux et des coûts |

Le code n'utilise aucun service propre à Vercel : il reste portable.

- **Connexions :** l'application utilise `DATABASE_URL` (poolée) ; les migrations utilisent `DATABASE_URL_UNPOOLED` (directe), car leur verrou ne passe pas par un pooler.
- **Tâche de nuit :** `GET /webapi/internal/refresh-stats` recalcule `monthly_stats`. Elle exige l'en-tête `Authorization: Bearer <CRON_SECRET>`, que Vercel Cron envoie automatiquement.
- **Migrations :** appliquées au build des déploiements de production uniquement.

## 5. Points ouverts

1. **Versionnement :** faut-il préfixer dès maintenant par une version (`/webapi/v1/...`) ? Cela facilite les évolutions quand d'autres canaux (WhatsApp, application) utiliseront l'API.
2. **Protection contre les abus :** limite du nombre d'avis par appareil et par établissement, sans stocker d'identifiant personnel.
3. **Hébergement :** l'obligation éventuelle d'héberger les données au Sénégal limite le choix des hébergeurs.
4. **Back-office :** dans la même application (section `(admin)`) comme prévu ici, ou dans une application à part.
