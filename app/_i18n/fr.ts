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
    description: "Donnez votre avis sur un établissement : gratuit, environ une minute.",
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
    tagline: "La plateforme de vos expériences",
    navLabel: "Navigation principale",
    howItWorks: "Comment ça marche",
  },

  footer: {
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
    duration: "Gratuit, environ 1 minute.",
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

  /** Pre-launch landing page (neexnaxari.com until the official launch). */
  landing: {
    meta: {
      title: "NeexNaxari — La plateforme de vos expériences",
      description:
        "NeexNaxari permet de partager son expérience des services publics et privés et de contribuer à leur amélioration.",
      imageAlt: "NeexNaxari, la plateforme de vos expériences",
    },
    nav: {
      howItWorks: "Comment ça marche",
      vision: "Notre vision",
      soon: "Bientôt disponible",
      openMenu: "Ouvrir le menu",
      closeMenu: "Fermer le menu",
    },
    hero: {
      title: "Votre expérience peut faire avancer les services.",
      lead: "Partagez votre expérience des services que vous utilisez et contribuez à leur amélioration.",
      discover: "Découvrir NeexNaxari",
      follow: "Suivre le lancement",
      photoAlt: "Des usagers montent dans un bus Tata à un arrêt de Dakar.",
      phoneAlt:
        "Écran de NeexNaxari sur un téléphone : « Êtes-vous satisfait(e) du service reçu ? » pour un trajet en bus de l'AFTU, avec cinq réponses de « Très satisfait(e) » à « Pas du tout satisfait(e) ».",
    },
    idea: {
      label: "Pourquoi NeexNaxari ?",
      title: "Parce que chaque expérience doit pouvoir être entendue.",
      paragraphs: [
        "Nous utilisons chaque jour des services publics et privés. Chaque expérience nous apprend quelque chose : ce qui fonctionne, ce qui peut être amélioré et ce qui mérite d'être repensé.",
        "NeexNaxari donne à chacun la possibilité de partager simplement son expérience et de contribuer à une amélioration continue des services.",
      ],
      chain: ["Votre expérience", "Votre voix", "Des résultats partagés chaque mois"],
    },
    services: {
      title: "Tous les services, toutes les expériences.",
      lead: "NeexNaxari ne se limite pas à un secteur. La plateforme est pensée pour recueillir les expériences des citoyens et des clients, dans les services publics comme dans les services privés.",
      photoAlt: "Une usagère à l'accueil d'un centre de santé, face à une employée souriante.",
    },
    steps: {
      title: "Partager une expérience devient simple et rapide.",
      items: [
        { title: "Je choisis", text: "Je sélectionne le service ou l'établissement concerné." },
        {
          title: "Je partage",
          text: "En quelques clics, je donne mon avis sur mon expérience et j'évalue les différents aspects du service.",
        },
        {
          title: "Je contribue",
          text: "Mon retour permet de mieux comprendre les expériences vécues et d'identifier les pistes d'amélioration. Les résultats seront rendus publics, en toute transparence.",
        },
      ],
    },
    vision: {
      lines: ["La satisfaction des usagers au cœur du développement.", "Des expériences qui comptent.", "Un Sénégal qui progresse."],
      text: "NeexNaxari veut contribuer à créer une culture de l'écoute, du respect, de la transparence et de l'amélioration continue des services.",
      valuesTitle: "Ce qui nous guide",
      values: [
        { title: "Engagement citoyen", text: "Donner à chacun la possibilité de faire entendre son expérience." },
        {
          title: "Amélioration des services",
          text: "Transformer les retours d'expérience en opportunités d'amélioration.",
        },
        { title: "Respect", text: "Valoriser chaque expérience et chaque voix." },
        {
          title: "Transparence",
          text: "Encourager une relation plus ouverte entre les usagers et les services.",
        },
      ],
    },
    soon: {
      title: "NeexNaxari arrive.",
      text: "Une nouvelle façon de partager vos expériences et de participer à l'amélioration des services.",
      follow: "Suivez-nous sur les réseaux pour être informé du lancement officiel.",
      handle: "@neexnaxari",
      /** Button texts; the button opens the page in a new tab. */
      networks: { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", x: "X" },
      newTab: "(nouvel onglet)",
    },
    footer: {
      home: "Accueil",
      copyright: "© 2026 NeexNaxari. Tous droits réservés.",
      navLabel: "Plan du site",
    },
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
    sectorError: "Choisissez un secteur.",
    type: "Type d'établissement",
    typeError: "Choisissez un type (ou « Autre »).",
    other: "Autre",
    change: "Changer",
    municipality: "Localité ou quartier",
    municipalityPlaceholder: "Ex. : Dakar, Médina",
    note: "Il sera ajouté à la liste après validation. Votre avis compte dès maintenant.",
    submit: "Continuer avec « {name} »",
    submitNoName: "Continuer",
    saving: "Enregistrement en cours…",
  },

  establishment: {
    title: "Partagez votre expérience",
    change: "Changer",
    changeLabel: "Changer d'établissement ou d'organisme",
    whenError: "Indiquez à quand remonte votre expérience.",
    reason: "Sur quoi porte votre avis ?",
    reasonOther: "Autre démarche",
    when: "À quand remonte votre expérience ?",
    periods: {
      today: "Aujourd'hui",
      under_week: "Il y a moins d'une semaine",
      under_month: "Il y a moins d'un mois",
      over_month: "Il y a plus d'un mois",
    },
    start: "Commencer",
    duration: "Gratuit, environ 1 minute.",
  },

  site: {
    title: "Dans quelle agence ?",
    placeholder: "Commune ou quartier (ex. : Touba)",
    error: "Indiquez la commune ou le quartier (2 lettres au moins), ou appuyez sur « Passer ».",
    continueWith: "Continuer avec « {place} »",
    submitNoPlace: "Continuer",
    unknown: "Passer",
    note: "Un lieu qui n'est pas dans la liste y sera ajouté après validation.",
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
    good: "Bien",
    bad: "Pas bien",
    notConcerned: "Non concerné",
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

  /** Last screen, after the questions (2026-10-05): contact and statement on honour. */
  send: {
    contactLabel: "Votre e-mail ou votre numéro de téléphone",
    contactPlaceholder: "Ex. : 77 123 45 67",
    contactHelp: "Il sert uniquement à des fins de validation et de modération. Il n'est jamais publié ni transmis.",
    contactError: "Indiquez une adresse e-mail ou un numéro de téléphone sénégalais.",
    attest:
      "J'atteste sur l'honneur que cet avis est sincère, qu'il décrit une expérience que j'ai vécue moi-même, et que les coordonnées indiquées sont les miennes.",
    attestError: "Cochez l'attestation pour envoyer votre avis.",
    error: "Vérifiez votre e-mail ou votre numéro, et cochez l'attestation, puis appuyez de nouveau sur « Envoyer mon avis ».",
    submit: "Envoyer mon avis",
  },

  thanks: {
    title: "Merci pour votre participation",
    text: "Votre avis aidera à améliorer ce service pour tous les usagers.",
    /** In the stub, beside the stamp (her wording, 2026-10-06). */
    nextPublication: "Il sera comptabilisé lors de la prochaine publication mensuelle des résultats.",
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
    /** Alone on the stamp: no « 0 avis sur 10 » (her request, 2026-10-06). */
    stampWaiting: "En attente",
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
      MEDICINE_AVAILABILITY: "Disponibilité (médicaments/examens)",
      TEACHING_QUALITY: "Enseignement",
      REQUEST_HANDLING: "Prise en compte",
      POWER_CUTS: "Fourniture du courant",
      WATER_CUTS: "Distribution de l'eau",
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
    /** The rule without the count, which read as a score at 0 (2026-10-06). */
    emptyWhy:
      "Les résultats s'affichent à partir de {threshold} avis reçus sur les 3 derniers mois, pour qu'ils soient fiables et que personne ne puisse être reconnu.",
    rules: "Résultats mis à jour chaque mois.",
    methodLink: "Comment sont calculés ces résultats ?",
    give: "Donner mon avis sur cet établissement",
  },

  /** « Comment sont calculés ces résultats ? », linked from every results page. */
  method: {
    title: "Comment sont calculés les résultats",
    periodTitle: "Période et mise à jour",
    period:
      "Les résultats portent sur les avis des 3 derniers mois complets et sont mis à jour le 1er de chaque mois. Seuls les avis complets et validés sont comptés. Rien n'est publié avant {threshold} avis. Aucun avis n'est publié un par un, et les commentaires écrits ne sont pas publiés.",
    /** Text validated on 2026-10-03, word for word. */
    highlightsTitle: "Points forts et points à améliorer",
    highlights:
      "Un pourcentage calculé sur peu d'avis peut changer beaucoup avec un seul avis de plus. Pour ne pas juger un établissement trop vite, nous tenons compte de cette incertitude : un thème n'est affiché comme point fort que si son résultat reste au-dessus de 60 % même dans le cas le moins favorable, et comme point à améliorer que s'il reste sous 50 % même dans le cas le plus favorable.",
    highlightsMethod: "(Méthode : intervalle de confiance à 95 %, calculé selon Wilson.)",
  },

  /**
   * Legal pages (mentions légales, confidentialité, conditions d'utilisation),
   * validated by Olivia on 2026-10-06 (Claude Doc « NeexNaxari : pages légales »).
   * Tags: <contact> the contact address, <method> the page of the calculation,
   * <cdp> the CDP's site, <privacy> the privacy policy.
   */
  legal: {
    updated: "Dernière mise à jour : 6 octobre 2026",
    navLabel: "Informations légales",
    notice: {
      title: "Mentions légales",
      sections: [
        { title: "Éditeur du site", paragraphs: ["Le site neexnaxari.com est édité par Olivia Bonfils Guèye, personne physique."] },
        { title: "Responsable de la publication", paragraphs: ["Olivia Bonfils Guèye, fondatrice."] },
        { title: "Contact", paragraphs: ["<contact>contact@neexnaxari.com</contact>"] },
        {
          title: "Hébergement",
          paragraphs: [
            "Site : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com).",
            "Base de données : Neon (Databricks), serveurs situés à Francfort, Allemagne (neon.tech).",
          ],
        },
        {
          title: "Propriété intellectuelle",
          paragraphs: [
            "Le nom NeexNaxari, le logo, les textes et les illustrations du site appartiennent à Olivia Bonfils Guèye. Les résultats publiés peuvent être cités en indiquant la source « NeexNaxari » et la date de consultation.",
          ],
        },
        {
          title: "Indépendance",
          paragraphs: ["NeexNaxari n'est pas un service de l'État et n'est lié à aucun des organismes évalués."],
        },
      ],
    },
    privacy: {
      title: "Politique de confidentialité",
      summary:
        "<b>En une phrase.</b> Vos coordonnées servent uniquement à des fins de validation et de modération : elles ne sont jamais publiées, ni transmises, ni vendues.",
      before: [
        {
          title: "Responsable du traitement",
          paragraphs: [
            "Olivia Bonfils Guèye. Contact : <contact>contact@neexnaxari.com</contact>.",
            "Déclaration à la Commission de Protection des Données Personnelles (CDP) en cours, conformément à la loi n° 2008-12 du 25 janvier 2008. Le numéro de récépissé sera indiqué ici dès réception.",
          ],
        },
      ],
      collected: {
        title: "Ce que nous recueillons",
        headers: ["Donnée", "Pourquoi", "Combien de temps"],
        rows: [
          [
            "E-mail ou téléphone (au choix)",
            "Valider et modérer les avis (doublons, avis en masse)",
            "12 mois après votre dernier avis",
          ],
          [
            "Vos réponses (satisfaction, thèmes, questions)",
            "Calculer les résultats publiés",
            "Tant que le service existe, sans lien avec votre e-mail ou téléphone après 12 mois",
          ],
          [
            "Votre commentaire écrit",
            "Relu par notre équipe, non publié",
            "Tant que le service existe, sans lien avec votre e-mail ou téléphone après 12 mois. Les informations personnelles qu'il contient (noms, numéros, adresses) sont effacées à la relecture.",
          ],
          ["Dates de votre expérience et de votre avis", "Ne compter que les avis récents", "Avec l'avis"],
          [
            "Journaux techniques (adresse IP, navigateur)",
            "Sécurité du site, lutte contre les abus",
            "Durée fixée par l'hébergeur du site",
          ],
        ],
        note: "L'e-mail ou le téléphone est obligatoire pour envoyer un avis. Un avis arrêté avant ce dernier écran n'est pas compté dans les résultats ; ses réponses sont gardées sans aucune donnée sur vous, pour nos statistiques internes. En envoyant votre avis, vous acceptez ce traitement.",
      },
      after: [
        {
          title: "Ce qui est publié",
          paragraphs: [
            "Seuls des résultats d'ensemble par organisme, selon les règles expliquées sur la page <method>Comment sont calculés les résultats</method>, dont le nombre minimum d'avis. Aucun avis individuel, aucun commentaire, aucune information sur vous.",
          ],
        },
        {
          title: "Qui y a accès",
          paragraphs: [
            "Seule l'équipe de NeexNaxari. Les organismes évalués n'ont jamais accès à vos coordonnées. Nous ne vendons et ne louons aucune donnée, et n'en faisons aucun usage commercial, publicitaire ou politique.",
          ],
        },
        {
          title: "Prestataires",
          paragraphs: [
            "Le site est hébergé par Vercel (États-Unis) et la base de données par Neon à Francfort (Allemagne). Ce transfert hors du Sénégal figure dans notre déclaration à la CDP, en cours. Ces prestataires ne peuvent pas utiliser vos données pour leur propre compte.",
          ],
        },
        {
          title: "Sécurité",
          paragraphs: [
            "Les échanges avec le site sont chiffrés. Vos coordonnées sont rangées à part de vos réponses. Seule l'équipe de NeexNaxari y accède, avec un mot de passe.",
          ],
        },
        {
          title: "Vos droits",
          paragraphs: [
            "Vous pouvez demander à consulter, corriger ou supprimer vos données personnelles, et vous opposer à leur utilisation, en écrivant à <contact>contact@neexnaxari.com</contact>. Nous répondons sous 30 jours. Si la réponse ne vous satisfait pas, vous pouvez saisir la CDP (<cdp>cdp.sn</cdp>).",
          ],
        },
        {
          title: "Stockage sur votre appareil",
          paragraphs: [
            "Le site ne pose pas de cookie publicitaire ni de mesure d'audience. Il garde seulement sur votre appareil les informations utiles à son bon fonctionnement.",
          ],
        },
      ],
    },
    terms: {
      title: "Conditions d'utilisation",
      intro: "En donnant un avis sur NeexNaxari, vous acceptez ces conditions.",
      sections: [
        {
          title: "1. Objet",
          paragraphs: [
            "NeexNaxari permet aux usagers de donner leur avis sur les services publics et privés au Sénégal, et publie des résultats d'ensemble par organisme. NeexNaxari ne transmet pas les avis et ne traite pas les plaintes : pour une réclamation, adressez-vous directement à l'organisme concerné.",
          ],
        },
        {
          title: "2. Gratuité",
          paragraphs: [
            "Donner un avis et consulter les résultats est gratuit. Les frais de connexion internet restent à votre charge.",
          ],
        },
        {
          title: "3. Vérification",
          paragraphs: ["Chaque avis est accompagné de vos coordonnées, qui doivent être les vôtres."],
        },
        {
          title: "4. Un avis sincère",
          paragraphs: [
            "Vous vous engagez à décrire une expérience que vous avez vécue vous-même. Sont interdits : les avis inventés, les avis contre rémunération, les avis donnés pour le compte d'un organisme ou contre un concurrent.",
          ],
        },
        {
          title: "5. Commentaires",
          paragraphs: [
            "Les commentaires écrits ne sont pas publiés. Ils sont relus par notre équipe. N'y mettez ni nom de personne, ni numéro de téléphone, ni propos injurieux ou contraires à la loi. Ne visez pas une personne en particulier : l'avis porte sur le service. Si un commentaire contient des informations personnelles, nous les effaçons.",
          ],
        },
        {
          title: "6. Droits sur vos réponses",
          paragraphs: [
            "En envoyant un avis, vous autorisez NeexNaxari à l'utiliser pour calculer et publier des résultats d'ensemble. Vos réponses ne sont ni vendues ni utilisées à des fins publicitaires.",
          ],
        },
        {
          title: "7. Modération",
          paragraphs: [
            "Nous pouvons écarter des résultats un avis qui ne respecte pas ces règles, ou une série d'avis suspects, sans avoir à nous justifier auprès de son auteur.",
          ],
        },
        {
          title: "8. Résultats publiés",
          paragraphs: [
            "Les résultats reflètent les avis reçus. Ils ne constituent ni un classement officiel, ni une inspection, ni un jugement sur des personnes. Leurs règles de calcul et de publication, dont le nombre minimum d'avis, sont expliquées sur la page <method>Comment sont calculés les résultats</method>.",
          ],
        },
        {
          title: "9. Organismes évalués",
          paragraphs: [
            "Un organisme peut signaler une erreur (nom, adresse, fermeture) à <contact>contact@neexnaxari.com</contact>. Il ne peut ni acheter, ni modifier, ni faire retirer ses résultats.",
          ],
        },
        {
          title: "10. Responsabilité",
          paragraphs: [
            "Nous faisons notre possible pour que le site fonctionne et que les résultats soient exacts, sans pouvoir le garantir à tout moment. L'auteur d'un avis reste responsable de ce qu'il écrit. Les signalements de contenu illicite se font à <contact>contact@neexnaxari.com</contact> (loi n° 2008-08 sur les transactions électroniques).",
          ],
        },
        {
          title: "11. Droit applicable",
          paragraphs: [
            "Ces conditions relèvent du droit sénégalais. En cas de désaccord, une solution amiable est recherchée d'abord, à <contact>contact@neexnaxari.com</contact> ; à défaut, les tribunaux de Dakar sont compétents. Elles sont susceptibles d'être modifiées.",
          ],
        },
      ],
    },
  },

  admin: {
    title: "Back-office",
    brand: "NeexNaxari",
    nav: {
      label: "Back-office",
      dashboard: "Tableau de bord",
      comments: "Commentaires",
      establishments: "Établissements",
      questionnaire: "Questionnaire",
      categories: "Catégories et thèmes",
      qrCodes: "QR codes",
      signOut: "Se déconnecter",
    },
    signIn: {
      title: "Connexion au back-office",
      restricted: "Back-office, accès réservé",
      password: "Mot de passe",
      submit: "Se connecter",
      wrong: "Mot de passe incorrect.",
      blocked: "Trop d'essais ratés. Réessayez dans 15 minutes.",
      notConfigured: "Le mot de passe n'est pas encore réglé (ADMIN_PASSWORD dans Vercel).",
    },
    dashboard: {
      title: "Tableau de bord",
      todo: "À traiter :",
      todoComments: "{n} commentaires à relire",
      todoComment: "1 commentaire à relire",
      todoEstablishments: "{n} établissements ajoutés par les usagers",
      todoEstablishment: "1 établissement ajouté par un usager",
      todoAnd: "et",
      nothingTodo: "Rien à traiter.",
      monthLabel: "Avis de la période",
      periodLabel: "Période",
      periodMonth: "Mois en cours",
      periodWeek: "Semaine en cours",
      periodDates: "Choisir des dates",
      periodFrom: "Du",
      periodTo: "au",
      periodApply: "Afficher",
      period: "Du {from} au {to}",
      periodOneDay: "Le {date}",
      complete: "Avis complets",
      notSent: "Avis non envoyés",
      abandon: "Abandon",
      stopsTitle: "Abandons par étape",
      stopsHelp:
        "Au-dessus de chaque bâton : abandons et part des avis commencés sur la période. Au survol : le détail. Les questions générales ne sont posées qu'aux non-satisfaits.",
      satisfied: "Satisfaits",
      notSatisfied: "Non satisfaits",
      stopTooltip: "{page} : {total} abandons, dont {satisfied} satisfaits et {notSatisfied} non satisfaits",
      stopPages: {
        details: "Précisions",
        sector: "Questions sur le service",
        common: "Questions générales",
        send: "Coordonnées",
      },
      weeksTitle: "Avis complets par semaine",
      weekOf: "Semaine du {date} : {n} avis complets",
      thisWeek: "{n} cette semaine",
      lastWeek: "{n} la semaine du {date}",
      satisfactionTitle: "Part de satisfaits",
      satisfactionComplete: "Avis complets",
      satisfactionNotSent: "Avis non envoyés",
      satisfactionHelp:
        "Si les avis non envoyés sont nettement moins satisfaits, le parcours décourage les avis négatifs. Un avis compte comme non envoyé 24 heures après son début.",
      commentedTitle: "Commentaires par établissement",
      commentedEstablishment: "Établissement",
      commentedTotal: "Commentaires",
      commentedPending: "À relire",
      commentedEmpty: "Aucun commentaire sur cette période.",
      commentedHelp: "Cliquez sur un établissement pour lire ses commentaires.",
      byEstablishmentTitle: "Avis par établissement",
      byEstablishmentComplete: "Complets",
      byEstablishmentNotSent: "Non complets",
      byEstablishmentEmpty: "Aucun avis sur cette période.",
      byEstablishmentHelp: "Un avis est complet quand l'usager a cliqué sur « Envoyer mon avis ». Il est non complet s'il n'est pas envoyé 24 heures après son début.",
    },
    comments: {
      title: "Commentaires à relire",
      lead: "Les commentaires ne sont jamais publiés. On les lit et on efface les noms, numéros et adresses e-mail.",
      show: "Afficher",
      pending: "À relire ({n})",
      reviewed: "Relus",
      order: "Trier",
      oldest: "Plus anciens d'abord",
      newest: "Plus récents d'abord",
      apply: "Afficher",
      empty: "Aucun commentaire à relire.",
      emptyReviewed: "Aucun commentaire relu.",
      visit: "Visite en {month}",
      notSent: "Avis non envoyé",
      maybePersonal: "Contient peut-être un numéro ou une adresse e-mail",
      markReviewed: "Relu",
      correct: "Effacer des informations personnelles",
      keptText: "Texte gardé",
      keptHelp: "Le texte d'origine est remplacé : les informations retirées ne sont gardées nulle part.",
      save: "Enregistrer",
      cancel: "Annuler",
      filteredOn: "Commentaires sur {name}.",
      unknownEstablishment: "cet établissement",
      allEstablishments: "Voir tous les établissements",
    },
    establishments: {
      title: "Établissements ajoutés par les usagers",
      lead: "Un usager qui ne trouve pas l'établissement l'ajoute à la main. Corrigez-le si besoin, puis validez-le (il apparaît dans la recherche), fusionnez-le avec un établissement existant ou refusez-le.",
      empty: "Aucun établissement à valider.",
      noSector: "Secteur inconnu",
      noType: "type non précisé",
      feedbacks: "{n} avis",
      added: "Ajouté le {date}",
      validate: "Valider",
      edit: "Modifier",
      merge: "Fusionner avec…",
      refuse: "Refuser",
      name: "Nom",
      municipality: "Commune",
      sector: "Secteur",
      type: "Type",
      otherType: "Autre ou non précisé",
      editHelp: "Choisissez un type du secteur choisi. Les prochains avis auront les questions du nouveau type.",
      saveAndValidate: "Enregistrer et valider",
      saveOnly: "Enregistrer sans valider",
      cancel: "Annuler",
      mergeWith: "Fusionner avec",
      mergeSearch: "Rechercher",
      mergePlaceholder: "Nom d'un établissement existant",
      mergeHelp: "Les {n} avis de « {name} » seront rattachés à l'établissement choisi.",
      mergeNoResult: "Aucun établissement trouvé.",
      mergeSubmit: "Fusionner",
      confirmRefuse: "Refuser « {name} » ?",
      confirmRefuseHelp: "Il n'apparaîtra pas dans la recherche, et ses {n} avis ne compteront dans aucun résultat.",
      error: "La correction n'a pas été enregistrée : vérifiez le nom, et que le type appartient bien au secteur.",
    },
    qrCodes: {
      title: "QR codes",
      lead: "Un QR code se colle dans un lieu précis : une agence, un magasin, un guichet. L'usager le scanne et arrive sur le formulaire, le lieu déjà rempli. Un organisme « en général » n'a pas de QR code : on en fait un par agence.",
      search: "Organisme ou établissement",
      searchPlaceholder: "La Poste, Auchan, Mairie de Grand Yoff…",
      searchSubmit: "Rechercher",
      searchTooShort: "Tapez au moins 2 lettres.",
      noResult: "Aucun organisme ni établissement trouvé.",
      organizations: "Organismes",
      places: "Établissements",
      sites: "{n} lieux",
      oneSite: "1 lieu",
      noSite: "aucun lieu",
      activeCodes: "{n} QR codes",
      oneActiveCode: "1 QR code",
      noCode: "pas de QR code",
      back: "Retour à la recherche",
      // A place
      codesTitle: "QR codes de ce lieu",
      noCodeYet: "Ce lieu n'a pas encore de QR code.",
      wholePlace: "Tout le lieu",
      createTitle: "Créer un QR code",
      service: "Service",
      serviceHelp: "Choisissez un service pour un guichet précis : l'usager n'aura pas à le choisir.",
      location: "Emplacement (facultatif)",
      locationPlaceholder: "Guichet 2, Accueil, Caisse…",
      locationHelp: "Imprimé sur l'affiche, pour savoir où la coller. Jamais montré dans le formulaire.",
      create: "Créer le QR code",
      createError: "Le QR code n'a pas été créé : l'emplacement fait 60 caractères au plus.",
      created: "Créé le {date}",
      inactive: "Désactivé",
      poster: "Affiche à imprimer",
      printPlace: "Imprimer toutes les affiches de ce lieu ({n})",
      download: "Image du QR code (SVG)",
      deactivate: "Désactiver",
      reactivate: "Réactiver",
      deactivateHelp: "Un QR code désactivé affiche « Ce QR code n'est plus actif ». Les avis déjà donnés restent.",
      // An organisation
      sitesTitle: "Lieux de {name}",
      noSites: "{name} n'a encore aucun lieu. Ajoutez ses agences ou magasins pour leur créer un QR code.",
      createMissing: "Créer un QR code pour chaque lieu qui n'en a pas ({n})",
      printAll: "Imprimer toutes les affiches ({n})",
      addSiteTitle: "Ajouter un lieu",
      addSitePlace: "Ville ou quartier",
      addSitePlaceholder: "Médina, Thiès, Touba…",
      addSiteHelp: "Le lieu s'appelle « {name} – Ville ou quartier ». Il est actif tout de suite et apparaît dans la recherche du site.",
      addSite: "Ajouter",
      addSiteError: "Le lieu n'a pas été ajouté : tapez entre 2 et 100 caractères.",
      // Posters
      withLogo: "Logo au centre du QR code",
      withoutLogo: "Sans logo au centre",
      print: "Imprimer",
      printHelp: "Une affiche par page A4. Pour un PDF : « Enregistrer au format PDF » dans la fenêtre d'impression.",
      noPoster: "Aucun QR code actif à imprimer.",
      posterTitle: "Donnez votre avis",
      posterScan: "Ouvrez l'appareil photo de votre téléphone et visez le code.",
      posterOr: "Sans appareil photo : allez sur",
    },
    questionnaire: {
      title: "Questionnaire",
      lead: "Les thèmes (écran 2b) et les questions (écran 6) reliés à chaque secteur, type d'établissement et service, puis la banque de questions. À côté de chaque nom de colonne : la colonne en base.",
      sector: "Secteur",
      type: "Type d'établissement",
      service: "Service",
      establishment: "Établissement",
      tabs: { levels: "Par niveau", overview: "Vue d'ensemble" },
      overview: {
        lead: "Chaque parcours qu'un usager peut suivre dans un établissement actif (secteur, type, raison de la visite), avec les thèmes et les questions qu'il voit, calculés comme sur le site. La couleur d'une case dit la liste d'où vient l'élément.",
        alertsTitle: "À vérifier",
        fewTopics: "parcours avec {max} thèmes ou moins",
        fewTopicsHelp: "Sans compter la ligne « Autre ».",
        duplicates: "doublons",
        duplicatesHelp: "Un élément apporté par deux listes : affiché une fois, mais une des listes est en trop pour ce parcours.",
        unusedTopics: "thèmes proposés nulle part",
        emptyLists: "listes vides",
        unusedLists: "listes que personne n'utilise",
        none: "Aucun.",
        views: { topics: "Parcours × thèmes", questions: "Parcours × questions", lists: "Listes", topicsList: "Thèmes" },
        allSectors: "Tous les secteurs",
        noSector: "Secteur inconnu",
        otherReason: "Autre démarche",
        path: "Parcours",
        count: "Nb",
        establishments: { one: "{count} établissement", other: "{count} établissements" },
        rowHelp: "Le nom d'un parcours ouvre son formulaire généré, pour le premier de ses établissements.",
        legendLevels: "Liste d'origine :",
        legendDuplicate: "Doublon (2 listes)",
        legendGated: "Affiché après une réponse",
        commonGroup: "Commun (écran 6b)",
        noCategory: "Sans catégorie",
        noTopic: "Aucun thème",
        noQuestion: "Aucune question",
        everyPath: "Commun, tous les parcours",
        categories: "Catégories",
        categoriesOf: "{count} sur {total}",
        missingCategories: "À compléter par d'autres listes :",
        listsHelp: "Les listes s'ajoutent : COMMON pour tous (sauf un service qui remplace les listes partagées), celle du secteur (COMMERCE s'il est inconnu), du type, puis du service. COMMON et ESSENTIAL sont trouvées par leur code.",
        list: "Liste",
        kind: { topics: "thèmes", questions: "questions" },
        state: "État",
        empty: "vide",
        unused: "inutilisée",
        usedBy: "Utilisée par",
        content: "Contenu",
        topic: "Thème",
        lists: "Listes",
        paths: "Parcours",
        noList: "aucune",
        limit: "Seuls les parcours des établissements actifs ont une ligne : un type ou un service qu'aucun établissement n'utilise encore n'apparaît que dans l'onglet Listes.",
      },
      form: {
        title: "Formulaire généré",
        help: "Ce que voit un usager avec ces filtres, calculé comme sur le site. Tous les thèmes et toutes les questions sont affichés : la ligne surlignée en jaune dit quand un élément ne s'affiche qu'après une réponse. Rien n'est cliquable.",
        hint: "Choisissez un établissement, ou au moins un secteur, pour voir le formulaire généré.",
        levels: "Calculé avec",
        noType: "sans type d'établissement",
        noSector: "secteur inconnu (listes COMMERCE)",
        otherReason: "Autre démarche (aucun service)",
        noReason: "aucun motif (l'établissement n'a pas de service)",
        screenTopics: "Écran 2b · thèmes",
        screenQuestions: "Écran 6 · questions",
        screenCommon: "Écran 6b · questions communes",
        none: "Aucune question : cet écran ne s'affiche pas.",
        shownIf: "Seulement si « {question} » : {answers}",
        listsLegend: "D'où vient chaque thème et chaque question : le code de sa liste, de la couleur de son niveau, puis sa catégorie en gris.",
        category: "Catégorie",
        levelNames: {
          common: "Commun",
          sector: "Secteur",
          type: "Type d'établissement",
          service: "Service",
        },
      },
      all: "Tous",
      noType: "Aucun type",
      apply: "Afficher",
      reset: "Tout afficher",
      sectorsTitle: "Secteurs",
      sectorsHelp:
        "Une ligne par secteur, à déplier : ses thèmes, puis ses questions. Ils viennent de sector_topic_set et sector_question_set ; un niveau peut avoir plusieurs listes, réunies par « + ». Une liste marquée « sans service » (only_without_service) ne s'ajoute qu'à un avis sans service : « Autre démarche », ou un établissement qui n'en propose aucun. Une liste marquée « sans type » (only_without_type) ne s'ajoute qu'à un établissement sans type (« Autre »).",
      typesTitle: "Types d'établissement",
      typesHelp:
        "Les services du type (establishment_type_service) sont proposés par tous ses établissements ; un établissement peut en avoir d'autres à lui (establishment_service). Les thèmes et les questions viennent de establishment_type_topic_set et establishment_type_question_set. Une liste marquée « sans service » ne s'ajoute qu'à « Autre démarche ».",
      servicesTitle: "Services",
      servicesHelp:
        "Les établissements viennent de establishment_service. Un service reçoit aussi les listes de son secteur, sauf celles marquées « sans service », et celles du type. Thèmes et questions viennent de service_topic_set et service_question_set.",
      bankTitle: "Banque de questions",
      bankHelp:
        "Une ligne par question, chacune écrite une seule fois. Dépliée : ses réponses possibles. « Conditions » vient de question_condition, liste par liste. Avec un filtre : les questions des listes ci-dessus, plus celles que tout avis peut recevoir (ESSENTIAL, COMMON) et celles qui ouvrent un de leurs thèmes à l'écran 2b.",
      categoriesPageTitle: "Catégories et thèmes",
      categoriesPageLead:
        "Les catégories, puis tous les thèmes de l'écran 2b. Pas de filtre : une catégorie et un thème valent pour tous les secteurs. À côté de chaque nom de colonne : la colonne en base.",
      categoriesTitle: "Catégories",
      categoriesHelp:
        "Une catégorie regroupe des thèmes de l'écran 2b et des questions de l'écran 6 sur le même sujet (topic.category_id, question.category_id).",
      topicsTitle: "Thèmes",
      topicsHelp:
        "Tous les thèmes, actifs ou non, dans l'ordre des catégories puis de topic.position. « Listes » : les listes de thèmes qui le contiennent (topic_set_item) ; un thème sans liste n'est proposé à personne.",
      code: "Code",
      label: "Label",
      text: "Texte",
      questionType: "Type",
      category: "Catégorie",
      lists: "Listes",
      position: "Position",
      shownIf: "Conditions",
      topicShownIf: "Conditions",
      opensTopics: "Ouvre les thèmes",
      noTopic: "aucun",
      always: "toujours",
      noList: "aucune",
      or: " ou ",
      services: "Services",
      establishments: "Établissements",
      withoutService: "sans service",
      withoutType: "sans type",
      groups: {
        topics: "Thème",
        questions: "Questions",
        answers: "Réponses",
        condition: "Condition",
        question: "Question",
      },
      list: "Liste",
      topic: "Thème",
      question: "Question",
      answer: "Réponse",
      active: "Actif",
      topicCount: "{n} thèmes",
      topicCountOne: "1 thème",
      questionCount: "{n} questions",
      questionCountOne: "1 question",
      answerCount: "{n} réponses",
      answerCountOne: "1 réponse",
      grid: {
        emptyList: "liste vide",
        none: "aucun",
        more: "+ {n} autres",
        moreOne: "+ 1 autre",
        expandAll: "Tout déplier",
        collapseAll: "Tout replier",
        exportCsv: "Exporter CSV",
        rows: "{n} lignes",
        rowsOne: "1 ligne",
        empty: "Aucune ligne pour ce filtre.",
      },
    },
  },
};

export type Dictionary = typeof fr;
