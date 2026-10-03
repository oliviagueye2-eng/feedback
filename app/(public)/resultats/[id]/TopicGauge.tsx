import styles from "./results.module.css";

/**
 * One icon per topic, drawn for the site (stroke 2, 24 × 24). Decorative:
 * the short label next to it says the same thing.
 */
const ICONS: Record<string, string> = {
  STAFF: "M12 21s-7-4.4-9-9.2C1.6 8.3 3.6 5 7 5c2 0 3.3 1.1 5 3 1.7-1.9 3-3 5-3 3.4 0 5.4 3.3 4 6.8C19 16.6 12 21 12 21z",
  PROFESSIONALISM: "M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6zM8.5 12l2.5 2.5 4.5-5",
  INFORMATION: "M4 5h16v11H9l-5 4zM8 9h8M8 12h5",
  PRIVACY: "M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5zM12 15v2",
  RIGHTS_RESPECT: "M12 4v16M7 20h10M5 8h14M5 8l-2.5 6a2.5 2.5 0 0 0 5 0zM19 8l-2.5 6a2.5 2.5 0 0 0 5 0z",
  STUDENT_SUPERVISION: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5M21 20c0-2.6-1.6-4.8-4-5.6",
  PARENT_COMMUNICATION: "M3 4h12v8H7l-4 3zM9 15v2h8l4 3V9h-3",
  WAIT_TIME: "M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9",
  PROCESSING_TIME: "M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h4",
  INTERVENTION_TIME: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z",
  PUNCTUALITY: "M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2.5 1.5M9 2h6",
  PROCEDURE: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
  CASE_TRACKING: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5",
  OPENING_HOURS: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  CUSTOMER_SERVICE: "M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H4zM17 14h3v5h-3zM20 19c0 1.5-1.5 2-4 2h-3",
  FEES: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2",
  BILLING: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3",
  CARE_RECEIVED: "M9 3h6v6h6v6h-6v6H9v-6H3V9h6z",
  MEDICINE_AVAILABILITY: "M10.5 20.5a5 5 0 0 1-7-7l7-7a5 5 0 0 1 7 7zM7 10l7 7",
  TEACHING_QUALITY: "M4 5a2 2 0 0 1 2-2h14v15H6a2 2 0 0 0-2 2zM4 20a2 2 0 0 0 2 2h14v-4",
  REQUEST_HANDLING: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12l3 3 5-6",
  POWER_CUTS: "M13 2L4 14h7l-1 8 9-12h-7z",
  WATER_CUTS: "M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11zM4 4l16 16",
  WATER_QUALITY: "M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11zM9 15a3 3 0 0 0 3 3",
  NETWORK_QUALITY: "M4 20v-3M9 20v-6M14 20v-9M19 20V5",
  CLEANLINESS: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z",
  ACCESS_FOR_ALL: "M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 8l6 1 6-1M12 9v5M12 14l-3 7M12 14l3 7",
  ONBOARD_SAFETY: "M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z",
  SCHOOL_SAFETY: "M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z",
  SCHOOL_EQUIPMENT: "M3 10h18M5 10v10M19 10v10M7 10V6h10v4M3 15h18",
  VEHICLE_CONDITION: "M5 17h14V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2zM5 12h14M8 20v-3M16 20v-3M8 9h8",
};
const FALLBACK_ICON = "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8v4M12 16h.01";

/** The 3 zones of the scale, those of the rule: under 50 %, 50 to 60 %, from 60 % (2026-10-03). */
const ZONES = [
  { from: 0, to: 0.5, color: "var(--satisfaction-5)" },
  { from: 0.5, to: 0.6, color: "var(--satisfaction-3)" },
  { from: 0.6, to: 1, color: "var(--satisfaction-1)" },
];
const CX = 75;
const CY = 78;
const R = 62;
/** Point of the half circle at `share` of it, from the left end (0) to the right one (1). */
const at = (share: number, radius = R) => {
  const angle = Math.PI * (1 - share);
  return [(CX + radius * Math.cos(angle)).toFixed(1), (CY - radius * Math.sin(angle)).toFixed(1)] as const;
};

/**
 * A strength or a point to improve: a half-circle gauge with a needle on the
 * share of « Bien », then the topic's icon and short label, the percent and
 * the number of ratings. The kind (« Point fort », « À améliorer ») is read
 * by screen readers only: the section title and the colour say it already.
 */
export function TopicGauge({
  code,
  label,
  kind,
  percent,
  count,
  strength,
}: {
  code: string;
  label: string;
  kind: string;
  percent: number;
  count: string;
  strength: boolean;
}) {
  const [nx, ny] = at(percent / 100, R - 18);
  return (
    <li className={styles.gauge}>
      <svg className={styles.gaugeScale} viewBox="0 0 150 86" aria-hidden="true">
        {ZONES.map((zone) => {
          // A small gap between the zones.
          const [x0, y0] = at(zone.from + (zone.from > 0 ? 0.005 : 0));
          const [x1, y1] = at(zone.to - (zone.to < 1 ? 0.005 : 0));
          return (
            <path key={zone.from} d={`M${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1}`} stroke={zone.color} strokeWidth="13" fill="none" />
          );
        })}
        <line x1={CX} y1={CY} x2={nx} y2={ny} stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
        <circle cx={CX} cy={CY} r="6" fill="var(--ink)" />
      </svg>
      <span className={styles.gaugeName}>
        <span className="visually-hidden">{kind} </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={ICONS[code] ?? FALLBACK_ICON} />
        </svg>
        {label}
      </span>
      <strong className={strength ? styles.gaugeGood : styles.gaugeBad}>{percent} %</strong>
      <span className={`muted ${styles.gaugeCount}`}>{count}</span>
    </li>
  );
}
