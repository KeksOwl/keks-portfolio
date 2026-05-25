"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider/locale-provider";
import LangSwitcher from "@/components/lang-switcher/lang-switcher";
import styles from "./header.module.scss";
import en from "./header.en.json";
import ru from "./header.ru.json";

const dicts = { en, ru };

export default function Header() {
  const { locale } = useLocale();
  const dict = dicts[locale];

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        KeksOwl
        <span className={styles.spec}>
          {dict.spec}
        </span>
      </Link>
      <LangSwitcher />
    </header>
  );
}
