import { LockKeyhole } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
  getApiErrorMessage,
} from "../api-client";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { LoadingOverlay } from "../components/LoadingOverlay";
import {
  type TemplateCategory,
  type TemplateItem,
  type PortfolioItem,
} from "../content";
import { type OrderItem, type OrdersResponse } from "../order-types";
import {
  userRoleKey,
  userSessionEvent,
  userTokenKey,
  userUsernameKey,
} from "../user-session";
import { AdminTemplateWorkspace } from "./admin/AdminTemplateWorkspace";
import {
  adminBlogPostsPageSize,
  adminOrdersPageSize,
  adminTemplatesPageSize,
  defaultBlogPostFormState,
  defaultFormState,
  defaultPortfolioFormState,
  formToPayload,
  legacyHashToAdminView,
  normalizeAdminSection,
  normalizeCoverIndex,
  slugify,
  templateToForm,
  type AdminOrderFilters,
  type AuthResponse,
  type BlogPostFormState,
  type BlogPostItem,
  type CategoryMutationResponse,
  type DashboardView,
  type OrderStatus,
  type PortfolioFormState,
  type ProjectMutationResponse,
  type TemplateFormState,
  type TemplateMutationResponse,
  type TemplatesResponse,
} from "./admin/AdminTemplateWorkspace.shared";
import { DeleteCategoryDialog } from "./admin/DeleteCategoryDialog";
import { DeleteOrderDialog } from "./admin/DeleteOrderDialog";
import { DeleteTemplateDialog } from "./admin/DeleteTemplateDialog";

/** Parse order filter state from URL query params. */
function readOrderFiltersFromUrl(search: string): {
  filters: AdminOrderFilters;
  page: number;
} {
  const params = new URLSearchParams(search);
  const status = params.get("ordersStatus");
  const paymentStatus = params.get("ordersPaymentStatus");
  const page = params.get("ordersPage");

  return {
    filters: {
      status:
        status === "new" || status === "contacted" || status === "deal" || status === "closed"
          ? status
          : "all",
      paymentStatus:
        paymentStatus === "pending" ||
        paymentStatus === "waiting_payment" ||
        paymentStatus === "paid" ||
        paymentStatus === "failed"
          ? paymentStatus
          : "all",
    },
    page: page && Number(page) > 0 ? Number(page) : 1,
  };
}

type AdminTemplatesPageProps = {
  templates: TemplateItem[];
  categories: TemplateCategory[];
  projects: PortfolioItem[];
  onTemplatesChange: (templates: TemplateItem[]) => void;
  onCategoriesChange: (categories: TemplateCategory[]) => void;
  onProjectsChange: (projects: PortfolioItem[]) => void;
};

