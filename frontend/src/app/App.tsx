import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Loader2 } from "lucide-react";
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
import { getTemplateCategoryFromSlug } from "../utils/design-url";
import { FloatingActions } from "../components/layout/FloatingActions";
import { absoluteSiteUrl, getSiteOrigin } from "../utils/seo";

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

const CouponBannerOverlay = lazyWithReload(() =>
  import("../components/promotions/CouponBannerOverlay").then((module) => ({
    default: module.CouponBannerOverlay,
  })),
);

const HomePage = lazyWithReload(() =>
  import("../pages/HomePage").then((module) => ({
    default: module.HomePage,
  })),
);
const DesignDetailPage = lazyWithReload(() =>
  import("../pages/DesignDetailPage").then((module) => ({
    default: module.DesignDetailPage,
  })),
);
const DesignCatalogPage = lazyWithReload(() =>
  import("../pages/DesignCatalogPage").then((module) => ({
    default: module.DesignCatalogPage,
  })),
);
const AdminDesignsPage = lazyWithReload(() =>
  import("../pages/AdminDesignsPage").then((module) => ({
    default: module.AdminDesignsPage,
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
const PortfolioPage = lazyWithReload(() =>
  import("../pages/PortfolioPage").then((module) => ({
    default: module.PortfolioPage,
  })),
);
const LegalPage = lazyWithReload(() =>
  import("../pages/LegalPage").then((module) => ({
    default: module.LegalPage,
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
  const siteOrigin = getSiteOrigin();
  const googleSiteVerification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION?.trim();
  const canonicalHomeUrl = absoluteSiteUrl("/");
  const isHomePage = location.pathname === "/";
  const isPrivatePage = [
    "/admin",
    "/akun-saya",
    "/checkout",
    "/forgot-password",
    "/login",
    "/pesanan-saya",
    "/profile",
    "/verify-email",
    "/wishlist",
  ].some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>(["Semua"]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [activeCategory, setActiveCategory] =
    useState<TemplateCategory>("Semua");
  const [query, setQuery] = useState("");
  const templatesQuery = useQuery({
    queryKey: ["app-templates"],
    queryFn: () => apiGet<TemplatesResponse>("/api/designs"),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
  const categoriesQuery = useQuery({
    queryKey: ["app-categories"],
    queryFn: () => apiGet<CategoriesResponse>("/api/categories"),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
  const projectsQuery = useQuery({
    queryKey: ["app-projects"],
    queryFn: () => apiGet<ProjectsResponse>("/api/projects"),
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
    if (Array.isArray(templatesQuery.data?.templates)) {
      setTemplates(templatesQuery.data.templates);
    }
  }, [templatesQuery.data]);

  useEffect(() => {
    if (!Array.isArray(categoriesQuery.data?.categories)) {
      return;
    }

    const nextCategories = categoriesQuery.data.categories;
    setCategories(nextCategories);
    setActiveCategory((currentCategory) =>
      nextCategories.includes(currentCategory) ? currentCategory : "Semua",
    );
  }, [categoriesQuery.data]);

  useEffect(() => {
    if (Array.isArray(projectsQuery.data?.projects)) {
      setPortfolioItems(projectsQuery.data.projects);
    }
  }, [projectsQuery.data]);

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
        isLoadingCategories={categoriesQuery.isPending}
        isLoadingProjects={projectsQuery.isPending}
        isLoadingTemplates={templatesQuery.isPending}
        onQueryChange={setQuery}
      />
    </div>
  );

  return (
    <Suspense fallback={<RouteLoading />}>
      <ToastProvider>
        <Helmet>
          <html lang="id" />
          <title>Naki Code - Jasa Pembuatan Website Berbasis Design</title>
          <meta
            name="description"
            content="Naki Code menyediakan jasa pembuatan website dengan koleksi design referensi yang siap disesuaikan untuk brand, bisnis, dan kebutuhan custom."
          />
          <meta property="og:title" content="Naki Code - Jasa Pembuatan Website Berbasis Design" />
          <meta
            property="og:description"
            content="Pilih design website, konsultasikan kebutuhanmu, lalu kami sesuaikan hingga siap digunakan. Source code juga tersedia sebagai opsi."
          />
          <meta name="robots" content={isPrivatePage ? "noindex, nofollow" : "index, follow, max-image-preview:large"} />
          <meta property="og:locale" content="id_ID" />
          <meta property="og:site_name" content="Naki Code" />
          <meta property="og:url" content={canonicalHomeUrl} />
          <meta property="og:image" content={absoluteSiteUrl("/logo.png")} />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content="Naki Code - Jasa Pembuatan Website Berbasis Design" />
          <meta name="twitter:description" content="Pilih design website, konsultasikan kebutuhanmu, lalu kami sesuaikan hingga siap digunakan." />
          <meta name="twitter:image" content={absoluteSiteUrl("/logo.png")} />
          {googleSiteVerification ? <meta name="google-site-verification" content={googleSiteVerification} /> : null}
          {isHomePage ? <link rel="canonical" href={canonicalHomeUrl} /> : null}
          {isHomePage ? (
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "ProfessionalService",
                    "@id": `${siteOrigin}/#business`,
                    name: "Naki Code",
                    url: canonicalHomeUrl,
                    logo: absoluteSiteUrl("/logo.png"),
                    description: "Jasa pembuatan website dengan design referensi yang dapat disesuaikan untuk brand dan kebutuhan bisnis.",
                    areaServed: { "@type": "Country", name: "Indonesia" },
                  },
                  {
                    "@type": "WebSite",
                    "@id": `${siteOrigin}/#website`,
                    url: canonicalHomeUrl,
                    name: "Naki Code",
                    inLanguage: "id-ID",
                    publisher: { "@id": `${siteOrigin}/#business` },
                    potentialAction: {
                      "@type": "SearchAction",
                      target: `${siteOrigin}/design?q={search_term_string}`,
                      "query-input": "required name=search_term_string",
                    },
                  },
                ],
              })}
            </script>
          ) : null}
        </Helmet>
        <Routes>
        <Route path="/" element={homePageElement} />
        <Route
          path="/design"
          element={
            <DesignCatalogPage
              templates={templates}
              categories={categories}
              activeCategory={activeCategory}
              query={query}
              isLoading={templatesQuery.isPending}
              onCategoryChange={setActiveCategory}
              onQueryChange={setQuery}
            />
          }
        />
        <Route
          path="/design/kategori/:categorySlug"
          element={
            <DesignCatalogPage
              templates={templates}
              categories={categories}
              activeCategory={activeCategory}
              query={query}
              isLoading={templatesQuery.isPending}
              onCategoryChange={setActiveCategory}
              onQueryChange={setQuery}
            />
          }
        />
        <Route
          path="/design/:slug"
          element={(
            <DesignDetailPage
              templates={templates}
              isLoading={templatesQuery.isPending}
            />
          )}
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
        <Route path="/portofolio" element={<PortfolioPage />} />
        <Route path="/kebijakan-privasi" element={<LegalPage kind="privacy" />} />
        <Route path="/syarat-ketentuan" element={<LegalPage kind="terms" />} />
        <Route path="/privacy-policy" element={<Navigate replace to="/kebijakan-privasi" />} />
        <Route path="/terms" element={<Navigate replace to="/syarat-ketentuan" />} />
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
              <AdminDesignsPage
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
        <CouponBannerOverlay />
        <FloatingActions />
      </ToastProvider>
    </Suspense>
  );
}

function RouteLoading() {
  return (
    <div className="naki-frosted-grid grid min-h-screen place-items-center text-naki-primary">
      <div
        className="relative z-10 flex items-center gap-3 rounded-xl border border-naki-steel bg-naki-frost px-5 py-4 text-sm font-semibold text-naki-primary shadow-naki-card"
        aria-live="polite"
        role="status"
      >
        <Loader2
          aria-hidden="true"
          className="size-5 animate-spin text-naki-secondary"
        />
        <span>Memuat halaman...</span>
      </div>
    </div>
  );
}

export default App;
