import { Search, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import type { TemplateCategory } from "../../domain/content";
import { getTemplateCategoryPath } from "../../utils/template-url";

type TemplateFilterBarProps = {
  categories: TemplateCategory[];
  activeCategory: TemplateCategory;
  query: string;
  sortBy: string;
  onCategoryChange: (category: TemplateCategory) => void;
  onQueryChange: (value: string) => void;
  onSortChange: (value: string) => void;
  resultCount: number;
};

const sortOptions = [
  { value: "popular", label: "Paling Populer" },
  { value: "newest", label: "Terbaru" },
  { value: "price-low", label: "Harga Terendah" },
  { value: "price-high", label: "Harga Tertinggi" },
];

export function TemplateFilterBar({
  categories,
  activeCategory,
  query,
  sortBy,
  onCategoryChange,
  onQueryChange,
  onSortChange,
  resultCount,
}: TemplateFilterBarProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 xl:px-12 2xl:px-16">
      <div className="rounded-xl border border-naki-steel bg-white px-4 py-3 shadow-sm md:px-6 md:py-4">
        {/* Top row: search + sort */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search */}
          <label className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-naki-smoke"
              size={18}
            />
            <input
              className="h-10 w-full rounded-lg border border-naki-steel bg-naki-page-bg pl-10 pr-4 text-sm outline-none placeholder:text-naki-smoke focus:border-blue-400"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Cari design, teknologi, atau kategori..."
              type="search"
            />
          </label>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden items-center gap-1 text-sm text-naki-smoke sm:flex">
              <SlidersHorizontal size={16} />
            </span>
            <select
              className="h-10 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none focus:border-blue-400 md:w-auto"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bottom row: category pills */}
        <div className="mt-3 flex gap-2 overflow-x-auto border-t border-naki-steel pt-3 pb-1">
          <Link
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              activeCategory === "Semua"
                ? "bg-naki-primary text-white"
                : "bg-naki-frost text-naki-smoke hover:text-naki-primary"
            }`}
            onClick={() => onCategoryChange("Semua")}
            to={getTemplateCategoryPath("Semua")}
          >
            Semua
          </Link>
          {categories
            .filter((c) => c !== "Semua")
            .map((cat) => (
              <Link
                key={cat}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  activeCategory === cat
                    ? "bg-naki-primary text-white"
                    : "bg-naki-frost text-naki-smoke hover:text-naki-primary"
                }`}
                onClick={() => onCategoryChange(cat)}
                to={getTemplateCategoryPath(cat)}
              >
                {cat}
              </Link>
            ))}
        </div>
      </div>

      {/* Result count */}
      <p className="mt-4 text-sm text-naki-smoke">
        Menampilkan <strong className="text-naki-primary">{resultCount}</strong> design
      </p>
    </div>
  );
}
