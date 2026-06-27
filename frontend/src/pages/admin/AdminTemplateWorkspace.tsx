import { ArrowLeft, ClipboardList, Globe2, Inbox, LayoutDashboard } from "lucide-react";
import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { type PortfolioItem, type TemplateItem } from "../../content";
import { type OrderItem } from "../../order-types";
import {
  type AdminOrderFilters,
  type DashboardView,
  type OrderStatus,
  type PortfolioFormState,
  type TemplateFormState,
} from "./AdminTemplateWorkspace.shared";

// Lazy-loaded admin panels
const AdminDashboardHome = lazy(() => import("./AdminDashboardHome").then((m) => ({ default: m.AdminDashboardHome })));
const OrdersPanel = lazy(() => import("./OrdersPanel").then((m) => ({ default: m.OrdersPanel })));
const PortfolioAdminPanel = lazy(() => import("./PortfolioAdminPanel").then((m) => ({ default: m.PortfolioAdminPanel })));
const TemplatesPanel = lazy(() => import("./TemplatesPanel").then((m) => ({ default: m.TemplatesPanel })));

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
  onUpdateOrderStatus: (orderId: number, status: OrderStatus) => void;
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
  onResetPortfolioForm: () => void;
  onDeletePortfolio: (project: PortfolioItem) => void;
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
  onResetPortfolioForm,
  onDeletePortfolio,
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
        <div className="inline-flex gap-1 rounded-xl border border-naki-steel bg-white p-1.5 shadow-sm">
          <button
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${activeAdminView === "dashboard" ? "bg-naki-primary text-white" : "text-naki-smoke hover:bg-naki-frost hover:text-naki-primary"}`}
            onClick={() => onActiveAdminViewChange("dashboard")}
            type="button"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </button>
          <button
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${activeAdminView === "templates" ? "bg-naki-primary text-white" : "text-naki-smoke hover:bg-naki-frost hover:text-naki-primary"}`}
            onClick={() => onActiveAdminViewChange("templates")}
            type="button"
          >
            <ClipboardList size={16} />
            Template
          </button>
          <button
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${activeAdminView === "orders" ? "bg-naki-primary text-white" : "text-naki-smoke hover:bg-naki-frost hover:text-naki-primary"}`}
            onClick={() => {
              onActiveAdminViewChange("orders");
              onRefreshOrders();
            }}
            type="button"
          >
            <Inbox size={16} />
            Order
          </button>
          <button
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${activeAdminView === "portfolio" ? "bg-naki-primary text-white" : "text-naki-smoke hover:bg-naki-frost hover:text-naki-primary"}`}
            onClick={() => onActiveAdminViewChange("portfolio")}
            type="button"
          >
            <Globe2 size={16} />
            Portofolio
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
            <PortfolioAdminPanel projects={projects} form={portfolioForm} status={portfolioStatus} deletingProjectId={deletingProjectId} onStartEdit={onStartEditPortfolio} onReset={onResetPortfolioForm} onDelete={onDeletePortfolio} />
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
