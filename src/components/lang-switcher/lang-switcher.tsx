"use client";

import { useLocale } from "@/components/locale-provider/locale-provider";
import styles from "./lang-switcher.module.scss";

export default function LangSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className={styles.switcher} data-paw-target>
      <span className={`${styles.indicator} ${locale === "ru" ? styles.indicatorRight : ""}`} aria-hidden="true" />
      <button
        className={`${styles.btn} ${locale === "en" ? styles.active : ""}`}
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        className={`${styles.btn} ${locale === "ru" ? styles.active : ""}`}
        onClick={() => setLocale("ru")}
        aria-pressed={locale === "ru"}
      >
        RU
      </button>
    </div>
  );
}
