"use client";

import { useLocale, type Locale } from "@/components/locale-provider/locale-provider";
import styles from "./lang-switcher.module.scss";

const labels: Record<Locale, string> = {
  en: "Switch language to Russian",
  ru: "Переключить язык на английский",
};

export default function LangSwitcher() {
  const { locale, setLocale } = useLocale();
  const nextLocale: Locale = locale === "en" ? "ru" : "en";

  return (
    <button
      type="button"
      className={styles.switcher}
      onClick={() => setLocale(nextLocale)}
      aria-label={labels[locale]}
      data-paw-target
    >
      <span className={`${styles.indicator} ${locale === "ru" ? styles.indicatorRight : ""}`} aria-hidden="true" />
      <span className={`${styles.option} ${locale === "en" ? styles.active : ""}`}>EN</span>
      <span className={`${styles.option} ${locale === "ru" ? styles.active : ""}`}>RU</span>
    </button>
  );
}
