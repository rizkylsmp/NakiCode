import { useQuery } from "@tanstack/react-query";
import { CategorySection } from "../components/home/CategorySection";
import { CTASection } from "../components/home/CTASection";
import { FaqSection } from "../components/home/FaqSection";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { Hero } from "../components/home/Hero";
import { LearningSection } from "../components/home/LearningSection";
import { PortfolioSection } from "../components/home/PortfolioSection";
import { TemplateCatalog } from "../components/catalog/TemplateCatalog";
import { TestimonialSection } from "../components/home/TestimonialSection";
import { apiGet } from "../services/api-client";
import {
  faqs,
  type PortfolioItem,
  type TemplateCategory,
  type TemplateItem,
} from "../domain/content";

type HomePageProps = {
  templates: TemplateItem[];
  categories: TemplateCategory[];
  filteredTemplates: TemplateItem[];
  portfolioItems: PortfolioItem[];
  activeCategory: TemplateCategory;
  query: string;
  isLoading?: boolean;
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
  templates,
  categories,
  filteredTemplates,
  portfolioItems,
  activeCategory,
  query: _query,
  isLoading,
  onQueryChange: _onQueryChange,
}: HomePageProps) {
  const {
    data: blogData,
    isLoading: isLoadingBlogPosts,
    isError: isBlogPostsError,
  } = useQuery({
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
        isLoading={isLoading}
      />
      <CategorySection categories={categories} isLoading={isLoading} />
      <TestimonialSection />
      <PortfolioSection
        items={portfolioItems}
        isLoading={isLoading}
      />
      <LearningSection
        blogPosts={blogPosts}
        isLoading={isLoadingBlogPosts || isBlogPostsError}
      />
      <FaqSection faqs={faqs} />
      <CTASection />
      <Footer />
    </div>
  );
}
