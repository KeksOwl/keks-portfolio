"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/locale-provider/locale-provider";
import { EXPERIMENTS } from "./experiments";
import styles from "./lab-nav.module.scss";
import en from "./lab.en.json";
import ru from "./lab.ru.json";

const dicts = { en, ru };

export default function LabNav() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const dict = dicts[locale];

  return (
    <nav className={styles.nav} aria-label={dict.title} data-paw-target>
      <Link
        href="/lab"
        className={`${styles.link} ${pathname === "/lab" ? styles.active : ""}`}
      >
        {dict.title}
      </Link>
      {EXPERIMENTS.map((exp) => {
        const href = `/lab/${exp.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={exp.slug}
            href={href}
            className={`${styles.link} ${active ? styles.active : ""}`}
          >
            {dict.experiments[exp.slug].title}
            {exp.sticky ? <span className={styles.stickyMark} aria-hidden="true">*</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
