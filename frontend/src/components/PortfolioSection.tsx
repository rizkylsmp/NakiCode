import { ArrowRight, ExternalLink } from "lucide-react";
import { useState } from "react";
import type { PortfolioItem } from "../content";
import { normalizeCoverIndex } from "../pages/admin/AdminTemplateWorkspace.shared";

type PortfolioSectionProps = {
  items: PortfolioItem[];
};

export function PortfolioSection({ items }: PortfolioSectionProps) {
  return (
    <section className="w-full">
      <div className="px-5 py-16 md:px-8 xl:px-12 2xl:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
                Portofolio
              </p>
              <h2 className="mt-1 text-2xl font-bold text-naki-primary md:text-3xl">
                Karya Developer Kami
              </h2>
              <p className="mt-2 max-w-xl text-sm text-naki-smoke">
                Contoh project yang bisa dibangun dari template Naki Code atau dari request custom.
              </p>
            </div>
            <a
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-500 transition hover:text-blue-600"
              href="#layanan"
            >
              Request mirip ini
              <ArrowRight size={14} />
            </a>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const [imageError, setImageError] = useState(false);
              const coverIndex = normalizeCoverIndex(
                item.coverIndex,
                item.imageUrls ?? []
              );
              const coverImage =
                item.imageUrls && item.imageUrls.length > 0
                  ? item.imageUrls[coverIndex]
                  : item.imageUrl;

              const showImage = coverImage && !imageError;

              return (
                <article
                  key={item.id ?? item.title}
                  className="group overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-naki-frost">
                    {showImage ? (
                      <img
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        src={coverImage}
                        alt={item.title}
                        loading="lazy"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-naki-primary/5 to-naki-secondary/5" />
                    )}
                    <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-xs font-medium text-naki-primary backdrop-blur">
                      {item.category}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="text-base font-semibold text-naki-primary">
                      {item.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-naki-smoke">
                      {item.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-500">
                        {item.result}
                      </span>
                      <a
                        className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-500 transition hover:bg-blue-100"
                        href={
                          item.websiteUrl && item.websiteUrl !== "#"
                            ? item.websiteUrl
                            : "#template"
                        }
                        target={
                          item.websiteUrl && item.websiteUrl !== "#"
                            ? "_blank"
                            : undefined
                        }
                        rel={
                          item.websiteUrl && item.websiteUrl !== "#"
                            ? "noreferrer"
                            : undefined
                        }
                        aria-label={`Lihat ${item.title}`}
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
