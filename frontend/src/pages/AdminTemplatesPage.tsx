import {
  AlertTriangle,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  ClipboardList,
  Edit3,
  ExternalLink,
  FileArchive,
  Globe2,
  GripVertical,
  ImagePlus,
  Inbox,
  LockKeyhole,
  MessageSquareText,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { getApiUrl } from "../api-client";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { PaginationControls } from "../components/PaginationControls";
import {
  type TemplateCategory,
  type TemplateItem,
  type TemplatePreviewItem,
  type PortfolioItem,
} from "../content";
import {
  getPaymentStatusLabel,
  type OrderItem,
  type OrdersResponse,
} from "../order-types";
import {
  userRoleKey,
  userSessionEvent,
  userTokenKey,
  userUsernameKey,
} from "../user-session";

type AdminTemplatesPageProps = {
  templates: TemplateItem[];
  categories: TemplateCategory[];
  projects: PortfolioItem[];
  onTemplatesChange: (templates: TemplateItem[]) => void;
  onProjectsChange: (projects: PortfolioItem[]) => void;
};

type TemplateFormState = {
  id?: number;
  slug: string;
  title: string;
  category: TemplateItem["category"];
  description: string;
  price: string;
  stack: string;
  level: string;
  accentClass: string;
  preview: TemplatePreviewItem[];
  demoUrl: string;
  features: string;
  includedFiles: string;
  suitableFor: string;
  license: string;
  support: string;
};

type TemplatesResponse = {
  templates: TemplateItem[];
};

type TemplateMutationResponse = {
  template: TemplateItem;
};

type ProjectMutationResponse = {
  project: PortfolioItem;
};

type PortfolioFormState = {
  id?: number;
  title: string;
  category: string;
  description: string;
  result: string;
  websiteUrl: string;
  imageUrl: string;
  imageUrls: string[];
};

type OrderStatus = "new" | "contacted" | "deal" | "closed";
type OrderStatusFilter = "all" | OrderStatus;
type PaymentStatusFilter =
  | "all"
  | "pending"
  | "waiting_payment"
  | "paid"
  | "failed";

type AuthResponse = {
  user: {
    id: number;
    username: string;
    role?: "user" | "admin";
  };
};

const defaultFormState: TemplateFormState = {
  slug: "",
  title: "",
  category: "Portfolio",
  description: "",
  price: "Rp149K",
  stack: "React\nTailwind",
  level: "Pemula",
  accentClass: "bg-naki-secondary",
  preview: [
    { image: "", caption: "Hero section" },
    { image: "", caption: "Feature grid" },
    { image: "", caption: "Contact CTA" },
  ],
  demoUrl: "#",
  features: "Responsive layout\nClean components\nEasy customization",
  includedFiles: "React components\nTailwind theme\nSetup guide",
  suitableFor: "Personal project\nClient project",
  license:
    "Boleh dipakai untuk satu personal/client project. Tidak untuk dijual ulang sebagai template mentah.",
  support: "Support setup dasar setelah pembelian.",
};

const defaultPortfolioFormState: PortfolioFormState = {
  title: "",
  category: "Company profile",
  description: "",
  result: "Website selesai",
  websiteUrl: "#",
  imageUrl: "",
  imageUrls: [],
};

const orderStatusFilters: Array<{ label: string; value: OrderStatusFilter }> = [
  { label: "Semua", value: "all" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Deal", value: "deal" },
  { label: "Closed", value: "closed" },
];
const paymentStatusFilters: Array<{
  label: string;
  value: PaymentStatusFilter;
}> = [
  { label: "Semua bayar", value: "all" },
  { label: "Belum bayar", value: "pending" },
  { label: "Menunggu", value: "waiting_payment" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
];
const adminOrdersPageSize = 8;
const levelOptions = ["Pemula", "Menengah", "Lanjut"];
const stackOptions = [
  "React",
  "Vite",
  "Tailwind",
  "TypeScript",
  "Express",
  "MySQL",
  "API",
  "Motion",
  "Chart",
];
const licenseOptions = [
  "Boleh dipakai untuk satu personal/client project. Tidak untuk dijual ulang sebagai template mentah.",
  "Boleh dipakai untuk satu brand atau satu client project.",
  "Boleh dipakai untuk personal dan client project.",
  "Personal use only.",
];
const supportOptions = [
  "Support setup dasar selama 7 hari setelah pembelian.",
  "Support setup dasar dan arahan custom ringan.",
  "Support setup dasar dan integrasi API awal.",
  "Tanpa support teknis lanjutan.",
];
export function AdminTemplatesPage({
  templates,
  categories,
  projects,
  onTemplatesChange,
  onProjectsChange,
}: AdminTemplatesPageProps) {
  const location = useLocation();
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
  const [activeAdminView, setActiveAdminView] = useState<
    "templates" | "orders" | "portfolio"
  >(() => {
    if (window.location.hash === "#orders") {
      return "orders";
    }

    if (window.location.hash === "#portfolio") {
      return "portfolio";
    }

    return "templates";
  });
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
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersMeta, setOrdersMeta] = useState({
    total: 0,
    totalPages: 1,
    pageSize: adminOrdersPageSize,
  });
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(
    () => window.location.hash === "#new-template",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [status, setStatus] = useState("Siap mengelola katalog template.");
  const [ordersStatus, setOrdersStatus] = useState(
    "Login untuk melihat request konsultasi.",
  );
  const [deleteCandidateOrder, setDeleteCandidateOrder] =
    useState<OrderItem | null>(null);
  const adminTokenRef = useRef(adminToken);
  const isAdmin = Boolean(adminToken && adminRole === "admin");

  useEffect(() => {
    adminTokenRef.current = adminToken;
  }, [adminToken]);

  useEffect(() => {
    if (location.hash === "#orders") {
      setActiveAdminView("orders");
      setIsTemplateModalOpen(false);

      if (isAdmin && adminToken) {
        void loadOrders(adminToken, ordersPage);
      }

      return;
    }

    if (location.hash === "#new-template") {
      setActiveAdminView("templates");
      setIsTemplateModalOpen(true);
      return;
    }

    if (location.hash === "#portfolio") {
      setActiveAdminView("portfolio");
      setIsTemplateModalOpen(false);
      return;
    }

    if (!location.hash) {
      setActiveAdminView("templates");
    }
    // loadOrders is intentionally omitted because this effect only syncs route hash into UI state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken, isAdmin, location.hash]);

  useEffect(() => {
    let isActive = true;

    fetch(getApiUrl("/api/templates"))
      .then((response) => response.json())
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

    fetch(getApiUrl("/api/auth/user/me"), {
      headers: createAuthHeaders(adminToken),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Token tidak valid.");
        }

        return response.json();
      })
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

  function updateField<Key extends keyof TemplateFormState>(
    key: Key,
    value: TemplateFormState[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
      slug:
        key === "title" && !selectedId ? slugify(String(value)) : current.slug,
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

    setPortfolioForm({
      id: project.id,
      title: project.title,
      category: project.category,
      description: project.description,
      result: project.result,
      websiteUrl: project.websiteUrl ?? "#",
      imageUrl: imageUrls[0] ?? "",
      imageUrls,
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

  function startCreate() {
    window.location.hash = "new-template";
    setSelectedId(null);
    setForm(defaultFormState);
    setIsTemplateModalOpen(true);
    setStatus("Mode tambah template baru.");
  }

  function startEdit(template: TemplateItem) {
    window.location.hash = `template-${template.id}`;
    setSelectedId(template.id);
    setForm(templateToForm(template));
    setIsTemplateModalOpen(true);
    setStatus(`Mengedit ${template.title}.`);
  }

  function closeTemplateModal() {
    if (!isSaving) {
      if (window.location.hash !== "#orders") {
        window.location.hash = "";
      }
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

  async function loadOrders(token = adminToken, page = ordersPage) {
    if (!token) {
      setOrdersStatus("Login admin diperlukan untuk melihat order.");
      return;
    }

    setIsLoadingOrders(true);
    setOrdersStatus("Memuat request konsultasi...");

    try {
      const response = await fetch(
        `/api/orders?page=${page}&pageSize=${adminOrdersPageSize}`,
        {
          headers: createAuthHeaders(token),
        },
      );

      if (response.status === 401) {
        logout();
        throw new Error("Sesi admin habis.");
      }

      if (!response.ok) {
        throw new Error("Gagal memuat order.");
      }

      const data = (await response.json()) as OrdersResponse;
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

  async function updateOrderStatus(orderId: number, nextStatus: OrderStatus) {
    if (!adminToken) {
      setOrdersStatus("Login admin diperlukan untuk update order.");
      return;
    }

    setUpdatingOrderId(orderId);
    setOrdersStatus("Mengubah status order...");

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...createAuthHeaders(adminToken),
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      if (response.status === 401) {
        logout();
        throw new Error("Sesi admin habis.");
      }

      if (!response.ok) {
        throw new Error("Gagal mengubah status order.");
      }

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
    }
  }

  async function deleteOrder(order: OrderItem) {
    if (!adminToken) {
      setOrdersStatus("Login admin diperlukan untuk menghapus order.");
      return;
    }

    setUpdatingOrderId(order.id);
    setOrdersStatus(`Menghapus order #${order.id}...`);

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "DELETE",
        headers: createAuthHeaders(adminToken),
      });

      if (response.status === 401) {
        logout();
        throw new Error("Sesi admin habis.");
      }

      if (!response.ok) {
        throw new Error("Gagal menghapus order.");
      }

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
    }
  }

  async function submitTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminToken) {
      setStatus("Login admin diperlukan untuk menyimpan template.");
      return;
    }

    setIsSaving(true);
    setStatus("Menyimpan template...");

    const payload = formToPayload(form);
    const isEditing = selectedTemplate !== undefined;

    try {
      const response = await fetch(
        isEditing ? `/api/templates/${selectedTemplate.id}` : "/api/templates",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...createAuthHeaders(adminToken),
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.status === 401) {
        logout();
        throw new Error("Sesi admin habis.");
      }

      if (!response.ok) {
        throw new Error("Gagal menyimpan template.");
      }

      const data = (await response.json()) as TemplateMutationResponse;
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
    }
  }

  async function deleteTemplate(template: TemplateItem) {
    if (!adminToken) {
      setStatus("Login admin diperlukan untuk menghapus template.");
      return;
    }

    setStatus(`Menghapus ${template.title}...`);

    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: "DELETE",
        headers: createAuthHeaders(adminToken),
      });

      if (response.status === 401) {
        logout();
        throw new Error("Sesi admin habis.");
      }

      if (!response.ok) {
        throw new Error("Gagal menghapus template.");
      }

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
    }
  }

  async function submitPortfolio(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminToken) {
      setPortfolioStatus("Login admin diperlukan untuk menyimpan portofolio.");
      return;
    }

    setIsSavingPortfolio(true);
    setPortfolioStatus("Menyimpan portofolio...");

    const payload = {
      title: portfolioForm.title.trim(),
      category: portfolioForm.category.trim(),
      description: portfolioForm.description.trim(),
      result: portfolioForm.result.trim(),
      websiteUrl: portfolioForm.websiteUrl.trim() || "#",
      imageUrl:
        portfolioForm.imageUrls[0] ||
        portfolioForm.imageUrl.trim() ||
        undefined,
      imageUrls: portfolioForm.imageUrls,
    };
    const isEditing = typeof portfolioForm.id === "number";

    try {
      const response = await fetch(
        isEditing ? `/api/projects/${portfolioForm.id}` : "/api/projects",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...createAuthHeaders(adminToken),
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.status === 401) {
        logout();
        throw new Error("Sesi admin habis.");
      }

      if (!response.ok) {
        throw new Error("Gagal menyimpan portofolio.");
      }

      const data = (await response.json()) as ProjectMutationResponse;
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
    }
  }

  async function deletePortfolio(project: PortfolioItem) {
    if (!adminToken || !project.id) {
      setPortfolioStatus("Login admin diperlukan untuk menghapus portofolio.");
      return;
    }

    setDeletingProjectId(project.id);
    setPortfolioStatus(`Menghapus portofolio ${project.title}...`);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
        headers: createAuthHeaders(adminToken),
      });

      if (response.status === 401) {
        logout();
        throw new Error("Sesi admin habis.");
      }

      if (!response.ok) {
        throw new Error("Gagal menghapus portofolio.");
      }

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
    }
  }

  return (
    <main className="naki-frosted-grid min-h-screen text-naki-primary">
      <Header />

      {!adminToken ? (
        <section className="grid min-h-[76vh] w-full place-items-center px-5 py-12 md:px-8 xl:px-12 2xl:px-16">
          <div className="w-full max-w-md rounded-xl border border-naki-steel bg-naki-frost p-6 shadow-naki-soft">
            <span className="grid size-12 place-items-center rounded-lg bg-naki-primary text-naki-frost">
              <LockKeyhole size={22} />
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight">
              Login diperlukan
            </h1>
            <p className="mt-3 leading-7 text-naki-smoke">
              Gunakan halaman login yang sama. Akun dengan role admin akan
              otomatis membuka dashboard ini.
            </p>
            <Link
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-naki-secondary px-5 text-sm font-black text-naki-frost transition hover:bg-naki-primary"
              to="/login?next=%2Fadmin%2Ftemplates"
            >
              <LockKeyhole size={17} />
              Buka login
            </Link>
            <p className="mt-4 text-sm font-semibold text-naki-smoke">
              {loginStatus}
            </p>
          </div>
        </section>
      ) : !isAdmin ? (
        <section className="grid min-h-[76vh] w-full place-items-center px-5 py-12 text-center md:px-8 xl:px-12 2xl:px-16">
          <div className="w-full max-w-md rounded-xl border border-naki-steel bg-naki-frost p-6 shadow-naki-soft">
            <span className="mx-auto grid size-12 place-items-center rounded-lg bg-naki-primary text-naki-frost">
              <LockKeyhole size={22} />
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight">
              Akses admin
            </h1>
            <p className="mt-3 leading-7 text-naki-smoke">
              Akun {adminUsername || "ini"} sudah login, tapi belum punya role
              admin.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-naki-secondary px-5 text-sm font-black text-naki-frost transition hover:bg-naki-primary"
                to="/login?next=%2Fadmin%2Ftemplates"
              >
                Login akun admin
              </Link>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-naki-steel px-5 text-sm font-black text-naki-secondary transition hover:border-naki-smoke"
                onClick={logout}
                type="button"
              >
                Logout
              </button>
            </div>
            <p className="mt-4 text-sm font-semibold text-naki-smoke">
              {loginStatus}
            </p>
          </div>
        </section>
      ) : (
        <AdminTemplateWorkspace
          templates={templates}
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
          portfolioForm={portfolioForm}
          isPortfolioModalOpen={isPortfolioModalOpen}
          portfolioStatus={portfolioStatus}
          isSavingPortfolio={isSavingPortfolio}
          deletingProjectId={deletingProjectId}
          orders={orders}
          ordersStatus={ordersStatus}
          ordersPage={ordersPage}
          ordersMeta={ordersMeta}
          isLoadingOrders={isLoadingOrders}
          updatingOrderId={updatingOrderId}
          onActiveAdminViewChange={setActiveAdminView}
          onRefreshOrders={() => loadOrders(adminToken, ordersPage)}
          onOrdersPageChange={(page) => {
            setOrdersPage(page);
            void loadOrders(adminToken, page);
          }}
          onUpdateOrderStatus={updateOrderStatus}
          onDeleteOrder={setDeleteCandidateOrder}
          onStartCreate={startCreate}
          onStartEdit={startEdit}
          onCloseTemplateModal={closeTemplateModal}
          onDeleteTemplate={deleteTemplate}
          onSubmitTemplate={submitTemplate}
          onUpdateField={updateField}
          onUpdatePortfolioField={updatePortfolioField}
          onSubmitPortfolio={submitPortfolio}
          onStartEditPortfolio={startEditPortfolio}
          onClosePortfolioModal={closePortfolioModal}
          onResetPortfolioForm={resetPortfolioForm}
          onDeletePortfolio={deletePortfolio}
        />
      )}

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

      <Footer />
    </main>
  );
}

type AdminTemplateWorkspaceProps = {
  templates: TemplateItem[];
  projects: PortfolioItem[];
  categoryOptions: TemplateItem["category"][];
  selectedId: number | null;
  selectedTemplate: TemplateItem | undefined;
  form: TemplateFormState;
  status: string;
  isSaving: boolean;
  isTemplateModalOpen: boolean;
  adminToken: string | null;
  activeAdminView: "templates" | "orders" | "portfolio";
  portfolioForm: PortfolioFormState;
  isPortfolioModalOpen: boolean;
  portfolioStatus: string;
  isSavingPortfolio: boolean;
  deletingProjectId: number | null;
  orders: OrderItem[];
  ordersStatus: string;
  ordersPage: number;
  ordersMeta: {
    total: number;
    totalPages: number;
    pageSize: number;
  };
  isLoadingOrders: boolean;
  updatingOrderId: number | null;
  onActiveAdminViewChange: (view: "templates" | "orders" | "portfolio") => void;
  onRefreshOrders: () => void;
  onOrdersPageChange: (page: number) => void;
  onUpdateOrderStatus: (orderId: number, status: OrderStatus) => void;
  onDeleteOrder: (order: OrderItem) => void;
  onStartCreate: () => void;
  onStartEdit: (template: TemplateItem) => void;
  onCloseTemplateModal: () => void;
  onDeleteTemplate: (template: TemplateItem) => void;
  onSubmitTemplate: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdateField: <Key extends keyof TemplateFormState>(
    key: Key,
    value: TemplateFormState[Key],
  ) => void;
  onUpdatePortfolioField: <Key extends keyof PortfolioFormState>(
    key: Key,
    value: PortfolioFormState[Key],
  ) => void;
  onSubmitPortfolio: (event: React.FormEvent<HTMLFormElement>) => void;
  onStartEditPortfolio: (project: PortfolioItem) => void;
  onClosePortfolioModal: () => void;
  onResetPortfolioForm: () => void;
  onDeletePortfolio: (project: PortfolioItem) => void;
};

function AdminTemplateWorkspace({
  templates,
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
  portfolioForm,
  isPortfolioModalOpen,
  portfolioStatus,
  isSavingPortfolio,
  deletingProjectId,
  orders,
  ordersStatus,
  ordersPage,
  ordersMeta,
  isLoadingOrders,
  updatingOrderId,
  onActiveAdminViewChange,
  onRefreshOrders,
  onOrdersPageChange,
  onUpdateOrderStatus,
  onDeleteOrder,
  onStartCreate,
  onStartEdit,
  onCloseTemplateModal,
  onDeleteTemplate,
  onSubmitTemplate,
  onUpdateField,
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
            Admin template
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-naki-smoke">
            Kelola katalog Naki Code, pantau request konsultasi, dan tindak
            lanjuti calon pembeli.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition ${
            activeAdminView === "templates"
              ? "bg-naki-primary text-naki-frost"
              : "border border-naki-steel text-naki-secondary hover:border-naki-smoke"
          }`}
          onClick={() => {
            window.location.hash = "";
            onActiveAdminViewChange("templates");
          }}
          type="button"
        >
          <ClipboardList size={17} />
          Template
        </button>
        <button
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition ${
            activeAdminView === "orders"
              ? "bg-naki-primary text-naki-frost"
              : "border border-naki-steel text-naki-secondary hover:border-naki-smoke"
          }`}
          onClick={() => {
            window.location.hash = "orders";
            onActiveAdminViewChange("orders");
            onRefreshOrders();
          }}
          type="button"
        >
          <Inbox size={17} />
          Order
        </button>
        <button
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition ${
            activeAdminView === "portfolio"
              ? "bg-naki-primary text-naki-frost"
              : "border border-naki-steel text-naki-secondary hover:border-naki-smoke"
          }`}
          onClick={() => {
            window.location.hash = "portfolio";
            onActiveAdminViewChange("portfolio");
          }}
          type="button"
        >
          <Globe2 size={17} />
          Portofolio
        </button>
      </div>

      {activeAdminView === "orders" ? (
        <OrdersPanel
          orders={orders}
          ordersStatus={ordersStatus}
          ordersPage={ordersPage}
          ordersMeta={ordersMeta}
          isLoadingOrders={isLoadingOrders}
          updatingOrderId={updatingOrderId}
          onRefreshOrders={onRefreshOrders}
          onOrdersPageChange={onOrdersPageChange}
          onUpdateOrderStatus={onUpdateOrderStatus}
          onDeleteOrder={onDeleteOrder}
        />
      ) : activeAdminView === "portfolio" ? (
        <PortfolioAdminPanel
          projects={projects}
          form={portfolioForm}
          status={portfolioStatus}
          deletingProjectId={deletingProjectId}
          onStartEdit={onStartEditPortfolio}
          onReset={onResetPortfolioForm}
          onDelete={onDeletePortfolio}
        />
      ) : (
        <div className="py-8">
          <section className="min-w-0">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-black">Katalog aktif</h2>
                <p className="mt-1 text-sm font-semibold text-naki-smoke">
                  {templates.length} template tersedia.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-naki-steel px-3 py-2 text-sm font-black text-naki-secondary">
                  <BadgeCheck size={16} />
                  {status}
                </span>
                <button
                  className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg bg-naki-secondary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-primary"
                  onClick={onStartCreate}
                  type="button"
                >
                  <Plus size={16} />
                  Template baru
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-naki-steel bg-naki-frost shadow-naki-card">
              <div className="hidden grid-cols-[1.1fr_0.7fr_0.5fr_118px] border-b border-naki-steel bg-naki-steel px-4 py-3 text-xs font-black uppercase text-naki-smoke md:grid">
                <span>Template</span>
                <span>Kategori</span>
                <span>Harga</span>
                <span>Aksi</span>
              </div>
              <div className="divide-y divide-naki-steel">
                {templates.map((template) => (
                  <article
                    key={template.id}
                    className={`grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.1fr_0.7fr_0.5fr_118px] md:items-center ${
                      selectedId === template.id
                        ? "bg-naki-steel"
                        : "bg-naki-frost"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-black">{template.title}</p>
                      <p className="truncate text-xs font-semibold text-naki-smoke">
                        /templates/{template.slug}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 md:hidden">
                        <span className="rounded-md bg-naki-steel px-2 py-1 text-xs font-black text-naki-primary">
                          {template.category}
                        </span>
                        <span className="rounded-md bg-naki-steel px-2 py-1 text-xs font-black text-naki-primary">
                          {template.price}
                        </span>
                      </div>
                    </div>
                    <span className="hidden font-bold text-naki-smoke md:block">
                      {template.category}
                    </span>
                    <span className="hidden font-black md:block">
                      {template.price}
                    </span>
                    <div className="flex gap-2 md:justify-start">
                      <button
                        className="grid size-10 place-items-center rounded-lg border border-naki-steel text-naki-secondary transition hover:border-naki-smoke"
                        onClick={() => onStartEdit(template)}
                        type="button"
                        aria-label={`Edit ${template.title}`}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        className="grid size-10 place-items-center rounded-lg border border-naki-steel text-naki-smoke transition hover:border-naki-smoke hover:text-naki-primary"
                        onClick={() => onDeleteTemplate(template)}
                        type="button"
                        aria-label={`Hapus ${template.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
          <TemplateFormModal
            categoryOptions={categoryOptions}
            form={form}
            isOpen={isTemplateModalOpen}
            isSaving={isSaving}
            selectedTemplate={selectedTemplate}
            adminToken={adminToken}
            onClose={onCloseTemplateModal}
            onStartCreate={onStartCreate}
            onSubmitTemplate={onSubmitTemplate}
            onUpdateField={onUpdateField}
          />
        </div>
      )}
      <PortfolioFormModal
        adminToken={adminToken}
        form={portfolioForm}
        isOpen={isPortfolioModalOpen}
        isSaving={isSavingPortfolio}
        status={portfolioStatus}
        onClose={onClosePortfolioModal}
        onReset={onResetPortfolioForm}
        onSubmit={onSubmitPortfolio}
        onUpdateField={onUpdatePortfolioField}
      />
    </section>
  );
}

type TemplateFormModalProps = {
  categoryOptions: TemplateItem["category"][];
  form: TemplateFormState;
  isOpen: boolean;
  isSaving: boolean;
  selectedTemplate: TemplateItem | undefined;
  adminToken: string | null;
  onClose: () => void;
  onStartCreate: () => void;
  onSubmitTemplate: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdateField: <Key extends keyof TemplateFormState>(
    key: Key,
    value: TemplateFormState[Key],
  ) => void;
};

function TemplateFormModal({
  categoryOptions,
  form,
  isOpen,
  isSaving,
  selectedTemplate,
  adminToken,
  onClose,
  onStartCreate,
  onSubmitTemplate,
  onUpdateField,
}: TemplateFormModalProps) {
  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto bg-naki-primary/40 px-4 py-6 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-form-title"
    >
      <div className="w-full my-10 mx-20 rounded-xl border border-naki-steel bg-naki-frost shadow-naki-soft">
        <div className="sticky top-0 z-10 flex flex-col justify-between gap-3 border-b border-naki-steel bg-naki-frost/95 p-5 backdrop-blur sm:flex-row sm:items-start">
          <div>
            <h2 id="template-form-title" className="text-2xl font-black">
              {selectedTemplate ? "Edit template" : "Tambah template"}
            </h2>
            <p className="mt-1 text-sm font-semibold text-naki-smoke">
              Kelola data katalog yang tersimpan ke database.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="grid size-10 place-items-center rounded-lg border border-naki-steel text-naki-secondary transition hover:border-naki-smoke"
              onClick={onStartCreate}
              type="button"
              aria-label="Reset form"
            >
              <RefreshCw size={16} />
            </button>
            <button
              className="grid size-10 place-items-center rounded-lg border border-naki-steel text-naki-primary transition hover:border-naki-smoke"
              onClick={onClose}
              type="button"
              aria-label="Tutup form"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <form className="grid gap-5 p-5" onSubmit={onSubmitTemplate}>
          <div className="grid gap-4 lg:grid-cols-2">
            <Field
              label="Judul"
              value={form.title}
              onChange={(value) => onUpdateField("title", value)}
              required
            />
            <Field
              label="Slug"
              value={form.slug}
              onChange={(value) => onUpdateField("slug", slugify(value))}
              required
            />
            <SelectField
              label="Kategori"
              value={form.category}
              options={categoryOptions}
              onChange={(value) =>
                onUpdateField("category", value as TemplateItem["category"])
              }
            />
            <Field
              label="Harga"
              value={form.price}
              onChange={(value) => onUpdateField("price", value)}
            />
            <SelectField
              label="Level"
              value={form.level}
              options={levelOptions}
              onChange={(value) => onUpdateField("level", value)}
            />
          </div>

          <TextArea
            label="Deskripsi"
            value={form.description}
            onChange={(value) => onUpdateField("description", value)}
            rows={3}
            required
          />

          <TagSelector
            label="Stack"
            options={stackOptions}
            value={form.stack}
            onChange={(value) => onUpdateField("stack", value)}
          />

          <PreviewDropZone
            adminToken={adminToken}
            value={form.preview}
            onChange={(value) => onUpdateField("preview", value)}
          />

          <TagInput
            label="Fitur"
            value={form.features}
            onChange={(value) => onUpdateField("features", value)}
          />

          <SourceCodeUpload
            value={form.includedFiles}
            onChange={(value) => onUpdateField("includedFiles", value)}
          />

          <TagInput
            label="Cocok untuk"
            value={form.suitableFor}
            onChange={(value) => onUpdateField("suitableFor", value)}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <SelectField
              label="Lisensi"
              value={form.license}
              options={licenseOptions}
              onChange={(value) => onUpdateField("license", value)}
            />
            <SelectField
              label="Support"
              value={form.support}
              options={supportOptions}
              onChange={(value) => onUpdateField("support", value)}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-naki-steel pt-5 sm:flex-row sm:justify-end">
            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-naki-steel px-5 text-sm font-black text-naki-secondary transition hover:border-naki-smoke"
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-naki-primary px-5 text-sm font-black text-naki-frost transition hover:bg-naki-secondary disabled:cursor-not-allowed disabled:bg-naki-smoke"
              disabled={isSaving}
              type="submit"
            >
              <Save size={17} />
              {isSaving ? "Menyimpan..." : "Simpan template"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

type PortfolioFormModalProps = {
  adminToken: string | null;
  form: PortfolioFormState;
  isOpen: boolean;
  isSaving: boolean;
  status: string;
  onClose: () => void;
  onReset: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdateField: <Key extends keyof PortfolioFormState>(
    key: Key,
    value: PortfolioFormState[Key],
  ) => void;
};

function PortfolioFormModal({
  adminToken,
  form,
  isOpen,
  isSaving,
  status,
  onClose,
  onReset,
  onSubmit,
  onUpdateField,
}: PortfolioFormModalProps) {
  const [imageStatus, setImageStatus] = useState(
    "Upload, drop, atau paste satu foto portofolio.",
  );

  useEffect(() => {
    if (isOpen) {
      setImageStatus("Upload, drop, atau paste satu foto portofolio.");
    }
  }, [form.id, isOpen]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const modalTitle = form.id ? "Edit portofolio" : "Tambah portofolio";
  const previewTitle = form.title.trim() || "Nama website";
  const previewCategory = form.category.trim() || "Kategori";
  const previewDescription =
    form.description.trim() ||
    "Deskripsi singkat website yang sudah selesai dibuat.";
  const previewResult = form.result.trim() || "Hasil project";
  const portfolioImages =
    form.imageUrls.length > 0
      ? form.imageUrls
      : form.imageUrl.trim()
        ? [form.imageUrl.trim()]
        : [];
  const coverImage = portfolioImages[0] ?? "";
  const hasImage = Boolean(coverImage);

  function updatePortfolioImages(imageUrls: string[]) {
    onUpdateField("imageUrls", imageUrls);
    onUpdateField("imageUrl", imageUrls[0] ?? "");
  }

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto bg-naki-primary/45 px-4 py-6 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portfolio-form-title"
    >
      <div className="my-10 w-full max-w-6xl overflow-hidden rounded-xl border border-naki-steel bg-naki-frost shadow-naki-soft">
        <div className="sticky top-0 z-10 flex flex-col justify-between gap-3 border-b border-naki-steel bg-naki-frost/95 p-5 backdrop-blur sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-black uppercase text-naki-secondary">
              Portfolio admin
            </p>
            <h2 id="portfolio-form-title" className="mt-1 text-2xl font-black">
              {modalTitle}
            </h2>
            <p className="mt-1 text-sm font-semibold text-naki-smoke">
              Simpan website yang sudah jadi agar tampil di storefront.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="grid size-10 place-items-center rounded-lg border border-naki-steel text-naki-secondary transition hover:border-naki-smoke"
              onClick={onReset}
              type="button"
              aria-label="Reset form portofolio"
            >
              <RefreshCw size={16} />
            </button>
            <button
              className="grid size-10 place-items-center rounded-lg border border-naki-steel text-naki-primary transition hover:border-naki-smoke disabled:cursor-not-allowed disabled:text-naki-smoke"
              disabled={isSaving}
              onClick={onClose}
              type="button"
              aria-label="Tutup form portofolio"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <form
          className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px]"
          onSubmit={onSubmit}
        >
          <div className="grid gap-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-naki-steel px-3 py-2 text-sm font-black text-naki-secondary">
              <BadgeCheck size={16} />
              {status}
            </span>

            <div className="grid gap-4 lg:grid-cols-2">
              <Field
                label="Nama website"
                value={form.title}
                onChange={(value) => onUpdateField("title", value)}
                required
              />
              <Field
                label="Kategori"
                value={form.category}
                onChange={(value) => onUpdateField("category", value)}
                required
              />
              <Field
                label="Hasil"
                value={form.result}
                onChange={(value) => onUpdateField("result", value)}
                required
              />
              <Field
                label="URL website"
                value={form.websiteUrl}
                onChange={(value) => onUpdateField("websiteUrl", value)}
              />
            </div>

            <TextArea
              label="Deskripsi"
              value={form.description}
              onChange={(value) => onUpdateField("description", value)}
              rows={4}
              required
            />

            <ImageUploadDropZone
              adminToken={adminToken}
              title="Upload / drop / paste foto portofolio"
              description="Bisa upload beberapa gambar. Foto pertama dipakai sebagai cover kartu."
              multiple
              status={imageStatus}
              uploadLabel={hasImage ? "Tambah foto" : "Upload foto"}
              onStatusChange={setImageStatus}
              onUploaded={(imageUrls) => {
                updatePortfolioImages([...portfolioImages, ...imageUrls]);
              }}
              successMessage={(imageUrls) =>
                `${imageUrls.length} foto portofolio berhasil diupload.`
              }
            />

            {hasImage ? (
              <div className="overflow-hidden rounded-lg border border-naki-steel bg-naki-frost">
                <div className="flex items-center justify-between gap-3 border-b border-naki-steel bg-naki-steel px-3 py-2">
                  <p className="text-sm font-black text-naki-primary">
                    Foto terpilih ({portfolioImages.length})
                  </p>
                  <button
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-naki-steel bg-naki-frost px-3 text-xs font-black text-naki-secondary transition hover:border-naki-smoke"
                    onClick={() => {
                      updatePortfolioImages([]);
                      setImageStatus(
                        "Semua foto portofolio dihapus dari form.",
                      );
                    }}
                    type="button"
                  >
                    <X size={13} />
                    Hapus semua
                  </button>
                </div>
                <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
                  {portfolioImages.map((imageUrl, index) => (
                    <div
                      className="overflow-hidden rounded-lg border border-naki-steel bg-naki-frost"
                      key={`${imageUrl}-${index}`}
                    >
                      <div className="relative h-32 overflow-hidden bg-naki-steel">
                        <img
                          className="h-full w-full object-cover"
                          src={imageUrl}
                          alt={`${previewTitle} ${index + 1}`}
                          loading="lazy"
                          decoding="async"
                        />
                        {index === 0 ? (
                          <span className="absolute left-2 top-2 rounded-md bg-naki-primary px-2 py-1 text-xs font-black text-naki-frost">
                            Cover
                          </span>
                        ) : null}
                      </div>
                      <button
                        className="flex h-9 w-full items-center justify-center gap-1 border-t border-naki-steel text-xs font-black text-naki-secondary transition hover:bg-naki-steel hover:text-naki-primary"
                        onClick={() => {
                          updatePortfolioImages(
                            portfolioImages.filter(
                              (_, imageIndex) => imageIndex !== index,
                            ),
                          );
                          setImageStatus(
                            `Foto posisi ${index + 1} dihapus dari form.`,
                          );
                        }}
                        type="button"
                      >
                        <X size={13} />
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="grid content-start gap-4">
            <div className="overflow-hidden rounded-xl border border-naki-steel bg-naki-frost shadow-naki-card">
              <div className="relative flex h-52 items-end overflow-hidden bg-naki-primary p-4 text-naki-frost">
                {hasImage ? (
                  <>
                    <img
                      className="absolute inset-0 h-full w-full object-cover"
                      src={coverImage}
                      alt={previewTitle}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="absolute inset-0 bg-naki-primary/62" />
                  </>
                ) : (
                  <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent),radial-gradient(circle_at_top_right,rgba(240,244,245,0.2),transparent_40%)]" />
                )}
                <div className="relative min-w-0">
                  <p className="text-xs font-black uppercase text-naki-steel">
                    {previewCategory}
                  </p>
                  <h3 className="mt-2 line-clamp-2 text-2xl font-black leading-tight">
                    {previewTitle}
                  </h3>
                </div>
              </div>
              <div className="grid gap-3 p-4">
                <p className="line-clamp-3 text-sm font-semibold leading-6 text-naki-smoke">
                  {previewDescription}
                </p>
                <p className="rounded-lg bg-naki-steel px-3 py-2 text-sm font-black text-naki-primary">
                  {previewResult}
                </p>
              </div>
            </div>

            <div className="grid gap-2 rounded-xl border border-naki-steel bg-naki-steel p-4">
              <p className="text-xs font-black uppercase text-naki-smoke">
                Website URL
              </p>
              <p className="break-all text-sm font-black text-naki-primary">
                {form.websiteUrl.trim() || "Belum diisi"}
              </p>
            </div>

            <div className="grid gap-2 border-t border-naki-steel pt-4">
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-naki-primary px-5 text-sm font-black text-naki-frost transition hover:bg-naki-secondary disabled:cursor-not-allowed disabled:bg-naki-smoke"
                disabled={isSaving}
                type="submit"
              >
                <Save size={17} />
                {isSaving ? "Menyimpan..." : "Simpan portofolio"}
              </button>
              <button
                className="inline-flex h-12 items-center justify-center rounded-lg border border-naki-steel px-5 text-sm font-black text-naki-secondary transition hover:border-naki-smoke disabled:cursor-not-allowed disabled:text-naki-smoke"
                disabled={isSaving}
                onClick={onClose}
                type="button"
              >
                Batal
              </button>
            </div>
          </aside>
        </form>
      </div>
    </div>,
    document.body,
  );
}

type DeleteOrderDialogProps = {
  order: OrderItem | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: (order: OrderItem) => void;
};

function DeleteOrderDialog({
  order,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteOrderDialogProps) {
  if (!order || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[130] grid place-items-center bg-naki-primary/55 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-order-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-naki-steel bg-naki-frost shadow-naki-soft">
        <div className="flex items-start justify-between gap-4 border-b border-naki-steel bg-naki-steel p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-naki-primary text-naki-frost">
              <AlertTriangle size={20} />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-naki-secondary">
                Validasi hapus order
              </p>
              <h2
                id="delete-order-title"
                className="mt-1 text-2xl font-black leading-tight text-naki-primary"
              >
                Hapus order #{order.id}?
              </h2>
            </div>
          </div>
          <button
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-naki-steel text-naki-secondary transition hover:border-naki-smoke disabled:cursor-not-allowed disabled:text-naki-smoke"
            disabled={isDeleting}
            onClick={onClose}
            type="button"
            aria-label="Tutup dialog hapus order"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 p-5">
          <p className="text-sm font-semibold leading-6 text-naki-smoke">
            Order ini akan dihapus dari inbox admin dan daftar pesanan user.
            Datanya tetap disimpan sebagai soft delete di database.
          </p>

          <div className="grid gap-2 rounded-lg border border-naki-steel bg-naki-steel p-3">
            <DeleteOrderMeta label="Customer" value={order.customerName} />
            <DeleteOrderMeta label="Template" value={order.templateTitle} />
            <DeleteOrderMeta
              label="Payment"
              value={getPaymentStatusLabel(order.paymentStatus)}
            />
            <DeleteOrderMeta label="Status order" value={order.status} />
          </div>

          <div className="rounded-lg border border-naki-steel bg-naki-frost px-3 py-2 text-xs font-bold leading-5 text-naki-smoke">
            Aksi ini bukan hapus permanen. Untuk restore, admin perlu
            mengosongkan kolom <span className="font-black">deleted_at</span>{" "}
            pada order terkait.
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-naki-steel bg-naki-steel p-4 sm:flex-row sm:justify-end">
          <button
            className="inline-flex h-11 items-center justify-center rounded-lg border border-naki-steel bg-naki-frost px-4 text-sm font-black text-naki-secondary transition hover:border-naki-smoke disabled:cursor-not-allowed disabled:text-naki-smoke"
            disabled={isDeleting}
            onClick={onClose}
            type="button"
          >
            Batal
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-naki-primary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-secondary disabled:cursor-not-allowed disabled:bg-naki-smoke"
            disabled={isDeleting}
            onClick={() => onConfirm(order)}
            type="button"
          >
            <Trash2 size={16} />
            {isDeleting ? "Menghapus..." : "Ya, hapus order"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

type DeleteOrderMetaProps = {
  label: string;
  value: string;
};

function DeleteOrderMeta({ label, value }: DeleteOrderMetaProps) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[120px_1fr] sm:items-center">
      <p className="text-xs font-black uppercase text-naki-smoke">{label}</p>
      <p className="min-w-0 truncate text-sm font-black text-naki-primary">
        {value}
      </p>
    </div>
  );
}

type OrdersPanelProps = {
  orders: OrderItem[];
  ordersStatus: string;
  ordersPage: number;
  ordersMeta: {
    total: number;
    totalPages: number;
    pageSize: number;
  };
  isLoadingOrders: boolean;
  updatingOrderId: number | null;
  onRefreshOrders: () => void;
  onOrdersPageChange: (page: number) => void;
  onUpdateOrderStatus: (orderId: number, status: OrderStatus) => void;
  onDeleteOrder: (order: OrderItem) => void;
};

type PortfolioAdminPanelProps = {
  projects: PortfolioItem[];
  form: PortfolioFormState;
  status: string;
  deletingProjectId: number | null;
  onStartEdit: (project: PortfolioItem) => void;
  onReset: () => void;
  onDelete: (project: PortfolioItem) => void;
};

function PortfolioAdminPanel({
  projects,
  form,
  status,
  deletingProjectId,
  onStartEdit,
  onReset,
  onDelete,
}: PortfolioAdminPanelProps) {
  return (
    <section className="py-8">
      <div className="mb-4 flex flex-col justify-between gap-3 rounded-xl border border-naki-steel bg-naki-frost p-4 shadow-naki-card sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black">Website yang sudah jadi</h2>
          <p className="mt-1 text-sm font-semibold text-naki-smoke">
            {projects.length} item tampil di section Portofolio storefront.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-naki-steel px-3 text-sm font-black text-naki-secondary">
            <Globe2 size={16} />
            {projects.length} live
          </span>
          <span className="inline-flex min-h-10 items-center rounded-lg border border-naki-steel px-3 py-2 text-sm font-black text-naki-secondary">
            {status}
          </span>
          <button
            className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg bg-naki-secondary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-primary"
            onClick={onReset}
            type="button"
          >
            <Plus size={16} />
            Tambah baru
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-naki-steel bg-naki-frost p-10 text-center shadow-naki-card">
          <span className="mx-auto grid size-14 place-items-center rounded-xl bg-naki-steel text-naki-secondary">
            <Globe2 size={28} />
          </span>
          <h3 className="mt-5 text-2xl font-black">Belum ada portofolio.</h3>
          <p className="mt-2 text-naki-smoke">
            Tambahkan website yang sudah selesai agar tampil di halaman utama.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((project) => {
            const coverImage =
              project.imageUrls && project.imageUrls.length > 0
                ? project.imageUrls[0]
                : project.imageUrl;

            return (
              <article
                key={project.id ?? project.title}
                className={`overflow-hidden rounded-xl border bg-naki-frost shadow-naki-card transition hover:-translate-y-0.5 hover:shadow-naki-soft ${
                  form.id === project.id
                    ? "border-naki-secondary"
                    : "border-naki-steel"
                }`}
              >
                <div className="relative flex h-44 items-end overflow-hidden bg-naki-primary p-4 text-naki-frost">
                  {coverImage ? (
                    <>
                      <img
                        className="absolute inset-0 h-full w-full object-cover"
                        src={coverImage}
                        alt={project.title}
                      />
                      <span className="absolute inset-0 bg-naki-primary/62" />
                    </>
                  ) : (
                    <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent),radial-gradient(circle_at_top_right,rgba(240,244,245,0.2),transparent_40%)]" />
                  )}
                  <div className="relative min-w-0">
                    <p className="text-xs font-black uppercase text-naki-steel">
                      {project.category}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-2xl font-black leading-tight">
                      {project.title}
                    </h3>
                  </div>
                </div>
                <div className="grid gap-4 p-4">
                  <div>
                    <p className="line-clamp-2 text-sm font-semibold leading-6 text-naki-smoke">
                      {project.description}
                    </p>
                    <p className="mt-3 rounded-lg bg-naki-steel px-3 py-2 text-sm font-black text-naki-primary">
                      {project.result}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-naki-steel pt-3">
                    <p className="min-w-0 truncate text-xs font-bold text-naki-smoke">
                      {project.websiteUrl && project.websiteUrl !== "#"
                        ? project.websiteUrl
                        : "URL belum diisi"}
                    </p>
                    <div className="flex shrink-0 gap-2">
                      {project.websiteUrl && project.websiteUrl !== "#" ? (
                        <a
                          className="grid size-9 place-items-center rounded-lg border border-naki-steel text-naki-secondary transition hover:border-naki-smoke"
                          href={project.websiteUrl}
                          rel="noreferrer"
                          target="_blank"
                          aria-label={`Buka ${project.title}`}
                        >
                          <ExternalLink size={15} />
                        </a>
                      ) : null}
                      <button
                        className="grid size-9 place-items-center rounded-lg border border-naki-steel text-naki-secondary transition hover:border-naki-smoke"
                        onClick={() => onStartEdit(project)}
                        type="button"
                        aria-label={`Edit ${project.title}`}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        className="grid size-9 place-items-center rounded-lg border border-naki-steel text-naki-smoke transition hover:border-naki-smoke hover:text-naki-primary disabled:cursor-not-allowed disabled:text-naki-smoke"
                        disabled={deletingProjectId === project.id}
                        onClick={() => onDelete(project)}
                        type="button"
                        aria-label={`Hapus ${project.title}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function OrdersPanel({
  orders,
  ordersStatus,
  ordersPage,
  ordersMeta,
  isLoadingOrders,
  updatingOrderId,
  onRefreshOrders,
  onOrdersPageChange,
  onUpdateOrderStatus,
  onDeleteOrder,
}: OrdersPanelProps) {
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState<PaymentStatusFilter>("all");
  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesOrderStatus =
          statusFilter === "all" || order.status === statusFilter;
        const matchesPaymentStatus =
          paymentStatusFilter === "all" ||
          order.paymentStatus === paymentStatusFilter;

        return matchesOrderStatus && matchesPaymentStatus;
      }),
    [orders, paymentStatusFilter, statusFilter],
  );

  return (
    <section className="py-8">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black">Inbox order</h2>
          <p className="mt-1 text-sm font-semibold text-naki-smoke">
            Request konsultasi dari halaman detail template.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-naki-steel px-3 py-2 text-sm font-black text-naki-secondary">
            <BadgeCheck size={16} />
            {ordersStatus}
          </span>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-naki-secondary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-primary disabled:cursor-not-allowed disabled:bg-naki-smoke"
            disabled={isLoadingOrders}
            onClick={onRefreshOrders}
            type="button"
          >
            <RefreshCw size={16} />
            {isLoadingOrders ? "Memuat..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-2">
        <FilterButtonGroup
          filters={orderStatusFilters}
          orders={orders}
          activeValue={statusFilter}
          countBy={(order) => order.status}
          onChange={setStatusFilter}
        />
        <FilterButtonGroup
          filters={paymentStatusFilters}
          orders={orders}
          activeValue={paymentStatusFilter}
          countBy={(order) => order.paymentStatus}
          onChange={setPaymentStatusFilter}
        />
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-naki-steel bg-naki-frost p-8 text-center shadow-naki-card">
          <Inbox className="mx-auto text-naki-secondary" size={34} />
          <h3 className="mt-4 text-2xl font-black">Belum ada order.</h3>
          <p className="mt-2 text-naki-smoke">
            Saat user mengirim form konsultasi, request akan muncul di sini.
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-lg border border-naki-steel bg-naki-frost p-8 text-center shadow-naki-card">
          <Inbox className="mx-auto text-naki-secondary" size={34} />
          <h3 className="mt-4 text-2xl font-black">
            Tidak ada order di filter ini.
          </h3>
          <p className="mt-2 text-naki-smoke">
            Coba pilih status lain atau refresh daftar order.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredOrders.map((order) => (
            <article
              key={order.id}
              className="rounded-lg border border-naki-steel bg-naki-frost p-3 shadow-naki-card"
            >
              <div className="grid gap-3 xl:grid-cols-[1fr_170px] xl:items-start">
                <div className="min-w-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <p className="w-fit rounded-md bg-naki-steel px-2 py-1 text-xs font-black uppercase text-naki-secondary">
                      #{order.id}
                    </p>
                    <h3 className="min-w-0 flex-1 truncate text-lg font-black leading-tight text-naki-primary">
                      {order.customerName}
                    </h3>
                    <span className="inline-flex h-8 w-fit items-center rounded-md bg-naki-steel px-2.5 text-xs font-black text-naki-primary">
                      {order.projectType}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-5">
                    <OrderMeta label="Kontak" value={order.customerContact} />
                    <OrderMeta label="Template" value={order.templateTitle} />
                    <OrderMeta label="Budget" value={order.budgetRange} />
                    <OrderMeta
                      label="Payment"
                      value={getPaymentStatusLabel(order.paymentStatus)}
                    />
                    <OrderMeta
                      label="Masuk"
                      value={formatOrderDate(order.createdAt)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="grid w-full gap-1 text-xs font-black text-naki-smoke">
                    Status
                    <select
                      className="h-9 rounded-lg border border-naki-steel bg-naki-frost px-2.5 text-xs font-black text-naki-primary outline-none transition focus:border-naki-secondary disabled:cursor-not-allowed disabled:text-naki-smoke"
                      disabled={updatingOrderId === order.id}
                      value={order.status}
                      onChange={(event) =>
                        onUpdateOrderStatus(
                          order.id,
                          event.target.value as OrderStatus,
                        )
                      }
                    >
                      <option value="new">new</option>
                      <option value="contacted">contacted</option>
                      <option value="deal">deal</option>
                      <option value="closed">closed</option>
                    </select>
                  </label>
                  <button
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-naki-steel text-xs font-black text-naki-secondary transition hover:border-naki-smoke disabled:cursor-not-allowed disabled:text-naki-smoke"
                    disabled={updatingOrderId === order.id}
                    onClick={() => onDeleteOrder(order)}
                    type="button"
                  >
                    <Trash2 size={14} />
                    Hapus
                  </button>
                </div>
              </div>

              <div className="mt-2 rounded-lg bg-naki-steel p-2.5">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-naki-primary">
                  <MessageSquareText size={14} />
                  Brief
                </div>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-naki-smoke">
                  {order.message}
                </p>
              </div>
            </article>
          ))}
          <PaginationControls
            page={ordersPage}
            total={ordersMeta.total}
            totalPages={ordersMeta.totalPages}
            pageSize={ordersMeta.pageSize}
            isLoading={isLoadingOrders}
            onPageChange={onOrdersPageChange}
          />
        </div>
      )}
    </section>
  );
}

