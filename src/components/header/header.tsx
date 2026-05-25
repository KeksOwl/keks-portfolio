import Link from "next/link";
import type { Locale } from "@/app/[locale]/layout";
import LangSwitcher from "@/components/lang-switcher/lang-switcher";
import styles from "./header.module.scss";

interface HeaderProps {
  locale: Locale;
}

export default async function Header({ locale }: HeaderProps) {
  const dict = (await import(`./${`header.${locale}.json`}`)).default;

  return (
    <header className={styles.header}>
        <Link href={`/${locale}`} className={styles.logo}>
          KeksOwl
          <span className={styles.spec}>
            {dict.spec}
          </span>
        </Link>
        <LangSwitcher className={styles.langSwitch} locale={locale} label={dict.langSwitch} />
    </header>
  );
}
