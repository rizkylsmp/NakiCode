import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import type { TemplateCategory, TemplateItem } from "../domain/content";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { TemplateFilterBar } from "../components/catalog/TemplateFilterBar";
import { TemplateCatalog } from "../components/catalog/TemplateCatalog";
import { getTemplateCategoryPath } from "../utils/template-url";

type TemplateCatalogPageProps = {
  templates: TemplateItem[];
  categories: TemplateCategory[];
  activeCategory: TemplateCategory;
  query: string;
  isLoading?: boolean;
  onCategoryChange: (category: TemplateCategory) => void;
  onQueryChange: (value: string) => void;
};

export function TemplateCatalogPage({
  templates,
  categories,
  activeCategory,
  query,
  isLoading,
  onCategoryChange,
  onQueryChange,
}: TemplateCatalogPageProps) {
  const [sortBy, setSortBy] = useState("popular");
  const isCategoryPage = activeCategory !== "Semua";
  const categoryPath = getTemplateCategoryPath(activeCategory);
  const canonicalUrl = `${window.location.origin}${categoryPath}`;
  const pageTitle = isCategoryPage
    ? `Design ${activeCategory} - Naki Code`
    : "Koleksi Design Website - Naki Code";
  const pageDescription = isCategoryPage
    ? `Koleksi design ${activeCategory} sebagai referensi website yang siap disesuaikan oleh Naki Code. Source code tersedia sebagai opsi.`
    : "Pilih design website sebagai inspirasi, lalu sesuaikan tampilan, konten, dan fiturnya bersama Naki Code.";

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
        return [...result].sort((a, b) => b.rating - a.rating);
    }
  }, [activeCategory, query, sortBy, templates]);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isCategoryPage
      ? `Design ${activeCategory} Naki Code`
      : "Koleksi Design Website Naki Code",
    description: pageDescription,
    numberOfItems: filteredTemplates.length,
    itemListElement: filteredTemplates.slice(0, 20).map((template, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${window.location.origin}/design/${template.slug}`,
      name: template.title,
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${window.location.origin}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Design",
        item: `${window.location.origin}/design`,
      },
      ...(isCategoryPage
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: activeCategory,
              item: canonicalUrl,
            },
          ]
        : []),
    ],
  };

  return (
    <div className="naki-frosted-grid min-h-screen text-naki-primary">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <Header />

      {/* Dark navy hero */}
      <main id="main-content" tabIndex={-1}>
      <section className="bg-naki-primary px-5 py-14 text-center md:px-8 xl:px-12 2xl:px-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
          {isCategoryPage ? `Kategori ${activeCategory}` : "Koleksi Design"}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
          {isCategoryPage
            ? `Design ${activeCategory} siap disesuaikan`
            : "Pilih design untuk website-mu"}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-slate-400">
          {pageDescription}
        </p>
      </section>

      {/* Floating filter bar */}
      <section className="relative z-10 -mt-6">
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

      {/* Design grid */}
      <section className="bg-naki-page-bg pb-8">
        <TemplateCatalog
          templates={filteredTemplates}
          activeCategory={activeCategory}
          isLoading={isLoading}
        />
      </section>
      </main>

      <Footer />
    </div>
  );
}
