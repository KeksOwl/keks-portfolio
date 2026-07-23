"use client";

import { useLocale } from "@/components/locale-provider/locale-provider";
import { Reveal } from "@/components";
import { ArrowUpRight, Printer } from "lucide-react";
import styles from "./page.module.scss";
import en from "./page.en.json";
import ru from "./page.ru.json";

const dicts = { en, ru };

const contacts = [
  { id: "email", link: "mailto:info@keksowl.com", text: "E-mail", external: false },
  { id: "github", link: "https://github.com/keksowl", text: "GitHub", external: true },
  { id: "telegram", link: "https://t.me/keksowl", text: "Telegram", external: true },
];

export default function CvView() {
  const { locale } = useLocale();
  const dict = dicts[locale];
  const isOpen = true;

  return (
    <>
      <section className="container">
        <p className={`${styles.availability} ${isOpen ? "" : styles.availabilityNegative}`}>
          {isOpen ? dict.header.available : dict.header.notAvailable}
        </p>
        <h1 className={styles.name}>{dict.header.name}</h1>
        <p className={styles.headline}>{dict.header.headline}</p>
        <p className={styles.meta}>{dict.header.meta}</p>

        <div className={styles.headerRow}>
          <ul className={styles.contactList} data-paw-target>
            {contacts.map(contact => (
              <li className={styles.contactItem} key={contact.id}>
                <a
                  href={contact.link}
                  className={styles.contactLink}
                  {...(contact.external ? { rel: "noopener", target: "_blank" } : {})}
                >
                  {contact.text}
                  <ArrowUpRight size={14} />
                </a>
              </li>
            ))}
          </ul>
          <button type="button" className={styles.printButton} onClick={() => window.print()}>
            <Printer size={14} />
            {dict.header.downloadPdf}
          </button>
        </div>
      </section>

      <Reveal>
        <hr />
        <section className="container section">
          <h2 className="section-title">{dict.summary.title}</h2>
          <p className={styles.summaryText}>{dict.summary.text}</p>
        </section>
      </Reveal>

      <Reveal>
        <hr />
        <section className="container section">
          <h2 className="section-title">{dict.experience.title}</h2>
          {dict.experience.jobs.map(job => (
            <article className={styles.job} key={job.id}>
              <div className={styles.jobHeader}>
                <h3 className={styles.jobRole}>{job.role}</h3>
                <span className={styles.jobPeriod}>{job.period}</span>
              </div>
              <p className={styles.jobCompany}>
                <a href={job.url} rel="noopener" target="_blank" className={styles.jobCompanyLink}>
                  {job.company}
                  <ArrowUpRight size={12} />
                </a>
                <span className={styles.jobLocation}>{job.location}</span>
              </p>
              <p className={styles.jobDescription}>{job.description}</p>
              {job.bullets.length > 0 && (
                <ul className={styles.jobBullets}>
                  {job.bullets.map((bullet, index) => (
                    <li className={styles.jobBullet} key={index}>{bullet}</li>
                  ))}
                </ul>
              )}
              <p className={styles.jobStack}>{job.stack}</p>
            </article>
          ))}
          <p className={styles.experienceNote}>{dict.experience.note}</p>
        </section>
      </Reveal>

      <Reveal>
        <hr />
        <section className="container section">
          <h2 className="section-title">{dict.skills.title}</h2>
          <ul className={styles.skillGroups}>
            {dict.skills.groups.map(group => (
              <li className={styles.skillGroup} key={group.title}>
                <h3 className={styles.skillGroupTitle}>{group.title}</h3>
                <ul className={styles.skillList}>
                  {group.items.map(item => (
                    <li className={styles.skillItem} key={item}>{item}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      <Reveal>
        <hr />
        <section className="container section">
          <h2 className="section-title">{dict.languages.title}</h2>
          <ul className={styles.languageList}>
            {dict.languages.items.map(item => (
              <li className={styles.languageItem} key={item.name}>
                <span className={styles.languageName}>{item.name}</span>
                <span className={styles.languageLevel}> — {item.level}</span>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>
    </>
  );
}
