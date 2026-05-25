import fs from "fs";
import path from "path";
import matter from "gray-matter";

type Locale = "en" | "ru";

const contentDirectory = path.join(process.cwd(), "content/blog");

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  content: string;
}

export async function getBlogPosts(locale: Locale): Promise<BlogPost[]> {
  const slugs = fs.readdirSync(contentDirectory);

  const posts = slugs
    .filter((slug) => {
      const filePath = path.join(contentDirectory, slug, `${locale}.mdx`);
      return fs.existsSync(filePath);
    })
    .map((slug) => {
      const filePath = path.join(contentDirectory, slug, `${locale}.mdx`);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(fileContent);

      return {
        slug,
        title: data.title ?? "",
        description: data.description ?? "",
        date: data.date ?? "",
        content: "",
      };
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1));

  return posts;
}

export async function getBlogPost(
  slug: string,
  locale: Locale
): Promise<BlogPost | null> {
  const filePath = path.join(contentDirectory, slug, `${locale}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  return {
    slug,
    title: data.title ?? "",
    description: data.description ?? "",
    date: data.date ?? "",
    content,
  };
}
