import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { apiGet } from "../api-client";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import type { BlogPostItem } from "./BlogListPage";

type BlogPostResponse = {
  post: BlogPostItem;
};

export function BlogDetailPage() {
  const { slug } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    enabled: Boolean(slug),
    queryFn: () => apiGet<BlogPostResponse>(`/api/blog/${slug}`),
  });
  const post = data?.post;

  // Generate Article schema for SEO
  const articleSchema = post
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        author: {
          "@type": "Person",
          name: post.author,
        },
        datePublished: post.createdAt,
        dateModified: post.publishedAt || post.createdAt,
        publisher: {
          "@type": "Organization",
          name: "Naki Code",
          logo: {
            "@type": "ImageObject",
            url: `${window.location.origin}/logo.png`,
          },
        },
      }
    : null;

  const canonicalUrl = post
    ? `${window.location.origin}/blog/${post.slug}`
    : `${window.location.origin}/blog`;

  return (
    <main className="naki-frosted-grid min-h-screen text-naki-primary">
      <Helmet>
        <title>{post ? `${post.title} - Naki Code` : "Blog - Naki Code"}</title>
        {post ? <meta name="description" content={post.excerpt} /> : null}
        <link rel="canonical" href={canonicalUrl} />
        {post ? (
          <>
            <meta property="og:title" content={`${post.title} - Naki Code`} />
            <meta property="og:description" content={post.excerpt} />
            <meta property="og:type" content="article" />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="article:author" content={post.author} />
            <meta property="article:published_time" content={post.createdAt} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={`${post.title} - Naki Code`} />
            <meta name="twitter:description" content={post.excerpt} />
            {articleSchema ? (
              <script type="application/ld+json">
                {JSON.stringify(articleSchema)}
              </script>
            ) : null}
          </>
        ) : null}
      </Helmet>
      <Header />
      <article className="mx-auto w-full max-w-6xl px-5 py-10 md:px-8">
        <Link
          className="inline-flex items-center gap-2 text-sm font-black text-naki-secondary"
          to="/blog"
        >
          <ArrowLeft size={16} />
          Kembali ke blog
        </Link>

        <nav
          className="mt-4 flex flex-wrap items-center gap-2 text-sm font-black text-naki-smoke"
          aria-label="Breadcrumb"
        >
          <Link className="hover:text-naki-primary" to="/">
            Home
          </Link>
          <span>/</span>
          <Link className="hover:text-naki-primary" to="/blog">
            Blog
          </Link>
          {post ? (
            <>
              <span>/</span>
              <span className="text-naki-primary">{post.title}</span>
            </>
          ) : null}
        </nav>

        {isLoading ? (
          <p className="mt-8 rounded-lg bg-naki-steel p-4 text-sm font-black text-naki-secondary">
            Memuat artikel...
          </p>
        ) : post ? (
          <>
            <p className="mt-8 text-sm font-black uppercase text-naki-secondary">
              {post.author}
            </p>
            <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">
              {post.title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-naki-smoke">
              {post.excerpt}
            </p>
            <div className="mt-8 whitespace-pre-line rounded-xl border border-naki-steel bg-naki-frost p-6 text-base font-semibold leading-8 text-naki-primary shadow-naki-card">
              {post.content}
            </div>
          </>
        ) : (
          <div className="mt-8 rounded-xl border border-naki-steel bg-naki-frost p-8 text-center shadow-naki-card">
            <h1 className="text-3xl font-black">Artikel tidak ditemukan.</h1>
            <p className="mt-2 text-naki-smoke">
              Artikel mungkin belum dipublish atau sudah dihapus.
            </p>
          </div>
        )}
      </article>
      <Footer />
    </main>
  );
}
