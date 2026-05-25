"use client";

import { type ReactNode } from "react";
import { useLocale } from "@/components/locale-provider/locale-provider";

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
    <article>
      <header>
        <h1>{title}</h1>
        <time dateTime={date}>{date}</time>
      </header>
      <div>{content}</div>
    </article>
  );
}
