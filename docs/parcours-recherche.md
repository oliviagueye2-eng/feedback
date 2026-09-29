# Parcours de recherche d'un établissement (écrans 0 à 0c)

Comportement validé le 2026-09-29. Les textes affichés seront revus dans une phase ultérieure.

## Écrans

| Écran | Adresse | Contenu |
|---|---|---|
| 0. Recherche | `/avis` | Titre, champ « Dans quel établissement êtes-vous allé(e) ? », aide, bouton « Rechercher » ; en bas, rappel du QR code |
| 0a. Résultats | `/avis` (mode recherche) | Liste d'établissements ; « Je ne trouve pas mon établissement » toujours en dernier |
| 0b. Aucun résultat | `/avis` (mode recherche) | « Aucun résultat exact », suggestions « Vouliez-vous dire », bouton « Continuer avec « … » » |
| 0c. Non répertorié | `/avis/nouveau?nom=…` | Nom (obligatoire, prérempli), secteur (facultatif), commune ou village (facultatif), « Utiliser cet établissement » |
| 1. Établissement identifié | `/avis/{id}` | Première version : l'établissement évalué. Motif et « Quand êtes-vous venu(e) ? » à venir |

## Recherche

- Recherche **par le nom** de l'établissement (et ses alias), ou par une démarche (« état civil », « extrait de naissance ») qui renvoie les établissements qui la proposent. Taper seulement une commune ne liste pas les établissements de la commune.
- Suggestions à partir de **3 lettres**, environ 0,25 s après la dernière touche ; **8 résultats** au plus.
- **3 ou 4 lettres** : seulement les noms dont un mot (du nom ou d'un alias) **commence** par ce qui est tapé (« sen » → Sen'Eau, Senelec ; « ucad » → UCAD).
- **5 lettres et plus** : la tolérance aux fautes s'ajoute (« dantek » trouve Dantec). Principe : les mots sont découpés en morceaux de 3 lettres ; au moins 60 % de morceaux communs.
- Accents ignorés. Le mot **« Sénégal » est ignoré** (il est dans presque tous les noms complets).
- Ordre : commune tapée d'abord ; puis les établissements dont le **nom affiché** correspond, avant ceux trouvés seulement par un alias ; puis début de mot avant faute tolérée ; à égalité, l'organisme « en général » avant ses agences. Aucune mention de l'alias sous le nom (décision du 2026-09-29).
- Commune tapée en entier (« état civil Grand-Yoff ») : les établissements de cette commune passent en tête.
- Sous chaque nom : **commune et secteur** (« Grand-Yoff, Administration et état civil »), ce qui est connu. Jamais le service.
- Démarche reconnue : encadré « Précisez l'établissement ».
- Aucun résultat : jusqu'à 3 suggestions plus approximatives (chaque mot comparé séparément), puis « Continuer avec « … » » vers l'écran 0c.
- Un établissement saisi par un usager (à vérifier) ou fermé n'apparaît pas dans la recherche.

## Comportement sur téléphone

- En touchant le champ, la page passe en **mode recherche** : bandeau tricolore, flèche retour, champ en haut, résultats dessous, clavier ouvert.
- **Transition** : le champ glisse jusqu'en haut (0,45 s, jugé trop rapide à 0,24 s), la page s'efface en fondu, puis la flèche retour et les résultats apparaissent ; mouvement inverse au retour. Pas d'animation si le téléphone demande de réduire les animations.
- **Flèche retour** ou **bouton retour du téléphone** : on revient à l'écran 0, le texte tapé est conservé.
- **Croix** : le champ et la liste se vident, le clavier reste ouvert.
- Touche « Rechercher » du clavier : affiche la liste, n'ouvre pas le premier résultat.
- Moins de 3 lettres : « Tapez au moins 3 lettres. »
- Clavier : touche « Rechercher », pas de correction automatique (elle abîme les noms propres).

Sur ordinateur, pas de mode plein écran : les résultats s'affichent sous le champ. La recherche du talon de la page d'accueil mène à `/avis?q=…`.

## Réseau

- **Sans JavaScript** (ou avant son chargement en 3G) : le formulaire fonctionne, la page se recharge avec les résultats.
- **Sans connexion** : « Pas de connexion. Vérifiez votre réseau, puis réessayez. » (la file d'envoi hors connexion est prévue plus tard).
- **Erreur du serveur** : message, avec un lien pour saisir le nom soi-même.

## Écran 0c

- Seul le nom est obligatoire (2 à 200 caractères).
- L'établissement est créé « à vérifier » (`pending_review`) ; l'avis est accepté tout de suite. Il n'apparaît dans la recherche qu'après vérification par un agent, qui fusionne les doublons.
- La commune tapée s'affiche à la place de la commune officielle tant qu'un agent ne l'a pas rattachée.

## Décisions

- Pas de lecteur de QR code dans la page : une phrase invite à utiliser l'appareil photo du téléphone.
- Un seul parcours pour le motif : l'usager choisit toujours son motif dans la liste de l'écran 1, même s'il a tapé une démarche.
- Pas de journal des recherches pour l'instant (idée notée pour plus tard).
