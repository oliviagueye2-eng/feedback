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
| `PUT /webapi/feedbacks/{id}/topics` | Thèmes cochés, avec le texte de « Autre » | 2b |
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

## 4. Points ouverts

1. **Versionnement :** faut-il préfixer dès maintenant par une version (`/webapi/v1/...`) ? Cela facilite les évolutions quand d'autres canaux (WhatsApp, application) utiliseront l'API.
2. **Protection contre les abus :** limite du nombre d'avis par appareil et par établissement, sans stocker d'identifiant personnel.
3. **Hébergement :** l'obligation éventuelle d'héberger les données au Sénégal limite le choix des hébergeurs.
4. **Back-office :** dans la même application (section `(admin)`) comme prévu ici, ou dans une application à part.
