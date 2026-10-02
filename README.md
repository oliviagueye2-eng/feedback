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

**À faire plus tard :** ajouter `CRON_SECRET` dans Vercel. Sans lui, le site fonctionne, mais la tâche de nuit est refusée (401) et les résultats publiés ne sont jamais recalculés. À faire avant d'avoir de vrais avis.

#### Migrations

Quatre fichiers, réécrits proprement le 2026-10-02 avant le lancement : `0001_schema.sql` (tables), `0002_reference_data.sql` (secteurs, thèmes), `0003_registry.sql` (territoire, organismes, établissements réels vérifiés sur des sources publiques, services), `0004_questions.sql` (banque de questions et listes). Puis `0005_establishment_types.sql` (types d'établissement, questions des lieux de passage) et `0006_air_senegal.sql` (première compagnie aérienne). Désormais, toute modification passe par une **nouvelle** migration numérotée, sans jamais modifier un fichier déjà appliqué.

#### Réinitialiser la base

Nécessaire une seule fois, pour passer de l'ancienne série de migrations (0001 à 0019 du prototype) à la nouvelle : le script de migration refuse une base qui contient des migrations disparues, et le déploiement échoue alors sans rien casser (l'ancienne version reste en ligne). Dans la console Neon, *SQL Editor*, sur la base de production :

1. Vérifier qu'il n'y a pas d'avis à garder : `SELECT count(*) FROM feedback;`
2. Tout effacer : `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
3. Relancer le déploiement (ou pousser sur `main`) : la build recrée tout à partir des quatre migrations.

Configuration dans [`vercel.json`](vercel.json) : région `fra1` (Francfort, la même que la base), et recalcul des résultats publiés chaque nuit à 2 h UTC (`/webapi/internal/refresh-stats`, protégé par `CRON_SECRET`).

### Organisation du code

| Dossier | Contenu |
|---|---|
| `app/(public)/` | Pages usagers : accueil (`/`), recherche (`/avis`), arrivée par QR code (`/e/{code}`) |
| `app/(admin)/` | Back-office des agents (`/admin`), à construire |
| `app/webapi/` | Routes de l'API REST, minces : elles appellent `src/domain` |
| `app/_i18n/` | Textes de l'interface, un fichier par langue (`fr.ts`) ; voir l'architecture technique |
| `src/domain/` | Logique métier, indépendante de Next.js |
| `src/db/` | Accès à PostgreSQL. Les **migrations** (`src/db/migrations/`) créent le schéma et les données de référence ; les requêtes sont dans les autres fichiers |
| `src/lib/` | Utilitaires partagés (normalisation du texte, validation) |

Voir [l'architecture technique](docs/architecture-technique.md) pour les règles de cette organisation.

## Logo et icônes

Logo fourni le 2026-09-30 (symbole seul, sans le texte), vectorisé en SVG avec 3 couleurs à plat : vert `#137A36`, jaune `#FACC15`, rouge `#CD1E22`. À remplacer par le fichier vectoriel d'origine quand il sera disponible.

| Fichier | Usage |
|---|---|
| `public/brand/logo.svg` | Logo couleur (en-tête) |
| `public/brand/logo-degrade.svg`, `logo-degrade-512.png`, `logo-degrade-1024.png`, `logo-degrade-2048.png` (détouré, impression) | Logo avec les dégradés de l'original, pour les grands formats (affiches, présentations) |
| `public/brand/logo-blanc.svg` | Logo blanc, sur fond foncé (pied de page) |
| `public/brand/logo-512.png`, `logo-1024.png`, `logo-blanc-512.png` | Images pour documents, réseaux sociaux |
| `public/brand/icon-192.png`, `icon-512.png` | Icônes d'application (fond blanc), pour un futur manifeste |
| `app/favicon.ico` (16, 32, 48 px), `app/icon.svg`, `app/apple-icon.png` (180 px) | Icônes d'onglet et d'écran d'accueil, ajoutées automatiquement par Next.js |

Photo de l'accueil : `public/images/accueil-brt.jpg` (BRT de Dakar, 736 px, 43 Ko). Crédit à préciser.

### Logos des organismes

Un organisme (Senelec, Orange…) peut avoir un logo, affiché dans les résultats de recherche et sur l'écran 1, pour lui-même et pour toutes ses agences. Les autres établissements gardent le pictogramme.

- Le fichier porte le code de l'organisme (`organization.code`), en minuscules avec des tirets : `SENELEC` → `public/logos/senelec.svg`, `SOCIETE_GENERALE` → `public/logos/societe-generale.svg`. Aucune colonne dans la base.
- Ajouter un logo : déposer le SVG (moins de 10 Ko) dans `public/logos/`, puis ajouter le code dans `ORGANIZATIONS_WITH_LOGO` (`app/_components/organizationLogo.ts`). Un test vérifie que chaque code a son fichier.
- Avant de publier un logo, vérifier que l'organisme accepte son utilisation.
- Aucun logo pour l'instant.

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
