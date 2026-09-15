import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  Check,
  CircleCheckBig,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  CreditCard,
  ExternalLink,
  Inbox,
  Hammer,
  LayoutGrid,
  PackageOpen,
  Paperclip,
  RefreshCw,
  Send,
  Star,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  apiGet,
  apiPost,
  apiUpload,
  getApiErrorMessage,
  getApiErrorStatus,
} from "../services/api-client";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { PaginationControls } from "../components/ui/PaginationControls";
import { OrderCardSkeletonGrid } from "../components/ui/skeletons/ProfileSkeleton";
import { PaymentDeadline } from "../components/payment/PaymentDeadline";
import type { TemplateItem } from "../domain/content";
import {
  canConfirmPaymentManually,
  canRateOrder,
  canStartOrderCheckout,
  getOrderPaymentActionLabel,
  getPaymentMethodLabel,
  getOrderStatusLabel,
  getOrderTypeLabel,
  getPaymentStatusLabel,
  getWaitingPaymentMessage,
  type OrderItem,
  type OrdersResponse,
} from "../domain/order-types";
import {
  userSessionEvent,
  userTokenKey,
  userUsernameKey,
} from "../utils/user-session";

type MyOrdersPageProps = {
  onTemplateUpdate: (template: TemplateItem) => void;
};

type RatingFormState = {
  rating: string;
  message: string;
};

type RatingResponse = {
  template?: TemplateItem;
};
type RevisionFormState = { notes: string; files: File[] };

type OrdersPaymentMenu =
  | "all"
  | "work"
  | "waiting_payment"
  | "unpaid"
  | "cancelled"
  | "review"
  | "balance"
  | "completed";

const defaultRatingForm: RatingFormState = {
  rating: "5",
  message: "",
};
const maxRevisionFileSize = 20 * 1024 * 1024;
const ordersPageSize = 6;
const orderPaymentMenus: Array<{
  value: OrdersPaymentMenu;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    value: "all",
    label: "Semua",
    description: "Seluruh progres pesanan.",
    icon: LayoutGrid,
  },
  {
    value: "unpaid",
    label: "Belum lunas",
    description: "Belum bayar, gagal, kedaluwarsa, atau baru membayar DP.",
    icon: CircleDollarSign,
  },
  {
    value: "waiting_payment",
    label: "Menunggu pembayaran",
    description: "Sudah punya instruksi bayar.",
    icon: Clock3,
  },
  {
    value: "work",
    label: "Pengerjaan",
    description: "Pesanan sedang dikerjakan, termasuk permintaan revisi.",
    icon: Hammer,
  },
  {
    value: "review",
    label: "Review",
    description: "Hasil siap diperiksa.",
    icon: ClipboardCheck,
  },
  {
    value: "balance",
    label: "Pelunasan",
    description: "Sisa pembayaran tersedia.",
    icon: CreditCard,
  },
  {
    value: "completed",
    label: "Selesai",
    description: "Pesanan sudah dituntaskan.",
    icon: CircleCheckBig,
  },
  {
    value: "cancelled",
    label: "Dibatalkan",
    description: "Order atau transaksi yang dibatalkan.",
    icon: Ban,
  },
];

function getPaymentStatusBadgeClass(paymentStatus: string): string {
  switch (paymentStatus) {
    case "paid":
      return "bg-emerald-100 text-emerald-700";
    case "waiting_payment":
      return "bg-amber-100 text-amber-700";
    case "pending":
      return "bg-blue-100 text-blue-700";
    case "failed":
      return "bg-red-100 text-red-700";
    case "expired":
      return "bg-amber-100 text-amber-700";
    case "cancelled":
      return "bg-naki-steel text-naki-smoke";
    case "partial_paid":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-naki-frost text-naki-smoke";
  }
}

