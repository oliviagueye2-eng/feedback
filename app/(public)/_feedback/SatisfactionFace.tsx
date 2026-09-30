/** Answer codes of the essential question, from very satisfied (1) to not at all (5). */
export const SATISFACTION_LEVEL: Record<string, 1 | 2 | 3 | 4 | 5> = {
  VERY_SATISFIED: 1,
  SATISFIED: 2,
  NEUTRAL: 3,
  DISSATISFIED: 4,
  VERY_DISSATISFIED: 5,
};

// The mouth of each face; only level 1 is an open smile (filled).
const MOUTHS = {
  1: "M7.5 13.5 Q12 19.5 16.5 13.5",
  2: "M8 14.5 Q12 17.5 16 14.5",
  3: "M8.5 15.5 L15.5 15.5",
  4: "M8 16.5 Q12 13.8 16 16.5",
  5: "M7.5 17.5 Q12 12 16.5 17.5",
} as const;

/**
 * A face drawn for the site (not an emoji: the same on every phone), in the
 * colour of its level (--satisfaction-N in globals.css). Decorative: the
 * answer's text says the same thing.
 */
export function SatisfactionFace({ level, className }: { level: 1 | 2 | 3 | 4 | 5; className?: string }) {
  const color = `var(--satisfaction-${level})`;
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill={`var(--satisfaction-${level}-tint)`} stroke={color} strokeWidth="1.8" />
      <circle cx="8.6" cy="9.6" r="1.3" fill={color} />
      <circle cx="15.4" cy="9.6" r="1.3" fill={color} />
      <path
        d={MOUTHS[level]}
        fill={level === 1 ? color : "none"}
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
