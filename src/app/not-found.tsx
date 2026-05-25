"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider/locale-provider";
import styles from "./not-found.module.scss";
import en from "./not-found.en.json";
import ru from "./not-found.ru.json";

const dicts = { en, ru };

export default function NotFound() {
  const { locale } = useLocale();
  const dict = dicts[locale];

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>
        <span>404</span>
        {dict.message} :\
      </h1>
      <Link href="/" className={styles.link}>
        {dict.link}
      </Link>
    </div>
  );
}
