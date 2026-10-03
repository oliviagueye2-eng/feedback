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
    topicsTitle: "Comment évaluez-vous les points suivants ?",
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
    /** Day of the last update, the 1st of the month (her choice, 2026-10-03). */
    stampPublished: "Mis à jour",
    stampWaiting: "En attente",
    stampCount: "{count} avis sur {threshold}",
    /** Short label as the title, the exact question asked under it, alone (her choice, 2026-10-03). */
    satisfactionTitle: "Satisfaction",
    goalTitle: "Résultat obtenu",
    /** The figure stands apart, in large type, with a short label (her choice, 2026-10-03). */
    satisfiedPercent: "{percent} %",
    /** « d'avis », not « d'usagers »: the feedbacks are given freely, not a random sample (2026-10-03). */
    satisfiedLabel: "d'avis satisfaits ou très satisfaits",
    feedbackCount: { one: "{count} avis", other: "{count} avis" },
    answer: "Réponse",
    count: "Avis",
    share: "Part",
    topicsTitle: "Points forts et points à améliorer",
    topicsHelp: "% d'avis positifs",
    /** Read by screen readers before each gauge. */
    strength: "Point fort :",
    improvement: "À améliorer :",
    /**
     * Short label of each topic under its gauge. A topic missing here shows its
     * label without the part in brackets.
     */
    topicShort: {
      STAFF: "Politesse",
      PROFESSIONALISM: "Compétence",
      INFORMATION: "Explications",
      PRIVACY: "Intimité",
      RIGHTS_RESPECT: "Respect des droits",
      STUDENT_SUPERVISION: "Encadrement",
      PARENT_COMMUNICATION: "Échanges",
      WAIT_TIME: "Attente",
      PROCESSING_TIME: "Délai de traitement",
      INTERVENTION_TIME: "Délai d'intervention",
      PUNCTUALITY: "Ponctualité",
      PROCEDURE: "Démarche",
      CASE_TRACKING: "Suivi du dossier",
      OPENING_HOURS: "Horaires",
      CUSTOMER_SERVICE: "Service client",
      FEES: "Frais",
      BILLING: "Factures",
      CARE_RECEIVED: "Soins",
      MEDICINE_AVAILABILITY: "Médicaments",
      TEACHING_QUALITY: "Enseignement",
      REQUEST_HANDLING: "Prise en compte",
      POWER_CUTS: "Coupures de courant",
      WATER_CUTS: "Coupures d'eau",
      WATER_QUALITY: "Qualité de l'eau",
      NETWORK_QUALITY: "Réseau",
      CLEANLINESS: "Propreté",
      ACCESS_FOR_ALL: "Accessibilité",
      ONBOARD_SAFETY: "Sécurité à bord",
      SCHOOL_SAFETY: "Sécurité",
      SCHOOL_EQUIPMENT: "Équipement",
      VEHICLE_CONDITION: "Véhicules",
    } as Record<string, string>,
    /** The period before the published one, then the published one (2026-10-03). */
    evolutionTitle: "Évolution",
    month: "Période",
    satisfied: "Satisfaits",
    notEnough: "pas assez d'avis",
    emptyTitle: "Pas encore assez d'avis pour publier un résultat.",
    emptyCount: { one: "{count} avis reçu ces 3 derniers mois.", other: "{count} avis reçus ces 3 derniers mois." },
    emptyWhy: "Il en faut au moins {threshold} pour que le résultat soit fiable et que personne ne puisse être reconnu.",
    rules: "Résultats mis à jour chaque mois.",
    methodLink: "Comment sont calculés ces résultats ?",
    give: "Donner mon avis sur cet établissement",
  },

  /** « Comment sont calculés ces résultats ? », linked from every results page. */
  method: {
    title: "Comment sont calculés les résultats",
    periodTitle: "Période et mise à jour",
    period:
      "Les résultats portent sur les avis des 3 derniers mois complets et sont mis à jour le 1er de chaque mois. Rien n'est publié avant {threshold} avis. Les avis sont anonymes ; les commentaires écrits ne sont pas publiés.",
    /** Text validated on 2026-10-03, word for word. */
    highlightsTitle: "Points forts et points à améliorer",
    highlights:
      "Un pourcentage calculé sur peu d'avis peut changer beaucoup avec un seul avis de plus. Pour ne pas juger un établissement trop vite, nous tenons compte de cette incertitude : un thème n'est affiché comme point fort que si son résultat reste au-dessus de 60 % même dans le cas le moins favorable, et comme point à améliorer que s'il reste sous 50 % même dans le cas le plus favorable.",
    highlightsMethod: "(Méthode : intervalle de confiance à 95 %, calculé selon Wilson.)",
  },

  admin: {
    title: "Back-office",
    comingSoon: "À venir.",
  },
};

export type Dictionary = typeof fr;