type OrderMetaProps = {
  label: string;
  value: string;
};

type FilterButtonGroupProps<Value extends string> = {
  filters: Array<{ label: string; value: Value }>;
  orders: OrderItem[];
  activeValue: Value;
  countBy: (order: OrderItem) => string;
  onChange: (value: Value) => void;
};

function FilterButtonGroup<Value extends string>({
  filters,
  orders,
  activeValue,
  countBy,
  onChange,
}: FilterButtonGroupProps<Value>) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const count =
          filter.value === "all"
            ? orders.length
            : orders.filter((order) => countBy(order) === filter.value).length;
        const isActive = activeValue === filter.value;

        return (
          <button
            key={filter.value}
            className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-black transition ${
              isActive
                ? "bg-naki-primary text-naki-frost"
                : "border border-naki-steel text-naki-secondary hover:border-naki-smoke"
            }`}
            onClick={() => onChange(filter.value)}
            type="button"
          >
            {filter.label}
            <span
              className={`rounded-md px-2 py-0.5 text-xs ${
                isActive
                  ? "bg-naki-frost text-naki-primary"
                  : "bg-naki-steel text-naki-primary"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function OrderMeta({ label, value }: OrderMetaProps) {
  return (
    <div className="min-w-0 rounded-md bg-naki-steel p-2">
      <p className="text-[10px] font-black uppercase text-naki-smoke">
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-black text-naki-primary">
        {value}
      </p>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  step?: string;
};

function Field({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  step,
}: FieldProps) {
  return (
    <label className="grid gap-1.5 text-sm font-black">
      {label}
      <input
        className="h-11 w-full rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold outline-none transition focus:border-naki-secondary"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        step={step}
      />
    </label>
  );
}

type TextAreaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
};

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  required = false,
}: TextAreaProps) {
  return (
    <label className="grid gap-1.5 text-sm font-black">
      {label}
      <textarea
        className="resize-y rounded-lg border border-naki-steel bg-naki-frost px-3 py-2 text-sm font-semibold leading-6 outline-none transition focus:border-naki-secondary"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        required={required}
      />
    </label>
  );
}

