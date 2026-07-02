import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpenText, Clock, Inbox } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { apiGet } from "../api-client";
import { BlogCardSkeletonGrid } from "../components/skeletons/BlogCardSkeleton";
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
    <div className="naki-frosted-grid min-h-screen text-naki-primary">
      <Helmet>
        <title>Blog - Naki Code</title>
        <meta
          name="description"
          content="Tutorial dan artikel Naki Code untuk template React, Express, MySQL, dan workflow project website."
        />
      </Helmet>
      <Header />

      {/* Dark hero */}
      <section className="bg-naki-primary px-5 py-14 text-center md:px-8 xl:px-12 2xl:px-16 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
          Blog Naki Code
        </p>
        <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
          Tips, tutorial, dan insight seputar development, design, dan bisnis digital.
        </h1>
      </section>

      {/* Blog cards */}
      <section className="bg-naki-page-bg px-5 py-14 md:px-8 xl:px-12 2xl:px-16">
        <div className="mx-auto max-w-7xl">
          {isLoading ? (
            <BlogCardSkeletonGrid count={6} />
          ) : isError || posts.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <Inbox className="mx-auto text-naki-steel" size={40} />
              <h2 className="mt-4 text-2xl font-semibold text-naki-primary">
                Belum ada artikel.
              </h2>
              <p className="mt-2 text-sm text-naki-smoke">
                Publish artikel dari API admin blog agar tampil di sini.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  className="group overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:shadow-md"
                  to={`/blog/${post.slug}`}
                >
                  {/* Image placeholder */}
                  <div className="aspect-video bg-gradient-to-br from-naki-frost to-naki-steel/50" />

                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-500">
                        {post.author}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-naki-smoke">
                        <Clock size={12} />
                        5 menit
                      </span>
                    </div>
                    <h2 className="mt-3 text-base font-semibold leading-snug text-naki-primary group-hover:text-blue-500">
                      {post.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm text-naki-smoke">
                      {post.excerpt}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-500 transition group-hover:gap-2">
                      Baca selengkapnya <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
