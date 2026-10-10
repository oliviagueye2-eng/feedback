import { getDictionary } from "../../_i18n";
import styles from "./screen.module.css";

/**
 * How far each screen of a feedback is, in percent. No « step 2 of 5 »: the
 * number of screens depends on the answers (agency, sector and common
 * questions), so a count would change on the way. A screen that is skipped
 * only makes the bar jump further; it never goes back (decided 2026-10-10).
 */
const SCREENS = {
  establishment: 15,
  site: 25,
  essential: 40,
  details: 55,
  sector: 70,
  common: 85,
  send: 100,
} as const;

/** Thin bar at the top of each screen of a feedback, before « Merci ». */
export async function Progress({ screen }: { screen: keyof typeof SCREENS }) {
  const { common } = await getDictionary();
  const value = SCREENS[screen];
  return (
    <div
      className={styles.progress}
      role="progressbar"
      aria-label={common.progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <span style={{ width: `${value}%` }} />
    </div>
  );
}
