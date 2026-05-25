import { getBlogPosts } from "@/lib/mdx";
import BlogList from "./blog-list";

export default async function BlogPage() {
  const enPosts = await getBlogPosts("en");
  const ruPosts = await getBlogPosts("ru");

  return <BlogList enPosts={enPosts} ruPosts={ruPosts} />;
}
