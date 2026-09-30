/**
 * Texts of the interface, in French, grouped by screen. Texts that come from
 * the database (questions, answers, topics, services, sectors) are not here:
 * they have their own translations in the `translation` table.
 *
 * Writing rules:
 * - plain spaces before ? ! : ; and inside « »: they become non-breaking
 *   spaces when the dictionary is loaded (see index.ts);
 * - {name} is replaced by a value (see fill in format.tsx);
 * - <b>…</b> is shown in bold (see withBold in format.tsx);
 * - { one, other }: singular and plural, {count} being the number.
 *
 * Another language copies this file (wo.ts…) with the type Dictionary: a
 * missing text is then reported by the type check.
 */
export const fr = {
  meta: {
    title: "Avis des usagers",
    description: "Donnez votre avis sur un établissement : anonyme, gratuit, environ une minute.",
  },

  common: {
    optional: "(facultatif)",
    back: "Retour",
    giveFeedback: "Donner mon avis",
    searchLabel: "Quel établissement ou organisme voulez-vous évaluer ?",
    searchPlaceholder: "Ex. : hôpital Fann",
    savingFeedback: "Enregistrement de votre avis…",
  },

  header: {
    state: "République du Sénégal",
    siteName: "Avis des usagers",
    navLabel: "Navigation principale",
    howItWorks: "Comment ça marche",
  },

  footer: {
    state: "République du Sénégal",
    motto: "Un Peuple, Un But, Une Foi",
    privacy: "Aucune donnée personnelle n'est demandée aux usagers.",
    purpose: "Une plateforme au service de la transparence et de la bonne gouvernance.",
  },

  intro: {
    skip: "Passer",
  },

  home: {
    photoAlt: "Bus du BRT à Dakar",
    photoCaption: "Bus du BRT, Dakar",
    ticketLabel: "Ticket usager",
    ticketNumber: "N° 047",
    title: "C'est votre tour.",
    lead: "Vous avez utilisé un service, public ou privé ? Dites-nous comment ça s'est passé. Votre avis aide à améliorer les services au Sénégal.",
    duration: "Anonyme et gratuit, environ 1 minute.",
    qr: "Encore au guichet ? <b>Scannez le QR code affiché</b>, l'établissement sera déjà rempli.",
    civicTitle: "Un geste citoyen : donner son avis, c'est faire entendre la voix des usagers.",
    civicLead: "Chaque expérience compte : mairie, hôpital, école, banque, transport, hôtel, restaurant.",
    civicPoints: [
      { title: "Écouter", text: "Décrivez ce que vous avez vécu, avec respect et honnêteté." },
      {
        title: "Comprendre",
        text: "Un avis, ce n'est pas qu'une note. Les avis sont analysés pour montrer ce qui marche et ce qui doit changer.",
      },
      {
        title: "Améliorer",
        text: "Les résultats sont publiés chaque mois, en toute transparence, pour aider les responsables à décider.",
      },
    ],
    stepsTitle: "Comment ça marche",
    steps: [
      "Trouvez l'établissement ou l'organisme à évaluer.",
      "Dites si vous êtes satisfait(e). Une seule question est obligatoire.",
      "Votre avis est enregistré. C'est terminé !",
    ],
  },

  search: {
    title: "Donnez votre avis sur un service",
    lead: "Anonyme et gratuit. Les résultats sont publiés chaque mois.",
    help: "Recherche par nom, type ou commune",
    submit: "Rechercher",
    clear: "Effacer la recherche",
    backHome: "Retour à l'accueil",
    qrHint: "Vous êtes au guichet ? Ouvrez l'appareil photo de votre téléphone et visez le QR code affiché.",
    tooShort: "Tapez au moins 3 lettres.",
    offline: "Pas de connexion. Vérifiez votre réseau, puis réessayez.",
    error: "La recherche ne répond pas. Réessayez dans un instant, ou <a>saisissez le nom vous-même</a>.",
    loading: "Recherche en cours…",
    found: { one: "{count} établissement trouvé", other: "{count} établissements trouvés" },
    serviceHint: "<b>Précisez l'établissement.</b> Voici ceux qui proposent « {query} ». Ajoutez la commune pour affiner.",
    notFound: "Je ne le trouve pas dans la liste",
    notFoundAction: "Le saisir moi-même",
    noResult: "Aucun résultat exact",
    noResultHelp: "Vérifiez l'orthographe, ou continuez : votre avis sera pris en compte.",
    didYouMean: "Vouliez-vous dire :",
    continueWith: "Continuer avec « {query} »",
  },

  newEstablishment: {
    title: "Ajouter un organisme ou un établissement à évaluer",
    backToSearch: "Retour à la recherche",
    error: "Indiquez le nom (3 lettres au moins).",
    name: "Nom (minimum 3 lettres)",
    sector: "Secteur",
    sectorPlaceholder: "Choisir un secteur",
    municipality: "Localité ou quartier",
    municipalityPlaceholder: "Ex. : Ndiaganiao, Médina",
    note: "Il sera ajouté à la liste après validation. Votre avis compte dès maintenant.",
    submit: "Continuer avec « {name} »",
    submitNoName: "Continuer",
    saving: "Enregistrement en cours…",
  },

  establishment: {
    title: "Donnez votre avis sur ce service",
    rating: "Vous évaluez",
    wrongEstablishment: "Ce n'est pas le bon établissement ?",
    wrongOrganization: "Ce n'est pas le bon organisme ?",
    whenError: "Indiquez quand vous êtes venu(e).",
    reason: "Motif de votre visite",
    reasonGeneral: "Sur quoi porte votre avis ?",
    reasonPlaceholder: "Choisir dans la liste",
    reasonOther: "Autre démarche",
    when: "Quand êtes-vous venu(e) ?",
    whenGeneral: "Quand est-ce arrivé ?",
    periods: {
      today: "Aujourd'hui",
      under_week: "Il y a moins d'une semaine",
      under_month: "Il y a moins d'un mois",
      over_month: "Il y a plus d'un mois",
    },
    duration: "Anonyme, environ 1 minute.",
    loading: "Un instant…",
  },

  qr: {
    inactiveTitle: "Ce QR code n'est plus actif",
    inactiveText: "Vous pouvez chercher l'établissement par son nom.",
    search: "Chercher l'établissement",
  },

  essential: {
    lead: "Une question, puis c'est enregistré.",
    hint: "Choisissez une réponse pour continuer.",
  },

  details: {
    change: "Modifier",
    error: "Votre avis n'a pas pu être enregistré. Vérifiez vos réponses, puis réessayez.",
    topicsTitle: "Comment ça s'est passé ?",
    topicsHint: "(choisissez seulement ce qui vous concerne)",
    good: "Bien",
    bad: "Pas bien",
    otherLabel: "Précisez",
    otherPlaceholder: "Précisez (ex. : parking)",
    commentLabel: "Détail de votre expérience",
    commentPlaceholder: "Décrivez votre expérience : les points positifs, les points négatifs, vos suggestions d'amélioration…",
    commentHelp: "N'indiquez ni nom ni numéro de téléphone.",
    submit: "Enregistrer mon avis",
  },

  saved: {
    title: "Votre avis est enregistré",
    next: "La suite (confirmation et questionnaire détaillé) sera ajoutée à la prochaine étape.",
  },

  admin: {
    title: "Back-office",
    comingSoon: "À venir.",
  },
};

export type Dictionary = typeof fr;
