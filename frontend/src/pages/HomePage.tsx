import { CategoryFilter } from "../components/CategoryFilter";
import { CommunitySection } from "../components/CommunitySection";
import { FaqSection } from "../components/FaqSection";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { LearningSection } from "../components/LearningSection";
import { PortfolioSection } from "../components/PortfolioSection";
import { ServicesSection } from "../components/ServicesSection";
import { TemplateCatalog } from "../components/TemplateCatalog";
import { WorkflowSection } from "../components/WorkflowSection";
import {
  articles,
  faqs,
  portfolioItems as defaultPortfolioItems,
  services,
  workflow,
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
  query,
  onCategoryChange,
  onQueryChange,
}: HomePageProps) {
  return (
    <>
      <Header />
      <Hero
        query={query}
        onQueryChange={onQueryChange}
        featuredTemplates={templates}
      />
      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        query={query}
        onCategoryChange={onCategoryChange}
        onQueryChange={onQueryChange}
      />
      <TemplateCatalog
        templates={filteredTemplates}
        allTemplates={templates}
        activeCategory={activeCategory}
        health={health}
      />
      <ServicesSection services={services} />
      <PortfolioSection
        items={portfolioItems.length > 0 ? portfolioItems : defaultPortfolioItems}
      />
      <CommunitySection />
      <LearningSection articles={articles} />
      <FaqSection faqs={faqs} />
      <WorkflowSection workflow={workflow} />
      <Footer />
    </>
  );
}
