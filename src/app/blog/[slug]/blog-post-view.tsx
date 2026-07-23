"use client";

import { type ReactNode } from "react";
import { useLocale } from "@/components/locale-provider/locale-provider";
import styles from "./blog-post-view.module.scss";

interface BlogPostViewProps {
  enContent: ReactNode;
  ruContent: ReactNode;
  meta: {
    en: { title: string; date: string };
    ru: { title: string; date: string };
  };
}

export default function BlogPostView({ enContent, ruContent, meta }: BlogPostViewProps) {
  const { locale } = useLocale();
  const content = locale === "ru" ? ruContent : enContent;
  const { title, date } = meta[locale];

  return (
    <article className={styles.article}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <time className={styles.date} dateTime={date}>
          {date}
        </time>
      </header>
      <div className={styles.content}>{content}</div>
    </article>
  );
}
