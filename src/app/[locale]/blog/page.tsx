import Link from "next/link";
import { getBlogPosts } from "@/lib/mdx";
import type { Locale } from "../layout";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function BlogPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = (await import(`./${`page.${locale}.json`}`)).default;
  const posts = await getBlogPosts(locale);

  return (
    <>
      <h1>{dict.title}</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/${locale}/blog/${post.slug}`}>
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
