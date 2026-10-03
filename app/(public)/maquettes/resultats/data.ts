/**
 * MAQUETTE : chiffres fictifs pour comparer deux présentations des résultats.
 * Ces pages ne lisent pas la base et ne doivent pas être mises en ligne telles quelles.
 */

export const SAMPLE = {
  name: "Mairie de Grand Yoff",
  details: "Grand Yoff, Administration et état civil",
  period: "juillet à septembre 2026",
  publishedOn: "1er octobre 2026",
  publishedShort: "01/10/2026",
  feedbackCount: 48,
  /** Réponses à « Êtes-vous satisfait(e) du service reçu ? », du niveau 1 (très satisfait) au 5. */
  levels: [
    { level: 1, label: "Très satisfait(e)", count: 14 },
    { level: 2, label: "Satisfait(e)", count: 20 },
    { level: 3, label: "Moyennement satisfait(e)", count: 8 },
    { level: 4, label: "Peu satisfait(e)", count: 4 },
    { level: 5, label: "Pas du tout satisfait(e)", count: 2 },
  ] as const,
  /** « Avez-vous obtenu ce que vous étiez venu(e) chercher ? » (40 réponses sur 48). */
  goal: { yes: 24, partly: 9, no: 7 },
  /** Thèmes de l'écran 2b : nombre de « Bien » et de « Pas bien ». */
  topics: [
    { label: "Accueil et politesse", good: 21, bad: 5 },
    { label: "Horaires d'ouverture", good: 11, bad: 3 },
    { label: "Explications reçues", good: 15, bad: 6 },
    { label: "Propreté et confort des locaux", good: 8, bad: 10 },
    { label: "Frais payés (montant, reçu)", good: 7, bad: 9 },
    { label: "Simplicité de la démarche (papiers, allers-retours)", good: 9, bad: 14 },
    { label: "Temps d'attente", good: 6, bad: 24 },
  ],
  /** Mois par mois : un mois sous le seuil n'a pas de résultat. */
  months: [
    { month: "avr.", full: "Avril", count: 12, satisfied: 7 },
    { month: "mai", full: "Mai", count: 9, satisfied: null },
    { month: "juin", full: "Juin", count: 16, satisfied: 10 },
    { month: "juil.", full: "Juillet", count: 15, satisfied: 10 },
    { month: "août", full: "Août", count: 14, satisfied: 9 },
    { month: "sept.", full: "Septembre", count: 19, satisfied: 15 },
  ],
};

/** État « pas encore assez d'avis ». */
export const SAMPLE_EMPTY = {
  name: "Mairie de la Médina",
  details: "Médina, Administration et état civil",
  feedbackCount: 4,
  threshold: 10,
};

export const MIN_FEEDBACK = 10;

/** Satisfaits = niveaux 1 et 2 ; moyennement = 3 ; pas satisfaits = 4 et 5. */
export function groups() {
  const c = SAMPLE.levels.map((l) => l.count);
  const total = c.reduce((a, b) => a + b, 0);
  return {
    total,
    satisfied: c[0] + c[1],
    neutral: c[2],
    unsatisfied: c[3] + c[4],
  };
}

/** Arrondi « sur 10 » dont la somme fait toujours 10 (plus forts restes). */
export function outOfTen(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  const raw = values.map((v) => (v * 10) / total);
  const floors = raw.map(Math.floor);
  let rest = 10 - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (rest-- <= 0) break;
    floors[i] += 1;
  }
  return floors;
}

export function percent(part: number, total: number): number {
  return Math.round((part * 100) / total);
}
