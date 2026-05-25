import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import { getBlogPost, getBlogPosts } from "@/lib/mdx";
import type { Locale } from "../../layout";

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export async function generateStaticParams() {
  const locales: Locale[] = ["en", "ru"];
  const params: { locale: string; slug: string }[] = [];

  for (const locale of locales) {
    const posts = await getBlogPosts(locale);
    for (const post of posts) {
      params.push({ locale, slug: post.slug });
    }
  }

  return params;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const post = await getBlogPost(slug, locale);

  if (!post) {
    notFound();
  }

  const { content } = await compileMDX({
    source: post.content,
    options: { parseFrontmatter: false },
  });

  return (
    <article>
      <header>
        <h1>{post.title}</h1>
        <time dateTime={post.date}>{post.date}</time>
      </header>
      <div>{content}</div>
    </article>
  );
}
