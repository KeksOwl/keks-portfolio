import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import { getBlogPost, getBlogPosts } from "@/lib/mdx";
import BlogPostView from "./blog-post-view";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getBlogPosts("en");
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const enPost = await getBlogPost(slug, "en");

  if (!enPost) {
    notFound();
  }

  const ruPost = await getBlogPost(slug, "ru");

  const { content: enContent } = await compileMDX({
    source: enPost.content,
    options: { parseFrontmatter: false },
  });

  const ruContent = ruPost
    ? (await compileMDX({ source: ruPost.content, options: { parseFrontmatter: false } })).content
    : enContent;

  return (
    <BlogPostView
      enContent={enContent}
      ruContent={ruContent}
      meta={{
        en: { title: enPost.title, date: enPost.date },
        ru: { title: ruPost?.title ?? enPost.title, date: ruPost?.date ?? enPost.date },
      }}
    />
  );
}
