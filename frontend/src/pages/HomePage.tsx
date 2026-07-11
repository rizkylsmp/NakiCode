import { useQuery } from "@tanstack/react-query";
import { CategorySection } from "../components/home/CategorySection";
import { CTASection } from "../components/home/CTASection";
import { FaqSection } from "../components/home/FaqSection";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { Hero } from "../components/home/Hero";
import { HowItWorksSection } from "../components/home/HowItWorksSection";
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

  // Calculate stats only from data that is available to the storefront.
  const totalTemplates = templates.length;
  const totalTransactions = templates.reduce((sum, t) => sum + (t.buyerCount || 0), 0);
  const averageRating = templates.length > 0
    ? templates.reduce((sum, t) => sum + (t.rating || 0), 0) / templates.length
    : 0;

  return (
    <div className="naki-frosted-grid min-h-screen text-naki-primary">
      <Header />
      <main id="main-content" tabIndex={-1}>
        <Hero
          totalTemplates={totalTemplates}
          totalProjects={portfolioItems.length}
          totalTransactions={totalTransactions}
          averageRating={averageRating}
        />
        <CategorySection categories={categories} isLoading={isLoading} />
        <div id="cara-kerja">
          <HowItWorksSection />
        </div>
        <TemplateCatalog
          templates={filteredTemplates}
          activeCategory={activeCategory}
          isLoading={isLoading}
        />
        <PortfolioSection
          items={portfolioItems}
          isLoading={isLoading}
        />
        <TestimonialSection />
        <LearningSection
          blogPosts={blogPosts}
          isLoading={isLoadingBlogPosts || isBlogPostsError}
        />
        <FaqSection faqs={faqs} />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
