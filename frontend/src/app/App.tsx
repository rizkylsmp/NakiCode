import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { trackPageView } from "../services/analytics";
import { apiGet } from "../services/api-client";
import {
  type PortfolioItem,
  type TemplateCategory,
  type TemplateItem,
} from "../domain/content";
import { RequireAdmin, RequireAuth } from "./route-guards";
import { ToastProvider } from "../components/ui/Toast";
import { getTemplateCategoryFromSlug } from "../utils/template-url";

/**
 * One-time stale chunk reload guard.
 * Vite hashed chunks become 404 after new deploy — Vercel serves HTML instead
 * of JS, which fails as "Failed to fetch dynamically imported module".
 * On first failure we reload the page (new index.html → new chunk references).
 * If the reload doesn't fix it we let the ErrorBoundary catch the error.
 */
const STALE_CHUNK_KEY = "naki-stale-chunk-reloaded";

function LegacyDesignDetailRedirect() {
  const { slug = "" } = useParams();
  return <Navigate replace to={`/design/${encodeURIComponent(slug)}`} />;
}

// React.lazy needs to preserve each page component's own props.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LazyComponent = ComponentType<any>;

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message;
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /ChunkLoadError/i.test(msg)
  );
}

function lazyWithReload<T extends LazyComponent>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(() =>
    factory().catch((error) => {
      if (isChunkLoadError(error)) {
        if (!sessionStorage.getItem(STALE_CHUNK_KEY)) {
          sessionStorage.setItem(STALE_CHUNK_KEY, "1");
          console.warn(
            "[Naki] Stale chunk detected, reloading to get latest app shell...",
          );
          window.location.reload();
          // Return a never-resolving promise so React stays in Suspense
          // while the page reloads.
          return new Promise<{ default: T }>(() => {});
        }
        // Already reloaded once — clear flag and let ErrorBoundary handle it.
        sessionStorage.removeItem(STALE_CHUNK_KEY);
        console.error("[Naki] Chunk still stale after reload. Falling through to ErrorBoundary.");
      }
      throw error;
    }),
  );
}

const HomePage = lazyWithReload(() =>
  import("../pages/HomePage").then((module) => ({
    default: module.HomePage,
  })),
);
const TemplateDetailPage = lazyWithReload(() =>
  import("../pages/TemplateDetailPage").then((module) => ({
    default: module.TemplateDetailPage,
  })),
);
const TemplateCatalogPage = lazyWithReload(() =>
  import("../pages/TemplateCatalogPage").then((module) => ({
    default: module.TemplateCatalogPage,
  })),
);
const AdminTemplatesPage = lazyWithReload(() =>
  import("../pages/AdminTemplatesPage").then((module) => ({
    default: module.AdminTemplatesPage,
  })),
);
const CheckoutPage = lazyWithReload(() =>
  import("../pages/CheckoutPage").then((module) => ({
    default: module.CheckoutPage,
  })),
);
const BlogListPage = lazyWithReload(() =>
  import("../pages/BlogListPage").then((module) => ({
    default: module.BlogListPage,
  })),
);
const BlogDetailPage = lazyWithReload(() =>
  import("../pages/BlogDetailPage").then((module) => ({
    default: module.BlogDetailPage,
  })),
);
const MyOrdersPage = lazyWithReload(() =>
  import("../pages/MyOrdersPage").then((module) => ({
    default: module.MyOrdersPage,
  })),
);
const UserProfilePage = lazyWithReload(() =>
  import("../pages/UserProfilePage").then((module) => ({
    default: module.UserProfilePage,
  })),
);
const WishlistPage = lazyWithReload(() =>
  import("../pages/WishlistPage").then((module) => ({
    default: module.WishlistPage,
  })),
);
const UserLoginPage = lazyWithReload(() =>
  import("../pages/UserLoginPage").then((module) => ({
    default: module.UserLoginPage,
  })),
);
const ForgotPasswordPage = lazyWithReload(() =>
  import("../pages/ForgotPasswordPage").then((module) => ({
    default: module.ForgotPasswordPage,
  })),
);
const VerifyEmailPage = lazyWithReload(() =>
  import("../pages/VerifyEmailPage").then((module) => ({
    default: module.VerifyEmailPage,
  })),
);
const NotFoundPage = lazyWithReload(() =>
  import("../pages/NotFoundPage").then((module) => ({
    default: module.NotFoundPage,
  })),
);

type TemplatesResponse = {
  source: string;
  templates: TemplateItem[];
};

type CategoriesResponse = {
  source: string;
  categories: TemplateCategory[];
};

type ProjectsResponse = {
  source: string;
  projects: PortfolioItem[];
};

