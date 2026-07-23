"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/locale-provider/locale-provider";
import LangSwitcher from "@/components/lang-switcher/lang-switcher";
import NavigationProgress from "@/components/navigation-progress/navigation-progress";
import styles from "./header.module.scss";
import en from "./header.en.json";
import ru from "./header.ru.json";

const dicts = { en, ru };

export default function Header() {
  const { locale } = useLocale();
  const dict = dicts[locale];
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  // Lock page scroll behind the fullscreen mobile menu
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo} data-paw-target onClick={closeMenu}>
        KeksOwl
        <span className={styles.spec}>
          {dict.spec}
        </span>
      </Link>
      <div className={styles.right}>
        <nav className={styles.nav} data-paw-target>
          <Link href="/lab" className={styles.navLink}>{dict.lab}</Link>
          <Link href="/cv" className={styles.navLink}>{dict.cv}</Link>
        </nav>
        <LangSwitcher />
        <button
          type="button"
          className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ""}`}
          aria-expanded={menuOpen}
          aria-label={dict.menu}
          onClick={() => setMenuOpen(open => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      <nav className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ""}`} data-paw-target>
        <Link href="/" className={styles.mobileLink} onClick={closeMenu}>{dict.home}</Link>
        <Link href="/lab" className={styles.mobileLink} onClick={closeMenu}>{dict.lab}</Link>
        <Link href="/cv" className={styles.mobileLink} onClick={closeMenu}>{dict.cv}</Link>
      </nav>
      <NavigationProgress />
    </header>
  );
}
