"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider/locale-provider";
import { Reveal } from "@/components";
import LabNav from "./lab-nav";
import styles from "./lab.module.scss";
import en from "./lab.en.json";
import ru from "./lab.ru.json";

const dicts = { en, ru };

export default function LabHub() {
  const { locale } = useLocale();
  const dict = dicts[locale];

  return (
    <>
      <section className="container">
        <LabNav />
        <h1 className={styles.heading}>{dict.heading}</h1>
        <p className={styles.intro}>{dict.intro}</p>
      </section>

      <Reveal>
        <hr />
        <section className="container section">
          <h2 className="visually-hidden">{dict.playground}</h2>
          <ul className={styles.gameList}>
            <li>
              <Link href="/lab/paw" className={styles.gameLink} data-paw-target>
                <h3 className={styles.gameTitle}>{dict.experiments.paw.title}</h3>
                <p className={styles.gameBlurb}>{dict.experiments.paw.blurb}</p>
                <span className={styles.cta}>{dict.open} →</span>
              </Link>
            </li>
          </ul>
        </section>
      </Reveal>
    </>
  );
}
