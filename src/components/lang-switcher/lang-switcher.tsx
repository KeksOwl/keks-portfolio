"use client";

import { useLocale } from "@/components/locale-provider/locale-provider";
import styles from "./lang-switcher.module.scss";

export default function LangSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className={styles.switcher} data-paw-target>
      {locale === "en" ? (
        <span className={styles.active}>EN</span>
      ) : (
        <button className={styles.btn} onClick={() => setLocale("en")}>EN</button>
      )}
      {locale === "ru" ? (
        <span className={styles.active}>RU</span>
      ) : (
        <button className={styles.btn} onClick={() => setLocale("ru")}>RU</button>
      )}
    </div>
  );
}
