"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../admin.module.css";

/** A link of the back-office menu, marked as the current page where it is. */
export function NavLink({ href, label, count }: { href: string; label: string; count?: number }) {
  const pathname = usePathname();
  // A page under a menu entry keeps it marked (Questionnaire › Vue d'ensemble), the dashboard aside.
  const current = pathname === href || (href !== "/console-bo" && pathname.startsWith(`${href}/`));
  return (
    <Link href={href} className={styles.navLink} aria-current={current ? "page" : undefined}>
      {label}
      {count !== undefined && count > 0 && <span className={styles.count}>{count}</span>}
    </Link>
  );
}
