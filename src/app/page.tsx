"use client";

import { useLocale } from "@/components/locale-provider/locale-provider";
import { Reveal } from "@/components";
import { ArrowUpRight } from "lucide-react";
import styles from "./page.module.scss";
import en from "./page.en.json";
import ru from "./page.ru.json";

const dicts = { en, ru };

const heroList = [
  { id: "email", link: "mailto:info@keksowl.com", text: "E-mail", external: false },
  { id: "github", link: "https://github.com/keksowl", text: "GitHub", external: true },
  { id: "telegram", link: "https://t.me/keksowl", text: "Telegram", external: true },
];

const aboutList = ["composition", "product", "craft", "ownership"] as const;

export default function HomePage() {
  const { locale } = useLocale();
  const dict = dicts[locale];
  const isOpen = true;

  return (
    <>
      <h1 className="visually-hidden">{dict.header}</h1>

      <section className="container">
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

        <ul className={styles.heroList} data-paw-target>
          {heroList.map(heroItem => (
            <li className={styles.heroItem} key={heroItem.id}>
              <a href={heroItem.link} className={styles.heroLink} {...(heroItem.external ? { rel: "noopener", target: "_blank" } : {})}>
                {heroItem.text}
                <ArrowUpRight size={14} />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <Reveal>
        <hr/>
        <section className="container section">
          <h2 className="section-title">{dict.about.title}</h2>
          <p className={styles.aboutText}>
            {dict.about.mainText.split("{role}")[0]}<strong>{dict.about.mainTextRole}</strong>{dict.about.mainText.split("{role}")[1]}<br/><br/>
            {dict.about.mainTextSecond}<br/><br/>
            {dict.about.mainTextThird}
          </p>
          <ul className={styles.aboutList}>
            {aboutList.map(id => (
              <li className={styles.aboutItem} key={id}>
                <h3 className={styles.aboutItemTitle}>{dict.about[id].title}</h3>
                <p className={styles.aboutItemText}>{dict.about[id].text}</p>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>
    </>
  );
}