function App() {
  const location = useLocation();
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>(["Semua"]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [activeCategory, setActiveCategory] =
    useState<TemplateCategory>("Semua");
  const [query, setQuery] = useState("");
  const {
    data: bootstrapData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["app-bootstrap"],
    queryFn: fetchAppBootstrap,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}${location.hash}`);
  }, [location.hash, location.pathname, location.search]);

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const targetId = decodeURIComponent(location.hash.replace("#", ""));

    window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }, [location.hash, location.pathname, location.search]);

  useEffect(() => {
    if (
      location.pathname !== "/design" &&
      !location.pathname.startsWith("/design/kategori/")
    ) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const requestedCategory = params.get("category");
    const requestedQuery = params.get("q");
    const categorySlug = location.pathname.startsWith("/design/kategori/")
      ? location.pathname.split("/").pop()
      : undefined;

    if (categorySlug) {
      setActiveCategory(getTemplateCategoryFromSlug(categories, categorySlug));
    } else if (requestedCategory) {
      setActiveCategory(
        categories.includes(requestedCategory) ? requestedCategory : "Semua",
      );
    } else {
      setActiveCategory("Semua");
    }

    setQuery(requestedQuery ?? "");
  }, [categories, location.pathname, location.search]);

  useEffect(() => {
    if (!bootstrapData) {
      return;
    }

    if (Array.isArray(bootstrapData.templates.templates)) {
      setTemplates(bootstrapData.templates.templates);
    }

    if (Array.isArray(bootstrapData.categories.categories)) {
      setCategories(bootstrapData.categories.categories);
      if (!bootstrapData.categories.categories.includes(activeCategory)) {
        setActiveCategory("Semua");
      }
    }

    if (Array.isArray(bootstrapData.projects.projects)) {
      setPortfolioItems(bootstrapData.projects.projects);
    }
  }, [activeCategory, bootstrapData]);

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return templates.filter((template) => {
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
  }, [activeCategory, query, templates]);

  function updateTemplate(updatedTemplate: TemplateItem) {
    setTemplates((currentTemplates) =>
      currentTemplates.map((template) =>
        template.id === updatedTemplate.id ? updatedTemplate : template,
      ),
    );
  }

  const homePageElement = (
    <div className="naki-frosted-grid min-h-screen text-naki-primary">
      <HomePage
        templates={templates}
        categories={categories}
        filteredTemplates={filteredTemplates}
        portfolioItems={portfolioItems}
        activeCategory={activeCategory}
        query={query}
        isLoading={isLoading || isError}
        onQueryChange={setQuery}
      />
    </div>
  );

  return (
    <Suspense fallback={<RouteLoading />}>
      <ToastProvider>
        <Helmet>
          <title>Naki Code</title>
          <meta
            name="description"
            content="Naki Code menyediakan jasa pembuatan website dengan koleksi design referensi yang siap disesuaikan untuk brand, bisnis, dan kebutuhan custom."
          />
          <meta property="og:title" content="Naki Code - Jasa Pembuatan Website Berbasis Design" />
          <meta
            property="og:description"
            content="Pilih design website, konsultasikan kebutuhanmu, lalu kami sesuaikan hingga siap digunakan. Source code juga tersedia sebagai opsi."
          />
          <meta property="og:image" content="/logo.png" />
          <meta property="og:type" content="website" />
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              name: "Naki Code",
              description: "Jasa pembuatan website dengan design referensi siap edit dan opsi pembelian source code.",
            })}
          </script>
        </Helmet>
        <Routes>
        <Route path="/" element={homePageElement} />
        <Route
          path="/design"
          element={
            <TemplateCatalogPage
              templates={templates}
              categories={categories}
              activeCategory={activeCategory}
              query={query}
              isLoading={isLoading || isError}
              onCategoryChange={setActiveCategory}
              onQueryChange={setQuery}
            />
          }
        />
        <Route
          path="/design/kategori/:categorySlug"
          element={
            <TemplateCatalogPage
              templates={templates}
              categories={categories}
              activeCategory={activeCategory}
              query={query}
              isLoading={isLoading || isError}
              onCategoryChange={setActiveCategory}
              onQueryChange={setQuery}
            />
          }
        />
        <Route
          path="/design/:slug"
          element={<TemplateDetailPage templates={templates} />}
        />
        <Route path="/template" element={<Navigate replace to="/design" />} />
        <Route path="/template/kategori/:categorySlug" element={<Navigate replace to="/design" />} />
        <Route path="/templates/:slug" element={<LegacyDesignDetailRedirect />} />
        <Route path="/admin/templates" element={<Navigate replace to="/admin/design" />} />
        <Route path="/login" element={<UserLoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogDetailPage />} />
        <Route
          path="/pesanan-saya"
          element={
            <RequireAuth>
              <MyOrdersPage onTemplateUpdate={updateTemplate} />
            </RequireAuth>
          }
        />
        <Route
          path="/checkout/:orderId"
          element={
            <RequireAuth>
              <CheckoutPage />
            </RequireAuth>
          }
        />
        <Route
          path="/akun-saya"
          element={
            <RequireAuth>
              <UserProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/wishlist"
          element={
            <RequireAuth>
              <WishlistPage templates={templates} />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <UserProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/:adminSection"
          element={
            <RequireAdmin>
              <AdminTemplatesPage
                templates={templates}
                categories={categories}
                projects={portfolioItems}
                onTemplatesChange={setTemplates}
                onCategoriesChange={setCategories}
                onProjectsChange={setPortfolioItems}
              />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <Navigate replace to="/admin/dashboard" />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ToastProvider>
    </Suspense>
  );
}

async function fetchAppBootstrap() {
  const [templates, categories, projects] = await Promise.all([
    apiGet<TemplatesResponse>("/api/designs"),
    apiGet<CategoriesResponse>("/api/categories"),
    apiGet<ProjectsResponse>("/api/projects"),
  ]);

  return { templates, categories, projects };
}

function RouteLoading() {
  return (
    <div className="naki-frosted-grid grid min-h-screen place-items-center text-naki-primary">
      <div className="rounded-xl border border-naki-steel bg-white px-5 py-4 text-sm font-semibold shadow-sm">
        Memuat halaman...
      </div>
    </div>
  );
}

export default App;
