"use client";

import { useLocale } from "@/components/locale-provider/locale-provider";
import styles from "./footer.module.scss";
import en from "./footer.en.json";
import ru from "./footer.ru.json";

const dicts = { en, ru };

const contactsList = [
  { id: "email", link: "mailto:info@keksowl.com", text: "info@keksowl.com" },
  { id: "github", link: "https://github.com/keksowl", text: "github" },
  { id: "telegram", link: "https://t.me/keksowl", text: "Telegram" },
];

export default function Footer() {
  const { locale } = useLocale();
  const dict = dicts[locale];

  return (
    <footer className={styles.footer}>
      <section className={styles.copyright}>
        <h2 className="visually-hidden">{dict.copyright.title}</h2>
        <p className={styles.copyrightText}>© &#8226; 2026 &#8226; KeksOwl</p>
      </section>
      <section className={styles.contacts}>
        <h2 className="visually-hidden">{dict.contacts.title}</h2>
        <ul className={styles.contactsList}>
          {contactsList.map(contactsItem => (
            <li className={styles.contactsItem} key={contactsItem.id}>
              <a href={contactsItem.link} className={styles.contactsLink} rel="noopener" target="_blank">
                {contactsItem.text}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </footer>
  );
}
