import {
  ArrowRight,
  Code2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { TemplateCategory, TemplateItem } from "../../domain/content";
import { useAuth } from "../../contexts/auth-context";
import { useFavoriteTemplates } from "../../hooks/useFavorites";
import { TemplateCard } from "./TemplateCard";
import { TemplateCardSkeleton } from "../ui/skeletons/TemplateCardSkeleton";

type TemplateCatalogProps = {
  templates: TemplateItem[];
  allTemplates: TemplateItem[];
  activeCategory: TemplateCategory;
  isLoading?: boolean;
};

export function TemplateCatalog({
  templates,
  allTemplates,
  activeCategory,
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

  return (
    <section
      id="template"
      className="relative z-0 w-full px-4 py-10 sm:px-5 md:px-8 md:py-14 xl:px-12 2xl:px-16"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
              Pilihan Terbaik
            </p>
            <h2 className="mt-1 text-2xl font-bold text-naki-primary md:text-3xl">
              {activeCategory === "Semua"
                ? "Design Unggulan"
                : `Design ${activeCategory}`}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-naki-smoke">
              Gunakan design sebagai inspirasi awal. Kami siap menyesuaikan visual, konten, dan fitur untuk website-mu.
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-500 transition hover:text-blue-600"
            to="/template"
          >
            Lihat semua design
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Design grid */}
        <div className="grid gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <TemplateCardSkeleton key={index} />
            ))
          ) : templates.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <Code2 className="mx-auto text-naki-steel" size={48} />
              <h3 className="mt-4 text-xl font-semibold text-naki-primary">
                Tidak ada design ditemukan
              </h3>
              <p className="mt-2 text-sm text-naki-smoke">
                Coba pilih kategori lain atau reset filter.
              </p>
            </div>
          ) : (
            templates.map((template) => (
              <TemplateCard
                key={template.id}
                isAuthenticated={isAuthenticated}
                isCompared={compareIds.includes(template.id)}
                isFavorite={favoriteIds.has(template.id)}
                isFavoriteLoading={isFavoriteLoading}
                template={template}
                onToggleCompare={toggleCompare}
                onToggleFavorite={toggleFavorite}
              />
            ))
          )}
        </div>

        {/* Compare section */}
        {compareTemplates.length > 0 ? (
          <section className="mt-8 rounded-2xl border border-naki-steel bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
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
                    <span>Source code: {template.price}</span>
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
