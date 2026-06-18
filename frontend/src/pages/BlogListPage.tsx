import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpenText, Inbox } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { apiGet } from "../api-client";
import { BlogCardSkeletonGrid } from "../components/BlogCardSkeleton";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";

export type BlogPostItem = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
};

type BlogPostsResponse = {
  posts: BlogPostItem[];
};

export function BlogListPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => apiGet<BlogPostsResponse>("/api/blog"),
  });
  const posts = data?.posts ?? [];

  return (
    <main className="naki-frosted-grid min-h-screen text-naki-primary">
      <Helmet>
        <title>Blog - Naki Code</title>
        <meta
          name="description"
          content="Tutorial dan artikel Naki Code untuk template React, Express, MySQL, dan workflow project website."
        />
      </Helmet>
      <Header />
      <section className="w-full px-5 py-10 md:px-8 xl:px-12 2xl:px-16">
        <p className="text-sm font-black uppercase text-naki-secondary">Blog</p>
        <h1 className="mt-2 text-4xl font-black">Tutorial Naki Code</h1>
        <p className="mt-3 max-w-2xl leading-7 text-naki-smoke">
          Artikel dari database untuk membantu setup, custom, checkout, dan
          pengembangan template.
        </p>

        {isLoading ? (
          <BlogCardSkeletonGrid count={6} />
        ) : isError || posts.length === 0 ? (
          <div className="mt-8 rounded-lg border border-naki-steel bg-naki-frost p-8 text-center shadow-naki-card">
            <Inbox className="mx-auto text-naki-secondary" size={34} />
            <h2 className="mt-4 text-2xl font-black">Belum ada artikel.</h2>
            <p className="mt-2 text-naki-smoke">
              Publish artikel dari API admin blog agar tampil di sini.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                className="group rounded-xl border border-naki-steel bg-naki-frost p-5 shadow-naki-card transition hover:-translate-y-0.5 hover:shadow-naki-soft"
                to={`/blog/${post.slug}`}
              >
                <BookOpenText className="text-naki-secondary" size={24} />
                <p className="mt-5 text-xs font-black uppercase text-naki-smoke">
                  {post.author}
                </p>
                <h2 className="mt-2 text-xl font-black group-hover:text-naki-secondary">
                  {post.title}
                </h2>
                <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-naki-smoke">
                  {post.excerpt}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-naki-secondary">
                  Baca artikel
                  <ArrowRight size={15} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
