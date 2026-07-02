import {
  ArrowRight,
  Code2,
  Eye,
  GitCompare,
  Heart,
  ShoppingCart,
  Star,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { HealthState, TemplateCategory, TemplateItem } from "../content";
import { useAuth } from "../auth-context";
import { useFavoriteTemplates } from "../use-favorites";
import { TemplateCardSkeleton } from "./skeletons/TemplateCardSkeleton";

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

  const databaseOnline = health?.database.status === "online";

  return (
    <section
      id="template"
      className="relative z-0 w-full px-5 py-14 md:px-8 xl:px-12 2xl:px-16"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
              Pilihan Terbaik
            </p>
            <h2 className="mt-1 text-2xl font-bold text-naki-primary md:text-3xl">
              Template Unggulan
            </h2>
            <p className="mt-2 text-sm text-naki-smoke">
              Mulai project-mu dengan template yang sudah teruji kualitasnya, lengkap dengan dokumentasi dan dukungan.
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-500 transition hover:text-blue-600"
            to="/template"
          >
            Lihat semua template
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Template grid */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <TemplateCardSkeleton key={index} />
            ))
          ) : templates.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <Code2 className="mx-auto text-naki-steel" size={48} />
              <h3 className="mt-4 text-xl font-semibold text-naki-primary">
                Tidak ada template ditemukan
              </h3>
              <p className="mt-2 text-sm text-naki-smoke">
                Coba pilih kategori lain atau reset filter.
              </p>
            </div>
          ) : (
            templates.map((template) => (
              <article
                key={template.id}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:shadow-md"
              >
                {/* Image */}
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

                  {/* Category badge */}
                  <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-xs font-medium text-naki-primary backdrop-blur">
                    {template.category}
                  </span>

                  {/* Wishlist button */}
                  {isAuthenticated && (
                    <button
                      className={`absolute right-3 top-3 grid size-8 place-items-center rounded-full transition ${
                        favoriteIds.has(template.id)
                          ? "bg-blue-500 text-white"
                          : "bg-white/90 text-naki-smoke backdrop-blur hover:text-naki-primary"
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
                        size={14}
                        fill={favoriteIds.has(template.id) ? "currentColor" : "none"}
                      />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Tech tags */}
                  <div className="mb-2 flex flex-wrap gap-1">
                    {template.stack.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="text-xs font-medium text-naki-smoke"
                      >
                        #{tech}
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold leading-tight text-naki-primary">
                    {template.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-1 line-clamp-2 text-xs text-naki-smoke">
                    {template.description}
                  </p>

                  {/* Rating */}
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-500">
                    <Star size={12} className="fill-blue-400 text-blue-400" />
                    <span>
                      {template.rating > 0
                        ? template.rating.toFixed(1)
                        : "Baru"}
                    </span>
                    {template.reviews?.length ? (
                      <span className="text-naki-smoke">
                        ({template.reviews.length} ulasan)
                      </span>
                    ) : null}
                  </div>

                  {/* Price + Cart */}
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-naki-smoke line-through">
                        {template.price}
                      </p>
                      <p className="text-lg font-bold text-naki-primary">
                        {template.price}
                      </p>
                    </div>
                    <Link
                      className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-500 transition hover:bg-blue-100"
                      to={`/templates/${template.slug}`}
                      aria-label={`Lihat detail ${template.title}`}
                    >
                      <ShoppingCart size={16} />
                    </Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Compare section */}
        {compareTemplates.length > 0 ? (
          <section className="mt-10 rounded-2xl border border-naki-steel bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
                  Compare
                </p>
                <h3 className="text-xl font-bold text-naki-primary">
                  Bandingkan {compareTemplates.length} pilihan
                </h3>
              </div>
              <button
                className="grid size-9 place-items-center rounded-lg border border-naki-steel text-naki-smoke transition hover:bg-naki-frost"
                onClick={() => setCompareIds([])}
                type="button"
                aria-label="Kosongkan compare"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {compareTemplates.map((template) => (
                <article
                  key={template.id}
                  className="rounded-xl bg-naki-frost p-4"
                >
                  <p className="text-xs font-medium text-blue-500">
                    {template.category}
                  </p>
                  <h4 className="mt-1 text-base font-semibold text-naki-primary">
                    {template.title}
                  </h4>
                  <div className="mt-3 grid gap-1.5 text-sm text-naki-smoke">
                    <span>Harga: {template.price}</span>
                    <span>Level: {template.level}</span>
                    <span>Rating: {template.rating || "Baru"}</span>
                    <span>Stack: {template.stack.slice(0, 3).join(", ")}</span>
                  </div>
                  <Link
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-500"
                    to={`/templates/${template.slug}`}
                  >
                    Lihat detail <ArrowRight size={12} />
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}
