import styles from "../admin.module.css";

/**
 * The dashboard's charts, drawn in SVG on the server: no library, no
 * JavaScript (choice of 2026-10-07). Satisfied in the green of the « Très
 * satisfait » face, not satisfied in the orange of « Pas satisfait » (checked
 * for colour blindness); every bar carries its number, and its detail on hover.
 */

const SATISFIED = "var(--satisfaction-1)";
const NOT_SATISFIED = "var(--satisfaction-4)";
const GRID = "var(--line-light)";
const MUTED = "var(--muted)";
const INK = "var(--ink)";

/** A round top for the axis: 4, then 10, 20, 50, 100… above the highest value. */
function niceMax(value: number): number {
  if (value <= 4) return 4;
  const power = 10 ** Math.floor(Math.log10(value));
  return [1, 2, 5, 10].map((m) => m * power).find((m) => m >= value) ?? value;
}

/** The axis lines: 0, half and top, all whole numbers. */
const ticks = (max: number) => (max % 2 === 0 ? [0, max / 2, max] : [0, max]);

export interface StopBar {
  label: string;
  satisfied: number;
  notSatisfied: number;
  /** Above the bar: « 12 (8 %) ». */
  caption: string;
  /** On hover. */
  detail: string;
}

/** One stacked bar per page: not satisfied below, satisfied above. */
export function StopBars({ bars, label }: { bars: StopBar[]; label: string }) {
  const W = 520;
  const base = 170;
  const top = 34;
  const max = niceMax(Math.max(1, ...bars.map((b) => b.satisfied + b.notSatisfied)));
  const scale = (base - top) / max;
  const width = 60;
  const step = (W - 56) / bars.length;
  return (
    <svg viewBox={`0 0 ${W} 214`} role="img" aria-label={label}>
      {ticks(max).map((v) => (
        <g key={v}>
          <line x1="44" x2={W - 8} y1={base - v * scale} y2={base - v * scale} stroke={GRID} />
          <text x="36" y={base - v * scale + 4} fontSize="12" fill={MUTED} textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      {bars.map((b, i) => {
        const x = 52 + i * step + (step - width) / 2;
        const lower = b.notSatisfied * scale;
        const upper = b.satisfied * scale;
        const gap = lower > 0 && upper > 0 ? 2 : 0;
        const barTop = base - lower - gap - upper;
        const [first, ...rest] = b.label.split(" ");
        const lines = rest.length > 1 ? [`${first} ${rest[0]}`, rest.slice(1).join(" ")] : [b.label];
        return (
          <g key={b.label}>
            <title>{b.detail}</title>
            {lower > 0 && <rect x={x} y={base - lower} width={width} height={lower} fill={NOT_SATISFIED} />}
            {upper > 0 && <rect x={x} y={barTop} width={width} height={upper} fill={SATISFIED} rx="4" />}
            <text x={x + width / 2} y={barTop - 8} fontSize="13" fill={INK} textAnchor="middle">
              {b.caption}
            </text>
            {lines.map((line, n) => (
              <text key={line} x={x + width / 2} y={base + 17 + n * 14} fontSize="12" fill={MUTED} textAnchor="middle">
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export function StopLegend({ satisfied, notSatisfied }: { satisfied: string; notSatisfied: string }) {
  return (
    <div className={styles.legend}>
      <span>
        <span className={`${styles.swatch} ${styles.satisfied}`} />
        {satisfied}
      </span>
      <span>
        <span className={`${styles.swatch} ${styles.notSatisfied}`} />
        {notSatisfied}
      </span>
    </div>
  );
}

export interface WeekPoint {
  /** Under the axis: « 5 oct. ». */
  label: string;
  count: number;
  /** On hover. */
  detail: string;
}

/** Feedbacks sent per week; the last point carries its number. One week alone sits in the middle. */
export function WeekLine({ points, label, lastCaption }: { points: WeekPoint[]; label: string; lastCaption: string }) {
  const W = 520;
  const H = 190;
  const max = niceMax(Math.max(1, ...points.map((p) => p.count)));
  const x = (i: number) => (points.length === 1 ? W / 2 : 44 + (i * (W - 64)) / (points.length - 1));
  const y = (v: number) => H - 34 - (v / max) * (H - 64);
  const last = points.length - 1;
  // A long period: one date in `step` under the line, the last one always shown.
  const step = Math.ceil(points.length / 9);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {ticks(max).map((v) => (
        <g key={v}>
          <line x1="44" x2={W - 20} y1={y(v)} y2={y(v)} stroke={GRID} />
          <text x="36" y={y(v) + 4} fontSize="12" fill={MUTED} textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      <path
        d={points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.count)}`).join(" ")}
        fill="none"
        stroke={SATISFIED}
        strokeWidth="2"
      />
      {points.map((p, i) => (
        <g key={p.label}>
          <title>{p.detail}</title>
          {/* A larger invisible target for the hover. */}
          <circle cx={x(i)} cy={y(p.count)} r="12" fill="transparent" />
          {i === last && <circle cx={x(i)} cy={y(p.count)} r="4" fill={SATISFIED} stroke="#fff" strokeWidth="2" />}
          {(last - i) % step === 0 && (
            <text x={x(i)} y={H - 12} fontSize="12" fill={MUTED} textAnchor="middle">
              {p.label}
            </text>
          )}
        </g>
      ))}
      {last >= 0 && (
        <text x={x(last)} y={y(points[last]!.count) - 12} fontSize="13" fill={INK} textAnchor="end">
          {lastCaption}
        </text>
      )}
    </svg>
  );
}

/** A horizontal bar per group: the share of satisfied. */
export function ShareBar({ label, percent, none }: { label: string; percent: number | null; none: string }) {
  return (
    <div className={styles.bar}>
      <span>{label}</span>
      <span className={styles.track}>
        {percent !== null && <span className={styles.fill} style={{ width: `${percent}%` }} />}
      </span>
      <span style={{ textAlign: "right" }}>{percent === null ? none : `${percent} %`}</span>
    </div>
  );
}