type SelectOption = string | { label: string; value: string };

type SelectFieldProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
};

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="grid gap-1.5 text-sm font-black">
      {label}
      <select
        className="h-11 w-full rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold outline-none transition focus:border-naki-secondary"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => {
          const optionValue =
            typeof option === "string" ? option : option.value;
          const optionLabel =
            typeof option === "string" ? option : option.label;

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}

type TagSelectorProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

function TagSelector({ label, options, value, onChange }: TagSelectorProps) {
  const selectedItems = splitLines(value);

  function toggleItem(item: string) {
    const nextItems = selectedItems.includes(item)
      ? selectedItems.filter((selectedItem) => selectedItem !== item)
      : [...selectedItems, item];

    onChange(nextItems.join("\n"));
  }

  return (
    <section className="grid gap-2">
      <p className="text-sm font-black">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedItems.includes(option);

          return (
            <button
              key={option}
              className={`inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-black transition ${
                isSelected
                  ? "bg-naki-primary text-naki-frost"
                  : "border border-naki-steel text-naki-secondary hover:border-naki-smoke"
              }`}
              onClick={() => toggleItem(option)}
              type="button"
            >
              {option}
            </button>
          );
        })}
      </div>
      <Field label="Stack custom" value={value} onChange={onChange} />
    </section>
  );
}

type TagInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function TagInput({ label, value, onChange }: TagInputProps) {
  const [draft, setDraft] = useState("");
  const items = splitLines(value);

  function addDraft() {
    const nextItem = draft.trim();

    if (!nextItem) {
      return;
    }

    onChange(appendLines(value, [nextItem]));
    setDraft("");
  }

  function removeItem(item: string) {
    onChange(items.filter((currentItem) => currentItem !== item).join("\n"));
  }

  return (
    <section className="grid gap-2">
      <p className="text-sm font-black">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-naki-steel px-3 text-sm font-black text-naki-primary"
            onClick={() => removeItem(item)}
            type="button"
          >
            {item}
            <X size={14} />
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="h-11 w-full min-w-0 flex-1 rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold outline-none transition focus:border-naki-secondary"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addDraft();
            }
          }}
          type="text"
        />
        <button
          className="inline-flex h-11 items-center justify-center rounded-lg bg-naki-secondary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-primary"
          onClick={addDraft}
          type="button"
        >
          Tambah
        </button>
      </div>
    </section>
  );
}

type ImageUploadDropZoneProps = {
  adminToken: string | null;
  title: string;
  description: string;
  status: string;
  multiple?: boolean;
  uploadLabel?: string;
  onStatusChange: (status: string) => void;
  onUploaded: (imageUrls: string[]) => void;
  successMessage: (imageUrls: string[]) => string;
};

