"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider/locale-provider";
import type { BlogPost } from "@/lib/mdx";
import en from "./page.en.json";
import ru from "./page.ru.json";

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
    <>
      <h1>{dict.title}</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`}>
              <h2>{post.title}</h2>
              <p>{post.description}</p>
              <time dateTime={post.date}>{post.date}</time>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
