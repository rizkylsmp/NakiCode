import { ArrowRight, BookOpenText } from "lucide-react";
import type { ArticleItem } from "../content";

type LearningSectionProps = {
  articles: ArticleItem[];
};

export function LearningSection({ articles }: LearningSectionProps) {
  return (
    <section
      id="tutorial"
      className="w-full px-5 py-14 md:px-8 xl:px-12 2xl:px-16"
    >
      <div className="mb-7 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-black text-naki-primary">
            Tutorial dan blog
          </h2>
          <p className="mt-2 max-w-2xl text-naki-smoke">
            Konten edukasi untuk menjalankan, mengedit, dan mengembangkan
            template Naki Code.
          </p>
        </div>
        <a
          id="blog"
          className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg border border-naki-steel px-4 text-sm font-black text-naki-secondary transition hover:border-naki-smoke"
          href="/blog"
        >
          Lihat semua blog
          <ArrowRight size={16} />
        </a>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {articles.map((article) => (
          <article
            key={article.title}
            className="rounded-lg border border-naki-steel bg-naki-frost p-5 shadow-naki-card"
          >
            <BookOpenText className="text-naki-secondary" size={24} />
            <p className="mt-5 text-sm font-black text-naki-smoke">
              {article.readTime}
            </p>
            <h3 className="mt-2 text-xl font-black leading-7 text-naki-primary">
              {article.title}
            </h3>
            <p className="mt-3 leading-7 text-naki-smoke">
              {article.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
