import { ArrowRight, ExternalLink } from "lucide-react";
import type { PortfolioItem } from "../content";
import { ResponsiveImage } from "./ResponsiveImage";

type PortfolioSectionProps = {
  items: PortfolioItem[];
};

export function PortfolioSection({ items }: PortfolioSectionProps) {
  return (
    <section
      id="portofolio"
      className="w-full px-5 py-14 md:px-8 xl:px-12 2xl:px-16"
    >
      <div className="mb-7 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-black text-naki-primary">
            Portofolio dan demo konsep
          </h2>
          <p className="mt-2 max-w-2xl text-naki-smoke">
            Contoh arah project yang bisa dibangun dari template Naki Code atau
            dari request custom.
          </p>
        </div>
        <a
          className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg border border-naki-steel px-4 text-sm font-black text-naki-secondary transition hover:border-naki-smoke"
          href="#layanan"
        >
          Request mirip ini
          <ArrowRight size={16} />
        </a>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {items.map((item) => {
          const coverImage =
            item.imageUrls && item.imageUrls.length > 0
              ? item.imageUrls[0]
              : item.imageUrl;

          return (
            <article
              key={item.id ?? item.title}
              className="rounded-lg border border-naki-steel bg-naki-frost p-5 shadow-naki-card"
            >
              <div className="relative flex h-44 items-end overflow-hidden rounded-lg bg-naki-primary p-4 text-naki-frost">
                {coverImage ? (
                  <>
                    <ResponsiveImage
                      className="absolute inset-0 h-full w-full object-cover"
                      src={coverImage}
                      sizes="(min-width: 1024px) 30vw, 100vw"
                      alt={item.title}
                    />
                    <span className="absolute inset-0 bg-naki-primary/65" />
                  </>
                ) : null}
                <div className="relative">
                  <p className="text-sm font-black text-naki-steel">
                    {item.category}
                  </p>
                  <h3 className="mt-2 text-2xl font-black leading-tight">
                    {item.title}
                  </h3>
                </div>
              </div>
              <p className="mt-4 leading-7 text-naki-smoke">
                {item.description}
              </p>
              <div className="mt-5 flex items-center justify-between gap-4">
                <span className="text-sm font-black text-naki-primary">
                  {item.result}
                </span>
                <a
                  className="grid size-10 place-items-center rounded-lg bg-naki-steel text-naki-secondary"
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
                  aria-label={`Lihat detail ${item.title}`}
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
