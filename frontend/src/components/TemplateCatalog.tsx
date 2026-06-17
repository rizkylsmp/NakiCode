import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Code2,
  Eye,
  GitCompare,
  Heart,
  MessageSquareText,
  Star,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type {
  HealthState,
  TemplateCategory,
  TemplateItem,
  TemplatePreviewItem,
} from "../content";
import { useAuth } from "../auth-context";
import { ResponsiveImage } from "./ResponsiveImage";
import { useFavoriteTemplates } from "../use-favorites";
import { TemplateCardSkeleton } from "./TemplateCardSkeleton";

type TemplateCatalogProps = {
  templates: TemplateItem[];
  allTemplates: TemplateItem[];
  activeCategory: TemplateCategory;
  health: HealthState | null;
  isLoading?: boolean;
};

export function TemplateCatalog({
  templates,
  allTemplates,
  activeCategory,
  health,
  isLoading,
}: TemplateCatalogProps) {
  const databaseOnline = health?.database.status === "online";
  const { isAuthenticated } = useAuth();
  const { favoriteIds, isFavoriteLoading, toggleFavorite } =
    useFavoriteTemplates();
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const compareTemplates = allTemplates.filter((template) =>
    compareIds.includes(template.id),
  );

  function toggleCompare(templateId: number) {
    setCompareIds((current) => {
      if (current.includes(templateId)) {
        return current.filter((id) => id !== templateId);
      }

      return [templateId, ...current].slice(0, 3);
    });
  }

  return (
    <section
      id="template"
      className="grid w-full gap-7 px-5 py-14 md:px-8 lg:grid-cols-[1fr_280px] xl:px-12 2xl:px-16"
    >
      <div className="min-w-0">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-black text-naki-primary">
              Template pilihan
            </h2>
            <p className="mt-2 text-naki-smoke">
              {templates.length} template ditemukan untuk{" "}
              {activeCategory.toLowerCase()}.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-naki-steel bg-naki-frost px-3 py-2 text-sm font-bold text-naki-secondary">
            <Zap size={16} />
            Source code siap edit
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <TemplateCardSkeleton key={index} />
            ))
          ) : (
            templates.map((template) => (
            <article
              key={template.id}
              className="group overflow-hidden rounded-2xl border border-naki-steel/70 bg-naki-frost shadow-naki-card transition duration-300 hover:-translate-y-1 hover:shadow-naki-soft"
            >
              <div className="p-4">
                <TemplatePreviewCarousel
                  slides={template.preview}
                  title={template.title}
                />
              </div>

              <div className="space-y-4 px-5 pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <span
                      className={`grid size-12 shrink-0 place-items-center rounded-xl shadow-sm transition group-hover:scale-[1.02] ${template.accentClass}`}
                    >
                      <Code2 className="text-naki-frost" size={22} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-naki-secondary">
                        {template.category}
                      </p>
                      <h3 className="mt-1 text-xl font-black leading-6 text-naki-primary">
                        {template.title}
                      </h3>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {isAuthenticated ? (
                      <button
                        className={`grid size-9 place-items-center rounded-full border transition ${
                          favoriteIds.has(template.id)
                            ? "border-naki-secondary bg-naki-secondary text-naki-frost"
                            : "border-naki-steel bg-naki-frost text-naki-secondary hover:border-naki-smoke"
                        }`}
                        disabled={isFavoriteLoading}
                        onClick={() => toggleFavorite(template.id)}
                        type="button"
                        aria-label={
                          favoriteIds.has(template.id)
                            ? `Hapus ${template.title} dari wishlist`
                            : `Simpan ${template.title} ke wishlist`
                        }
                      >
                        <Heart
                          size={16}
                          fill={favoriteIds.has(template.id) ? "currentColor" : "none"}
                        />
                      </button>
                    ) : null}
                    <div className="flex items-center gap-1 rounded-full border border-naki-steel bg-naki-steel/70 px-2.5 py-1 text-sm font-black text-naki-primary">
                      <Star size={15} fill="currentColor" />
                      {template.rating > 0 ? template.rating.toFixed(1) : "Baru"}
                    </div>
                  </div>
                </div>

                <p className="min-h-14 leading-7 text-naki-smoke">
                  {template.description}
                </p>

                {template.reviews?.[0]?.message ? (
                  <div className="rounded-xl border border-naki-steel bg-naki-steel/50 p-3">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-naki-secondary">
                      <MessageSquareText size={14} />
                      Review buyer
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-naki-primary">
                      "{template.reviews[0].message}"
                    </p>
                    <p className="mt-1 text-xs font-black text-naki-smoke">
                      {template.reviews[0].customerName}
                    </p>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {template.stack.map((stack) => (
                    <span
                      key={stack}
                      className="rounded-full border border-naki-steel bg-naki-frost px-3 py-1 text-xs font-black text-naki-primary"
                    >
                      {stack}
                    </span>
                  ))}
                </div>

                <div className="grid gap-4 rounded-2xl border border-naki-steel bg-naki-steel/55 p-4">
                  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs font-bold text-naki-smoke">
                        {template.level} · {template.buyerCount} pembeli
                      </p>
                      <p className="mt-1 text-2xl font-black text-naki-primary">
                        {template.price}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        className={`grid size-11 place-items-center rounded-xl border transition ${
                          compareIds.includes(template.id)
                            ? "border-naki-secondary bg-naki-secondary text-naki-frost"
                            : "border-naki-steel bg-naki-frost text-naki-secondary hover:border-naki-smoke"
                        }`}
                        onClick={() => toggleCompare(template.id)}
                        type="button"
                        aria-label={`Bandingkan ${template.title}`}
                      >
                        <GitCompare size={17} />
                      </button>
                      <Link
                        className="grid size-11 place-items-center rounded-xl border border-naki-steel bg-naki-frost text-naki-secondary transition hover:border-naki-smoke hover:bg-naki-frost/90"
                        to={`/templates/${template.slug}`}
                        aria-label={`Lihat detail ${template.title}`}
                      >
                        <Eye size={17} />
                      </Link>
                      <Link
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-secondary"
                        to={`/templates/${template.slug}`}
                      >
                        Pilih
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )))}
        </div>
        {compareTemplates.length > 0 ? (
          <section className="mt-6 rounded-xl border border-naki-steel bg-naki-frost p-4 shadow-naki-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase text-naki-secondary">
                  Compare template
                </p>
                <h3 className="text-xl font-black text-naki-primary">
                  Bandingkan {compareTemplates.length} pilihan
                </h3>
              </div>
              <button
                className="grid size-9 place-items-center rounded-lg border border-naki-steel text-naki-secondary"
                onClick={() => setCompareIds([])}
                type="button"
                aria-label="Kosongkan compare"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {compareTemplates.map((template) => (
                <article
                  key={template.id}
                  className="rounded-lg bg-naki-steel p-4"
                >
                  <p className="text-xs font-black uppercase text-naki-secondary">
                    {template.category}
                  </p>
                  <h4 className="mt-1 text-lg font-black">{template.title}</h4>
                  <div className="mt-3 grid gap-2 text-sm font-bold text-naki-smoke">
                    <span>Harga: {template.price}</span>
                    <span>Level: {template.level}</span>
                    <span>Rating: {template.rating || "Baru"}</span>
                    <span>Stack: {template.stack.slice(0, 3).join(", ")}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <aside className="h-fit rounded-lg border border-naki-steel bg-naki-frost p-5 shadow-naki-card lg:sticky lg:top-24">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-naki-primary text-naki-frost">
            <Code2 size={19} />
          </span>
          <div>
            <h2 className="text-lg font-black text-naki-primary">
              Ringkasan toko
            </h2>
            <p className="text-sm font-semibold text-naki-smoke">
              Template digital
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <SummaryRow label="Total katalog" value={`${allTemplates.length} item`} />
          <SummaryRow label="Kategori aktif" value={activeCategory} />
          <SummaryRow
            label="API"
            value={health?.status ?? "checking"}
            accent={health?.status === "online"}
          />
          <SummaryRow
            label="Database"
            value={health?.database.status ?? "checking"}
            accent={databaseOnline}
          />
        </div>
        <a
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-naki-secondary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-primary"
          href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}?text=${encodeURIComponent('Halo Naki Code, saya mau konsultasi template.')}`}
          rel="noreferrer"
          target="_blank"
        >
          Konsultasi template
          <ArrowRight size={16} />
        </a>
      </aside>
    </section>
  );
}

type SummaryRowProps = {
  label: string;
  value: string;
  accent?: boolean;
};

function SummaryRow({ label, value, accent = false }: SummaryRowProps) {
  return (
    <div className="flex justify-between gap-3 rounded-lg bg-naki-steel p-3 text-sm font-bold">
      <span>{label}</span>
      <span className={accent ? "text-naki-secondary" : "text-naki-primary"}>
        {value}
      </span>
    </div>
  );
}

type TemplatePreviewCarouselProps = {
  slides: TemplatePreviewItem[];
  title: string;
};

function TemplatePreviewCarousel({ slides, title }: TemplatePreviewCarouselProps) {
  const normalizedSlides = useMemo(() => {
    if (slides.length > 0) {
      return slides;
    }

    return [{ image: "", caption: `Preview untuk ${title}` }];
  }, [slides, title]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [normalizedSlides.length, title]);

  const activeSlide = normalizedSlides[activeIndex] ?? normalizedSlides[0];
  const activeIsImage = Boolean(activeSlide.image);

  function goToPrevious() {
    setActiveIndex((current) =>
      current === 0 ? normalizedSlides.length - 1 : current - 1,
    );
  }

  function goToNext() {
    setActiveIndex((current) =>
      current === normalizedSlides.length - 1 ? 0 : current + 1,
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-naki-steel bg-naki-primary/5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(49,88,141,0.12),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,255,255,0.15))]" />

      <div className="relative grid min-h-72 gap-3 p-3">
        {activeIsImage ? (
          <>
            <div className="relative aspect-[4/3] min-h-52 overflow-hidden rounded-xl bg-naki-steel">
              <ResponsiveImage
                className="h-full w-full rounded-xl object-cover"
                src={activeSlide.image}
                sizes="(min-width: 1280px) 28vw, (min-width: 768px) 45vw, 100vw"
                alt={
                  activeSlide.caption || `${title} preview ${activeIndex + 1}`
                }
              />
              {normalizedSlides.length > 1 ? (
                <>
                  <button
                    className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-naki-steel bg-naki-frost/90 text-naki-primary shadow-sm transition hover:bg-naki-frost"
                    onClick={goToPrevious}
                    type="button"
                    aria-label="Sebelumnya"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-naki-steel bg-naki-frost/90 text-naki-primary shadow-sm transition hover:bg-naki-frost"
                    onClick={goToNext}
                    type="button"
                    aria-label="Berikutnya"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              ) : null}
            </div>
            <div className="rounded-xl bg-naki-primary px-4 py-3 text-naki-frost shadow-sm">
              <p className="line-clamp-2 text-sm font-black leading-6">
                {activeSlide.caption || `Preview ${activeIndex + 1}`}
              </p>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col justify-between p-5">
            <span className="inline-flex w-fit rounded-full border border-naki-steel bg-naki-frost px-3 py-1 text-xs font-black text-naki-secondary">
              Preview slide {activeIndex + 1}
            </span>
            <div className="rounded-2xl border border-naki-steel bg-naki-frost/90 p-4 shadow-sm">
              <p className="text-sm font-black uppercase text-naki-secondary">
                Isi preview
              </p>
              <p className="mt-3 text-base font-semibold leading-7 text-naki-primary">
                {activeSlide.caption}
              </p>
            </div>
          </div>
        )}

        <div className="absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-naki-steel bg-naki-frost/90 px-2 py-1">
          {normalizedSlides.map((slide, index) => (
            <button
              key={`${slide.image}-${slide.caption}-${index}`}
              className={`size-2 rounded-full transition ${
                index === activeIndex ? "bg-naki-primary" : "bg-naki-steel"
              }`}
              onClick={() => setActiveIndex(index)}
              type="button"
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