function ImageUploadDropZone({
  adminToken,
  title,
  description,
  status,
  multiple = true,
  uploadLabel = "Upload",
  onStatusChange,
  onUploaded,
  successMessage,
}: ImageUploadDropZoneProps) {
  const [isUploading, setIsUploading] = useState(false);

  async function addFiles(files: File[]) {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const selectedFiles = multiple ? imageFiles : imageFiles.slice(0, 1);

    if (!selectedFiles.length) {
      return;
    }

    setIsUploading(true);
    onStatusChange("Mengupload gambar preview...");

    try {
      const imageUrls = await uploadPreviewImages(selectedFiles, adminToken);

      if (imageUrls.length) {
        onUploaded(imageUrls);
        onStatusChange(successMessage(imageUrls));
      }
    } catch {
      onStatusChange("Gagal memproses gambar. Coba file gambar lain.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="grid gap-2">
      <div
        className="rounded-lg border border-dashed border-naki-steel bg-naki-steel/70 p-5 outline-none transition focus:border-naki-secondary"
        onDrop={(event) => {
          event.preventDefault();

          const files = Array.from(event.dataTransfer.files);

          if (files.length) {
            void addFiles(files);
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onPaste={(event) => {
          void addFiles(Array.from(event.clipboardData.files));
        }}
        tabIndex={0}
      >
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-naki-frost text-naki-secondary">
              <ImagePlus size={20} />
            </span>
            <div>
              <p className="text-sm font-black text-naki-primary">{title}</p>
              <p className="mt-1 text-sm font-semibold text-naki-smoke">
                {description}
              </p>
            </div>
          </div>
          <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-naki-secondary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-primary">
            <UploadCloud size={16} />
            {isUploading ? "Proses..." : uploadLabel}
            <input
              className="sr-only"
              accept="image/*"
              disabled={isUploading}
              multiple={multiple}
              onChange={(event) => {
                void addFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
              type="file"
            />
          </label>
        </div>
      </div>
      <p className="text-sm font-semibold text-naki-smoke">{status}</p>
    </section>
  );
}

type PreviewDropZoneProps = {
  adminToken: string | null;
  value: TemplatePreviewItem[];
  onChange: (value: TemplatePreviewItem[]) => void;
};

function PreviewDropZone({
  adminToken,
  value,
  onChange,
}: PreviewDropZoneProps) {
  const [draggedPreviewIndex, setDraggedPreviewIndex] = useState<number | null>(
    null,
  );
  const [dragOverPreviewIndex, setDragOverPreviewIndex] = useState<
    number | null
  >(null);
  const [uploadStatus, setUploadStatus] = useState(
    "Upload foto, lalu isi caption untuk tiap foto.",
  );

  function updateCaption(index: number, caption: string) {
    onChange(
      value.map((item, currentIndex) =>
        currentIndex === index ? { ...item, caption } : item,
      ),
    );
  }

  function removeItem(index: number) {
    onChange(value.filter((_, currentIndex) => currentIndex !== index));
  }

  function movePreviewItem(fromIndex: number, toIndex: number) {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= value.length ||
      toIndex >= value.length
    ) {
      return;
    }

    onChange(reorderItems(value, fromIndex, toIndex));
    setUploadStatus(
      `Preview ${fromIndex + 1} dipindah ke posisi ${toIndex + 1}.`,
    );
  }

  function handlePreviewDragStart(
    event: React.DragEvent<HTMLElement>,
    index: number,
  ) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
    setDraggedPreviewIndex(index);
    setDragOverPreviewIndex(index);
  }

  function handlePreviewDrop(
    event: React.DragEvent<HTMLDivElement>,
    toIndex: number,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const rawIndex = event.dataTransfer.getData("text/plain");
    const fromIndex =
      draggedPreviewIndex ?? (rawIndex ? Number(rawIndex) : Number.NaN);

    if (!Number.isNaN(fromIndex)) {
      movePreviewItem(fromIndex, toIndex);
    }

    setDraggedPreviewIndex(null);
    setDragOverPreviewIndex(null);
  }

  function canMovePreviewItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    return nextIndex >= 0 && nextIndex < value.length;
  }

  function handlePreviewDragEnd() {
    setDraggedPreviewIndex(null);
    setDragOverPreviewIndex(null);
  }

  return (
    <section className="grid gap-3">
      <p className="text-sm font-black">Preview</p>
      <ImageUploadDropZone
        adminToken={adminToken}
        title="Upload / drop / paste foto preview"
        description="Bisa lebih dari satu gambar. File disimpan sebagai URL, bukan base64."
        status={uploadStatus}
        onStatusChange={setUploadStatus}
        onUploaded={(imageUrls) => {
          onChange([
            ...value,
            ...imageUrls.map((image, index) => ({
              image,
              caption: `Preview ${value.length + index + 1}`,
            })),
          ]);
        }}
        successMessage={(imageUrls) =>
          `${imageUrls.length} foto berhasil diupload. Lengkapi caption-nya.`
        }
      />

      {value.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((item, index) => (
            <div
              key={`${item.image}-${index}`}
              className={`overflow-hidden rounded-lg border bg-naki-frost transition ${
                dragOverPreviewIndex === index &&
                draggedPreviewIndex !== null &&
                draggedPreviewIndex !== index
                  ? "border-naki-secondary shadow-naki-card"
                  : "border-naki-steel"
              } ${
                draggedPreviewIndex === index ? "opacity-70" : "opacity-100"
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = "move";
                setDragOverPreviewIndex(index);
              }}
              onDrop={(event) => handlePreviewDrop(event, index)}
            >
              <div
                className="flex cursor-grab items-center justify-between gap-2 border-b border-naki-steel bg-naki-steel px-3 py-2 active:cursor-grabbing"
                draggable
                onDragEnd={handlePreviewDragEnd}
                onDragStart={(event) => handlePreviewDragStart(event, index)}
                title="Drag untuk mengurutkan gambar dan caption"
              >
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase text-naki-smoke">
                    Posisi {index + 1}
                  </p>
                  <p className="truncate text-sm font-black text-naki-primary">
                    {item.caption || "Belum ada caption"}
                  </p>
                </div>
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-lg border border-naki-steel bg-naki-frost text-naki-secondary"
                  aria-hidden="true"
                >
                  <GripVertical size={17} />
                </span>
              </div>
              {item.image ? (
                <img
                  className="h-36 w-full cursor-grab object-cover active:cursor-grabbing"
                  draggable
                  onDragEnd={handlePreviewDragEnd}
                  onDragStart={(event) => handlePreviewDragStart(event, index)}
                  src={item.image}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  loading="lazy"
                  decoding="async"
                  alt={item.caption || "Preview template"}
                  title="Drag gambar untuk mengurutkan"
                />
              ) : (
                <div
                  className="grid h-36 cursor-grab place-items-center bg-naki-steel text-sm font-black text-naki-smoke active:cursor-grabbing"
                  draggable
                  onDragEnd={handlePreviewDragEnd}
                  onDragStart={(event) => handlePreviewDragStart(event, index)}
                  title="Drag untuk mengurutkan"
                >
                  Belum ada foto
                </div>
              )}
              <div className="grid gap-2 border-t border-naki-steel p-3">
                <label className="grid gap-1 text-xs font-black text-naki-primary">
                  Caption foto
                  <input
                    className="h-10 rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold outline-none transition focus:border-naki-secondary"
                    value={item.caption}
                    onChange={(event) =>
                      updateCaption(index, event.target.value)
                    }
                    placeholder="Contoh: Tampilan homepage"
                    type="text"
                  />
                </label>
              </div>
              <div className="grid grid-cols-3 border-t border-naki-steel">
                <button
                  className="flex h-10 items-center justify-center gap-1 border-r border-naki-steel text-xs font-black text-naki-secondary transition hover:bg-naki-steel disabled:cursor-not-allowed disabled:text-naki-smoke"
                  disabled={!canMovePreviewItem(index, -1)}
                  onClick={() => movePreviewItem(index, index - 1)}
                  type="button"
                >
                  <ArrowUp size={14} />
                  Naik
                </button>
                <button
                  className="flex h-10 items-center justify-center gap-1 border-r border-naki-steel text-xs font-black text-naki-secondary transition hover:bg-naki-steel disabled:cursor-not-allowed disabled:text-naki-smoke"
                  disabled={!canMovePreviewItem(index, 1)}
                  onClick={() => movePreviewItem(index, index + 1)}
                  type="button"
                >
                  <ArrowDown size={14} />
                  Turun
                </button>
                <button
                  className="flex h-10 items-center justify-center gap-1 text-xs font-black text-naki-secondary transition hover:bg-naki-steel hover:text-naki-primary"
                  onClick={() => removeItem(index)}
                  type="button"
                >
                  <X size={14} />
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

type SourceCodeUploadProps = {
  value: string;
  onChange: (value: string) => void;
};

function SourceCodeUpload({ value, onChange }: SourceCodeUploadProps) {
  function addSourceFiles(files: File[]) {
    const packageItems = files
      .filter((file) => /\.(zip|rar)$/i.test(file.name))
      .map(
        (file) => `Source package: ${file.name} (${formatFileSize(file.size)})`,
      );

    if (packageItems.length) {
      onChange(appendLines(value, packageItems));
    }
  }

  return (
    <section className="grid gap-3">
      <div className="flex flex-col justify-between gap-3 rounded-lg border border-naki-steel bg-naki-frost p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-naki-steel text-naki-secondary">
            <FileArchive size={20} />
          </span>
          <div>
            <p className="text-sm font-black">Source code</p>
            <p className="mt-1 text-sm font-semibold text-naki-smoke">
              ZIP atau RAR codingan.
            </p>
          </div>
        </div>
        <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-naki-secondary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-primary">
          <UploadCloud size={16} />
          Upload
          <input
            className="sr-only"
            accept=".zip,.rar,application/zip,application/x-rar-compressed"
            multiple
            onChange={(event) => {
              addSourceFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
            type="file"
          />
        </label>
      </div>
      <TagInput label="Isi source code" value={value} onChange={onChange} />
    </section>
  );
}

function templateToForm(template: TemplateItem): TemplateFormState {
  return {
    id: template.id,
    slug: template.slug,
    title: template.title,
    category: template.category,
    description: template.description,
    price: template.price,
    stack: template.stack.join("\n"),
    level: template.level,
    accentClass: template.accentClass,
    preview: template.preview,
    demoUrl: template.demoUrl,
    features: template.features.join("\n"),
    includedFiles: template.includedFiles.join("\n"),
    suitableFor: template.suitableFor.join("\n"),
    license: template.license,
    support: template.support,
  };
}

function formToPayload(
  form: TemplateFormState,
): Omit<TemplateItem, "id" | "rating" | "buyerCount" | "reviews"> {
  return {
    slug: form.slug || slugify(form.title),
    title: form.title.trim(),
    category: form.category,
    description: form.description.trim(),
    price: form.price.trim(),
    stack: splitLines(form.stack),
    level: form.level.trim(),
    accentClass: form.accentClass.trim() || "bg-naki-secondary",
    preview: form.preview.filter((item) => item.image || item.caption.trim()),
    demoUrl: form.demoUrl.trim() || "#",
    features: splitLines(form.features),
    includedFiles: splitLines(form.includedFiles),
    suitableFor: splitLines(form.suitableFor),
    license: form.license.trim(),
    support: form.support.trim(),
  };
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function appendLines(currentValue: string, nextItems: string[]) {
  return Array.from(new Set([...splitLines(currentValue), ...nextItems]))
    .filter(Boolean)
    .join("\n");
}

async function uploadPreviewImages(files: File[], adminToken: string | null) {
  if (!adminToken) {
    throw new Error("Admin token tidak tersedia.");
  }

  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  const response = await fetch(getApiUrl("/api/uploads/images"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Upload preview gagal.");
  }

  const data = (await response.json()) as {
    images?: Array<{ url: string }>;
  };

  return data.images?.map((image) => image.url).filter(Boolean) ?? [];
}

function reorderItems<Item>(items: Item[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (movedItem === undefined) {
    return items;
  }

  nextItems.splice(toIndex, 0, movedItem);

  return nextItems;
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function formatOrderDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
