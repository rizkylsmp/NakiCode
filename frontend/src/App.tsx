import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Route, Routes, useLocation } from "react-router-dom";
import { trackPageView } from "./analytics";
import {
  type HealthState,
  type PortfolioItem,
  type TemplateCategory,
  type TemplateItem,
} from "./content";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { UserLoginPage } from "./pages/UserLoginPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { RequireAdmin, RequireAuth } from "./route-guards";

const HomePage = lazy(() =>
  import("./pages/HomePage").then((module) => ({
    default: module.HomePage,
  })),
);
const TemplateDetailPage = lazy(() =>
  import("./pages/TemplateDetailPage").then((module) => ({
    default: module.TemplateDetailPage,
  })),
);
const AdminTemplatesPage = lazy(() =>
  import("./pages/AdminTemplatesPage").then((module) => ({
    default: module.AdminTemplatesPage,
  })),
);
const CheckoutPage = lazy(() =>
  import("./pages/CheckoutPage").then((module) => ({
    default: module.CheckoutPage,
  })),
);
const BlogListPage = lazy(() =>
  import("./pages/BlogListPage").then((module) => ({
    default: module.BlogListPage,
  })),
);
const BlogDetailPage = lazy(() =>
  import("./pages/BlogDetailPage").then((module) => ({
    default: module.BlogDetailPage,
  })),
);
const MyOrdersPage = lazy(() =>
  import("./pages/MyOrdersPage").then((module) => ({
    default: module.MyOrdersPage,
  })),
);
const UserProfilePage = lazy(() =>
  import("./pages/UserProfilePage").then((module) => ({
    default: module.UserProfilePage,
  })),
);
const WishlistPage = lazy(() =>
  import("./pages/WishlistPage").then((module) => ({
    default: module.WishlistPage,
  })),
);
const ComparePage = lazy(() =>
  import("./pages/ComparePage").then((module) => ({
    default: module.ComparePage,
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
  const { data: bootstrapData, isError } = useQuery({
    queryKey: ["app-bootstrap"],
    queryFn: fetchAppBootstrap,
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
    if (location.pathname !== "/template") {
      return;
    }

    const params = new URLSearchParams(location.search);
    const requestedCategory = params.get("category");
    const requestedQuery = params.get("q");

    if (requestedCategory) {
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

  const health =
    bootstrapData?.health ??
    (isError
      ? {
          status: "offline",
          service: "naki-code-api",
          database: { status: "unknown", message: "Backend belum aktif." },
        }
      : null);

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
    <main className="naki-frosted-grid min-h-screen text-naki-primary">
      <HomePage
        health={health}
        templates={templates}
        categories={categories}
        filteredTemplates={filteredTemplates}
        portfolioItems={portfolioItems}
        activeCategory={activeCategory}
        query={query}
        onCategoryChange={setActiveCategory}
        onQueryChange={setQuery}
      />
    </main>
  );

  return (
    <Suspense fallback={<RouteLoading />}>
      <Helmet>
        <title>Naki Code</title>
        <meta
          name="description"
          content="Naki Code menyediakan template website siap pakai untuk portfolio, e-commerce, top up games, CRUD, company profile, dan pesanan custom."
        />
        <meta property="og:title" content="Naki Code - Toko Template Coding" />
        <meta
          property="og:description"
          content="Cari dan checkout template coding siap pakai dari Naki Code."
        />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Store",
            name: "Naki Code",
            description: "Toko template coding dan jasa custom website.",
          })}
        </script>
      </Helmet>
      <Routes>
        <Route path="/" element={homePageElement} />
        <Route path="/template" element={homePageElement} />
        <Route
          path="/templates/:slug"
          element={<TemplateDetailPage templates={templates} />}
        />
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
          path="/compare"
          element={<ComparePage templates={templates} />}
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
          path="/admin/templates"
          element={
            <RequireAdmin>
              <AdminTemplatesPage
                templates={templates}
                categories={categories}
                projects={portfolioItems}
                onTemplatesChange={setTemplates}
                onProjectsChange={setPortfolioItems}
              />
            </RequireAdmin>
          }
        />
      </Routes>
    </Suspense>
  );
}

async function fetchAppBootstrap() {
  const [health, templates, categories, projects] = await Promise.all([
    fetch("/api/health").then(
      (response) => response.json() as Promise<HealthState>,
    ),
    fetch("/api/templates").then(
      (response) => response.json() as Promise<TemplatesResponse>,
    ),
    fetch("/api/categories").then(
      (response) => response.json() as Promise<CategoriesResponse>,
    ),
    fetch("/api/projects").then(
      (response) => response.json() as Promise<ProjectsResponse>,
    ),
  ]);

  return { health, templates, categories, projects };
}

function RouteLoading() {
  return (
    <main className="naki-frosted-grid grid min-h-screen place-items-center text-naki-primary">
      <div className="rounded-xl border border-naki-steel bg-naki-frost px-5 py-4 text-sm font-black shadow-naki-card">
        Memuat halaman...
      </div>
    </main>
  );
}

export default App;
