import { ArrowRight, Code2, GitCompare, Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { TemplateItem } from "../../domain/content";
import { getTemplateCategoryPath } from "../../utils/template-url";

type TemplateCardProps = {
  isAuthenticated: boolean;
  isCompared: boolean;
  isFavorite: boolean;
  isFavoriteLoading: boolean;
  template: TemplateItem;
  onToggleCompare: (templateId: number) => void;
  onToggleFavorite: (templateId: number) => void;
};

export function TemplateCard({
  isAuthenticated,
  isCompared,
  isFavorite,
  isFavoriteLoading,
  template,
  onToggleCompare,
  onToggleFavorite,
}: TemplateCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-naki-frost">
        {template.preview?.[0]?.image ? (
          <img
            className="h-full w-full object-cover transition duration-300"
            src={template.preview[0].image}
            alt={template.title}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-naki-primary/5 to-naki-secondary/5">
            <Code2 className="text-naki-steel" size={40} />
          </div>
        )}

        <Link
          className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-xs font-medium text-naki-primary backdrop-blur transition hover:text-blue-500"
          to={getTemplateCategoryPath(template.category)}
          onClick={(event) => event.stopPropagation()}
        >
          {template.category}
        </Link>

        <div className="absolute right-3 top-3 flex gap-2">
          <button
            className={`grid size-8 place-items-center rounded-full transition ${
              isCompared
                ? "bg-naki-primary text-white"
                : "bg-white/90 text-naki-smoke backdrop-blur hover:text-naki-primary"
            }`}
            onClick={() => onToggleCompare(template.id)}
            type="button"
            aria-label={
              isCompared
                ? `Hapus ${template.title} dari compare`
                : `Bandingkan ${template.title}`
            }
          >
            <GitCompare size={14} />
          </button>

          {isAuthenticated ? (
            <button
              className={`grid size-8 place-items-center rounded-full transition ${
                isFavorite
                  ? "bg-blue-500 text-white"
                  : "bg-white/90 text-naki-smoke backdrop-blur hover:text-naki-primary"
              }`}
              disabled={isFavoriteLoading}
              onClick={() => onToggleFavorite(template.id)}
              type="button"
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
            <span key={tech} className="text-xs font-medium text-naki-smoke">
              #{tech}
            </span>
          ))}
        </div>

        <h3 className="text-base font-semibold leading-tight text-naki-primary">
          {template.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-naki-smoke">
          {template.description}
        </p>

        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-500">
          <Star size={12} className="fill-blue-400 text-blue-400" />
          <span>{template.rating > 0 ? template.rating.toFixed(1) : "Baru"}</span>
          {template.reviews?.length ? (
            <span className="text-naki-smoke">
              ({template.reviews.length} ulasan)
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-xs text-naki-smoke">Opsi source code</p>
            <p className="text-lg font-bold text-naki-primary">
              {template.price}
            </p>
          </div>
          <Link
            className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-500 transition hover:bg-blue-100"
            to={`/templates/${template.slug}`}
            aria-label={`Lihat design ${template.title}`}
          >
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
