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
    title: "NeexNaxari, plateforme citoyenne de satisfaction des usagers",
    description: "Donnez votre avis sur un établissement : anonyme, gratuit, environ une minute.",
  },

  common: {
    optional: "(facultatif)",
    back: "Retour",
    backHome: "Retour à l'accueil",
    previous: "Précédent",
    home: "Accueil",
    giveFeedback: "Donner mon avis",
    searchLabel: "Quel établissement ou organisme voulez-vous évaluer ?",
    searchPlaceholder: "Ex. : hôpital Fann",
    /** Loader while moving from one step to the next (the feedback is not finished yet). */
    wait: "Un instant…",
  },

  header: {
    siteName: "NeexNaxari",
    tagline: "Chaque voix compte",
    navLabel: "Navigation principale",
    howItWorks: "Comment ça marche",
  },

  footer: {
    privacy: "Aucune donnée personnelle n'est demandée aux usagers.",
    purpose: "Une plateforme au service de la transparence et de la bonne gouvernance.",
    followUs: "Suivez-nous",
    /** Read by screen readers on each icon (the page opens in a new tab). */
    networks: {
      facebook: "NeexNaxari sur Facebook (nouvel onglet)",
      instagram: "NeexNaxari sur Instagram (nouvel onglet)",
      tiktok: "NeexNaxari sur TikTok (nouvel onglet)",
      x: "NeexNaxari sur X, anciennement Twitter (nouvel onglet)",
    },
  },

  intro: {
    skip: "Passer",
  },

  home: {
    /** What the site is, above the ticket. */
    platform: "Plateforme citoyenne de satisfaction des usagers",
    photoAlt: "Bus du BRT à Dakar",
    photoCaption: "Bus du BRT, Dakar",
    ticketLabel: "Ticket usager",
    ticketNumber: "N° 047",
    title: "C'est votre tour.",
    lead: "Vous avez utilisé un service, public ou privé ? Dites-nous comment ça s'est passé. Ensemble, pour un Sénégal qui progresse.",
    duration: "Anonyme et gratuit, environ 1 minute.",
    qr: "Encore au guichet ? <b>Scannez le QR code affiché</b>, l'établissement sera déjà rempli.",
    civicTitle: "Un geste citoyen : donner son avis, c'est faire entendre la voix des usagers.",
    civicLead: "Chaque expérience compte : mairie, hôpital, banque, transport, hôtel, restaurant…",
    civicPoints: [
      { title: "Écouter", text: "Décrivez ce que vous avez vécu, avec respect et honnêteté." },
      {
        title: "Comprendre",
        text: "Une expérience ne se résume pas à une note : chaque réponse est analysée pour montrer ce qui marche et ce qui doit changer.",
      },
      {
        title: "Améliorer",
        text: "Les résultats sont publiés chaque mois, en toute transparence, pour aider les responsables à décider.",
      },
    ],
    stepsTitle: "Comment ça marche",
    steps: [
      "Trouvez l'établissement ou l'organisme à évaluer.",
      "En quelques clics, dites si vous êtes satisfait(e) et ajoutez vos commentaires et suggestions.",
      "C'est enregistré : votre réponse compte dans les résultats du mois.",
    ],
  },

  search: {
    title: "Donnez votre avis sur un service",
    help: "Recherche par nom, type ou commune",
    submit: "Rechercher",
    clear: "Effacer la recherche",
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
    municipalityPlaceholder: "Ex. : Dakar, Médina",
    note: "Il sera ajouté à la liste après validation. Votre avis compte dès maintenant.",
    submit: "Continuer avec « {name} »",
    submitNoName: "Continuer",
    saving: "Enregistrement en cours…",
  },

  establishment: {
    title: "Donnez votre avis sur ce service",
    rating: "Vous évaluez",
    change: "Changer",
    changeLabel: "Changer d'établissement ou d'organisme",
    whenError: "Indiquez à quand remonte votre expérience.",
    reason: "Sur quoi porte votre avis ?",
    reasonPlaceholder: "Choisir dans la liste",
    reasonOther: "Autre démarche",
    when: "À quand remonte votre expérience ?",
    periods: {
      today: "Aujourd'hui",
      under_week: "Il y a moins d'une semaine",
      under_month: "Il y a moins d'un mois",
      over_month: "Il y a plus d'un mois",
    },
    start: "Commencer",
    duration: "Anonyme, environ 1 minute.",
  },

  qr: {
    inactiveTitle: "Ce QR code n'est plus actif",
    inactiveText: "Vous pouvez chercher l'établissement par son nom.",
    search: "Chercher l'établissement",
  },

  essential: {
    hint: "Choisissez une réponse pour continuer.",
  },

  details: {
    change: "Modifier",
    error: "Une réponse n'a pas été acceptée. Vérifiez vos réponses, puis appuyez de nouveau sur « Continuer ».",
    topicsTitle: "Comment ça s'est passé ?",
    topicsHint: "(choisissez seulement ce qui vous concerne)",
    good: "Bien",
    bad: "Pas bien",
    otherLabel: "Précisez",
    otherPlaceholder: "Précisez (ex. : parking)",
    commentLabel: "Détail de votre expérience",
    commentPlaceholder: "Décrivez votre expérience : les points positifs, les points négatifs, vos suggestions d'amélioration…",
    commentHelp: "N'indiquez ni nom ni numéro de téléphone.",
    submit: "Continuer",
  },

  questionnaire: {
    lead: "Répondez seulement à ce qui vous concerne.",
    revealHint: "(si vous avez répondu {answer})",
    or: " ou ",
    error: "Une réponse n'a pas été acceptée. Vérifiez vos réponses, puis appuyez de nouveau sur « Continuer ».",
    submit: "Continuer",
  },

  thanks: {
    title: "Merci pour votre participation",
    text: "Vos réponses aideront à améliorer ce service.",
    close: "Vous pouvez fermer cette page.",
    stamp: "Merci",
    seeResults: "Voir les résultats de cet établissement",
  },

  /** Public results of an establishment (design B « Le relevé », 2026-10-03). */
  results: {
    pageTitle: "Résultats : {name}",
    sheetLabel: "Relevé des avis",
    /** Same year: « juillet à septembre 2026 »; otherwise each month has its year. */
    period: "{from} à {last}",
    waitingPeriod: "3 derniers mois",
    stampPublished: "Publié",
    stampWaiting: "En attente",
    stampCount: "{count} avis sur {threshold}",
    /** Short label as the title, the exact question asked under it (her choice, 2026-10-03). */
    satisfactionTitle: "Satisfaction",
    goalTitle: "Démarche aboutie",
    askedQuestion: "Question posée : « {question} »",
    /** The figure stands apart, in large type, with a short label (her choice, 2026-10-03). */
    satisfiedPercent: "{percent} %",
    satisfiedLabel: "d'usagers satisfaits ou très satisfaits",
    feedbackCount: { one: "{count} avis", other: "{count} avis" },
    answer: "Réponse",
    count: "Avis",
    share: "Part",
    answers: { one: "{count} réponse à cette question.", other: "{count} réponses à cette question." },
    topicsTitle: "Ce qui a été bien, ce qui ne l'a pas été",
    topicsHelp: "Nombre d'usagers qui ont jugé chaque point « Bien » ou « Pas bien ».",
    good: "Bien",
    bad: "Pas bien",
    /** Read by screen readers on each topic's bars. */
    topicCounts: "{good} « Bien », {bad} « Pas bien »",
    monthsTitle: "Mois par mois",
    month: "Mois",
    satisfied: "Satisfaits",
    notEnough: "pas assez d'avis",
    emptyTitle: "Pas encore assez d'avis pour publier un résultat.",
    emptyCount: { one: "{count} avis reçu ces 3 derniers mois.", other: "{count} avis reçus ces 3 derniers mois." },
    emptyWhy: "Il en faut au moins {threshold} pour que le résultat soit fiable et que personne ne puisse être reconnu.",
    rules:
      "Avis des 3 derniers mois, mis à jour chaque mois. Publié à partir de {threshold} avis. Les avis sont anonymes ; les commentaires écrits ne sont pas publiés.",
    give: "Donner mon avis sur cet établissement",
  },

  admin: {
    title: "Back-office",
    comingSoon: "À venir.",
  },
};

export type Dictionary = typeof fr;
