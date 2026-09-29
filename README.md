# Plateforme nationale de satisfaction des usagers (Sénégal)

Conception d'une plateforme permettant aux usagers de donner leur avis sur un établissement (service public ou privé), principalement via un QR code affiché au guichet.

## Contenu

| Dossier | Contenu |
|---|---|
| [`docs/`](docs/) | [Architecture technique](docs/architecture-technique.md) (Next.js en SSR, API REST sous `/webapi/`) et [architecture de la base de données](docs/architecture-base-de-donnees.md) |
| [`maquettes/`](maquettes/) | Maquettes UX des parcours (variante A retenue, variantes B, C, D pour mémoire) |

## Démarrer

Prérequis : Node.js 22.

```bash
npm install
cp .env.example .env.local   # renseigner DATABASE_URL
npm run dev                  # http://localhost:3000
```

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run lint` | Vérification du code, dont la règle qui interdit à `src/` de dépendre de Next.js |
| `npm run typecheck` | Vérification des types |
| `npm test` | Tests (Vitest), dont l'application des migrations sur une base PostgreSQL en mémoire (PGlite) |
| `npm run db:migrate` | Applique les migrations de `src/db/migrations/` à la base `DATABASE_URL` |

### Mise en ligne (prototype) : Vercel et Neon

1. **Base de données.** Dans Vercel, onglet *Storage*, ajouter **Neon** (ou créer un projet sur neon.tech) en région **Frankfurt (eu-central-1)**. Neon fournit `DATABASE_URL` (connexion poolée, pour l'application) et `DATABASE_URL_UNPOOLED` (connexion directe, pour les migrations).
2. **Projet Vercel.** *Add New… > Project*, importer le dépôt `feedback`. Si le dépôt n'apparaît pas, autoriser l'application GitHub de Vercel à y accéder.
3. **Variables d'environnement** (*Settings > Environment Variables*) : `DATABASE_URL` et `DATABASE_URL_UNPOOLED` (ajoutées automatiquement par l'intégration Neon), et `CRON_SECRET` (générer avec `openssl rand -hex 32`).
4. **Déployer.** Chaque `git push` sur `main` déploie en production. Les migrations s'appliquent pendant le build de production seulement (`npm run vercel-build`) ; les aperçus de branche ne touchent pas à la base.

Configuration dans [`vercel.json`](vercel.json) : région `fra1` (Francfort, la même que la base), et recalcul des résultats publiés chaque nuit à 2 h UTC (`/webapi/internal/refresh-stats`, protégé par `CRON_SECRET`).

### Organisation du code

| Dossier | Contenu |
|---|---|
| `app/(public)/` | Pages usagers : accueil (`/`), recherche (`/avis`), arrivée par QR code (`/e/{code}`) |
| `app/(admin)/` | Back-office des agents (`/admin`), à construire |
| `app/webapi/` | Routes de l'API REST, minces : elles appellent `src/domain` |
| `src/domain/` | Logique métier, indépendante de Next.js |
| `src/db/` | Accès à PostgreSQL. Les **migrations** (`src/db/migrations/`) créent le schéma et les données de référence. Les requêtes restent **à écrire** : chaque fonction répond pour l'instant « non implémenté » (HTTP 501) |
| `src/lib/` | Utilitaires partagés (normalisation du texte, validation) |

Voir [l'architecture technique](docs/architecture-technique.md) pour les règles de cette organisation.

## Parcours retenu (variante A)

```
Accueil ─► 0. Recherche d'établissement ─► 0a. Autocomplétion ─┬─► 1. Établissement identifié
                                                               ├─► 0b. Aucun résultat ─► 0c. Non répertorié ─► 1
                                                               └─► 0c. Non répertorié ─► 1
QR code scanné ─────────────────────────────────────────────────► 1. Établissement identifié

1 ─► 2. Question essentielle ─► 2b. Thèmes et texte libre ─► 3. Enregistrement
  ─► 4-5. Confirmation, Terminer ou Continuer ─► 6. Questionnaire détaillé ─► 7. Remerciement
```

## Principes

- La recherche porte sur l'établissement ; un service tapé (« état civil ») est traduit en établissements.
- Jamais d'impasse : un établissement absent du référentiel peut être saisi par l'usager.
- Une seule question obligatoire, enregistrée immédiatement.
- Anonymat : aucune donnée personnelle.
