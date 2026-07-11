import { ArrowLeft, ClipboardList, FileText, Globe2, Inbox, LayoutDashboard, MessageSquareQuote } from "lucide-react";
import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { type PortfolioItem, type TemplateItem } from "../../domain/content";
import { type OrderItem } from "../../domain/order-types";
import {
  type AdminOrderFilters,
  type BlogPostFormState,
  type BlogPostItem,
  type DashboardView,
  type OrderStatus,
  type PortfolioFormState,
  type TemplateFormState,
  type TestimonialItem,
} from "./AdminTemplateWorkspace.shared";

// Lazy-loaded admin panels
const AdminDashboardHome = lazy(() => import("./AdminDashboardHome").then((m) => ({ default: m.AdminDashboardHome })));
const BlogAdminPanel = lazy(() => import("./BlogAdminPanel").then((m) => ({ default: m.BlogAdminPanel })));
const OrdersPanel = lazy(() => import("./OrdersPanel").then((m) => ({ default: m.OrdersPanel })));
const PortfolioAdminPanel = lazy(() => import("./PortfolioAdminPanel").then((m) => ({ default: m.PortfolioAdminPanel })));
const TemplatesPanel = lazy(() => import("./TemplatesPanel").then((m) => ({ default: m.TemplatesPanel })));
const AdminTestimonialsSection = lazy(() => import("./AdminTestimonialsSection").then((m) => ({ default: m.AdminTestimonialsSection })));

type AdminTemplateWorkspaceProps = {
  templates: TemplateItem[];
  paginatedTemplates: TemplateItem[];
  filteredTemplatesCount: number;
  templatesPage: number;
  templatesTotalPages: number;
  templateSearch: string;
  templateCategoryFilter: string;
  projects: PortfolioItem[];
  categoryOptions: TemplateItem["category"][];
  selectedId: number | null;
  selectedTemplate: TemplateItem | undefined;
  form: TemplateFormState;
  status: string;
  isSaving: boolean;
  isTemplateModalOpen: boolean;
  adminToken: string | null;
  activeAdminView: DashboardView;
  categoryName: string;
  categoryStatus: string;
  isSavingCategory: boolean;
  isCategoryModalOpen: boolean;
  editingCategory: string | null;
  editingCategoryName: string;
  onEditCategoryNameChange: (value: string) => void;
  onEditCategory: (name: string) => void;
  onSaveEditCategory: () => void;
  onCancelEditCategory: () => void;
  onDeleteCategory: (name: string) => void;
  isDeletingCategory: boolean;
  onOpenCategoryModal: () => void;
  onCloseCategoryModal: () => void;
  onSubmitCategory: (event: React.FormEvent<HTMLFormElement>) => void;
  portfolioForm: PortfolioFormState;
  isPortfolioModalOpen: boolean;
  portfolioStatus: string;
  isSavingPortfolio: boolean;
  deletingProjectId: number | null;
  orders: OrderItem[];
  ordersStatus: string;
  ordersPage: number;
  orderFilters: AdminOrderFilters;
  ordersMeta: {
    total: number;
    totalPages: number;
    pageSize: number;
  };
  isLoadingOrders: boolean;
  updatingOrderId: number | null;
  onActiveAdminViewChange: (view: DashboardView) => void;
  onTemplateSearchChange: (value: string) => void;
  onTemplateCategoryFilterChange: (value: string) => void;
  onTemplatesPageChange: (page: number) => void;
  onRefreshOrders: () => void;
  onOrderFiltersChange: (filters: AdminOrderFilters) => void;
  onOrdersPageChange: (page: number) => void;
  onUpdateOrderStatus: (orderId: number, status: OrderStatus) => Promise<void>;
  onDeleteOrder: (order: OrderItem) => void;
  onStartCreate: () => void;
  onStartEdit: (template: TemplateItem) => void;
  onCloseTemplateModal: () => void;
  onDeleteTemplate: (template: TemplateItem) => void;
  onSubmitTemplate: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdateField: <Key extends keyof TemplateFormState>(key: Key, value: TemplateFormState[Key]) => void;
  onCategoryNameChange: (value: string) => void;
  onUpdatePortfolioField: <Key extends keyof PortfolioFormState>(key: Key, value: PortfolioFormState[Key]) => void;
  onSubmitPortfolio: (event: React.FormEvent<HTMLFormElement>) => void;
  onStartEditPortfolio: (project: PortfolioItem) => void;
  onClosePortfolioModal: () => void;
  onOpenPortfolioModal: () => void;
  onResetPortfolioForm: () => void;
  onDeletePortfolio: (project: PortfolioItem) => void;
  onConfirmDeletePortfolio: () => void;
  onCancelDeletePortfolio: () => void;
  paginatedBlogPosts: BlogPostItem[];
  totalBlogPosts: number;
  blogPostsPage: number;
  blogPostsTotalPages: number;
  blogSearch: string;
  blogForm: BlogPostFormState;
  blogStatus: string;
  isSavingBlog: boolean;
  isBlogModalOpen: boolean;
  deletingBlogId: number | null;
  onBlogSearchChange: (value: string) => void;
  onBlogPostsPageChange: (page: number) => void;
  onStartCreateBlog: () => void;
  onStartEditBlog: (post: BlogPostItem) => void;
  onCloseBlogModal: () => void;
  onOpenBlogModal: () => void;
  onDeleteBlog: (post: BlogPostItem) => void;
  onSubmitBlog: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdateBlogField: <Key extends keyof BlogPostFormState>(key: Key, value: BlogPostFormState[Key]) => void;
  onConfirmDeleteBlog: () => void;
  onCancelDeleteBlog: () => void;
  testimonials: TestimonialItem[];
  onTestimonialsChange: (testimonials: TestimonialItem[]) => void;
};

