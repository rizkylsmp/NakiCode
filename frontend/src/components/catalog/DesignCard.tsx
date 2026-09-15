import { ArrowRight, Code2, Film, Heart, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { TemplateItem } from "../../domain/content";
import { getTemplateCategoryPath } from "../../utils/design-url";
import { TechStackBadge } from "../ui/TechStackBadge";
import { ResponsiveImage } from "../ui/ResponsiveImage";

type DesignCardProps = {
  isAuthenticated: boolean;
  isFavorite: boolean;
  isFavoriteLoading: boolean;
  template: TemplateItem;
  onToggleFavorite: (templateId: number) => void;
};

export function DesignCard({
  isAuthenticated,
  isFavorite,
  isFavoriteLoading,
  template,
  onToggleFavorite,
}: DesignCardProps) {
  const [failedVideoUrl, setFailedVideoUrl] = useState<string | null>(null);
  const hasVideoPreview =
    Boolean(template.videoUrl) && failedVideoUrl !== template.videoUrl;

  return (
    <article className="group overflow-hidden rounded-2xl border border-naki-steel/60 bg-white shadow-sm transition duration-300 hover:border-blue-200 hover:shadow-md">
      <div
        className="relative aspect-[4/3] overflow-hidden bg-naki-frost"
        data-testid="design-card-media"
      >
        {hasVideoPreview ? (
          <Link
            className="relative block h-full w-full"
            to={`/design/${template.slug}`}
            aria-label={`Lihat design ${template.title}`}
          >
            {template.preview?.[0]?.image ? (
              <ResponsiveImage
                alt=""
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-xl"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                src={template.preview[0].image}
              />
            ) : (
              <span className="absolute inset-0 bg-gradient-to-br from-naki-primary/15 via-naki-frost to-naki-secondary/20" />
            )}
            <span className="absolute inset-0 bg-white/10" />
            <video
              aria-label={`Video preview ${template.title}`}
              autoPlay
              className="pointer-events-none relative z-10 h-full w-full object-contain"
              loop
              muted
              onError={() => setFailedVideoUrl(template.videoUrl || null)}
              playsInline
              poster={template.preview?.[0]?.image || undefined}
              preload="metadata"
              src={template.videoUrl || undefined}
            />
            <span className="absolute bottom-3 left-3 z-20 inline-flex items-center gap-1.5 rounded-md bg-naki-primary/80 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
              <Film size={13} aria-hidden="true" />
              Video preview
            </span>
          </Link>
        ) : template.preview?.[0]?.image ? (
          <Link
            className="relative block h-full w-full"
            to={`/design/${template.slug}`}
            aria-label={`Lihat design ${template.title}`}
          >
            <ResponsiveImage
              alt=""
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-xl"
              src={template.preview[0].image}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
            <span className="absolute inset-0 bg-white/10" />
            <ResponsiveImage
              className="relative z-10 h-full w-full object-contain"
              src={template.preview[0].image}
              alt={template.title}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          </Link>
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-naki-primary/5 to-naki-secondary/5">
            <Code2 className="text-naki-steel" size={40} />
          </div>
        )}

        <Link
          className="absolute left-3 top-3 z-20 rounded-md bg-white/90 px-2 py-0.5 text-xs font-medium text-naki-primary backdrop-blur transition hover:text-blue-500"
          to={getTemplateCategoryPath(template.category)}
          onClick={(event) => event.stopPropagation()}
        >
          {template.category}
        </Link>

        <div className="absolute right-3 top-3 z-20 flex gap-2">
          {isAuthenticated ? (
            <button
              className={`grid size-11 place-items-center rounded-full transition disabled:cursor-wait disabled:opacity-60 ${
                isFavorite
                  ? "bg-blue-500 text-white"
                  : "bg-white/90 text-naki-smoke backdrop-blur hover:text-naki-primary"
              }`}
              disabled={isFavoriteLoading}
              onClick={() => onToggleFavorite(template.id)}
              type="button"
              aria-pressed={isFavorite}
              aria-label={
                isFavorite
                  ? `Hapus ${template.title} dari wishlist`
                  : `Simpan ${template.title} ke wishlist`
              }
            >
              <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2 flex flex-wrap gap-1">
          {template.stack.slice(0, 3).map((tech) => (
            <TechStackBadge key={tech} tech={tech} />
          ))}
        </div>

        <div className="mb-2 inline-flex rounded-md bg-green-50 px-2 py-1 text-[11px] font-semibold text-green-700">
          Bisa disesuaikan
        </div>
        <h3 className="text-base font-semibold leading-tight text-naki-primary">
          <Link
            className="transition hover:text-blue-500"
            to={`/design/${template.slug}`}
          >
            {template.title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-naki-smoke">
          {template.description}
        </p>

        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-500">
          <Star size={12} className="fill-blue-400 text-blue-400" />
          <span>
            {template.rating > 0 ? template.rating.toFixed(1) : "Baru"}
          </span>
          {template.reviews?.length ? (
            <span className="text-naki-smoke">
              ({template.reviews.length} ulasan)
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-naki-smoke">
              {template.sourceAvailable === false
                ? "Layanan custom"
                : "Source code mulai"}
            </p>
            <p className="text-base font-bold text-naki-primary">
              {template.sourceAvailable === false
                ? "Konsultasi"
                : template.price}
            </p>
          </div>
          <Link
            className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 text-xs font-semibold text-blue-500 transition hover:bg-blue-100"
            to={`/design/${template.slug}`}
            aria-label={`Lihat design ${template.title}`}
          >
            Lihat Design
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
