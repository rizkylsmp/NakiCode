import {
  ArrowLeft,
  BadgeCheck,
  Clock3,
  CreditCard,
  ExternalLink,
  Inbox,
  PackageOpen,
  RefreshCw,
  Send,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { PaginationControls } from "../components/PaginationControls";
import { OrderCardSkeletonGrid } from "../components/ProfileSkeleton";
import type { TemplateItem } from "../content";
import {
  canConfirmPaymentManually,
  canRateOrder,
  getPaymentStatusLabel,
  getWaitingPaymentMessage,
  type OrderItem,
  type OrdersResponse,
} from "../order-types";
import {
  userSessionEvent,
  userTokenKey,
  userUsernameKey,
} from "../user-session";

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

type OrdersPaymentMenu = "paid" | "waiting_payment" | "unpaid";

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
    value: "unpaid",
    label: "Belum bayar",
    description: "Belum masuk proses pembayaran.",
  },
  {
    value: "waiting_payment",
    label: "Menunggu pembayaran",
    description: "Sudah punya instruksi bayar.",
  },
  {
    value: "paid",
    label: "Selesai",
    description: "Source code sudah terbuka.",
  },
];

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
    useState<OrdersPaymentMenu>("waiting_payment");
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
          paymentStatus: activePaymentMenu,
        });
        const response = await fetch(`/api/orders/my?${params.toString()}`, {
          headers: createAuthHeaders(userToken),
        });

        if (!response.ok) {
          throw new Error("Gagal memuat pesanan.");
        }

        const data = (await response.json()) as OrdersResponse;
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
      const response = await fetch(`/api/orders/${orderId}/payment/confirm`, {
        method: "POST",
        headers: createAuthHeaders(userToken),
      });

      if (!response.ok) {
        throw new Error("Gagal konfirmasi pembayaran.");
      }

      const data = (await response.json()) as { order: OrderItem };
      updateOrder(data.order);
      setStatus(`Pembayaran order #${orderId} berhasil. Rating sudah terbuka.`);
    } catch {
      setStatus("Gagal konfirmasi pembayaran. Coba lagi sebentar.");
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
      const response = await fetch(
        `/api/templates/${order.templateId}/rating`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...createAuthHeaders(userToken),
          },
          body: JSON.stringify(form),
        },
      );

      if (response.status === 409) {
        setRatedOrderIds((currentIds) => [...currentIds, order.id]);
        setStatus("Rating untuk template ini sudah pernah dikirim.");
        return;
      }

      if (!response.ok) {
        throw new Error("Gagal menyimpan rating.");
      }

      const data = (await response.json()) as RatingResponse;

      if (data.template) {
        onTemplateUpdate(data.template);
      }

      setRatedOrderIds((currentIds) => [...currentIds, order.id]);
      setStatus(`Rating untuk ${order.templateTitle} tersimpan.`);
    } catch {
      setStatus("Gagal menyimpan rating. Pastikan order sudah paid.");
    } finally {
      setProcessingOrderId(null);
    }
  }

  return (
    <main className="naki-frosted-grid min-h-screen text-naki-primary">
      <Header />

      <section className="w-full px-5 py-10 md:px-8 xl:px-12 2xl:px-16">
        <Link
          className="inline-flex items-center gap-2 text-sm font-black text-naki-secondary"
          to="/"
        >
          <ArrowLeft size={16} />
          Kembali ke storefront
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-4 border-b border-naki-steel pb-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase text-naki-secondary">
              Akun {userUsername || "user"}
            </p>
            <h1 className="mt-2 text-4xl font-black leading-tight md:text-5xl">
              Pesanan saya
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-naki-smoke">
              Lacak order, pembayaran, dan beri rating setelah pembayaran
              berhasil.
            </p>
          </div>
          <button
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-naki-secondary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-primary disabled:cursor-not-allowed disabled:bg-naki-smoke"
            disabled={isLoading || !userToken}
            onClick={() => void loadOrders(ordersPage)}
            type="button"
          >
            <RefreshCw size={16} />
            {isLoading ? "Memuat..." : "Refresh"}
          </button>
        </div>

        <p className="mt-5 inline-flex rounded-lg border border-naki-steel bg-naki-frost px-4 py-3 text-sm font-black text-naki-secondary shadow-naki-card">
          {status}
        </p>

        {!userToken ? (
          <div className="mt-8 rounded-xl border border-naki-steel bg-naki-frost p-8 text-center shadow-naki-card">
            <Inbox className="mx-auto text-naki-secondary" size={36} />
            <h2 className="mt-4 text-2xl font-black">Login dulu.</h2>
            <p className="mt-2 text-naki-smoke">
              Pesanan hanya bisa dilihat oleh akun pembeli.
            </p>
            <Link
              className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-naki-secondary px-5 text-sm font-black text-naki-frost"
              to="/login?next=%2Fpesanan-saya"
            >
              Login user
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-2 rounded-xl border border-naki-steel bg-naki-frost p-2 shadow-naki-card md:grid-cols-3">
              {orderPaymentMenus.map((menu) => {
                const isActive = activePaymentMenu === menu.value;

                return (
                  <button
                    key={menu.value}
                    className={`rounded-lg border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-naki-primary bg-naki-primary text-naki-frost"
                        : "border-transparent bg-transparent text-naki-primary hover:border-naki-steel hover:bg-naki-steel"
                    }`}
                    onClick={() => selectPaymentMenu(menu.value)}
                    type="button"
                  >
                    <span className="block text-sm font-black">
                      {menu.label}
                    </span>
                    <span
                      className={`mt-1 block text-xs font-semibold leading-5 ${
                        isActive ? "text-naki-frost" : "text-naki-smoke"
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
              <div className="mt-8 rounded-xl border border-naki-steel bg-naki-frost p-8 text-center shadow-naki-card">
                <Inbox className="mx-auto text-naki-secondary" size={36} />
                <h2 className="mt-4 text-2xl font-black">
                  {getEmptyOrdersTitle(activePaymentMenu)}
                </h2>
                <p className="mt-2 text-naki-smoke">
                  {getEmptyOrdersMessage(activePaymentMenu)}
                </p>
                <Link
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-naki-secondary px-5 text-sm font-black text-naki-frost"
                  to="/#template"
                >
                  Cari template
                </Link>
              </div>
            ) : (
              <div className="mt-8 grid w-full gap-3">
                {orders.map((order) => {
                  const form = ratingForms[order.id] ?? defaultRatingForm;
                  const isProcessing = processingOrderId === order.id;
                  const isRated = ratedOrderIds.includes(order.id);

                  return (
                    <article
                      key={order.id}
                      className="rounded-lg border border-naki-steel bg-naki-frost p-3 shadow-naki-card"
                    >
                      <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-start">
                        <div className="min-w-0">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <p className="w-fit rounded-md bg-naki-steel px-2 py-1 text-xs font-black uppercase text-naki-secondary">
                              #{order.id}
                            </p>
                            <div className="min-w-0 flex-1">
                              <h2 className="truncate text-lg font-black leading-tight">
                                {order.templateTitle}
                              </h2>
                            </div>
                            <span className="inline-flex h-8 w-fit items-center gap-1.5 rounded-md bg-naki-steel px-2.5 text-xs font-black text-naki-primary">
                              <CreditCard size={14} />
                              {getPaymentStatusLabel(order.paymentStatus)}
                            </span>
                          </div>

                          <div className="mt-2 grid gap-2 sm:grid-cols-4">
                            <OrderInfo label="Tipe" value={order.projectType} />
                            <OrderInfo
                              label="Budget"
                              value={order.budgetRange}
                            />
                            <OrderInfo
                              label="Status order"
                              value={order.status}
                            />
                            <OrderInfo
                              label="Tanggal"
                              value={formatOrderDate(order.createdAt)}
                            />
                          </div>
                        </div>

                        <div className="rounded-lg bg-naki-steel p-2.5 xl:w-[390px]">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm font-black">
                              <Clock3 size={15} />
                              Pembayaran
                            </div>
                            {order.paymentMethod ? (
                              <span className="truncate text-xs font-bold text-naki-smoke">
                                {order.paymentMethod}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-naki-smoke">
                            {order.paymentStatus === "paid"
                              ? `Lunas${order.paidAt ? ` pada ${formatOrderDate(order.paidAt)}` : ""}.`
                              : order.paymentStatus === "waiting_payment"
                                ? getWaitingPaymentMessage(order)
                                : "Klik bayar sekarang untuk membuat instruksi pembayaran."}
                          </p>
                          {order.paymentReference ? (
                            <p className="mt-1.5 truncate rounded-md bg-naki-frost px-2 py-1 font-mono text-[11px] font-black text-naki-primary">
                              Ref: {order.paymentReference}
                            </p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {order.paymentStatus === "pending" ||
                            order.paymentStatus === "failed" ? (
                              <Link
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-naki-secondary px-3 text-xs font-black text-naki-frost transition hover:bg-naki-primary"
                                to={`/checkout/${order.id}`}
                              >
                                <CreditCard size={14} />
                                Bayar di checkout
                              </Link>
                            ) : null}
                            {order.paymentUrl ? (
                              <a
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-naki-steel bg-naki-frost px-3 text-xs font-black text-naki-secondary transition hover:border-naki-smoke"
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
                                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-naki-steel bg-naki-frost px-3 text-xs font-black text-naki-secondary transition hover:border-naki-smoke"
                                  to={`/checkout/${order.id}`}
                                >
                                  <CreditCard size={14} />
                                  Lihat checkout
                                </Link>
                                {canConfirmPaymentManually(order) ? (
                                  <button
                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-naki-primary px-3 text-xs font-black text-naki-frost transition hover:bg-naki-secondary disabled:cursor-not-allowed disabled:bg-naki-smoke"
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
                        <section className="mt-2 rounded-lg border border-naki-steel p-2.5">
                          <div className="flex items-center gap-2 text-xs font-black uppercase text-naki-secondary">
                            <PackageOpen
                              className="text-naki-secondary"
                              size={16}
                            />
                            Source code & panduan
                          </div>
                          <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-start">
                            {order.sourceCodeItems.length > 0 ? (
                              <div className="rounded-md bg-naki-steel p-2.5">
                                <p className="text-xs font-black uppercase text-naki-smoke">
                                  Paket source
                                </p>
                                <ul className="mt-1 grid gap-0.5 text-xs font-semibold text-naki-smoke">
                                  {order.sourceCodeItems.map((item) => (
                                    <li key={item}>- {item}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                            {order.setupGuide ? (
                              <div className="rounded-md bg-naki-steel p-2.5">
                                <p className="text-xs font-black uppercase text-naki-smoke">
                                  Panduan
                                </p>
                                <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs font-semibold leading-5 text-naki-smoke">
                                  {order.setupGuide}
                                </p>
                              </div>
                            ) : null}
                            {order.demoUrl ? (
                              <a
                                className="inline-flex h-8 w-fit items-center justify-center gap-1.5 rounded-md bg-naki-primary px-2.5 text-xs font-black text-naki-frost transition hover:bg-naki-secondary"
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
                        <section className="mt-2 rounded-lg border border-naki-steel p-2.5">
                          <div className="flex items-center gap-2 text-xs font-black uppercase text-naki-secondary">
                            <Star className="text-naki-secondary" size={16} />
                            Rating template
                          </div>
                          {isRated ? (
                            <p className="mt-1 text-xs font-semibold text-naki-smoke">
                              Rating sudah dikirim. Terima kasih atas
                              feedback-nya.
                            </p>
                          ) : (
                            <div className="mt-2 grid gap-2 md:grid-cols-[150px_1fr_auto] md:items-end">
                              <label className="grid gap-1 text-xs font-black">
                                Rating
                                <select
                                  className="h-9 rounded-lg border border-naki-steel bg-naki-frost px-2.5 text-xs font-semibold outline-none focus:border-naki-secondary"
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
                              <label className="grid gap-1 text-xs font-black">
                                Catatan
                                <textarea
                                  className="min-h-9 resize-y rounded-lg border border-naki-steel bg-naki-frost px-2.5 py-2 text-xs font-semibold leading-5 outline-none focus:border-naki-secondary"
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
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-naki-secondary px-3 text-xs font-black text-naki-frost transition hover:bg-naki-primary disabled:cursor-not-allowed disabled:bg-naki-smoke"
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
                        <p className="mt-2 rounded-lg border border-naki-steel px-2.5 py-1.5 text-xs font-bold text-naki-smoke">
                          Rating akan terbuka setelah pembayaran berhasil.
                        </p>
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
    <div className="rounded-lg bg-naki-steel p-3">
      <p className="text-xs font-black uppercase text-naki-smoke">{label}</p>
      <p className="mt-1 text-sm font-black text-naki-primary">{value}</p>
    </div>
  );
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

function getPaymentMenuLabel(value: OrdersPaymentMenu) {
  return (
    orderPaymentMenus.find((menu) => menu.value === value)?.label ?? "Pesanan"
  );
}

function getEmptyOrdersTitle(value: OrdersPaymentMenu) {
  switch (value) {
    case "paid":
      return "Belum ada pesanan selesai.";
    case "waiting_payment":
      return "Belum ada yang menunggu pembayaran.";
    case "unpaid":
      return "Belum ada pesanan belum bayar.";
    default:
      return "Belum ada pesanan.";
  }
}

function getEmptyOrdersMessage(value: OrdersPaymentMenu) {
  switch (value) {
    case "paid":
      return "Pesanan yang sudah lunas dan source code-nya terbuka akan tampil di sini.";
    case "waiting_payment":
      return "Pesanan yang sudah dibuatkan instruksi pembayaran akan tampil di sini.";
    case "unpaid":
      return "Pesanan yang belum masuk proses pembayaran akan tampil di sini.";
    default:
      return "Pilih template, kirim order, lalu statusnya akan tampil di sini.";
  }
}