function PanelLoader() {
  return (
    <div className="grid min-h-75 place-items-center">
      <div className="rounded-xl border border-naki-steel bg-white px-5 py-4 text-sm font-medium text-naki-smoke shadow-sm">
        Memuat...
      </div>
    </div>
  );
}

export function AdminTemplateWorkspace({
  templates,
  paginatedTemplates,
  filteredTemplatesCount,
  templatesPage,
  templatesTotalPages,
  templateSearch,
  templateCategoryFilter,
  projects,
  categoryOptions,
  selectedId,
  selectedTemplate,
  form,
  status,
  isSaving,
  isTemplateModalOpen,
  adminToken,
  activeAdminView,
  categoryName,
  isSavingCategory,
  isCategoryModalOpen,
  editingCategory,
  editingCategoryName,
  onEditCategoryNameChange,
  onEditCategory,
  onSaveEditCategory,
  onCancelEditCategory,
  onDeleteCategory,
  isDeletingCategory,
  onOpenCategoryModal,
  onCloseCategoryModal,
  portfolioForm,
  isPortfolioModalOpen,
  portfolioStatus,
  isSavingPortfolio,
  deletingProjectId,
  orders,
  ordersStatus,
  ordersPage,
  orderFilters,
  ordersMeta,
  isLoadingOrders,
  updatingOrderId,
  onActiveAdminViewChange,
  onTemplateSearchChange,
  onTemplateCategoryFilterChange,
  onTemplatesPageChange,
  onRefreshOrders,
  onOrderFiltersChange,
  onOrdersPageChange,
  onUpdateOrderStatus,
  onDeleteOrder,
  onStartCreate,
  onStartEdit,
  onCloseTemplateModal,
  onDeleteTemplate,
  onSubmitTemplate,
  onUpdateField,
  onCategoryNameChange,
  onSubmitCategory,
  onUpdatePortfolioField,
  onSubmitPortfolio,
  onStartEditPortfolio,
  onClosePortfolioModal,
  onOpenPortfolioModal,
  onResetPortfolioForm,
  onDeletePortfolio,
  onConfirmDeletePortfolio,
  onCancelDeletePortfolio,
  paginatedBlogPosts,
  totalBlogPosts,
  blogPostsPage,
  blogPostsTotalPages,
  blogSearch,
  blogForm,
  blogStatus,
  isSavingBlog,
  isBlogModalOpen,
  deletingBlogId,
  onBlogSearchChange,
  onBlogPostsPageChange,
  onStartCreateBlog,
  onStartEditBlog,
  onCloseBlogModal,
  onOpenBlogModal,
  onDeleteBlog,
  onSubmitBlog,
  onUpdateBlogField,
  onConfirmDeleteBlog,
  onCancelDeleteBlog,
  testimonials,
  onTestimonialsChange,
}: AdminTemplateWorkspaceProps) {
  return (
    <section className="min-h-screen bg-naki-page-bg">
      {/* Header */}
      <div className="w-full px-5 py-6 md:px-8 xl:px-12 2xl:px-16">
        <div>
          <Link
            className="inline-flex items-center gap-1.5 text-sm font-medium text-naki-smoke transition hover:text-naki-primary"
            to="/"
          >
            <ArrowLeft size={15} />
            Kembali ke storefront
          </Link>
          <h1 className="mt-3 text-2xl font-bold leading-tight text-naki-primary md:text-3xl">
            Admin dashboard
          </h1>
          <p className="mt-1.5 text-sm text-naki-smoke leading-relaxed">
            Kelola katalog Naki Code, pantau request konsultasi, dan tindak
            lanjuti calon pembeli dari satu halaman.
          </p>
        </div>
      </div>

      {/* Pill tab navigation */}
      <div className="w-full px-5 md:px-8 xl:px-12 2xl:px-16">
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-naki-steel bg-white p-1.5 shadow-sm md:overflow-visible">
          <button
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition md:px-4 ${activeAdminView === "dashboard" ? "bg-naki-primary text-white" : "text-naki-smoke hover:bg-naki-frost hover:text-naki-primary"}`}
            onClick={() => onActiveAdminViewChange("dashboard")}
            type="button"
          >
            <LayoutDashboard size={16} />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition md:px-4 ${activeAdminView === "design" ? "bg-naki-primary text-white" : "text-naki-smoke hover:bg-naki-frost hover:text-naki-primary"}`}
            onClick={() => onActiveAdminViewChange("design")}
            type="button"
          >
            <ClipboardList size={16} />
            <span className="hidden sm:inline">Design</span>
          </button>
          <button
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition md:px-4 ${activeAdminView === "orders" ? "bg-naki-primary text-white" : "text-naki-smoke hover:bg-naki-frost hover:text-naki-primary"}`}
            onClick={() => {
              onActiveAdminViewChange("orders");
              onRefreshOrders();
            }}
            type="button"
          >
            <Inbox size={16} />
            <span className="hidden sm:inline">Order</span>
          </button>
          <button
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition md:px-4 ${activeAdminView === "portfolio" ? "bg-naki-primary text-white" : "text-naki-smoke hover:bg-naki-frost hover:text-naki-primary"}`}
            onClick={() => onActiveAdminViewChange("portfolio")}
            type="button"
          >
            <Globe2 size={16} />
            <span className="hidden sm:inline">Portofolio</span>
          </button>
          <button
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition md:px-4 ${activeAdminView === "blog" ? "bg-naki-primary text-white" : "text-naki-smoke hover:bg-naki-frost hover:text-naki-primary"}`}
            onClick={() => onActiveAdminViewChange("blog")}
            type="button"
          >
            <FileText size={16} />
            <span className="hidden sm:inline">Blog</span>
          </button>
          <button
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition md:px-4 ${activeAdminView === "testimonials" ? "bg-naki-primary text-white" : "text-naki-smoke hover:bg-naki-frost hover:text-naki-primary"}`}
            onClick={() => onActiveAdminViewChange("testimonials")}
            type="button"
          >
            <MessageSquareQuote size={16} />
            <span className="hidden sm:inline">Testimoni</span>
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="w-full px-5 py-6 md:px-8 xl:px-12 2xl:px-16">
        {activeAdminView === "dashboard" ? (
          <Suspense fallback={<PanelLoader />}>
            <AdminDashboardHome templates={templates} projects={projects} orders={orders} onNavigate={onActiveAdminViewChange} onRefreshOrders={onRefreshOrders} />
          </Suspense>
        ) : activeAdminView === "orders" ? (
          <Suspense fallback={<PanelLoader />}>
            <OrdersPanel orders={orders} ordersStatus={ordersStatus} ordersPage={ordersPage} orderFilters={orderFilters} ordersMeta={ordersMeta} isLoadingOrders={isLoadingOrders} updatingOrderId={updatingOrderId} onRefreshOrders={onRefreshOrders} onOrderFiltersChange={onOrderFiltersChange} onOrdersPageChange={onOrdersPageChange} onUpdateOrderStatus={onUpdateOrderStatus} onDeleteOrder={onDeleteOrder} />
          </Suspense>
        ) : activeAdminView === "portfolio" ? (
          <Suspense fallback={<PanelLoader />}>
            <PortfolioAdminPanel projects={projects} form={portfolioForm} status={portfolioStatus} isSaving={isSavingPortfolio} isModalOpen={isPortfolioModalOpen} deletingProjectId={deletingProjectId} adminToken={adminToken} onStartEdit={onStartEditPortfolio} onReset={onResetPortfolioForm} onDelete={onDeletePortfolio} onOpenModal={onOpenPortfolioModal} onCloseModal={onClosePortfolioModal} onUpdateField={onUpdatePortfolioField} onSubmit={onSubmitPortfolio} onConfirmDelete={onConfirmDeletePortfolio} onCancelDelete={onCancelDeletePortfolio} />
          </Suspense>
        ) : activeAdminView === "blog" ? (
          <Suspense fallback={<PanelLoader />}>
            <BlogAdminPanel paginatedPosts={paginatedBlogPosts} totalPosts={totalBlogPosts} page={blogPostsPage} totalPages={blogPostsTotalPages} search={blogSearch} selectedId={null} status={blogStatus} isSaving={isSavingBlog} isModalOpen={isBlogModalOpen} deletingId={deletingBlogId} form={blogForm} adminToken={adminToken} onSearchChange={onBlogSearchChange} onPageChange={onBlogPostsPageChange} onStartCreate={onStartCreateBlog} onStartEdit={onStartEditBlog} onDelete={onDeleteBlog} onOpenModal={onOpenBlogModal} onCloseModal={onCloseBlogModal} onFormChange={onUpdateBlogField} onSubmit={onSubmitBlog} onConfirmDelete={onConfirmDeleteBlog} onCancelDelete={onCancelDeleteBlog} />
          </Suspense>
        ) : activeAdminView === "testimonials" ? (
          <Suspense fallback={<PanelLoader />}>
            <AdminTestimonialsSection adminToken={adminToken} testimonials={testimonials} onTestimonialsChange={onTestimonialsChange} />
          </Suspense>
        ) : (
          <Suspense fallback={<PanelLoader />}>
            <TemplatesPanel templates={templates} paginatedTemplates={paginatedTemplates} filteredTemplatesCount={filteredTemplatesCount} templatesPage={templatesPage} templatesTotalPages={templatesTotalPages} templateSearch={templateSearch} templateCategoryFilter={templateCategoryFilter} categoryOptions={categoryOptions} selectedId={selectedId} selectedTemplate={selectedTemplate} form={form} status={status} isSaving={isSaving} isTemplateModalOpen={isTemplateModalOpen} adminToken={adminToken} categoryName={categoryName} isSavingCategory={isSavingCategory} isCategoryModalOpen={isCategoryModalOpen} editingCategory={editingCategory} editingCategoryName={editingCategoryName} onTemplateSearchChange={onTemplateSearchChange} onTemplateCategoryFilterChange={onTemplateCategoryFilterChange} onTemplatesPageChange={onTemplatesPageChange} onStartCreate={onStartCreate} onStartEdit={onStartEdit} onCloseTemplateModal={onCloseTemplateModal} onDeleteTemplate={onDeleteTemplate} onSubmitTemplate={onSubmitTemplate} onUpdateField={onUpdateField} onOpenCategoryModal={onOpenCategoryModal} onCloseCategoryModal={onCloseCategoryModal} onSubmitCategory={onSubmitCategory} onCategoryNameChange={onCategoryNameChange} onEditCategoryNameChange={onEditCategoryNameChange} onEditCategory={onEditCategory} onSaveEditCategory={onSaveEditCategory} onCancelEditCategory={onCancelEditCategory} onDeleteCategory={onDeleteCategory} isDeletingCategory={isDeletingCategory} />
          </Suspense>
        )}
      </div>
    </section>
  );
}