export function AdminTemplatesPage({
  templates,
  categories,
  projects,
  onTemplatesChange,
  onCategoriesChange,
  onProjectsChange,
}: AdminTemplatesPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { adminSection = "dashboard" } = useParams();
  const routeAdminView = normalizeAdminSection(adminSection);
  const categoryOptions = categories.filter(
    (category): category is TemplateItem["category"] => category !== "Semua",
  );
  const [adminToken, setAdminToken] = useState(() =>
    window.localStorage.getItem(userTokenKey),
  );
  const [adminUsername, setAdminUsername] = useState(
    () => window.localStorage.getItem(userUsernameKey) ?? "",
  );
  const [adminRole, setAdminRole] = useState(
    () => window.localStorage.getItem(userRoleKey) ?? "user",
  );
  const [loginStatus, setLoginStatus] = useState(
    "Login dengan akun admin untuk mengelola template.",
  );
  const [form, setForm] = useState<TemplateFormState>(defaultFormState);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState("all");
  const [templatesPage, setTemplatesPage] = useState(1);
  const [activeAdminView, setActiveAdminView] =
    useState<DashboardView>(routeAdminView);
  const [portfolioForm, setPortfolioForm] = useState<PortfolioFormState>(
    defaultPortfolioFormState,
  );
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [portfolioStatus, setPortfolioStatus] = useState(
    "Tambahkan website yang sudah selesai dibuat.",
  );
  const [isSavingPortfolio, setIsSavingPortfolio] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(
    null,
  );
  const [deleteCandidatePortfolio, setDeleteCandidatePortfolio] =
    useState<PortfolioItem | null>(null);
  const initialOrderState = useMemo(() => readOrderFiltersFromUrl(location.search), []);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [ordersPage, setOrdersPage] = useState(initialOrderState.page);
  const [orderFilters, setOrderFilters] = useState<AdminOrderFilters>(initialOrderState.filters);
  const [ordersMeta, setOrdersMeta] = useState({
    total: 0,
    totalPages: 1,
    pageSize: adminOrdersPageSize,
  });
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(
    () => routeAdminView === "templates" && window.location.hash === "#new-template",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [updatingTemplateId, setUpdatingTemplateId] = useState<number | null>(null);
  const [status, setStatus] = useState("Siap mengelola katalog template.");
  const [categoryName, setCategoryName] = useState("");
  const [categoryStatus, setCategoryStatus] = useState(
    "Tambahkan kategori agar muncul di dropdown template.",
  );
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoriesWithIds, setCategoriesWithIds] = useState<Array<{ id: number; name: string }>>([]);
  const [ordersStatus, setOrdersStatus] = useState(
    "Login untuk melihat request konsultasi.",
  );
  const [deleteCandidateOrder, setDeleteCandidateOrder] =
    useState<OrderItem | null>(null);
  const [deleteCandidateCategory, setDeleteCandidateCategory] =
    useState<string | null>(null);
  const [deleteCandidateTemplate, setDeleteCandidateTemplate] =
    useState<TemplateItem | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPostItem[]>([]);
  const [blogPostsPage, setBlogPostsPage] = useState(1);
  const [blogSearch, setBlogSearch] = useState("");
  const [blogForm, setBlogForm] = useState<BlogPostFormState>(defaultBlogPostFormState);
  const [blogStatus, setBlogStatus] = useState("");
  const [isSavingBlog, setIsSavingBlog] = useState(false);
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [deletingBlogId, setDeletingBlogId] = useState<number | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const adminTokenRef = useRef(adminToken);
  const isAdmin = Boolean(adminToken && adminRole === "admin");

  useEffect(() => {
    adminTokenRef.current = adminToken;
  }, [adminToken]);

  useEffect(() => {
    const legacyView = legacyHashToAdminView(location.hash);

    if (legacyView) {
      navigate(`/admin/${legacyView}`, { replace: true });
      return;
    }

    if (adminSection !== routeAdminView) {
      navigate(`/admin/${routeAdminView}`, { replace: true });
      return;
    }

    setActiveAdminView(routeAdminView);
    setIsTemplateModalOpen(
      routeAdminView === "templates" && location.hash === "#new-template",
    );

    if (routeAdminView === "orders" && isAdmin && adminToken) {
      void loadOrders(adminToken, ordersPage);
    }

    // loadOrders is intentionally omitted because this effect only syncs route into UI state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminSection, adminToken, isAdmin, location.hash, navigate, routeAdminView]);

  // Sync order filters from URL query params when navigating to/from the orders view.
  useEffect(() => {
    if (routeAdminView === "orders") {
      const { filters, page } = readOrderFiltersFromUrl(location.search);
      setOrderFilters(filters);
      setOrdersPage(page);
      return;
    }

    // When leaving the orders view, strip order params from the URL.
    const params = new URLSearchParams(location.search);
    const orderKeys = ["ordersStatus", "ordersPaymentStatus", "ordersPage"];
    let changed = false;
    for (const key of orderKeys) {
      if (params.has(key)) {
        params.delete(key);
        changed = true;
      }
    }
    if (changed) {
      navigate({ search: params.toString() }, { replace: true });
    }
  }, [routeAdminView, location.search, navigate]);

  useEffect(() => {
    let isActive = true;

    apiGet<TemplatesResponse>("/api/templates")
      .then((data: TemplatesResponse) => {
        if (isActive && Array.isArray(data.templates)) {
          onTemplatesChange(data.templates);
        }
      })
      .catch(() => {
        if (isActive) {
          onTemplatesChange([]);
        }
      });

    return () => {
      isActive = false;
    };
  }, [onTemplatesChange]);

  useEffect(() => {
    function syncUserSession() {
      const nextToken = window.localStorage.getItem(userTokenKey);
      const nextUsername = window.localStorage.getItem(userUsernameKey) ?? "";
      const nextRole = window.localStorage.getItem(userRoleKey) ?? "user";

      if (nextToken) {
        setAdminToken(nextToken);
        setAdminUsername(nextUsername);
        setAdminRole(nextRole);
        return;
      }

      if (adminTokenRef.current) {
        setAdminToken(null);
        setAdminUsername("");
        setAdminRole("user");
        setOrders([]);
        setLoginStatus("Sesi berakhir. Silakan login lagi.");
        setOrdersStatus("Login untuk melihat request konsultasi.");
        setStatus("Siap mengelola katalog template.");
      }
    }

    syncUserSession();
    window.addEventListener(userSessionEvent, syncUserSession);
    window.addEventListener("storage", syncUserSession);

    return () => {
      window.removeEventListener(userSessionEvent, syncUserSession);
      window.removeEventListener("storage", syncUserSession);
    };
  }, []);

  useEffect(() => {
    if (!adminToken) {
      return;
    }

    let isActive = true;

    apiGet<AuthResponse>("/api/auth/user/me")
      .then((data: AuthResponse) => {
        if (isActive) {
          setAdminUsername(data.user.username);
          setAdminRole(data.user.role ?? "user");
          window.localStorage.setItem(userUsernameKey, data.user.username);
          window.localStorage.setItem(userRoleKey, data.user.role ?? "user");

          if (data.user.role === "admin") {
            setLoginStatus(`Masuk sebagai admin ${data.user.username}.`);
            loadOrders(adminToken);
            return;
          }

          setOrders([]);
          setLoginStatus("Akun ini belum memiliki akses admin.");
        }
      })
      .catch(() => {
        if (isActive) {
          logout();
        }
      });

    return () => {
      isActive = false;
    };
    // loadOrders is intentionally kept outside this effect because it also powers manual refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId),
    [selectedId, templates],
  );
  const filteredAdminTemplates = useMemo(() => {
    const normalizedSearch = templateSearch.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesCategory =
        templateCategoryFilter === "all" ||
        template.category === templateCategoryFilter;
      const matchesSearch =
        !normalizedSearch ||
        [template.title, template.slug, template.category, template.price]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [templateCategoryFilter, templateSearch, templates]);
  const templateTotalPages = Math.max(
    1,
    Math.ceil(filteredAdminTemplates.length / adminTemplatesPageSize),
  );
  const safeTemplatesPage = Math.min(templatesPage, templateTotalPages);
  const paginatedAdminTemplates = filteredAdminTemplates.slice(
    (safeTemplatesPage - 1) * adminTemplatesPageSize,
    safeTemplatesPage * adminTemplatesPageSize,
  );

  function updateField<Key extends keyof TemplateFormState>(
    key: Key,
    value: TemplateFormState[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
      slug: key === "title" ? slugify(String(value)) : current.slug,
    }));
  }

  function updatePortfolioField<Key extends keyof PortfolioFormState>(
    key: Key,
    value: PortfolioFormState[Key],
  ) {
    setPortfolioForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function startEditPortfolio(project: PortfolioItem) {
    const imageUrls =
      project.imageUrls && project.imageUrls.length > 0
        ? project.imageUrls
        : project.imageUrl
          ? [project.imageUrl]
          : [];

    const coverIndex = normalizeCoverIndex(project.coverIndex, imageUrls);

    setPortfolioForm({
      id: project.id,
      title: project.title,
      category: project.category,
      description: project.description,
      result: project.result,
      websiteUrl: project.websiteUrl ?? "#",
      imageUrl: imageUrls[coverIndex] ?? "",
      imageUrls,
      coverIndex,
    });
    setIsPortfolioModalOpen(true);
    setPortfolioStatus(`Mengedit portofolio ${project.title}.`);
  }

  function resetPortfolioForm() {
    setPortfolioForm(defaultPortfolioFormState);
    setIsPortfolioModalOpen(true);
    setPortfolioStatus("Mode tambah portofolio baru.");
  }

  function closePortfolioModal() {
    if (!isSavingPortfolio) {
      setIsPortfolioModalOpen(false);
    }
  }

  function openPortfolioModal() {
    setIsPortfolioModalOpen(true);
  }

  function navigateAdminView(view: DashboardView) {
    setActiveAdminView(view);
    setIsTemplateModalOpen(false);
    navigate(`/admin/${view}`);
  }

  function startCreate() {
    navigate("/admin/templates#new-template");
    setSelectedId(null);
    setForm(defaultFormState);
    setIsTemplateModalOpen(true);
    setStatus("Mode tambah template baru.");
  }

  const startEdit = useCallback((template: TemplateItem) => {
    navigate("/admin/templates");
    setSelectedId(template.id);
    setForm(templateToForm(template));
    setIsTemplateModalOpen(true);
    setStatus(`Mengedit ${template.title}.`);
  }, [navigate]);

  function closeTemplateModal() {
    if (!isSaving) {
      navigate("/admin/templates", { replace: true });
      setIsTemplateModalOpen(false);
    }
  }

  function logout() {
    window.localStorage.removeItem(userTokenKey);
    window.localStorage.removeItem(userUsernameKey);
    window.localStorage.removeItem(userRoleKey);
    setAdminToken(null);
    setAdminUsername("");
    setAdminRole("user");
    setOrders([]);
    setLoginStatus("Sesi berakhir. Silakan login lagi.");
    window.dispatchEvent(new Event(userSessionEvent));
  }

  async function loadOrders(
    token = adminToken,
    page = ordersPage,
    filters = orderFilters,
  ) {
    if (!token) {
      setOrdersStatus("Login admin diperlukan untuk melihat order.");
      return;
    }

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(adminOrdersPageSize),
    });

    if (filters.status !== "all") {
      params.set("status", filters.status);
    }

    if (filters.paymentStatus !== "all") {
      params.set("paymentStatus", filters.paymentStatus);
    }

    setIsLoadingOrders(true);
    setOrdersStatus("Memuat request konsultasi...");

    try {
      const data = await apiGet<OrdersResponse>(`/api/orders?${params}`);
      setOrders(data.orders ?? []);
      setOrdersPage(data.page ?? page);
      setOrdersMeta({
        total: data.total ?? data.orders?.length ?? 0,
        totalPages: data.totalPages ?? 1,
        pageSize: data.pageSize ?? adminOrdersPageSize,
      });
      setOrdersStatus(
        data.total
          ? `${data.total} request konsultasi ditemukan.`
          : "Belum ada request konsultasi.",
      );
    } catch {
      setOrdersStatus("Gagal memuat order. Pastikan backend aktif.");
    } finally {
      setIsLoadingOrders(false);
    }
  }

  function updateOrderFilters(nextFilters: AdminOrderFilters) {
    setOrderFilters(nextFilters);
    setOrdersPage(1);
    void loadOrders(adminToken, 1, nextFilters);

    const params = new URLSearchParams(location.search);
    if (nextFilters.status !== "all") {
      params.set("ordersStatus", nextFilters.status);
    } else {
      params.delete("ordersStatus");
    }
    if (nextFilters.paymentStatus !== "all") {
      params.set("ordersPaymentStatus", nextFilters.paymentStatus);
    } else {
      params.delete("ordersPaymentStatus");
    }
    params.set("ordersPage", "1");
    navigate({ search: params.toString() }, { replace: true });
  }

  async function updateOrderStatus(orderId: number, nextStatus: OrderStatus) {
    if (!adminToken) {
      setOrdersStatus("Login admin diperlukan untuk update order.");
      return;
    }

    setUpdatingOrderId(orderId);
    setLoadingMessage(`Mengubah status order #${orderId}...`);

    try {
      await apiPatch(`/api/orders/${orderId}/status`, {
        status: nextStatus,
      });

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId ? { ...order, status: nextStatus } : order,
        ),
      );
      setOrdersStatus(`Status order #${orderId} diubah ke ${nextStatus}.`);
    } catch {
      setOrdersStatus("Gagal mengubah status order.");
    } finally {
      setUpdatingOrderId(null);
      setLoadingMessage(null);
    }
  }

  async function deleteOrder(order: OrderItem) {
    if (!adminToken) {
      setOrdersStatus("Login admin diperlukan untuk menghapus order.");
      return;
    }

    setUpdatingOrderId(order.id);
    setLoadingMessage(`Menghapus order #${order.id}...`);

    try {
      await apiDelete(`/api/orders/${order.id}`);

      setOrders((currentOrders) =>
        currentOrders.filter((currentOrder) => currentOrder.id !== order.id),
      );
      setOrdersMeta((currentMeta) => ({
        ...currentMeta,
        total: Math.max(0, currentMeta.total - 1),
      }));
      setDeleteCandidateOrder(null);
      setOrdersStatus(`Order #${order.id} dihapus dari inbox.`);
    } catch {
      setOrdersStatus("Gagal menghapus order.");
    } finally {
      setUpdatingOrderId(null);
      setLoadingMessage(null);
    }
  }

  async function submitTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminToken) {
      setStatus("Login admin diperlukan untuk menyimpan template.");
      return;
    }

    setIsSaving(true);
    setLoadingMessage("Menyimpan template...");

    const payload = formToPayload(form);
    const isEditing = selectedTemplate !== undefined;

    try {
      const data = isEditing
        ? await apiPut<TemplateMutationResponse>(
            `/api/templates/${selectedTemplate.id}`,
            payload,
          )
        : await apiPost<TemplateMutationResponse>("/api/templates", payload);
      const nextTemplates = isEditing
        ? templates.map((template) =>
            template.id === data.template.id ? data.template : template,
          )
        : [data.template, ...templates];

      onTemplatesChange(nextTemplates);
      setSelectedId(data.template.id);
      setForm(templateToForm(data.template));
      setIsTemplateModalOpen(false);
      setStatus(`Template ${data.template.title} tersimpan.`);
    } catch {
      setStatus("Gagal menyimpan. Pastikan backend aktif.");
    } finally {
      setIsSaving(false);
      setLoadingMessage(null);
    }
  }

  async function deleteTemplate(template: TemplateItem) {
    if (!adminToken) {
      setStatus("Login admin diperlukan untuk menghapus template.");
      return;
    }

    setUpdatingTemplateId(template.id);
    setLoadingMessage(`Menghapus ${template.title}...`);

    try {
      await apiDelete(`/api/templates/${template.id}`);

      onTemplatesChange(
        templates.filter(
          (currentTemplate) => currentTemplate.id !== template.id,
        ),
      );

      if (selectedId === template.id) {
        startCreate();
      }

      setStatus(`Template ${template.title} dihapus.`);
    } catch {
      setStatus("Gagal menghapus. Pastikan backend aktif.");
    } finally {
      setDeleteCandidateTemplate(null);
      setUpdatingTemplateId(null);
      setLoadingMessage(null);
    }
  }

  function cancelDeleteTemplate() {
    setDeleteCandidateTemplate(null);
  }

  async function refreshCategoriesWithIds() {
    try {
      const response = await apiGet<{ source: string; categories: Array<{ id: number; name: string }> }>("/api/categories/admin");
      setCategoriesWithIds(response.categories ?? []);
    } catch (error) {
      console.error("Failed to refresh categories:", error);
    }
  }

  function handleEditCategory(categoryName: string) {
    if (!adminToken) {
      setCategoryStatus("Login admin diperlukan untuk mengedit kategori.");
      return;
    }

    const category = categoriesWithIds.find(c => c.name === categoryName);
    if (!category) {
      setCategoryStatus("Kategori tidak ditemukan.");
      return;
    }

    setEditingCategory(categoryName);
    setEditingCategoryId(category.id);
    setEditingCategoryName(categoryName);
  }

  async function handleUpdateCategory() {
    if (!adminToken || editingCategoryId === null) {
      setCategoryStatus("Login admin diperlukan untuk mengedit kategori.");
      return;
    }

    const newName = editingCategoryName.trim();

    if (newName.length < 2) {
      setCategoryStatus("Nama kategori minimal 2 karakter.");
      return;
    }

    setIsSavingCategory(true);
    setLoadingMessage("Memperbarui kategori...");

    try {
      const data = await apiPut<CategoryMutationResponse>(`/api/categories/${editingCategoryId}`, {
        name: newName,
      });

      onCategoriesChange(data.categories);
      await refreshCategoriesWithIds();
      setEditingCategory(null);
      setEditingCategoryId(null);
      setEditingCategoryName("");
      setCategoryStatus(data.message ?? "Kategori berhasil diperbarui.");
    } catch (error) {
      setCategoryStatus(getApiErrorMessage(error, "Gagal memperbarui kategori."));
    } finally {
      setIsSavingCategory(false);
      setLoadingMessage(null);
    }
  }

  function handleCancelEdit() {
    setEditingCategory(null);
    setEditingCategoryName("");
    setCategoryStatus("Edit kategori dibatalkan.");
  }

  async function handleSubmitCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminToken) {
      setCategoryStatus("Login admin diperlukan untuk menambah kategori.");
      return;
    }

    const name = categoryName.trim();
    if (name.length < 2) {
      setCategoryStatus("Nama kategori minimal 2 karakter.");
      return;
    }

    setIsSavingCategory(true);
    setLoadingMessage("Menyimpan kategori...");

    try {
      const data = await apiPost<CategoryMutationResponse>("/api/categories", {
        name,
      });

      onCategoriesChange(data.categories);
      await refreshCategoriesWithIds();
      setCategoryName("");
      setCategoryStatus(data.message ?? `Kategori "${name}" berhasil ditambahkan.`);
      setIsCategoryModalOpen(false);
    } catch (error) {
      setCategoryStatus(getApiErrorMessage(error, "Gagal menambahkan kategori."));
    } finally {
      setIsSavingCategory(false);
      setLoadingMessage(null);
    }
  }

  function handleDeleteCategory(categoryName: string) {
    if (!adminToken) {
      setCategoryStatus("Login admin diperlukan untuk menghapus kategori.");
      return;
    }

    setDeleteCandidateCategory(categoryName);
  }

  async function handleConfirmDeleteCategory(categoryName: string) {
    setDeleteCandidateCategory(null);

    const category = categoriesWithIds.find(c => c.name === categoryName);
    if (!category) {
      setCategoryStatus("Kategori tidak ditemukan.");
      return;
    }

    setIsSavingCategory(true);
    setLoadingMessage("Menghapus kategori...");

    try {
      const data = await apiDelete<CategoryMutationResponse>(`/api/categories/${category.id}`);

      onCategoriesChange(data.categories);
      await refreshCategoriesWithIds();
      setCategoryStatus(data.message ?? "Kategori berhasil dihapus.");
    } catch (error) {
      setCategoryStatus(getApiErrorMessage(error, "Gagal menghapus kategori."));
    } finally {
      setIsSavingCategory(false);
      setLoadingMessage(null);
    }
  }

  async function openCategoryModal() {
    setIsCategoryModalOpen(true);
    await refreshCategoriesWithIds();
  }

  function closeCategoryModal() {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    setEditingCategoryName("");
    setCategoryName("");
  }

  async function submitPortfolio(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminToken) {
      setPortfolioStatus("Login admin diperlukan untuk menyimpan portofolio.");
      return;
    }

    setIsSavingPortfolio(true);
    setLoadingMessage("Menyimpan portofolio...");

    const coverIndex = normalizeCoverIndex(
      portfolioForm.coverIndex,
      portfolioForm.imageUrls,
    );
    const payload = {
      title: portfolioForm.title.trim(),
      category: portfolioForm.category.trim(),
      description: portfolioForm.description.trim(),
      result: portfolioForm.result.trim(),
      websiteUrl: portfolioForm.websiteUrl.trim() || "#",
      imageUrl:
        portfolioForm.imageUrls[coverIndex] ||
        portfolioForm.imageUrl.trim() ||
        undefined,
      imageUrls: portfolioForm.imageUrls,
      coverIndex,
    };
    const isEditing = typeof portfolioForm.id === "number";

    try {
      const data = isEditing
        ? await apiPut<ProjectMutationResponse>(
            `/api/projects/${portfolioForm.id}`,
            payload,
          )
        : await apiPost<ProjectMutationResponse>("/api/projects", payload);
      const nextProjects = isEditing
        ? projects.map((project) =>
            project.id === data.project.id ? data.project : project,
          )
        : [data.project, ...projects];

      onProjectsChange(nextProjects);
      setPortfolioForm(defaultPortfolioFormState);
      setIsPortfolioModalOpen(false);
      setPortfolioStatus(`Portofolio ${data.project.title} tersimpan.`);
    } catch {
      setPortfolioStatus("Gagal menyimpan portofolio. Pastikan backend aktif.");
    } finally {
      setIsSavingPortfolio(false);
      setLoadingMessage(null);
    }
  }

  async function deletePortfolio(project: PortfolioItem) {
    setDeleteCandidatePortfolio(project);
  }

  async function confirmDeletePortfolio() {
    if (!deleteCandidatePortfolio) return;

    const project = deleteCandidatePortfolio;
    if (!adminToken || !project.id) {
      setPortfolioStatus("Login admin diperlukan untuk menghapus portofolio.");
      return;
    }

    setDeletingProjectId(project.id);
    setLoadingMessage(`Menghapus portofolio ${project.title}...`);

    try {
      await apiDelete(`/api/projects/${project.id}`);

      onProjectsChange(
        projects.filter((currentProject) => currentProject.id !== project.id),
      );

      if (portfolioForm.id === project.id) {
        setPortfolioForm(defaultPortfolioFormState);
      }

      setPortfolioStatus(`Portofolio ${project.title} dihapus.`);
    } catch {
      setPortfolioStatus("Gagal menghapus portofolio.");
    } finally {
      setDeletingProjectId(null);
      setDeleteCandidatePortfolio(null);
      setLoadingMessage(null);
    }
  }

  function cancelDeletePortfolio() {
    if (!deletingProjectId) {
      setDeleteCandidatePortfolio(null);
    }
  }

  // Blog handlers
  async function loadBlogPosts() {
    try {
      const res = await apiGet<{ source: string; posts: BlogPostItem[] }>("/api/blog/admin");
      setBlogPosts(res.posts ?? []);
    } catch {
      setBlogStatus("Gagal memuat artikel.");
    }
  }

  const filteredBlogPosts = useMemo(() => {
    if (!blogSearch.trim()) return blogPosts;
    const q = blogSearch.toLowerCase();
    return blogPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q),
    );
  }, [blogPosts, blogSearch]);

  const blogPostsTotalPages = Math.max(1, Math.ceil(filteredBlogPosts.length / adminBlogPostsPageSize));
  const safeBlogPostsPage = Math.min(blogPostsPage, blogPostsTotalPages);
  const paginatedBlogPosts = filteredBlogPosts.slice(
    (safeBlogPostsPage - 1) * adminBlogPostsPageSize,
    safeBlogPostsPage * adminBlogPostsPageSize,
  );

  function startCreateBlog() {
    setBlogForm(defaultBlogPostFormState);
  }

  function startEditBlog(post: BlogPostItem) {
    setBlogForm({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      coverImage: post.coverImage ?? "",
      status: post.status as "draft" | "published",
    });
    setIsBlogModalOpen(true);
  }

  function closeBlogModal() {
    if (isSavingBlog) return;
    setIsBlogModalOpen(false);
  }

  function openBlogModal() {
    setIsBlogModalOpen(true);
  }

  function updateBlogField<Key extends keyof BlogPostFormState>(
    key: Key,
    value: BlogPostFormState[Key],
  ) {
    setBlogForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submitBlog(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminToken) {
      setBlogStatus("Login admin diperlukan.");
      return;
    }

    setIsSavingBlog(true);
    setLoadingMessage("Menyimpan artikel...");

    try {
      const payload = {
        slug: blogForm.slug || slugify(blogForm.title),
        title: blogForm.title.trim(),
        excerpt: blogForm.excerpt.trim(),
        content: blogForm.content.trim(),
        author: blogForm.author.trim() || "Naki Code",
        coverImage: blogForm.coverImage.trim() || null,
        status: blogForm.status,
      };

      if (blogForm.id) {
        const res = await apiPut<{ source: string; post: BlogPostItem }>(
          `/api/blog/${blogForm.id}`,
          payload,
        );
        setBlogPosts(
          blogPosts.map((p) => (p.id === res.post.id ? res.post : p)),
        );
        setBlogStatus("Artikel berhasil diperbarui.");
      } else {
        const res = await apiPost<{ source: string; post: BlogPostItem }>(
          "/api/blog",
          payload,
        );
        setBlogPosts([res.post, ...blogPosts]);
        setBlogStatus("Artikel berhasil dibuat.");
      }

      setBlogForm(defaultBlogPostFormState);
      setIsBlogModalOpen(false);
    } catch {
      setBlogStatus("Gagal menyimpan artikel.");
    } finally {
      setIsSavingBlog(false);
      setLoadingMessage(null);
    }
  }

  function deleteBlog(post: BlogPostItem) {
    setDeletingBlogId(post.id);
  }

  async function confirmDeleteBlog() {
    if (!adminToken || deletingBlogId === null) return;

    const id = deletingBlogId;
    setDeletingBlogId(null);
    setLoadingMessage("Menghapus artikel...");

    try {
      await apiDelete(`/api/blog/${id}`);
      setBlogPosts(blogPosts.filter((p) => p.id !== id));
      setBlogStatus("Artikel berhasil dihapus.");
    } catch {
      setBlogStatus("Gagal menghapus artikel.");
    } finally {
      setLoadingMessage(null);
    }
  }

  function cancelDeleteBlog() {
    setDeletingBlogId(null);
  }

  // Load blog posts when admin is logged in
  useEffect(() => {
    if (adminToken) {
      void loadBlogPosts();
    }
  }, [adminToken]);

  return (
    <main className="bg-naki-page-bg min-h-screen text-naki-primary">
      <Header />

      {!adminToken ? (
        <section className="grid min-h-[76vh] w-full place-items-center px-5 py-12 md:px-8 xl:px-12 2xl:px-16">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
            <span className="grid size-12 place-items-center rounded-xl bg-naki-primary text-white">
              <LockKeyhole size={22} />
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-tight">
              Login diperlukan
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-naki-smoke">
              Gunakan halaman login yang sama. Akun dengan role admin akan
              otomatis membuka dashboard ini.
            </p>
            <Link
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-5 text-sm text-white transition hover:opacity-90"
              to="/login?next=%2Fadmin%2Fdashboard"
            >
              <LockKeyhole size={17} />
              Buka login
            </Link>
            <p className="mt-4 text-xs font-medium text-naki-smoke">
              {loginStatus}
            </p>
          </div>
        </section>
      ) : !isAdmin ? (
        <section className="grid min-h-[76vh] w-full place-items-center px-5 py-12 text-center md:px-8 xl:px-12 2xl:px-16">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
            <span className="mx-auto grid size-12 place-items-center rounded-xl bg-naki-primary text-white">
              <LockKeyhole size={22} />
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-tight">
              Akses admin
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-naki-smoke">
              Akun {adminUsername || "ini"} sudah login, tapi belum punya role
              admin.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-5 text-sm text-white transition hover:opacity-90"
                to="/login?next=%2Fadmin%2Fdashboard"
              >
                Login akun admin
              </Link>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-5 text-sm font-medium text-naki-primary transition hover:bg-naki-frost"
                onClick={logout}
                type="button"
              >
                Logout
              </button>
            </div>
            <p className="mt-4 text-xs font-medium text-naki-smoke">
              {loginStatus}
            </p>
          </div>
        </section>
      ) : (
        <AdminTemplateWorkspace
          templates={templates}
          paginatedTemplates={paginatedAdminTemplates}
          filteredTemplatesCount={filteredAdminTemplates.length}
          templatesPage={safeTemplatesPage}
          templatesTotalPages={templateTotalPages}
          templateSearch={templateSearch}
          templateCategoryFilter={templateCategoryFilter}
          projects={projects}
          categoryOptions={categoryOptions}
          selectedId={selectedId}
          selectedTemplate={selectedTemplate}
          form={form}
          status={status}
          isSaving={isSaving}
          isTemplateModalOpen={isTemplateModalOpen}
          adminToken={adminToken}
          activeAdminView={activeAdminView}
          categoryName={categoryName}
          categoryStatus={categoryStatus}
          isSavingCategory={isSavingCategory}
          isCategoryModalOpen={isCategoryModalOpen}
          editingCategory={editingCategory}
          editingCategoryName={editingCategoryName}
          onEditCategoryNameChange={setEditingCategoryName}
          onEditCategory={handleEditCategory}
          onSaveEditCategory={handleUpdateCategory}
          onCancelEditCategory={handleCancelEdit}
          onDeleteCategory={handleDeleteCategory}
          isDeletingCategory={isSavingCategory}
          onOpenCategoryModal={openCategoryModal}
          onCloseCategoryModal={closeCategoryModal}
          onSubmitCategory={handleSubmitCategory}
          portfolioForm={portfolioForm}
          isPortfolioModalOpen={isPortfolioModalOpen}
          portfolioStatus={portfolioStatus}
          isSavingPortfolio={isSavingPortfolio}
          deletingProjectId={deletingProjectId}
          orders={orders}
          ordersStatus={ordersStatus}
          ordersPage={ordersPage}
          orderFilters={orderFilters}
          ordersMeta={ordersMeta}
          isLoadingOrders={isLoadingOrders}
          updatingOrderId={updatingOrderId}
          onActiveAdminViewChange={navigateAdminView}
          onTemplateSearchChange={(value) => {
            setTemplateSearch(value);
            setTemplatesPage(1);
          }}
          onTemplateCategoryFilterChange={(value) => {
            setTemplateCategoryFilter(value);
            setTemplatesPage(1);
          }}
          onTemplatesPageChange={setTemplatesPage}
          onRefreshOrders={() => loadOrders(adminToken, ordersPage, orderFilters)}
          onOrderFiltersChange={updateOrderFilters}
          onOrdersPageChange={(page) => {
            setOrdersPage(page);
            void loadOrders(adminToken, page, orderFilters);
            const params = new URLSearchParams(location.search);
            params.set("ordersPage", String(page));
            navigate({ search: params.toString() }, { replace: true });
          }}
          onUpdateOrderStatus={updateOrderStatus}
          onDeleteOrder={setDeleteCandidateOrder}
          onStartCreate={startCreate}
          onStartEdit={startEdit}
          onCloseTemplateModal={closeTemplateModal}
          onDeleteTemplate={setDeleteCandidateTemplate}
          onSubmitTemplate={submitTemplate}
          onUpdateField={updateField}
          onCategoryNameChange={setCategoryName}
          onUpdatePortfolioField={updatePortfolioField}
          onSubmitPortfolio={submitPortfolio}
          onStartEditPortfolio={startEditPortfolio}
          onClosePortfolioModal={closePortfolioModal}
          onOpenPortfolioModal={openPortfolioModal}
          onResetPortfolioForm={resetPortfolioForm}
          onDeletePortfolio={deletePortfolio}
          onConfirmDeletePortfolio={confirmDeletePortfolio}
          onCancelDeletePortfolio={cancelDeletePortfolio}
          blogPosts={blogPosts}
          paginatedBlogPosts={paginatedBlogPosts}
          totalBlogPosts={filteredBlogPosts.length}
          blogPostsPage={safeBlogPostsPage}
          blogPostsTotalPages={blogPostsTotalPages}
          blogSearch={blogSearch}
          blogForm={blogForm}
          blogStatus={blogStatus}
          isSavingBlog={isSavingBlog}
          isBlogModalOpen={isBlogModalOpen}
          deletingBlogId={deletingBlogId}
          onBlogSearchChange={setBlogSearch}
          onBlogPostsPageChange={setBlogPostsPage}
          onStartCreateBlog={startCreateBlog}
          onStartEditBlog={startEditBlog}
          onCloseBlogModal={closeBlogModal}
          onOpenBlogModal={openBlogModal}
          onDeleteBlog={deleteBlog}
          onSubmitBlog={submitBlog}
          onUpdateBlogField={updateBlogField}
          onConfirmDeleteBlog={confirmDeleteBlog}
          onCancelDeleteBlog={cancelDeleteBlog}
        />
      )}

      <DeleteCategoryDialog
        category={deleteCandidateCategory}
        isDeleting={isSavingCategory}
        onClose={() => {
          if (!isSavingCategory) {
            setDeleteCandidateCategory(null);
          }
        }}
        onConfirm={(category) => void handleConfirmDeleteCategory(category)}
      />

      <DeleteOrderDialog
        order={deleteCandidateOrder}
        isDeleting={
          deleteCandidateOrder
            ? updatingOrderId === deleteCandidateOrder.id
            : false
        }
        onClose={() => {
          if (
            !deleteCandidateOrder ||
            updatingOrderId !== deleteCandidateOrder.id
          ) {
            setDeleteCandidateOrder(null);
          }
        }}
        onConfirm={(order) => void deleteOrder(order)}
      />

      <DeleteTemplateDialog
        template={deleteCandidateTemplate}
        isDeleting={
          deleteCandidateTemplate
            ? updatingTemplateId === deleteCandidateTemplate.id
            : false
        }
        onClose={() => {
          if (
            !deleteCandidateTemplate ||
            updatingTemplateId !== deleteCandidateTemplate.id
          ) {
            setDeleteCandidateTemplate(null);
          }
        }}
        onConfirm={(template) => void deleteTemplate(template)}
      />

      <Footer />

      <LoadingOverlay
        isLoading={loadingMessage !== null}
        message={loadingMessage ?? ""}
      />
    </main>
  );
}

