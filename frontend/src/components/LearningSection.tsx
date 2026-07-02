import { ArrowRight, Calendar, User } from "lucide-react";

type BlogPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  publishedAt: string | null;
  createdAt: string;
};

type LearningSectionProps = {
  blogPosts: BlogPost[];
};

export function LearningSection({ blogPosts }: LearningSectionProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <section className="relative z-0 w-full">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 xl:px-12 2xl:px-16">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
              Blog & Tutorial
            </p>
            <h2 className="mt-2 text-3xl font-bold text-naki-primary">
              Artikel Terbaru
            </h2>
            <p className="mt-2 max-w-2xl text-naki-smoke">
              Tips, tutorial, dan insight seputar development, design, dan bisnis digital.
            </p>
          </div>
          <a
            href="/blog"
            className="hidden items-center gap-2 text-sm font-semibold text-blue-500 transition hover:text-blue-600 md:flex"
          >
            Lihat semua artikel
            <ArrowRight size={16} />
          </a>
        </div>

        {blogPosts.length === 0 ? (
          <div className="rounded-xl border border-naki-steel/60 bg-white p-12 text-center">
            <p className="text-naki-smoke">Belum ada artikel yang dipublikasikan.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {blogPosts.slice(0, 3).map((post) => (
              <a
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-xl border border-naki-steel/60 bg-white transition hover:border-blue-500/50 hover:shadow-lg"
              >
                <div className="aspect-video bg-linear-to-br from-blue-500/10 to-purple-500/10" />
                <div className="p-5">
                  <div className="mb-3 flex items-center gap-3 text-xs text-naki-smoke">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {post.author}
                    </span>
                    {post.publishedAt && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(post.publishedAt)}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-naki-primary group-hover:text-blue-500">
                    {post.title}
                  </h3>
                  <p className="line-clamp-2 text-sm text-naki-smoke">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-500 group-hover:gap-3">
                    Baca selengkapnya
                    <ArrowRight size={14} />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="mt-8 text-center md:hidden">
          <a
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-500 transition hover:text-blue-600"
          >
            Lihat semua artikel
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
