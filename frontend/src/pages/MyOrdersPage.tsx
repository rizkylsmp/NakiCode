import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Clock3,
  CreditCard,
  ExternalLink,
  Inbox,
  PackageOpen,
  RefreshCw,
  Send,
  Star,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  apiGet,
  apiPost,
  getApiErrorMessage,
  getApiErrorStatus,
} from "../services/api-client";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { PaginationControls } from "../components/ui/PaginationControls";
import { OrderCardSkeletonGrid } from "../components/ui/skeletons/ProfileSkeleton";
import type { TemplateItem } from "../domain/content";
import {
  canConfirmPaymentManually,
  canRateOrder,
  canStartOrderCheckout,
  getOrderPaymentActionLabel,
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

type OrdersPaymentMenu = "all" | "paid" | "waiting_payment" | "unpaid";

const defaultRatingForm: RatingFormState = {
  rating: "5",
  message: "",
};
const ordersPageSize = 6;
const orderPaymentMenus: Array<{
  value: OrdersPaymentMenu;
  label: string;
  description: string;
}> = [
  {
    value: "all",
    label: "Semua",
    description: "Seluruh progres pesanan.",
  },
  {
    value: "unpaid",
    label: "Belum lunas",
    description: "Belum bayar, gagal, atau baru membayar DP.",
  },
  {
    value: "waiting_payment",
    label: "Menunggu pembayaran",
    description: "Sudah punya instruksi bayar.",
  },
  {
    value: "paid",
    label: "Sudah dibayar",
    description: "Pembayaran telah diterima.",
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

  const loadOrders = useCallback(
    async (page = ordersPage) => {
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

      setIsLoading(true);
      setStatus("Memuat pesanan saya...");

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
        setStatus("Gagal memuat pesanan. Pastikan backend aktif.");
      } finally {
        setIsLoading(false);
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
          "Gagal menyimpan rating. Pastikan order sudah paid.",
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
              Lacak order, pembayaran, dan beri rating setelah pembayaran
              berhasil.
            </p>
          </div>
          <button
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-4 text-sm font-medium text-naki-primary transition hover:bg-naki-frost disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="mt-6 grid gap-2 rounded-2xl bg-white p-2 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
              {orderPaymentMenus.map((menu) => {
                const isActive = activePaymentMenu === menu.value;

                return (
                  <button
                    key={menu.value}
                    className={`rounded-xl px-4 py-3 text-left transition ${
                      isActive
                        ? "bg-naki-primary text-white"
                        : "bg-white text-naki-primary hover:bg-naki-frost"
                    }`}
                    onClick={() => selectPaymentMenu(menu.value)}
                    type="button"
                  >
                    <span className="block text-sm font-semibold">
                      {menu.label}
                    </span>
                    <span
                      className={`mt-1 block text-xs leading-5 ${
                        isActive ? "text-white/70" : "text-naki-smoke"
                      }`}
                    >
                      {menu.description}
                    </span>
                  </button>
                );
              })}
            </div>

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

                  return (
                    <article
                      key={order.id}
                      className="rounded-2xl bg-white p-5 shadow-sm"
                    >
                      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                        <div className="min-w-0">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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

                          <div className="mt-3 grid gap-2 sm:grid-cols-4">
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

                        {order.quoteAmount ? (
                          <section className="rounded-xl border border-naki-steel bg-naki-frost p-4 md:col-span-2">
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
                                    Dikirim {formatOrderDate(order.quoteSentAt)}
                                  </p>
                                ) : null}
                              </div>
                              <QuoteStatus status={quoteStatus} />
                            </div>
                            {quoteStatus === "pending" ? (
                              <div className="mt-4 flex flex-col gap-2 border-t border-naki-steel pt-4 sm:flex-row">
                                <button
                                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
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
                                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 disabled:opacity-50"
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

                        <div className="rounded-xl bg-naki-frost p-4 xl:w-[390px]">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-naki-primary">
                              <Clock3 size={15} />
                              Pembayaran
                            </div>
                            {order.paymentMethod ? (
                              <span className="truncate text-xs font-medium text-naki-smoke">
                                {order.paymentMethod}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-naki-smoke">
                            {order.paymentStatus === "paid"
                              ? `Lunas${order.paidAt ? ` pada ${formatOrderDate(order.paidAt)}` : ""}.`
                              : order.paymentStatus === "partial_paid"
                                ? `DP ${formatRupiah(order.amountPaid)} sudah diterima. Pelunasan dapat dibayar sekarang.`
                                : quoteStatus === "pending"
                                  ? "Tinjau dan setujui penawaran sebelum membuka checkout."
                                  : quoteStatus === "rejected"
                                    ? "Penawaran ditolak. Tim NAKI Code akan mengirim revisi penawaran."
                                    : order.paymentStatus === "waiting_payment"
                                      ? getWaitingPaymentMessage(order)
                                      : "Klik bayar sekarang untuk membuat instruksi pembayaran."}
                          </p>
                          {order.paymentReference ? (
                            <div className="mt-2 rounded-lg bg-white px-3 py-1.5">
                              <span className="font-mono text-xs font-medium text-naki-primary">
                                Ref: {order.paymentReference}
                              </span>
                            </div>
                          ) : null}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {canStartOrderCheckout(order) ? (
                              <Link
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-naki-secondary px-3 text-xs font-semibold text-white transition hover:bg-naki-primary"
                                to={`/checkout/${order.id}`}
                              >
                                <CreditCard size={14} />
                                {getOrderPaymentActionLabel(order)}
                              </Link>
                            ) : null}
                            {order.paymentUrl ? (
                              <a
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-3 text-xs font-medium text-naki-primary transition hover:bg-naki-frost"
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
                                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-3 text-xs font-medium text-naki-primary transition hover:bg-naki-frost"
                                  to={`/checkout/${order.id}`}
                                >
                                  <CreditCard size={14} />
                                  Lihat checkout
                                </Link>
                                {canConfirmPaymentManually(order) ? (
                                  <button
                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-naki-primary px-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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

                      {order.deliveryStatus === "available" ? (
                        <section className="mt-4 rounded-xl bg-naki-frost p-4">
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
                        <section className="mt-4 rounded-xl bg-naki-frost p-4">
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
                      ) : (
                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-naki-frost px-4 py-3">
                          <Star size={14} className="text-naki-smoke" />
                          <p className="text-sm font-medium text-naki-smoke">
                            Rating akan terbuka setelah pembayaran berhasil.
                          </p>
                        </div>
                      )}
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
    <div className="rounded-xl bg-naki-frost px-3 py-2.5">
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

function getPaymentMenuLabel(value: OrdersPaymentMenu) {
  return (
    orderPaymentMenus.find((menu) => menu.value === value)?.label ?? "Pesanan"
  );
}

function getEmptyOrdersTitle(value: OrdersPaymentMenu) {
  switch (value) {
    case "all":
      return "Belum ada pesanan.";
    case "paid":
      return "Belum ada pesanan yang sudah dibayar.";
    case "waiting_payment":
      return "Belum ada yang menunggu pembayaran.";
    case "unpaid":
      return "Tidak ada pesanan yang belum lunas.";
    default:
      return "Belum ada pesanan.";
  }
}

function getEmptyOrdersMessage(value: OrdersPaymentMenu) {
  switch (value) {
    case "all":
      return "Pilih design atau layanan untuk membuat pesanan pertama.";
    case "paid":
      return "Pesanan yang seluruh pembayarannya sudah lunas akan tampil di sini.";
    case "waiting_payment":
      return "Pesanan yang sudah dibuatkan instruksi pembayaran akan tampil di sini.";
    case "unpaid":
      return "Pesanan yang belum dibayar atau baru membayar DP akan tampil di sini.";
    default:
      return "Pilih design atau layanan, kirim konsultasi/order, lalu statusnya akan tampil di sini.";
  }
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
