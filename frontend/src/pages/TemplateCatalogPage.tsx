import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import type { HealthState, TemplateCategory, TemplateItem } from "../content";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { TemplateFilterBar } from "../components/TemplateFilterBar";
import { TemplateCatalog } from "../components/TemplateCatalog";

type TemplateCatalogPageProps = {
  health: HealthState | null;
  templates: TemplateItem[];
  categories: TemplateCategory[];
  activeCategory: TemplateCategory;
  query: string;
  isLoading?: boolean;
  onCategoryChange: (category: TemplateCategory) => void;
  onQueryChange: (value: string) => void;
};

export function TemplateCatalogPage({
  health,
  templates,
  categories,
  activeCategory,
  query,
  isLoading,
  onCategoryChange,
  onQueryChange,
}: TemplateCatalogPageProps) {
  const [sortBy, setSortBy] = useState("popular");

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const result = templates.filter((template) => {
      const matchesCategory =
        activeCategory === "Semua" || template.category === activeCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          template.title,
          template.category,
          template.description,
          template.stack.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });

    // Sort
    switch (sortBy) {
      case "price-low":
        return [...result].sort((a, b) => {
          const aPrice = parseInt(a.price.replace(/\D/g, ""), 10) || 0;
          const bPrice = parseInt(b.price.replace(/\D/g, ""), 10) || 0;
          return aPrice - bPrice;
        });
      case "price-high":
        return [...result].sort((a, b) => {
          const aPrice = parseInt(a.price.replace(/\D/g, ""), 10) || 0;
          const bPrice = parseInt(b.price.replace(/\D/g, ""), 10) || 0;
          return bPrice - aPrice;
        });
      case "newest":
        return [...result].sort((a, b) => b.id - a.id);
      default:
        return result.sort((a, b) => b.rating - a.rating);
    }
  }, [activeCategory, query, sortBy, templates]);

  return (
    <div className="naki-frosted-grid min-h-screen text-naki-primary">
      <Helmet>
        <title>Koleksi Template - Naki Code</title>
        <meta
          name="description"
          content="Pilih template terbaik untuk project-mu. Semua template dilengkapi dokumentasi dan update berkala."
        />
      </Helmet>

      <Header />

      {/* Dark navy hero */}
      <section className="bg-naki-primary px-5 py-14 text-center md:px-8 xl:px-12 2xl:px-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
          Koleksi Template
        </p>
        <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
          Pilih template terbaik untuk project-mu
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-slate-400">
          Semua template dilengkapi dokumentasi dan update berkala.
        </p>
      </section>

      {/* Floating filter bar */}
      <section className="relative z-10 -mt-6 px-5 md:px-8 xl:px-12 2xl:px-16">
        <TemplateFilterBar
          categories={categories}
          activeCategory={activeCategory}
          query={query}
          sortBy={sortBy}
          onCategoryChange={onCategoryChange}
          onQueryChange={onQueryChange}
          onSortChange={setSortBy}
          resultCount={filteredTemplates.length}
        />
      </section>

      {/* Template grid */}
      <section className="bg-naki-page-bg px-5 pb-16 pt-8 md:px-8 xl:px-12 2xl:px-16">
        <TemplateCatalog
          templates={filteredTemplates}
          allTemplates={templates}
          activeCategory={activeCategory}
          health={health}
          isLoading={isLoading}
        />
      </section>

      <Footer />
    </div>
  );
}
