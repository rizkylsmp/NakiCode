import { ArrowRight, Clock } from "lucide-react";
import type { ArticleItem } from "../content";

type LearningSectionProps = {
  articles: ArticleItem[];
};

export function LearningSection({ articles }: LearningSectionProps) {
  return (
    <section className="w-full">
      <div className="px-5 py-16 md:px-8 xl:px-12 2xl:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
                Blog &amp; Tutorial
              </p>
              <h2 className="mt-1 text-2xl font-bold text-naki-primary md:text-3xl">
                Artikel Terbaru
              </h2>
              <p className="mt-2 max-w-xl text-sm text-naki-smoke">
                Tips, tutorial, dan insight seputar development, design, dan bisnis digital.
              </p>
            </div>
            <a
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-500 transition hover:text-blue-600"
              href="/blog"
            >
              Lihat semua blog
              <ArrowRight size={14} />
            </a>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <article
                key={article.title}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                {/* Image placeholder */}
                <div className="aspect-[16/9] bg-gradient-to-br from-naki-frost to-naki-steel/50" />

                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-500">
                      Tips
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-naki-smoke">
                      <Clock size={12} />
                      {article.readTime}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold leading-snug text-naki-primary">
                    {article.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-naki-smoke">
                    {article.description}
                  </p>
                  <a
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-500 transition group-hover:gap-2"
                    href="/blog"
                  >
                    Baca selengkapnya <ArrowRight size={14} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
