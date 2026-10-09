import Link from "next/link";
import styles from "../admin.module.css";

/** The two pages of « Questionnaire »: by level, and the overview (asked by Olivia, 2026-10-09). */
export function QuestionnaireTabs({ current, text }: { current: "levels" | "overview"; text: { levels: string; overview: string } }) {
  const tab = (key: "levels" | "overview", href: string) => (
    <Link href={href} className={styles.tab} aria-current={current === key ? "page" : undefined}>
      {text[key]}
    </Link>
  );
  return (
    <nav className={styles.tabs}>
      {tab("levels", "/console-bo/questionnaire")}
      {tab("overview", "/console-bo/questionnaire/vue-ensemble")}
    </nav>
  );
}
