"use client";

import { useLocale } from "@/components/locale-provider/locale-provider";
import { ArrowUpRight } from "lucide-react";
import styles from "./page.module.scss";
import en from "./page.en.json";
import ru from "./page.ru.json";

const dicts = { en, ru };

const heroList = [
  { id: "email", link: "mailto:info@keksowl.com", text: "E-mail" },
  { id: "github", link: "https://github.com/keksowl", text: "GitHub" },
  { id: "telegram", link: "https://t.me/keksowl", text: "Telegram" },
];

export default function HomePage() {
  const { locale } = useLocale();
  const dict = dicts[locale];
  const isOpen = true;

  return (
    <>
      <h1 className="visually-hidden">{dict.header}</h1>

      <section className={styles.hero}>
        <h2 className="visually-hidden">{dict.hero.title}</h2>
        <p className={`${styles.heroSupText} ${isOpen ? "" : styles.heroSupTextNegative}`}>
          {isOpen ? dict.hero.available : dict.hero.notAvailable}
        </p>

        <h3 className={styles.heroHeading}>{dict.hero.heading}</h3>
        <p className={styles.heroMainText}>
          {dict.hero.mainText}<br /><br />
          {dict.hero.mainTextSecond}
        </p>
        <p className={styles.heroSubText}>{dict.hero.subText}</p>

        <ul className={styles.heroList}>
          {heroList.map(heroItem => (
            <li className={styles.heroItem} key={heroItem.id}>
              <a href={heroItem.link} className={styles.heroLink} rel="noopener" target="_blank">
                {heroItem.text}
                <ArrowUpRight size={14} />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
