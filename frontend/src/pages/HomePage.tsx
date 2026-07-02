import { useQuery } from "@tanstack/react-query";
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
import { apiGet } from "../api-client";
import {
  faqs,
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

type BlogPostsResponse = {
  posts: Array<{
    id: number;
    slug: string;
    title: string;
    excerpt: string;
    author: string;
    status: string;
    publishedAt: string | null;
    createdAt: string;
  }>;
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
  const { data: blogData } = useQuery({
    queryKey: ["home-blog-posts"],
    queryFn: () => apiGet<BlogPostsResponse>("/api/blog"),
    staleTime: 5 * 60 * 1000,
  });

  const blogPosts = blogData?.posts ?? [];

  // Calculate real stats from templates data
  const totalTemplates = templates.length;
  const totalDevelopers = templates.reduce((sum, t) => sum + (t.buyerCount || 0), 0);
  const totalTransactions = templates.reduce((sum, t) => sum + (t.buyerCount || 0), 0);
  const averageRating = templates.length > 0
    ? templates.reduce((sum, t) => sum + (t.rating || 0), 0) / templates.length
    : 0;

  return (
    <div className="naki-frosted-grid min-h-screen text-naki-primary">
      <Header />
      <Hero
        totalTemplates={totalTemplates}
        totalDevelopers={totalDevelopers}
        totalTransactions={totalTransactions}
        averageRating={averageRating}
      />
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
        items={portfolioItems.length > 0 ? portfolioItems : []}
      />
      <LearningSection blogPosts={blogPosts} />
      <FaqSection faqs={faqs} />
      <CTASection />
      <Footer />
    </div>
  );
}
