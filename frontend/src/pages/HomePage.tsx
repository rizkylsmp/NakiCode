import { CategorySection } from "../components/CategorySection";
import { CTASection } from "../components/CTASection";
import { FaqSection } from "../components/FaqSection";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { LearningSection } from "../components/LearningSection";
import { PortfolioSection } from "../components/PortfolioSection";
import { TemplateCatalog } from "../components/TemplateCatalog";
import { TestimonialSection } from "../components/TestimonialSection";
import {
  articles,
  faqs,
  portfolioItems as defaultPortfolioItems,
  type HealthState,
  type PortfolioItem,
  type TemplateCategory,
  type TemplateItem,
} from "../content";

type HomePageProps = {
  health: HealthState | null;
  templates: TemplateItem[];
  categories: TemplateCategory[];
  filteredTemplates: TemplateItem[];
  portfolioItems: PortfolioItem[];
  activeCategory: TemplateCategory;
  query: string;
  isLoading?: boolean;
  onCategoryChange: (category: TemplateCategory) => void;
  onQueryChange: (value: string) => void;
};

export function HomePage({
  health,
  templates,
  categories,
  filteredTemplates,
  portfolioItems,
  activeCategory,
  query: _query,
  isLoading,
  onCategoryChange,
  onQueryChange: _onQueryChange,
}: HomePageProps) {
  return (
    <div className="naki-frosted-grid min-h-screen text-naki-primary">
      <Header />
      <Hero />
      <TemplateCatalog
        templates={filteredTemplates}
        allTemplates={templates}
        activeCategory={activeCategory}
        health={health}
        isLoading={isLoading}
      />
      <CategorySection categories={categories} />
      <TestimonialSection />
      <PortfolioSection
        items={portfolioItems.length > 0 ? portfolioItems : defaultPortfolioItems}
      />
      <LearningSection articles={articles} />
      <FaqSection faqs={faqs} />
      <CTASection />
      <Footer />
    </div>
  );
}
