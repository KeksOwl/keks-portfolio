import type { Locale } from "./layout";
import styles from "./page.module.scss";
import { ArrowUpRight } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  const dict = (await import(`./${`page.${locale}.json`}`)).default;
  const isOpen = true;

  const heroList = [
    {
      id: "email",
      link: "mailto:info@keksowl.com",
      text: "E-mail"
    },
    {
      id: "github",
      link: "https://github.com/keksowl",
      text: "GitHub"
    },
    {
      id: "telegram",
      link: "https://t.me/keksowl",
      text: "Telegram"
    }
  ]

  return (
    <>
      <h1 className="visually-hidden">{dict.header}</h1>

      <section className={styles.hero}>
        <h2 className="visually-hidden">{dict.hero.title}</h2>
        <p className={styles.heroSupText + " " + (isOpen ? "" : styles.heroSupTextNegative)}>{isOpen ? dict.hero.available : dict.hero.notAvailable}</p>

        <h3 className={styles.heroHeading}>{dict.hero.heading}</h3>
        <p className={styles.heroMainText}>
          {dict.hero.mainText}<br/><br/>
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