export function MyOrdersPage({ onTemplateUpdate }: MyOrdersPageProps) {
  const [userToken, setUserToken] = useState(() =>
    window.localStorage.getItem(userTokenKey),
  );
  const [userUsername, setUserUsername] = useState(
    () => window.localStorage.getItem(userUsernameKey) ?? "",
  );
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersMeta, setOrdersMeta] = useState({
    total: 0,
    totalPages: 1,
    pageSize: ordersPageSize,
  });
  const [activePaymentMenu, setActivePaymentMenu] =
    useState<OrdersPaymentMenu>("all");
  const [status, setStatus] = useState("Memuat pesanan...");
  const [isLoading, setIsLoading] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(
    null,
  );
  const [ratingForms, setRatingForms] = useState<
    Record<number, RatingFormState>
  >({});
  const [ratedOrderIds, setRatedOrderIds] = useState<number[]>([]);
  const [revisionForms, setRevisionForms] = useState<
    Record<number, RevisionFormState>
  >({});

  const loadOrders = useCallback(
    async (page = ordersPage, options: { silent?: boolean } = {}) => {
      if (!userToken) {
        setOrders([]);
        setOrdersMeta({
          total: 0,
          totalPages: 1,
          pageSize: ordersPageSize,
        });
        setStatus("Login user diperlukan untuk melihat pesanan.");
        return;
      }

      if (!options.silent) {
        setIsLoading(true);
        setStatus("Memuat pesanan saya...");
      }

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(ordersPageSize),
        });
        if (activePaymentMenu !== "all") {
          params.set("paymentStatus", activePaymentMenu);
        }
        const data = await apiGet<OrdersResponse>(
          `/api/orders/my?${params.toString()}`,
        );
        setOrders(data.orders ?? []);
        setOrdersPage(data.page ?? page);
        setOrdersMeta({
          total: data.total ?? data.orders?.length ?? 0,
          totalPages: data.totalPages ?? 1,
          pageSize: data.pageSize ?? ordersPageSize,
        });
        setStatus(
          data.total
            ? `${data.total} pesanan ${getPaymentMenuLabel(activePaymentMenu).toLowerCase()} ditemukan.`
            : getEmptyOrdersMessage(activePaymentMenu),
        );
      } catch {
        if (!options.silent) {
          setStatus("Gagal memuat pesanan. Pastikan backend aktif.");
        }
      } finally {
        if (!options.silent) setIsLoading(false);
      }
    },
    [activePaymentMenu, ordersPage, userToken],
  );

  useEffect(() => {
    function syncUserSession() {
      setUserToken(window.localStorage.getItem(userTokenKey));
      setUserUsername(window.localStorage.getItem(userUsernameKey) ?? "");
    }

    window.addEventListener(userSessionEvent, syncUserSession);
    window.addEventListener("storage", syncUserSession);

    return () => {
      window.removeEventListener(userSessionEvent, syncUserSession);
      window.removeEventListener("storage", syncUserSession);
    };
  }, []);

  useEffect(() => {
    void loadOrders(ordersPage);
  }, [loadOrders, ordersPage]);

  useEffect(() => {
    if (!orders.some((order) => order.paymentStatus === "waiting_payment")) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadOrders(ordersPage, { silent: true });
    }, 15_000);
    return () => window.clearInterval(intervalId);
  }, [loadOrders, orders, ordersPage]);

  function updateOrder(nextOrder: OrderItem) {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === nextOrder.id ? nextOrder : order,
      ),
    );
  }

  function updateRatingForm(orderId: number, nextForm: RatingFormState) {
    setRatingForms((currentForms) => ({
      ...currentForms,
      [orderId]: nextForm,
    }));
  }

  function selectRevisionFiles(orderId: number, fileList: FileList | null) {
    const selectedFiles = Array.from(fileList ?? []);
    if (selectedFiles.length > 5) {
      setStatus("Maksimal 5 lampiran untuk satu permintaan revisi.");
      return;
    }
    if (selectedFiles.some((file) => file.size > maxRevisionFileSize)) {
      setStatus("Ukuran setiap lampiran maksimal 20 MB.");
      return;
    }
    setRevisionForms((current) => ({
      ...current,
      [orderId]: {
        ...(current[orderId] ?? { notes: "", files: [] }),
        files: selectedFiles,
      },
    }));
  }

  function selectPaymentMenu(nextMenu: OrdersPaymentMenu) {
    setActivePaymentMenu(nextMenu);
    setOrdersPage(1);
  }

  async function confirmPayment(orderId: number) {
    if (!userToken) {
      setStatus("Login user diperlukan untuk konfirmasi pembayaran.");
      return;
    }

    setProcessingOrderId(orderId);
    setStatus("Mengonfirmasi pembayaran...");

    try {
      const data = await apiPost<{ order: OrderItem }>(
        `/api/orders/${orderId}/payment/confirm`,
      );
      updateOrder(data.order);
      setStatus(`Pembayaran order #${orderId} berhasil. Rating sudah terbuka.`);
    } catch {
      setStatus("Gagal konfirmasi pembayaran. Coba lagi sebentar.");
    } finally {
      setProcessingOrderId(null);
    }
  }

  async function respondToQuote(
    orderId: number,
    decision: "accepted" | "rejected",
  ) {
    if (!userToken) return;
    setProcessingOrderId(orderId);
    setStatus(
      decision === "accepted"
        ? "Menyetujui penawaran..."
        : "Menolak penawaran...",
    );

    try {
      const data = await apiPost<{ order: OrderItem }>(
        `/api/orders/${orderId}/quote/respond`,
        { decision },
      );
      updateOrder(data.order);
      setStatus(
        decision === "accepted"
          ? `Penawaran order #${orderId} disetujui. Checkout sudah tersedia.`
          : `Penawaran order #${orderId} ditolak dan akan ditinjau kembali.`,
      );
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Gagal merespons penawaran harga."));
    } finally {
      setProcessingOrderId(null);
    }
  }

  async function respondToDelivery(
    order: OrderItem,
    decision: "approved" | "revision_requested",
  ) {
    const form = revisionForms[order.id] ?? { notes: "", files: [] };
    if (decision === "revision_requested" && form.notes.trim().length < 3) {
      setStatus("Catatan revisi minimal 3 karakter.");
      return;
    }
    setProcessingOrderId(order.id);
    setStatus(
      decision === "approved"
        ? "Menyetujui hasil pekerjaan..."
        : "Mengirim permintaan revisi...",
    );
    try {
      let files: string[] = [];
      if (decision === "revision_requested" && form.files.length > 0) {
        const formData = new FormData();
        form.files.forEach((file) => formData.append("files", file));
        const uploaded = await apiUpload<{
          files: Array<{ url: string }>;
        }>("/api/uploads/revisions", formData);
        files = uploaded.files.map((file) => file.url);
      }
      const data = await apiPost<{ order: OrderItem }>(
        `/api/orders/${order.id}/delivery/respond`,
        decision === "approved"
          ? { decision }
          : { decision, notes: form.notes.trim(), files },
      );
      updateOrder(data.order);
      setStatus(
        decision === "approved"
          ? "Hasil disetujui. Pelunasan sekarang tersedia."
          : "Permintaan revisi berhasil dikirim.",
      );
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Gagal menyimpan respons hasil."));
    } finally {
      setProcessingOrderId(null);
    }
  }

  async function submitRating(order: OrderItem) {
    if (!userToken || !order.templateId) {
      setStatus("Order ini belum bisa diberi rating.");
      return;
    }

    const form = ratingForms[order.id] ?? defaultRatingForm;
    setProcessingOrderId(order.id);
    setStatus("Menyimpan rating...");

    try {
      const data = await apiPost<RatingResponse>(
        `/api/designs/${order.templateId}/rating`,
        form,
      );

      if (data.template) {
        onTemplateUpdate(data.template);
      }

      setRatedOrderIds((currentIds) => [...currentIds, order.id]);
      setStatus(`Rating design ${order.templateTitle} tersimpan.`);
    } catch (error) {
      if (getApiErrorStatus(error) === 409) {
        setRatedOrderIds((currentIds) => [...currentIds, order.id]);
        setStatus("Rating untuk design ini sudah pernah dikirim.");
        return;
      }

      setStatus(
        getApiErrorMessage(
          error,
          "Gagal menyimpan rating. Pastikan pesanan sudah selesai.",
        ),
      );
    } finally {
      setProcessingOrderId(null);
    }
  }

  return (
    <main className="naki-frosted-grid min-h-screen bg-naki-page-bg text-naki-primary">
      <Header />

      <section className="w-full px-5 py-10 md:px-8 xl:px-12 2xl:px-16">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-naki-secondary transition hover:opacity-80"
          to="/"
        >
          <ArrowLeft size={16} />
          Kembali ke storefront
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-medium uppercase text-naki-smoke">
              Akun {userUsername || "user"}
            </p>
            <h1 className="mt-1 text-3xl font-bold leading-tight md:text-4xl">
              Pesanan saya
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-naki-smoke leading-relaxed">
              Lacak pengerjaan, review, pembayaran, dan beri rating setelah
              pesanan selesai.
            </p>
          </div>
          <button
            className="naki-orders-secondary-action inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-4 text-sm font-medium text-naki-primary transition hover:bg-naki-frost disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || !userToken}
            onClick={() => void loadOrders(ordersPage)}
            type="button"
          >
            <RefreshCw size={16} />
            {isLoading ? "Memuat..." : "Refresh"}
          </button>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-naki-secondary" />
          <p className="text-sm font-medium text-naki-smoke">{status}</p>
        </div>

        {!userToken ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-naki-frost">
              <Inbox className="text-naki-secondary" size={28} />
            </div>
            <h2 className="text-xl font-bold">Login dulu.</h2>
            <p className="mt-2 text-sm text-naki-smoke">
              Pesanan hanya bisa dilihat oleh akun pembeli.
            </p>
            <Link
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-naki-primary px-5 text-sm font-semibold text-white transition hover:opacity-90"
              to="/login?next=%2Fpesanan-saya"
            >
              Login user
            </Link>
          </div>
        ) : (
          <>
            <nav
              aria-label="Filter progres pesanan"
              className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm"
            >
              <div className="flex snap-x snap-mandatory gap-1.5 overflow-x-auto p-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
                {orderPaymentMenus.map((menu) => {
                  const isActive = activePaymentMenu === menu.value;
                  const MenuIcon = menu.icon;

                  return (
                    <button
                      key={menu.value}
                      aria-pressed={isActive}
                      className={`group flex min-h-12 shrink-0 snap-start items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naki-secondary focus-visible:ring-offset-2 sm:min-w-0 ${
                        isActive
                          ? "bg-naki-primary text-white shadow-sm"
                          : "naki-orders-filter-action bg-white text-naki-primary hover:bg-naki-frost"
                      }`}
                      onClick={() => selectPaymentMenu(menu.value)}
                      type="button"
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                          isActive
                            ? "bg-white/15 text-white"
                            : "bg-naki-frost text-naki-secondary group-hover:bg-white"
                        }`}
                      >
                        <MenuIcon size={16} strokeWidth={2} />
                      </span>
                      <span className="whitespace-nowrap text-sm font-semibold sm:whitespace-normal">
                        {menu.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 border-t border-naki-steel px-4 py-2.5 text-xs text-naki-smoke">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-naki-secondary"
                />
                <p>
                  <span className="font-semibold text-naki-primary">
                    {getPaymentMenuLabel(activePaymentMenu)}:
                  </span>{" "}
                  {getPaymentMenuDescription(activePaymentMenu)}
                </p>
              </div>
            </nav>

            {isLoading ? (
              <div className="mt-8">
                <OrderCardSkeletonGrid count={3} />
              </div>
            ) : orders.length === 0 ? (
              <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-naki-frost">
                  <Inbox className="text-naki-secondary" size={28} />
                </div>
                <h2 className="text-xl font-bold">
                  {getEmptyOrdersTitle(activePaymentMenu)}
                </h2>
                <p className="mt-2 text-sm text-naki-smoke">
                  {getEmptyOrdersMessage(activePaymentMenu)}
                </p>
                <Link
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-naki-primary px-5 text-sm font-semibold text-white transition hover:opacity-90"
                  to="/#template"
                >
                  Cari design
                </Link>
              </div>
            ) : (
              <div className="mt-8 grid w-full gap-4">
                {orders.map((order) => {
                  const form = ratingForms[order.id] ?? defaultRatingForm;
                  const isProcessing = processingOrderId === order.id;
                  const isRated = ratedOrderIds.includes(order.id);
                  const quoteStatus =
                    order.quoteStatus ?? (order.quoteAmount ? "pending" : null);
                  const isPaymentRetry = [
                    "failed",
                    "expired",
                    "cancelled",
                  ].includes(order.paymentStatus);
                  const canCheckout = canStartOrderCheckout(order);

                  return (
                    <article
                      key={order.id}
                      className="rounded-2xl bg-white p-4 shadow-sm sm:p-5"
                    >
                      <div className="min-w-0">
                        <div className="min-w-0">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                            <span className="w-fit rounded-lg bg-naki-frost px-2.5 py-1 text-xs font-semibold text-naki-smoke">
                              #{order.id}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h2 className="truncate text-lg font-semibold leading-tight">
                                {order.templateTitle}
                              </h2>
                            </div>
                            <span
                              className={`inline-flex h-7 w-fit items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ${getPaymentStatusBadgeClass(order.paymentStatus)}`}
                            >
                              <CreditCard size={13} />
                              {getPaymentStatusLabel(order.paymentStatus)}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            <OrderInfo
                              label="Jenis transaksi"
                              value={getOrderTypeLabel(order)}
                            />
                            <OrderInfo
                              label="Budget"
                              value={order.budgetRange}
                            />
                            <OrderInfo
                              label="Status order"
                              value={getOrderStatusLabel(order.status)}
                            />
                            <OrderInfo
                              label="Tanggal"
                              value={formatOrderDate(order.createdAt)}
                            />
                          </div>
                        </div>

                        <div
                          className={`naki-orders-commerce-grid mt-4 grid items-start gap-4 ${
                            order.quoteAmount
                              ? "xl:grid-cols-[minmax(0,1fr)_minmax(320px,390px)]"
                              : "xl:justify-items-end"
                          }`}
                        >
                          {order.quoteAmount ? (
                            <section className="naki-orders-detail-surface w-full rounded-xl border border-naki-steel bg-naki-frost p-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-naki-secondary">
                                    Penawaran harga
                                  </p>
                                  <p className="mt-1 text-xl font-bold text-naki-primary">
                                    {formatRupiah(order.quoteAmount)}
                                  </p>
                                  <p className="mt-1 text-sm font-medium text-naki-smoke">
                                    DP {order.depositPercent}% · Pembayaran awal{" "}
                                    {formatRupiah(
                                      Math.round(
                                        order.quoteAmount *
                                          (order.depositPercent / 100),
                                      ),
                                    )}
                                  </p>
                                  {order.quoteNotes ? (
                                    <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-naki-smoke">
                                      {order.quoteNotes}
                                    </p>
                                  ) : null}
                                  {order.quoteSentAt ? (
                                    <p className="mt-2 text-xs text-naki-smoke">
                                      Dikirim{" "}
                                      {formatOrderDate(order.quoteSentAt)}
                                    </p>
                                  ) : null}
                                </div>
                                <QuoteStatus status={quoteStatus} />
                              </div>
                              {quoteStatus === "pending" ? (
                                <div className="mt-4 flex flex-col gap-2 border-t border-naki-steel pt-4 sm:flex-row">
                                  <button
                                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
                                    disabled={processingOrderId === order.id}
                                    onClick={() =>
                                      void respondToQuote(order.id, "accepted")
                                    }
                                    type="button"
                                  >
                                    <Check size={16} />
                                    Setujui penawaran
                                  </button>
                                  <button
                                    className="naki-orders-danger-action inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 disabled:opacity-50 sm:w-auto"
                                    disabled={processingOrderId === order.id}
                                    onClick={() =>
                                      void respondToQuote(order.id, "rejected")
                                    }
                                    type="button"
                                  >
                                    <X size={16} />
                                    Tolak
                                  </button>
                                </div>
                              ) : null}
                              {order.amountPaid > 0 ? (
                                <div className="mt-4 grid gap-2 border-t border-naki-steel pt-4 sm:grid-cols-2">
                                  <OrderInfo
                                    label="Sudah dibayar"
                                    value={formatRupiah(order.amountPaid)}
                                  />
                                  <OrderInfo
                                    label="Sisa pelunasan"
                                    value={formatRupiah(order.remainingAmount)}
                                  />
                                </div>
                              ) : null}
                            </section>
                          ) : null}

                          <div
                            className={`naki-orders-detail-surface w-full rounded-xl bg-naki-frost p-4 ${
                              order.quoteAmount ? "" : "xl:max-w-[390px]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-sm font-semibold text-naki-primary">
                                <Clock3 size={15} />
                                Pembayaran
                              </div>
                              {order.paymentMethod ? (
                                <span className="truncate text-xs font-medium text-naki-smoke">
                                  {getPaymentMethodLabel(order.paymentMethod)}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-naki-smoke">
                              {order.status === "cancelled"
                                ? "Order ini telah dibatalkan. Hubungi admin jika ingin mengaktifkannya kembali."
                                : order.paymentStatus === "paid"
                                  ? `Lunas${order.paidAt ? ` pada ${formatOrderDate(order.paidAt)}` : ""}.`
                                  : order.paymentStatus === "partial_paid"
                                    ? order.status === "awaiting_balance"
                                      ? `Hasil sudah disetujui. Bayar sisa ${formatRupiah(order.remainingAmount)} untuk menyelesaikan order.`
                                      : `DP ${formatRupiah(order.amountPaid)} sudah diterima. Proyek sedang diproses; pelunasan dibuka setelah hasil disetujui.`
                                    : order.paymentStatus === "expired"
                                      ? "Waktu pembayaran sebelumnya sudah habis. Buat pembayaran baru untuk mendapatkan instruksi dan batas waktu baru."
                                      : order.paymentStatus === "failed"
                                        ? `${order.paymentFailureReason || "Pembayaran sebelumnya gagal."} Kamu dapat mencoba pembayaran lagi.`
                                        : order.paymentStatus === "cancelled"
                                          ? "Pembayaran sebelumnya dibatalkan. Kamu dapat membuat pembayaran baru."
                                          : quoteStatus === "pending"
                                            ? "Tinjau dan setujui penawaran sebelum membuka checkout."
                                            : quoteStatus === "rejected"
                                              ? "Penawaran ditolak. Tim NAKI Code akan mengirim revisi penawaran."
                                              : order.paymentStatus ===
                                                  "waiting_payment"
                                                ? getWaitingPaymentMessage(
                                                    order,
                                                  )
                                                : "Klik bayar sekarang untuk membuat instruksi pembayaran."}
                            </p>
                            {["waiting_payment", "expired"].includes(
                              order.paymentStatus,
                            ) ? (
                              <PaymentDeadline
                                expiresAt={order.paymentExpiresAt}
                                onExpire={() =>
                                  setOrders((current) =>
                                    current.map((item) =>
                                      item.id === order.id
                                        ? {
                                            ...item,
                                            paymentStatus: "expired",
                                            paymentUrl: null,
                                            paymentFailureReason:
                                              "Waktu pembayaran kedaluwarsa",
                                          }
                                        : item,
                                    ),
                                  )
                                }
                              />
                            ) : null}
                            {order.paymentReference ? (
                              <div className="naki-orders-detail-inset mt-2 rounded-lg bg-white px-3 py-1.5">
                                <span className="font-mono text-xs font-medium text-naki-primary">
                                  Ref: {order.paymentReference}
                                </span>
                              </div>
                            ) : null}
                            <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap">
                              {canCheckout ? (
                                <Link
                                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-naki-secondary px-3 text-xs font-semibold text-white transition hover:bg-naki-primary sm:w-auto"
                                  to={`/checkout/${order.id}`}
                                >
                                  {isPaymentRetry ? (
                                    <RefreshCw size={14} />
                                  ) : (
                                    <CreditCard size={14} />
                                  )}
                                  {getOrderPaymentActionLabel(order)}
                                </Link>
                              ) : null}
                              {isPaymentRetry && !canCheckout ? (
                                <span
                                  className="inline-flex min-h-9 items-center rounded-xl border border-naki-steel bg-white px-3 text-xs font-medium leading-5 text-naki-smoke"
                                  title={getPaymentRetryUnavailableReason(
                                    order,
                                  )}
                                >
                                  {getPaymentRetryUnavailableReason(order)}
                                </span>
                              ) : null}
                              {order.paymentUrl ? (
                                <a
                                  className="naki-orders-secondary-action inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-3 text-xs font-medium text-naki-primary transition hover:bg-naki-frost sm:w-auto"
                                  href={order.paymentUrl}
                                  rel="noreferrer"
                                  target={
                                    order.paymentUrl.startsWith("http")
                                      ? "_blank"
                                      : undefined
                                  }
                                >
                                  Buka halaman bayar
                                  <ExternalLink size={14} />
                                </a>
                              ) : null}
                              {order.paymentStatus === "waiting_payment" ? (
                                <>
                                  <Link
                                    className="naki-orders-secondary-action inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-3 text-xs font-medium text-naki-primary transition hover:bg-naki-frost sm:w-auto"
                                    to={`/checkout/${order.id}`}
                                  >
                                    <CreditCard size={14} />
                                    Lihat checkout
                                  </Link>
                                  {canConfirmPaymentManually(order) ? (
                                    <button
                                      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-naki-primary px-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                      disabled={isProcessing}
                                      onClick={() =>
                                        void confirmPayment(order.id)
                                      }
                                      type="button"
                                    >
                                      <BadgeCheck size={14} />
                                      {isProcessing
                                        ? "Mengonfirmasi..."
                                        : "Konfirmasi dev"}
                                    </button>
                                  ) : null}
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>

                      {order.orderType === "custom_project" &&
                      (order.deliveryDemoUrl || order.deliverySourceUrl) ? (
                        <section className="naki-orders-detail-surface mt-4 rounded-xl border border-naki-steel bg-naki-frost p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-naki-secondary">
                                Hasil pekerjaan
                              </p>
                              <p className="mt-1 text-sm leading-relaxed text-naki-smoke">
                                {order.deliveryNotes ||
                                  "Silakan periksa hasil yang dikirim oleh tim NAKI Code."}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {order.deliveryDemoUrl ? (
                                <a
                                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-naki-primary px-3 text-xs font-semibold text-white"
                                  href={order.deliveryDemoUrl}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  Buka demo <ExternalLink size={13} />
                                </a>
                              ) : null}
                            </div>
                          </div>

                          {order.deliverySourceUrl &&
                          ["completed", "closed"].includes(order.status) ? (
                            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                  Source code final
                                </p>
                                <p className="mt-1 text-sm text-emerald-800">
                                  Pembayaran sudah lunas. Paket final siap
                                  diunduh.
                                </p>
                              </div>
                              <a
                                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
                                href={order.deliverySourceUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                Unduh source final <PackageOpen size={14} />
                              </a>
                            </div>
                          ) : order.finalSourceReady ? (
                            <div className="mt-4 flex items-start gap-2 rounded-xl border border-naki-steel bg-white p-3 text-sm text-naki-smoke">
                              <PackageOpen
                                className="mt-0.5 shrink-0 text-naki-secondary"
                                size={16}
                              />
                              <p>
                                Source code final sudah diamankan. Akses unduh
                                terbuka setelah hasil disetujui dan seluruh
                                pembayaran lunas.
                              </p>
                            </div>
                          ) : null}

                          {order.status === "delivered" &&
                          order.deliveryReviewStatus === "pending" ? (
                            <div className="mt-4 grid gap-3 border-t border-naki-steel pt-4 lg:grid-cols-[1fr_auto]">
                              <div className="grid gap-2">
                                <textarea
                                  aria-label="Catatan revisi"
                                  className="min-h-24 resize-y rounded-xl border border-naki-steel bg-white px-3 py-2 text-sm text-naki-primary outline-none focus:border-naki-secondary"
                                  onChange={(event) =>
                                    setRevisionForms((current) => ({
                                      ...current,
                                      [order.id]: {
                                        ...(current[order.id] ?? {
                                          notes: "",
                                          files: [],
                                        }),
                                        notes: event.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="Tulis bagian yang perlu direvisi..."
                                  value={revisionForms[order.id]?.notes ?? ""}
                                />
                                <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-naki-steel bg-white px-3 text-xs font-medium text-naki-smoke">
                                  <Paperclip size={14} />
                                  <span>
                                    {revisionForms[order.id]?.files.length
                                      ? `${revisionForms[order.id].files.length} file dipilih`
                                      : "Lampirkan file (maks. 5 × 20 MB)"}
                                  </span>
                                  <input
                                    accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.md,.zip,.rar,.7z"
                                    className="sr-only"
                                    multiple
                                    onChange={(event) =>
                                      selectRevisionFiles(
                                        order.id,
                                        event.target.files,
                                      )
                                    }
                                    type="file"
                                  />
                                </label>
                                {revisionForms[order.id]?.files.length ? (
                                  <ul className="grid gap-1 text-xs text-naki-smoke">
                                    {revisionForms[order.id].files.map(
                                      (file) => (
                                        <li
                                          className="truncate"
                                          key={`${file.name}-${file.size}`}
                                        >
                                          {file.name} ·{" "}
                                          {formatFileSize(file.size)}
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                ) : null}
                              </div>
                              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                                <button
                                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
                                  disabled={
                                    isProcessing || !order.finalSourceReady
                                  }
                                  onClick={() =>
                                    void respondToDelivery(order, "approved")
                                  }
                                  title={
                                    order.finalSourceReady
                                      ? undefined
                                      : "Admin perlu melengkapi source code final sebelum hasil dapat disetujui."
                                  }
                                  type="button"
                                >
                                  <Check size={15} /> Approve hasil
                                </button>
                                <button
                                  className="naki-orders-secondary-action inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-4 text-sm font-semibold text-naki-primary disabled:opacity-50"
                                  disabled={isProcessing}
                                  onClick={() =>
                                    void respondToDelivery(
                                      order,
                                      "revision_requested",
                                    )
                                  }
                                  type="button"
                                >
                                  <RefreshCw size={15} /> Minta revisi
                                </button>
                              </div>
                              {!order.finalSourceReady ? (
                                <p className="text-xs font-medium text-red-600 lg:col-span-2">
                                  Source code final belum tersedia. Admin perlu
                                  melengkapinya sebelum hasil dapat di-approve.
                                </p>
                              ) : null}
                            </div>
                          ) : null}
                          {order.revisionNotes ? (
                            <div className="mt-3 rounded-xl bg-white p-3 text-sm text-naki-smoke">
                              <span className="font-semibold text-naki-primary">
                                Catatan revisi:{" "}
                              </span>
                              {order.revisionNotes}
                              {order.revisionFiles.length ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {order.revisionFiles.map((file, index) => (
                                    <a
                                      key={file}
                                      className="text-xs font-semibold text-naki-secondary underline"
                                      href={file}
                                      rel="noreferrer"
                                      target="_blank"
                                    >
                                      {getAttachmentLabel(file, index)}
                                    </a>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </section>
                      ) : null}

                      {order.deliveryStatus === "available" ? (
                        <section className="naki-orders-detail-surface mt-4 rounded-xl bg-naki-frost p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-naki-secondary">
                            <PackageOpen
                              className="text-naki-secondary"
                              size={16}
                            />
                            Source code & panduan
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-start">
                            {order.sourceCodeItems.length > 0 ? (
                              <div className="rounded-lg bg-white p-3">
                                <p className="text-xs font-medium uppercase text-naki-smoke">
                                  Paket source
                                </p>
                                <ul className="mt-1.5 grid gap-0.5 text-sm text-naki-smoke">
                                  {order.sourceCodeItems.map((item) => (
                                    <li key={item}>- {item}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                            {order.setupGuide ? (
                              <div className="rounded-lg bg-white p-3">
                                <p className="text-xs font-medium uppercase text-naki-smoke">
                                  Panduan
                                </p>
                                <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-naki-smoke">
                                  {order.setupGuide}
                                </p>
                              </div>
                            ) : null}
                            {order.demoUrl ? (
                              <a
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-naki-primary px-3 text-xs font-semibold text-white transition hover:opacity-90"
                                href={order.demoUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                Buka aset / demo
                                <ExternalLink size={13} />
                              </a>
                            ) : null}
                          </div>
                        </section>
                      ) : null}

                      {canRateOrder(order) ? (
                        <section className="naki-orders-detail-surface mt-4 rounded-xl bg-naki-frost p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-naki-secondary">
                            <Star className="text-naki-secondary" size={16} />
                            Rating design
                          </div>
                          {isRated ? (
                            <p className="mt-2 text-sm text-naki-smoke">
                              Rating sudah dikirim. Terima kasih atas
                              feedback-nya.
                            </p>
                          ) : (
                            <div className="mt-3 grid gap-3 md:grid-cols-[150px_1fr_auto] md:items-end">
                              <label className="grid gap-1.5">
                                <span className="text-xs font-medium text-naki-smoke">
                                  Rating
                                </span>
                                <select
                                  className="h-11 rounded-lg border border-naki-steel bg-naki-page-bg px-2.5 text-sm outline-none focus:border-blue-400"
                                  value={form.rating}
                                  onChange={(event) =>
                                    updateRatingForm(order.id, {
                                      ...form,
                                      rating: event.target.value,
                                    })
                                  }
                                >
                                  <option value="5">5 - Sangat puas</option>
                                  <option value="4">4 - Puas</option>
                                  <option value="3">3 - Cukup</option>
                                  <option value="2">2 - Kurang</option>
                                  <option value="1">1 - Tidak cocok</option>
                                </select>
                              </label>
                              <label className="grid gap-1.5">
                                <span className="text-xs font-medium text-naki-smoke">
                                  Catatan
                                </span>
                                <textarea
                                  className="min-h-9 resize-y rounded-lg border border-naki-steel bg-naki-page-bg px-2.5 py-2 text-sm leading-relaxed outline-none focus:border-blue-400"
                                  value={form.message}
                                  onChange={(event) =>
                                    updateRatingForm(order.id, {
                                      ...form,
                                      message: event.target.value,
                                    })
                                  }
                                  placeholder="Opsional: tulis pengalaman singkat."
                                />
                              </label>
                              <button
                                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-naki-primary px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={isProcessing}
                                onClick={() => void submitRating(order)}
                                type="button"
                              >
                                <Send size={14} />
                                {isProcessing ? "Menyimpan..." : "Kirim rating"}
                              </button>
                            </div>
                          )}
                        </section>
                      ) : null}
                    </article>
                  );
                })}
                <PaginationControls
                  page={ordersPage}
                  total={ordersMeta.total}
                  totalPages={ordersMeta.totalPages}
                  pageSize={ordersMeta.pageSize}
                  isLoading={isLoading}
                  onPageChange={setOrdersPage}
                />
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </main>
  );
}

type OrderInfoProps = {
  label: string;
  value: string;
};

function OrderInfo({ label, value }: OrderInfoProps) {
  return (
    <div className="naki-orders-detail-surface rounded-xl bg-naki-frost px-3 py-2.5">
      <p className="text-xs font-medium text-naki-smoke">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-naki-primary">{value}</p>
    </div>
  );
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

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAttachmentLabel(url: string, index: number) {
  try {
    const pathname = new URL(url, window.location.origin).pathname;
    const rawName = decodeURIComponent(pathname.split("/").pop() ?? "");
    const cleanName = rawName.replace(/^\d+-[a-f0-9]{16}-/i, "");
    return cleanName || `Lampiran ${index + 1}`;
  } catch {
    return `Lampiran ${index + 1}`;
  }
}

function getPaymentMenuLabel(value: OrdersPaymentMenu) {
  return (
    orderPaymentMenus.find((menu) => menu.value === value)?.label ?? "Pesanan"
  );
}

function getPaymentMenuDescription(value: OrdersPaymentMenu) {
  return (
    orderPaymentMenus.find((menu) => menu.value === value)?.description ??
    "Seluruh progres pesanan."
  );
}

function getEmptyOrdersTitle(value: OrdersPaymentMenu) {
  switch (value) {
    case "all":
      return "Belum ada pesanan.";
    case "work":
      return "Belum ada pesanan yang sedang dikerjakan.";
    case "waiting_payment":
      return "Belum ada yang menunggu pembayaran.";
    case "unpaid":
      return "Tidak ada pesanan yang belum lunas.";
    case "cancelled":
      return "Belum ada pesanan yang dibatalkan.";
    case "review":
      return "Belum ada hasil yang menunggu review.";
    case "balance":
      return "Belum ada pesanan yang menunggu pelunasan.";
    case "completed":
      return "Belum ada pesanan yang selesai.";
    default:
      return "Belum ada pesanan.";
  }
}

function getEmptyOrdersMessage(value: OrdersPaymentMenu) {
  switch (value) {
    case "all":
      return "Pilih design atau layanan untuk membuat pesanan pertama.";
    case "work":
      return "Pesanan custom yang sudah dibayar dan sedang dikerjakan atau direvisi akan tampil di sini.";
    case "waiting_payment":
      return "Pesanan yang sudah dibuatkan instruksi pembayaran akan tampil di sini.";
    case "unpaid":
      return "Pesanan yang belum dibayar atau baru membayar DP akan tampil di sini.";
    case "cancelled":
      return "Order atau pembayaran yang dibatalkan akan tampil di sini. Pembayaran dapat diulang selama order masih aktif.";
    case "review":
      return "Hasil pekerjaan yang sudah dikirim admin dan perlu kamu approve atau revisi akan tampil di sini.";
    case "balance":
      return "Pesanan custom yang hasilnya sudah kamu setujui dan siap dilunasi akan tampil di sini.";
    case "completed":
      return "Pesanan yang seluruh proses dan pembayarannya sudah tuntas akan tampil di sini.";
    default:
      return "Pilih design atau layanan, kirim konsultasi/order, lalu statusnya akan tampil di sini.";
  }
}

function getPaymentRetryUnavailableReason(order: OrderItem) {
  if (["completed", "closed", "cancelled"].includes(order.status)) {
    return "Order sudah ditutup; hubungi admin untuk mengaktifkan kembali.";
  }
  if (
    order.orderType === "custom_project" &&
    (!order.quoteAmount || order.quoteStatus !== "accepted")
  ) {
    return "Setujui penawaran terbaru sebelum mengulang pembayaran.";
  }
  return "Pembayaran ulang belum tersedia untuk order ini.";
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function QuoteStatus({ status }: { status: OrderItem["quoteStatus"] }) {
  const styles = {
    pending: "bg-amber-100 text-amber-700",
    accepted: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
  } as const;
  const labels = {
    pending: "Menunggu respons",
    accepted: "Disetujui",
    rejected: "Ditolak",
  } as const;

  if (!status) return null;

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
