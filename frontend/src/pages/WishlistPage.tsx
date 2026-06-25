import { ArrowRight, Code2, Heart, Inbox } from "lucide-react";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { ResponsiveImage } from "../components/ResponsiveImage";
import { TemplateCardSkeletonGrid } from "../components/skeletons/TemplateCardSkeleton";
import type { TemplateItem } from "../content";
import { useFavoriteTemplates } from "../use-favorites";

type WishlistPageProps = {
  templates: TemplateItem[];
};

export function WishlistPage({ templates }: WishlistPageProps) {
  const { favoriteIds, isFavoriteLoading, toggleFavorite } =
    useFavoriteTemplates();
  const favoriteTemplates = templates.filter((template) =>
    favoriteIds.has(template.id),
  );

  return (
    <main className="naki-frosted-grid min-h-screen bg-naki-page-bg text-naki-primary">
      <Header />
      <section className="w-full px-5 py-10 md:px-8 xl:px-12 2xl:px-16">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-naki-secondary">
              Wishlist
            </p>
            <h1 className="mt-2 text-4xl font-bold leading-tight">Template tersimpan</h1>
            <p className="mt-2 text-sm leading-relaxed text-naki-smoke">
              Simpan template incaran sebelum checkout atau konsultasi.
            </p>
          </div>
          <Link
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
            to="/#template"
          >
            Cari template
            <ArrowRight size={16} />
          </Link>
        </div>

        {isFavoriteLoading ? (
          <div className="mt-8">
            <TemplateCardSkeletonGrid count={3} />
          </div>
        ) : favoriteTemplates.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">
            <Inbox className="mx-auto text-naki-secondary" size={34} />
            <h2 className="mt-4 text-2xl font-bold">Wishlist masih kosong.</h2>
            <p className="mt-2 text-sm text-naki-smoke">
              Tekan ikon hati di katalog atau detail template untuk menyimpan.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {favoriteTemplates.map((template) => (
              <article
                key={template.id}
                className="grid gap-4 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-[180px_1fr_auto] md:items-center"
              >
                {template.preview[0]?.image ? (
                  <ResponsiveImage
                    className="h-36 w-full rounded-xl object-cover md:h-28"
                    src={template.preview[0].image}
                    sizes="(min-width: 768px) 180px, 100vw"
                    alt={template.preview[0].caption || template.title}
                  />
                ) : (
                  <div className="grid h-36 place-items-center rounded-xl bg-naki-frost md:h-28">
                    <Code2 className="text-naki-secondary" size={26} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-naki-smoke">
                    {template.category}
                  </p>
                  <h2 className="mt-1 text-xl font-bold">{template.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-naki-smoke">
                    {template.description}
                  </p>
                </div>
                <div className="flex gap-2 md:flex-col">
                  <Link
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                    to={`/templates/${template.slug}`}
                  >
                    Detail
                    <ArrowRight size={15} />
                  </Link>
                  <button
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-4 text-sm font-semibold text-naki-secondary transition hover:border-naki-smoke disabled:text-naki-smoke"
                    disabled={isFavoriteLoading}
                    onClick={() => toggleFavorite(template.id)}
                    type="button"
                  >
                    <Heart size={15} fill="currentColor" />
                    Hapus
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
