# Plateforme nationale de satisfaction des usagers (Sénégal)

Conception d'une plateforme permettant aux usagers de donner leur avis sur un établissement (service public ou privé), principalement via un QR code affiché au guichet.

## Contenu

| Dossier | Contenu |
|---|---|
| [`docs/`](docs/) | [Architecture technique](docs/architecture-technique.md) (Next.js en SSR, API REST sous `/webapi/`) et [architecture de la base de données](docs/architecture-base-de-donnees.md) |
| [`maquettes/`](maquettes/) | Maquettes UX des parcours (variante A retenue, variantes B, C, D pour mémoire) |

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
