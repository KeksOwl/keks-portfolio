"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider/locale-provider";
import type { BlogPost } from "@/lib/mdx";
import en from "./page.en.json";
import ru from "./page.ru.json";
import styles from "./blog-list.module.scss";

const dicts = { en, ru };

interface BlogListProps {
  enPosts: BlogPost[];
  ruPosts: BlogPost[];
}

export default function BlogList({ enPosts, ruPosts }: BlogListProps) {
  const { locale } = useLocale();
  const dict = dicts[locale];
  const posts = locale === "ru" ? ruPosts : enPosts;

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{dict.title}</h1>
      <ul className={styles.list}>
        {posts.map((post) => (
          <li key={post.slug} className={styles.item}>
            <Link href={`/blog/${post.slug}`} className={styles.link}>
              <h2 className={styles.postTitle}>{post.title}</h2>
              <p className={styles.description}>{post.description}</p>
              <time className={styles.date} dateTime={post.date}>
                {post.date}
              </time>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
