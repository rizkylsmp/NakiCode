import {
  Database,
  Gamepad2,
  Heart,
  Laptop,
  MonitorSmartphone,
  Package,
  Search,
  ShoppingBag,
  Store,
} from "lucide-react";
import type { TemplateCategory } from "../content";

const categoryIcons = {
  Semua: Store,
  Portfolio: MonitorSmartphone,
  "E-commerce": ShoppingBag,
  "Top up games": Gamepad2,
  "Web Bucin": Heart,
  CRUD: Database,
  Company: Laptop,
};

type CategoryFilterProps = {
  categories: TemplateCategory[];
  activeCategory: TemplateCategory;
  query: string;
  onCategoryChange: (category: TemplateCategory) => void;
  onQueryChange: (value: string) => void;
};

export function CategoryFilter({
  categories,
  activeCategory,
  query,
  onCategoryChange,
  onQueryChange,
}: CategoryFilterProps) {
  return (
    <section id="kategori" className="border-y border-naki-steel bg-naki-frost">
      <div className="flex w-full flex-col gap-5 px-5 py-5 md:px-8 xl:px-12 2xl:px-16">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-black text-naki-primary">
              Cari berdasarkan jenis website
            </h2>
            <p className="mt-2 text-naki-smoke">
              Pilih kategori, lalu katalog akan otomatis menyesuaikan.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-naki-smoke"
              size={18}
            />
            <input
              className="h-11 w-full rounded-lg border border-naki-steel bg-naki-frost pl-10 pr-4 text-sm font-semibold outline-none transition placeholder:text-naki-smoke focus:border-naki-secondary"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Cari template..."
              type="search"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {categories.map((category) => {
            const Icon =
              categoryIcons[category as keyof typeof categoryIcons] ?? Package;
            const isActive = activeCategory === category;

            return (
              <button
                key={category}
                className={`flex flex-row items-start gap-3 justify-center rounded-lg border p-4 text-left transition ${
                  isActive
                    ? "border-naki-secondary bg-naki-steel text-naki-primary"
                    : "border-naki-steel bg-naki-frost text-naki-smoke hover:border-naki-secondary"
                }`}
                onClick={() => onCategoryChange(category)}
                type="button"
              >
                <Icon size={22} strokeWidth={2.15} />
                <span className="text-sm font-black">{category}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
