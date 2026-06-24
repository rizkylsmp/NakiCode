import { ArrowLeft, ClipboardList, Globe2, Inbox, LayoutDashboard } from "lucide-react";
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
import { AdminDashboardHome } from "./AdminDashboardHome";
import { OrdersPanel } from "./OrdersPanel";
import { PortfolioAdminPanel } from "./PortfolioAdminPanel";
import { PortfolioFormModal } from "./PortfolioFormModal";
import { TemplatesPanel } from "./TemplatesPanel";

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
    <section className="w-full px-5 py-8 md:px-8 xl:px-12 2xl:px-16">
      <div className="flex flex-col justify-between gap-4 border-b border-naki-steel pb-6 lg:flex-row lg:items-end">
        <div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-black text-naki-secondary"
            to="/"
          >
            <ArrowLeft size={16} />
            Kembali ke storefront
          </Link>
          <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
            Admin dashboard
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-naki-smoke">
            Kelola katalog Naki Code, pantau request konsultasi, dan tindak
            lanjuti calon pembeli dari satu halaman.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition ${activeAdminView === "dashboard" ? "bg-naki-primary text-naki-frost" : "border border-naki-steel text-naki-secondary hover:border-naki-smoke"}`}
          onClick={() => onActiveAdminViewChange("dashboard")}
          type="button"
        >
          <LayoutDashboard size={17} />
          Dashboard
        </button>
        <button
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition ${activeAdminView === "templates" ? "bg-naki-primary text-naki-frost" : "border border-naki-steel text-naki-secondary hover:border-naki-smoke"}`}
          onClick={() => onActiveAdminViewChange("templates")}
          type="button"
        >
          <ClipboardList size={17} />
          Template
        </button>
        <button
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition ${activeAdminView === "orders" ? "bg-naki-primary text-naki-frost" : "border border-naki-steel text-naki-secondary hover:border-naki-smoke"}`}
          onClick={() => {
            onActiveAdminViewChange("orders");
            onRefreshOrders();
          }}
          type="button"
        >
          <Inbox size={17} />
          Order
        </button>
        <button
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition ${activeAdminView === "portfolio" ? "bg-naki-primary text-naki-frost" : "border border-naki-steel text-naki-secondary hover:border-naki-smoke"}`}
          onClick={() => onActiveAdminViewChange("portfolio")}
          type="button"
        >
          <Globe2 size={17} />
          Portofolio
        </button>
      </div>

      {activeAdminView === "dashboard" ? (
        <AdminDashboardHome templates={templates} projects={projects} orders={orders} onNavigate={onActiveAdminViewChange} onRefreshOrders={onRefreshOrders} />
      ) : activeAdminView === "orders" ? (
        <OrdersPanel orders={orders} ordersStatus={ordersStatus} ordersPage={ordersPage} orderFilters={orderFilters} ordersMeta={ordersMeta} isLoadingOrders={isLoadingOrders} updatingOrderId={updatingOrderId} onRefreshOrders={onRefreshOrders} onOrderFiltersChange={onOrderFiltersChange} onOrdersPageChange={onOrdersPageChange} onUpdateOrderStatus={onUpdateOrderStatus} onDeleteOrder={onDeleteOrder} />
      ) : activeAdminView === "portfolio" ? (
        <PortfolioAdminPanel projects={projects} form={portfolioForm} status={portfolioStatus} deletingProjectId={deletingProjectId} onStartEdit={onStartEditPortfolio} onReset={onResetPortfolioForm} onDelete={onDeletePortfolio} />
      ) : (
        <TemplatesPanel templates={templates} paginatedTemplates={paginatedTemplates} filteredTemplatesCount={filteredTemplatesCount} templatesPage={templatesPage} templatesTotalPages={templatesTotalPages} templateSearch={templateSearch} templateCategoryFilter={templateCategoryFilter} categoryOptions={categoryOptions} selectedId={selectedId} selectedTemplate={selectedTemplate} form={form} status={status} isSaving={isSaving} isTemplateModalOpen={isTemplateModalOpen} adminToken={adminToken} categoryName={categoryName} isSavingCategory={isSavingCategory} isCategoryModalOpen={isCategoryModalOpen} editingCategory={editingCategory} editingCategoryName={editingCategoryName} onTemplateSearchChange={onTemplateSearchChange} onTemplateCategoryFilterChange={onTemplateCategoryFilterChange} onTemplatesPageChange={onTemplatesPageChange} onStartCreate={onStartCreate} onStartEdit={onStartEdit} onCloseTemplateModal={onCloseTemplateModal} onDeleteTemplate={onDeleteTemplate} onSubmitTemplate={onSubmitTemplate} onUpdateField={onUpdateField} onOpenCategoryModal={onOpenCategoryModal} onCloseCategoryModal={onCloseCategoryModal} onSubmitCategory={onSubmitCategory} onCategoryNameChange={onCategoryNameChange} onEditCategoryNameChange={onEditCategoryNameChange} onEditCategory={onEditCategory} onSaveEditCategory={onSaveEditCategory} onCancelEditCategory={onCancelEditCategory} onDeleteCategory={onDeleteCategory} />
      )}
      <PortfolioFormModal adminToken={adminToken} form={portfolioForm} isOpen={isPortfolioModalOpen} isSaving={isSavingPortfolio} status={portfolioStatus} onClose={onClosePortfolioModal} onReset={onResetPortfolioForm} onSubmit={onSubmitPortfolio} onUpdateField={onUpdatePortfolioField} />
    </section>
  );
}
