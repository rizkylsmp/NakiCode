import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CreditCard,
  ExternalLink,
  LockKeyhole,
  Link2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPost, getApiErrorMessage } from "../services/api-client";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { PaymentDeadline } from "../components/payment/PaymentDeadline";
import {
  canStartOrderCheckout,
  canConfirmPaymentManually,
  getOrderPaymentActionLabel,
  getOrderPayableAmount,
  getOrderTypeLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getWaitingPaymentMessage,
  type OrderItem,
} from "../domain/order-types";
import { userSessionEvent, userTokenKey } from "../utils/user-session";

type CheckoutProvider = "midtrans" | "lynk";
type PaymentMethod = "qris" | "dana";
type InitialPaymentOption = "deposit" | "full";

const paymentMethods: Array<{
  value: PaymentMethod;
  title: string;
  description: string;
  icon: typeof QrCode;
}> = [
  {
    value: "qris",
    title: "QRIS",
    description: "Scan dari mobile banking atau e-wallet yang support QRIS.",
    icon: QrCode,
  },
  {
    value: "dana",
    title: "DANA",
    description: "Lanjutkan pembayaran lewat channel DANA di gateway.",
    icon: WalletCards,
  },
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const parsedOrderId = Number(orderId);
  const [userToken, setUserToken] = useState(() =>
    window.localStorage.getItem(userTokenKey),
  );
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [checkoutProvider, setCheckoutProvider] =
    useState<CheckoutProvider>("midtrans");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("qris");
  const [initialPaymentOption, setInitialPaymentOption] =
    useState<InitialPaymentOption>("deposit");
  const [status, setStatus] = useState("Memuat checkout...");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState("Kupon opsional.");

  const loadOrder = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!userToken) {
        setOrder(null);
        setStatus("Login user diperlukan untuk checkout.");
        return;
      }

      if (!Number.isFinite(parsedOrderId)) {
        setStatus("Order checkout tidak valid.");
        return;
      }

      if (!options.silent) {
        setIsLoading(true);
        setStatus("Memuat detail order...");
      }

      try {
        const data = await apiGet<{ order: OrderItem }>(
          `/api/orders/my/${parsedOrderId}`,
        );
        const selectedOrder = data.order ?? null;

        setOrder(selectedOrder);
        if (
          selectedOrder?.orderType !== "source_purchase" ||
          !selectedOrder.templateLynkUrl
        ) {
          setCheckoutProvider("midtrans");
        }
        setStatus(
          selectedOrder
            ? "Pilih metode pembayaran untuk melanjutkan."
            : "Order tidak ditemukan di akun ini.",
        );
      } catch {
        if (!options.silent) {
          setStatus("Gagal memuat checkout. Pastikan backend aktif.");
        }
      } finally {
        if (!options.silent) setIsLoading(false);
      }
    },
    [parsedOrderId, userToken],
  );

  useEffect(() => {
    function syncUserSession() {
      setUserToken(window.localStorage.getItem(userTokenKey));
    }

    window.addEventListener(userSessionEvent, syncUserSession);
    window.addEventListener("storage", syncUserSession);

    return () => {
      window.removeEventListener(userSessionEvent, syncUserSession);
      window.removeEventListener("storage", syncUserSession);
    };
  }, []);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (order?.paymentStatus !== "waiting_payment") return;

    const intervalId = window.setInterval(() => {
      void loadOrder({ silent: true });
    }, 15_000);
    return () => window.clearInterval(intervalId);
  }, [loadOrder, order?.paymentStatus]);

  async function startPayment() {
    if (!userToken || !order) {
      setStatus("Order belum siap diproses.");
      return;
    }

    if (!canStartOrderCheckout(order)) {
      setStatus(
        order.quoteAmount && order.quoteStatus !== "accepted"
          ? "Setujui penawaran harga dari halaman Pesanan Saya terlebih dahulu."
          : "Pembayaran baru tidak dapat dimulai untuk status order ini.",
      );
      return;
    }

    if (checkoutProvider === "lynk" && !order.templateLynkUrl) {
      setStatus("Checkout Lynk belum tersedia untuk design ini.");
      return;
    }

    const paymentWindow = window.open("about:blank", "_blank");

    setIsProcessing(true);
    setStatus("Membuat sesi pembayaran...");

    try {
      const data = await apiPost<{ order: OrderItem }>(
        `/api/orders/${order.id}/payment`,
        {
          provider: checkoutProvider,
          method: checkoutProvider === "midtrans" ? paymentMethod : undefined,
          couponCode:
            checkoutProvider === "midtrans"
              ? couponCode.trim() || undefined
              : undefined,
          paymentOption:
            order.orderType === "custom_project" && order.amountPaid === 0
              ? initialPaymentOption
              : undefined,
        },
      );
      setOrder(data.order);
      if (data.order.paymentUrl) {
        openPaymentPage(data.order.paymentUrl, paymentWindow);
        setStatus(
          checkoutProvider === "lynk"
            ? "Checkout Lynk sudah dibuka. Selesaikan transaksi di Lynk, lalu kembali ke Pesanan Saya untuk melihat statusnya."
            : "Halaman pembayaran sudah dibuka. Status akan diperbarui otomatis setelah transaksi terverifikasi.",
        );
      } else {
        paymentWindow?.close();
        setStatus("Pembayaran siap. Buka halaman bayar untuk melanjutkan.");
      }
    } catch (error) {
      paymentWindow?.close();
      setStatus(
        getApiErrorMessage(
          error,
          checkoutProvider === "lynk"
            ? "Checkout Lynk tidak tersedia atau URL belum dikonfigurasi."
            : "Gagal membuat sesi pembayaran. Coba metode lain atau ulangi.",
        ),
      );
    } finally {
      setIsProcessing(false);
    }
  }

  async function confirmPayment() {
    if (!userToken || !order) {
      setStatus("Order belum siap dikonfirmasi.");
      return;
    }

    setIsProcessing(true);
    setStatus("Mengonfirmasi pembayaran...");

    try {
      const data = await apiPost<{ order: OrderItem }>(
        `/api/orders/${order.id}/payment/confirm`,
      );
      setOrder(data.order);
      setStatus(
        data.order.orderType === "source_purchase"
          ? "Pembayaran berhasil. Source code sudah terbuka."
          : "Pembayaran berhasil. Pesanan masuk ke tahap pengerjaan.",
      );
    } catch {
      setStatus("Gagal konfirmasi pembayaran.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function validateCoupon() {
    if (!order || !couponCode.trim()) {
      setCouponStatus("Masukkan kode kupon dulu.");
      return;
    }

    setCouponStatus("Memvalidasi kupon...");

    try {
      const data = await apiPost<{
        coupon: {
          discountAmount: number;
          finalAmount: number;
          description: string;
        };
      }>("/api/business/coupons/validate", {
        code: couponCode,
        amount: getOrderPayableAmount(order),
      });

      setCouponStatus(
        `${data.coupon.description}. Diskon Rp${data.coupon.discountAmount.toLocaleString("id-ID")}, total Rp${data.coupon.finalAmount.toLocaleString("id-ID")}.`,
      );
    } catch {
      setCouponStatus(
        "Kupon tidak valid, sudah kedaluwarsa, atau kuotanya habis.",
      );
    }
  }

  const hasLynkCheckout = Boolean(
    order?.orderType === "source_purchase" && order.templateLynkUrl,
  );
  const canStartPayment = order ? canStartOrderCheckout(order) : false;
  const showInitialPaymentChoice = Boolean(
    order?.orderType === "custom_project" && order.amountPaid === 0,
  );
  const payableAmount = order
    ? getOrderPayableAmount(order, initialPaymentOption)
    : 0;
  const paymentActionLabel = order
    ? showInitialPaymentChoice
      ? initialPaymentOption === "full"
        ? "Bayar lunas"
        : "Bayar DP 50%"
      : getOrderPaymentActionLabel(order)
    : "Bayar";

  return (
    <main className="naki-frosted-grid min-h-screen bg-naki-page-bg text-naki-primary">
      <Header />

      <section
        id="main-content"
        className="w-full px-4 py-6 sm:px-5 md:px-8 md:py-8 xl:px-12 2xl:px-16"
        tabIndex={-1}
      >
        <button
          className="inline-flex items-center gap-2 text-sm font-semibold text-naki-smoke hover:text-naki-primary transition"
          onClick={() => navigate(-1)}
          type="button"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>

        <ol
          className="mt-4 grid max-w-2xl grid-cols-3 gap-2"
          aria-label="Tahapan checkout"
        >
          {["Detail order", "Metode bayar", "Selesai"].map((step, index) => (
            <li
              key={step}
              className={`flex items-center gap-2 text-xs font-semibold sm:text-sm ${
                index < 2 ? "text-naki-primary" : "text-naki-smoke"
              }`}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full ${
                  index === 0
                    ? "bg-green-100 text-green-700"
                    : index === 1
                      ? "bg-naki-primary text-white"
                      : "bg-naki-steel text-naki-smoke"
                }`}
              >
                {index === 0 ? <Check size={14} /> : index + 1}
              </span>
              <span className="hidden sm:inline">{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Main checkout column */}
          <div className="rounded-2xl border border-naki-steel bg-white p-4 shadow-sm sm:p-5 md:p-6">
            <p className="text-xs font-medium uppercase text-naki-smoke tracking-wide">
              Checkout
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-tight text-naki-primary md:text-3xl">
              {order?.orderType === "custom_project"
                ? paymentActionLabel
                : "Pembayaran penuh source code"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-naki-smoke">
              Pilih jalur pembayaran yang paling nyaman. Detail proses dan
              pembaruan status berbeda untuk setiap provider.
            </p>

            <p
              className="mt-3 inline-flex rounded-lg bg-naki-frost px-3 py-2 text-sm font-medium text-naki-smoke"
              aria-live="polite"
              role="status"
            >
              {status}
            </p>

            {!userToken ? (
              <div className="mt-4 rounded-xl bg-naki-frost p-4">
                <LockKeyhole className="text-naki-secondary" size={28} />
                <h2 className="mt-3 text-xl font-bold text-naki-primary">
                  Login diperlukan.
                </h2>
                <p className="mt-2 text-sm text-naki-smoke leading-relaxed">
                  Checkout hanya bisa diproses oleh akun pembeli.
                </p>
                <Link
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-naki-primary px-5 text-sm font-medium text-white transition hover:bg-opacity-90"
                  to={`/login?next=${encodeURIComponent(
                    `/checkout/${orderId ?? ""}`,
                  )}`}
                >
                  Login
                </Link>
              </div>
            ) : order ? (
              <div className="mt-4 grid gap-4">
                {showInitialPaymentChoice ? (
                  <fieldset>
                    <legend className="text-sm font-bold text-naki-primary">
                      1. Pilih skema pembayaran
                    </legend>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {[
                        {
                          value: "deposit" as const,
                          title: "DP 50%",
                          description: `Bayar ${formatRupiah((order.quoteAmount ?? 0) * 0.5)} sekarang, sisanya setelah hasil disetujui.`,
                          icon: WalletCards,
                        },
                        {
                          value: "full" as const,
                          title: "Langsung lunas",
                          description: `Bayar penuh ${formatRupiah(order.quoteAmount ?? 0)}. Tetap melalui pengerjaan dan review.`,
                          icon: BadgeCheck,
                        },
                      ].map((option) => {
                        const OptionIcon = option.icon;
                        const isActive = initialPaymentOption === option.value;
                        return (
                          <button
                            key={option.value}
                            aria-pressed={isActive}
                            className={`flex items-start gap-3 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naki-secondary focus-visible:ring-offset-2 ${
                              isActive
                                ? "border-naki-primary bg-naki-primary text-white shadow-sm"
                                : "border-naki-steel bg-naki-frost text-naki-primary hover:border-naki-secondary"
                            }`}
                            onClick={() =>
                              setInitialPaymentOption(option.value)
                            }
                            type="button"
                          >
                            <OptionIcon
                              className={`mt-0.5 shrink-0 ${isActive ? "text-white" : "text-naki-secondary"}`}
                              size={20}
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-bold">
                                {option.title}
                              </span>
                              <span
                                className={`mt-0.5 block text-xs leading-relaxed ${isActive ? "text-white/80" : "text-naki-smoke"}`}
                              >
                                {option.description}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                ) : null}
                <fieldset>
                  <legend className="text-sm font-bold text-naki-primary">
                    {showInitialPaymentChoice ? "2" : "1"}. Pilih jalur
                    pembayaran
                  </legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition ${
                        checkoutProvider === "midtrans"
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                          : "border-blue-200 bg-white text-blue-600 hover:border-blue-400"
                      }`}
                      onClick={() => setCheckoutProvider("midtrans")}
                      type="button"
                      aria-pressed={checkoutProvider === "midtrans"}
                    >
                      <CreditCard size={18} />
                      Checkout
                    </button>

                    <button
                      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:border-naki-steel disabled:bg-naki-frost disabled:text-naki-smoke disabled:opacity-60 ${
                        checkoutProvider === "lynk"
                          ? "border-green-600 bg-green-600 text-white shadow-sm"
                          : "border-green-200 bg-white text-green-700 hover:border-green-400"
                      }`}
                      disabled={!hasLynkCheckout}
                      onClick={() => setCheckoutProvider("lynk")}
                      type="button"
                      aria-pressed={checkoutProvider === "lynk"}
                      aria-disabled={!hasLynkCheckout}
                    >
                      <Link2 size={18} />
                      via Lynk
                    </button>
                  </div>
                  {!hasLynkCheckout ? (
                    <p className="mt-2 text-xs text-naki-smoke">
                      {order.orderType === "custom_project"
                        ? "Proyek custom memakai payment gateway agar nominal DP dan pelunasan tervalidasi otomatis."
                        : "Checkout Lynk belum tersedia untuk design ini."}
                    </p>
                  ) : null}
                </fieldset>

                {checkoutProvider === "midtrans" ? (
                  <fieldset>
                    <legend className="text-sm font-bold text-naki-primary">
                      {showInitialPaymentChoice ? "3" : "2"}. Pilih metode
                      pembayaran
                    </legend>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        const isActive = paymentMethod === method.value;

                        return (
                          <button
                            key={method.value}
                            className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                              isActive
                                ? "border-naki-primary bg-naki-primary text-white shadow-sm"
                                : "border-naki-steel bg-naki-frost text-naki-primary hover:border-blue-300"
                            }`}
                            onClick={() => setPaymentMethod(method.value)}
                            type="button"
                            aria-pressed={isActive}
                          >
                            <Icon
                              className={`mt-0.5 shrink-0 ${isActive ? "text-white" : "text-naki-secondary"}`}
                              size={20}
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-bold">
                                {method.title}
                              </span>
                              <span
                                className={`mt-0.5 block text-xs leading-relaxed ${
                                  isActive ? "text-white/80" : "text-naki-smoke"
                                }`}
                              >
                                {method.description}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                ) : (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm leading-relaxed text-naki-smoke">
                    Kamu akan diarahkan ke Lynk pada tab baru. Setelah transaksi
                    selesai, akses pembelian mengikuti halaman dan akun Lynk.
                  </div>
                )}

                {/* Coupon and payment details */}
                <div className="rounded-xl bg-naki-frost p-4">
                  {checkoutProvider === "midtrans" &&
                  order.orderType === "source_purchase" ? (
                    <>
                      <div className="mb-3 grid gap-2 md:grid-cols-[1fr_auto]">
                        <label className="grid gap-1.5">
                          <span className="text-xs font-medium text-naki-smoke">
                            Kode kupon
                          </span>
                          <input
                            className="h-11 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary uppercase outline-none focus:border-blue-400"
                            value={couponCode}
                            onChange={(event) =>
                              setCouponCode(event.target.value)
                            }
                            placeholder="NAKIHEMAT"
                            type="text"
                          />
                        </label>
                        <button
                          className="self-end h-11 rounded-xl border border-naki-steel bg-white px-4 text-sm font-medium text-naki-smoke transition hover:border-naki-primary hover:text-naki-primary"
                          onClick={() => void validateCoupon()}
                          type="button"
                        >
                          Cek kupon
                        </button>
                      </div>
                      <p
                        className="mb-3 text-sm leading-relaxed text-naki-smoke"
                        aria-live="polite"
                        role="status"
                      >
                        {couponStatus}
                      </p>
                    </>
                  ) : null}
                  <div className="flex items-center gap-2 text-sm font-medium text-naki-smoke">
                    <ShieldCheck className="text-naki-secondary" size={18} />
                    Status pembayaran
                  </div>
                  <p className="mt-2 text-sm text-naki-smoke leading-relaxed">
                    {getPaymentStatusLabel(order.paymentStatus)}
                    {order.paymentReference
                      ? ` - Ref ${order.paymentReference}`
                      : ""}
                  </p>
                  {order.paymentStatus === "waiting_payment" ? (
                    <p className="mt-2 rounded-lg bg-white px-3 py-2 text-sm text-naki-smoke leading-relaxed">
                      {getWaitingPaymentMessage(order)}
                    </p>
                  ) : null}
                  {["waiting_payment", "expired"].includes(
                    order.paymentStatus,
                  ) ? (
                    <PaymentDeadline
                      expiresAt={order.paymentExpiresAt}
                      onExpire={() => {
                        setOrder((current) =>
                          current
                            ? {
                                ...current,
                                paymentStatus: "expired",
                                paymentUrl: null,
                                paymentFailureReason:
                                  "Waktu pembayaran kedaluwarsa",
                              }
                            : current,
                        );
                        setStatus(
                          "Batas pembayaran telah berakhir. Buat pembayaran baru untuk mendapatkan batas waktu baru.",
                        );
                      }}
                    />
                  ) : null}
                  {order.paymentMethod ? (
                    <p className="mt-2 text-sm font-medium text-naki-smoke">
                      Metode aktif: {getPaymentMethodLabel(order.paymentMethod)}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {order.paymentStatus === "paid" ? (
                      <Link
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-medium text-white transition hover:bg-opacity-90"
                        to="/pesanan-saya"
                      >
                        <BadgeCheck size={16} />
                        {order.orderType === "source_purchase"
                          ? "Buka source code"
                          : "Lihat progres pesanan"}
                      </Link>
                    ) : canStartPayment ? (
                      <button
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-secondary px-4 text-sm font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-naki-steel disabled:text-naki-smoke"
                        disabled={
                          isProcessing ||
                          isLoading ||
                          (checkoutProvider === "lynk" && !hasLynkCheckout)
                        }
                        onClick={() => void startPayment()}
                        type="button"
                      >
                        {checkoutProvider === "lynk" ? (
                          <Link2 size={16} />
                        ) : (
                          <CreditCard size={16} />
                        )}
                        {isProcessing
                          ? "Memproses..."
                          : checkoutProvider === "lynk"
                            ? `${paymentActionLabel} via Lynk`
                            : paymentActionLabel}
                      </button>
                    ) : null}
                    {order.paymentUrl ? (
                      <a
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-4 text-sm font-medium text-naki-smoke transition hover:border-naki-primary hover:text-naki-primary"
                        href={order.paymentUrl}
                        rel="noreferrer"
                        target={
                          order.paymentUrl.startsWith("http")
                            ? "_blank"
                            : undefined
                        }
                      >
                        Buka halaman bayar
                        <ExternalLink size={16} />
                      </a>
                    ) : null}
                    {canConfirmPaymentManually(order) ? (
                      <button
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-naki-steel disabled:text-naki-smoke"
                        disabled={isProcessing}
                        onClick={() => void confirmPayment()}
                        type="button"
                      >
                        <BadgeCheck size={16} />
                        Konfirmasi dev
                      </button>
                    ) : null}
                  </div>
                  {!canStartPayment &&
                  order.paymentStatus !== "paid" &&
                  order.paymentStatus !== "waiting_payment" ? (
                    <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-800">
                      {order.quoteAmount && order.quoteStatus !== "accepted"
                        ? "Penawaran harus disetujui dari halaman Pesanan Saya sebelum checkout."
                        : "Checkout tidak tersedia untuk tahap order ini."}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-naki-frost p-4">
                <RefreshCw className="text-naki-secondary" size={28} />
                <h2 className="mt-3 text-xl font-bold text-naki-primary">
                  Order belum ketemu.
                </h2>
                <p className="mt-2 text-sm text-naki-smoke leading-relaxed">
                  Pastikan kamu membuka checkout dari akun yang sama.
                </p>
                <Link
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-naki-secondary px-5 text-sm font-medium text-white transition hover:bg-opacity-90"
                  to="/pesanan-saya"
                >
                  Buka Pesanan Saya
                </Link>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <aside className="h-fit rounded-2xl border border-naki-steel bg-white p-4 shadow-sm lg:sticky lg:top-20">
            <p className="text-xs font-medium text-naki-smoke uppercase tracking-wide">
              Ringkasan order
            </p>
            {order ? (
              <>
                <h2 className="mt-1 text-lg font-bold leading-tight text-naki-primary">
                  {order.templateTitle}
                </h2>
                <div className="mt-3 divide-y divide-naki-steel rounded-xl bg-naki-frost px-3">
                  <CheckoutInfo label="Order" value={`#${order.id}`} />
                  <CheckoutInfo
                    label="Jenis transaksi"
                    value={getOrderTypeLabel(order)}
                  />
                  {order.orderType === "custom_project" && order.quoteAmount ? (
                    <CheckoutInfo
                      label="Total penawaran"
                      value={formatRupiah(order.quoteAmount)}
                    />
                  ) : null}
                  <CheckoutInfo
                    label="Tagihan saat ini"
                    value={formatRupiah(payableAmount)}
                  />
                  <CheckoutInfo
                    label="Tipe"
                    value={order.projectType || "Beli langsung"}
                  />
                  <CheckoutInfo
                    label="Status"
                    value={getPaymentStatusLabel(order.paymentStatus)}
                  />
                </div>
                <div className="mt-3 border-t border-naki-steel pt-3">
                  <div className="flex items-start gap-3 text-sm text-naki-smoke">
                    <ShieldCheck
                      className="mt-0.5 shrink-0 text-green-600"
                      size={18}
                    />
                    <p className="leading-relaxed">
                      URL pembayaran dibuat dari konfigurasi design dan tidak
                      dapat diganti dari browser pembeli.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-naki-smoke leading-relaxed">
                Ringkasan muncul setelah order berhasil dimuat.
              </p>
            )}
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}

type CheckoutInfoProps = {
  label: string;
  value: string;
};

function CheckoutInfo({ label, value }: CheckoutInfoProps) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <p className="text-xs font-medium uppercase text-naki-smoke">{label}</p>
      <p className="max-w-[60%] text-right text-sm font-semibold text-naki-primary">
        {value}
      </p>
    </div>
  );
}

function openPaymentPage(url: string, paymentWindow: Window | null) {
  if (paymentWindow && !paymentWindow.closed) {
    paymentWindow.opener = null;
    paymentWindow.location.href = url;
    return;
  }

  window.location.href = url;
}

function formatRupiah(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "Belum ditentukan";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
