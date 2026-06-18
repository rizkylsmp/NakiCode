import {
  ArrowLeft,
  BadgeCheck,
  CreditCard,
  ExternalLink,
  LockKeyhole,
  QrCode,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPost } from "../api-client";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import {
  canConfirmPaymentManually,
  getPaymentStatusLabel,
  getWaitingPaymentMessage,
  type OrderItem,
} from "../order-types";
import { userSessionEvent, userTokenKey } from "../user-session";

type PaymentMethod = "qris" | "dana" | "manual";

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
  {
    value: "manual",
    title: "Manual/dev",
    description: "Mode testing lokal untuk simulasi pembayaran.",
    icon: CreditCard,
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("qris");
  const [status, setStatus] = useState("Memuat checkout...");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [couponStatus, setCouponStatus] = useState("Kupon opsional.");

  const loadOrder = useCallback(async () => {
    if (!userToken) {
      setOrder(null);
      setStatus("Login user diperlukan untuk checkout.");
      return;
    }

    if (!Number.isFinite(parsedOrderId)) {
      setStatus("Order checkout tidak valid.");
      return;
    }

    setIsLoading(true);
    setStatus("Memuat detail order...");

    try {
      const data = await apiGet<{ order: OrderItem }>(
        `/api/orders/my/${parsedOrderId}`,
      );
      const selectedOrder = data.order ?? null;

      setOrder(selectedOrder);
      setStatus(
        selectedOrder
          ? "Pilih metode pembayaran untuk melanjutkan."
          : "Order tidak ditemukan di akun ini.",
      );
    } catch {
      setStatus("Gagal memuat checkout. Pastikan backend aktif.");
    } finally {
      setIsLoading(false);
    }
  }, [parsedOrderId, userToken]);

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

  async function startPayment() {
    if (!userToken || !order) {
      setStatus("Order belum siap diproses.");
      return;
    }

    const paymentWindow = window.open("about:blank", "_blank");

    setIsProcessing(true);
    setStatus("Membuat sesi pembayaran...");

    try {
      const data = await apiPost<{ order: OrderItem }>(
        `/api/orders/${order.id}/payment`,
        {
          method: paymentMethod,
          couponCode: couponCode.trim() || undefined,
          referralCode: referralCode.trim() || undefined,
        },
      );
      setOrder(data.order);
      if (data.order.paymentUrl) {
        openPaymentPage(data.order.paymentUrl, paymentWindow);
        setStatus(
          "Pembayaran siap. Halaman bayar sudah dibuka, status akan berubah otomatis setelah gateway mengirim webhook.",
        );
      } else {
        paymentWindow?.close();
        setStatus("Pembayaran siap. Buka halaman bayar untuk melanjutkan.");
      }
    } catch {
      paymentWindow?.close();
      setStatus("Gagal membuat pembayaran. Coba metode lain atau ulangi.");
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
      setStatus("Pembayaran berhasil. Source code sudah terbuka.");
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
        amount: parseCurrencyAmount(order.templatePrice ?? order.budgetRange),
      });

      setCouponStatus(
        `${data.coupon.description}. Diskon Rp${data.coupon.discountAmount.toLocaleString("id-ID")}, total Rp${data.coupon.finalAmount.toLocaleString("id-ID")}.`,
      );
    } catch {
      setCouponStatus("Kupon tidak valid atau sudah kedaluwarsa.");
    }
  }

  return (
    <main className="naki-frosted-grid min-h-screen text-naki-primary">
      <Header />

      <section className="w-full px-5 py-10 md:px-8 xl:px-12 2xl:px-16">
        <button
          className="inline-flex items-center gap-2 text-sm font-black text-naki-secondary"
          onClick={() => navigate(-1)}
          type="button"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded-xl border border-naki-steel bg-naki-frost p-5 shadow-naki-card">
            <p className="text-sm font-black uppercase text-naki-secondary">
              Checkout
            </p>
            <h1 className="mt-2 text-4xl font-black leading-tight md:text-5xl">
              Pilih metode pembayaran
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-naki-smoke">
              Bayar langsung dari website. Setelah pembayaran berhasil, source
              code dan panduan akan terbuka di Pesanan Saya.
            </p>

            <p
              className="mt-5 inline-flex rounded-lg border border-naki-steel bg-naki-steel px-4 py-3 text-sm font-black text-naki-secondary"
              aria-live="polite"
              role="status"
            >
              {status}
            </p>

            {!userToken ? (
              <div className="mt-6 rounded-lg border border-naki-steel bg-naki-steel p-5">
                <LockKeyhole className="text-naki-secondary" size={28} />
                <h2 className="mt-3 text-xl font-black">Login diperlukan.</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-naki-smoke">
                  Checkout hanya bisa diproses oleh akun pembeli.
                </p>
                <Link
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-naki-secondary px-5 text-sm font-black text-naki-frost"
                  to={`/login?next=${encodeURIComponent(
                    `/checkout/${orderId ?? ""}`,
                  )}`}
                >
                  Login
                </Link>
              </div>
            ) : order ? (
              <div className="mt-6 grid gap-4">
                <div className="grid gap-3 md:grid-cols-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isActive = paymentMethod === method.value;

                    return (
                      <button
                        key={method.value}
                        className={`min-h-36 rounded-xl border p-4 text-left transition ${
                          isActive
                            ? "border-naki-secondary bg-naki-primary text-naki-frost shadow-naki-soft"
                            : "border-naki-steel bg-naki-frost text-naki-primary hover:border-naki-secondary"
                        }`}
                        onClick={() => setPaymentMethod(method.value)}
                        type="button"
                      >
                        <Icon
                          className={
                            isActive ? "text-naki-frost" : "text-naki-secondary"
                          }
                          size={26}
                        />
                        <p className="mt-4 text-lg font-black">
                          {method.title}
                        </p>
                        <p
                          className={`mt-2 text-sm font-semibold leading-6 ${
                            isActive ? "text-naki-frost" : "text-naki-smoke"
                          }`}
                        >
                          {method.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-naki-steel bg-naki-steel p-5">
                  <div className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <label className="grid gap-1.5 text-sm font-black">
                      Kode kupon
                      <input
                        className="h-11 rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold uppercase outline-none focus:border-naki-secondary"
                        value={couponCode}
                        onChange={(event) => setCouponCode(event.target.value)}
                        placeholder="NAKIHEMAT"
                        type="text"
                      />
                    </label>
                    <label className="grid gap-1.5 text-sm font-black">
                      Referral
                      <input
                        className="h-11 rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold uppercase outline-none focus:border-naki-secondary"
                        value={referralCode}
                        onChange={(event) =>
                          setReferralCode(event.target.value)
                        }
                        placeholder="AFFILIATE"
                        type="text"
                      />
                    </label>
                    <button
                      className="self-end rounded-lg border border-naki-steel px-4 py-3 text-sm font-black text-naki-secondary transition hover:border-naki-smoke"
                      onClick={() => void validateCoupon()}
                      type="button"
                    >
                      Cek kupon
                    </button>
                  </div>
                  <p
                    className="mb-5 text-sm font-semibold text-naki-smoke"
                    aria-live="polite"
                    role="status"
                  >
                    {couponStatus}
                  </p>
                  <div className="flex items-center gap-2 text-sm font-black">
                    <ShieldCheck className="text-naki-secondary" size={18} />
                    Status pembayaran
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-naki-smoke">
                    {getPaymentStatusLabel(order.paymentStatus)}
                    {order.paymentReference
                      ? ` - Ref ${order.paymentReference}`
                      : ""}
                  </p>
                  {order.paymentStatus === "waiting_payment" ? (
                    <p className="mt-2 rounded-lg border border-naki-steel bg-naki-frost px-3 py-2 text-sm font-semibold leading-6 text-naki-smoke">
                      {getWaitingPaymentMessage(order)}
                    </p>
                  ) : null}
                  {order.paymentMethod ? (
                    <p className="mt-2 text-sm font-bold text-naki-smoke">
                      Metode aktif: {order.paymentMethod}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    {order.paymentStatus === "paid" ? (
                      <Link
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-naki-primary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-secondary"
                        to="/pesanan-saya"
                      >
                        <BadgeCheck size={16} />
                        Buka source code
                      </Link>
                    ) : (
                      <button
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-naki-secondary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-primary disabled:cursor-not-allowed disabled:bg-naki-smoke"
                        disabled={isProcessing || isLoading}
                        onClick={() => void startPayment()}
                        type="button"
                      >
                        <CreditCard size={16} />
                        {isProcessing ? "Memproses..." : "Buat pembayaran"}
                      </button>
                    )}
                    {order.paymentUrl ? (
                      <a
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-naki-steel px-4 text-sm font-black text-naki-secondary transition hover:border-naki-smoke"
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
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-naki-primary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-secondary disabled:cursor-not-allowed disabled:bg-naki-smoke"
                        disabled={isProcessing}
                        onClick={() => void confirmPayment()}
                        type="button"
                      >
                        <BadgeCheck size={16} />
                        Konfirmasi dev
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-lg border border-naki-steel bg-naki-steel p-5">
                <RefreshCw className="text-naki-secondary" size={28} />
                <h2 className="mt-3 text-xl font-black">Order belum ketemu.</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-naki-smoke">
                  Pastikan kamu membuka checkout dari akun yang sama.
                </p>
                <Link
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-naki-secondary px-5 text-sm font-black text-naki-frost"
                  to="/pesanan-saya"
                >
                  Buka Pesanan Saya
                </Link>
              </div>
            )}
          </div>

          <aside className="h-fit rounded-xl border border-naki-steel bg-naki-frost p-5 shadow-naki-card lg:sticky lg:top-24">
            <p className="text-sm font-black text-naki-smoke">
              Ringkasan order
            </p>
            {order ? (
              <>
                <h2 className="mt-2 text-2xl font-black">
                  {order.templateTitle}
                </h2>
                <div className="mt-5 grid gap-3">
                  <CheckoutInfo label="Order" value={`#${order.id}`} />
                  <CheckoutInfo
                    label="Harga"
                    value={order.templatePrice ?? order.budgetRange}
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
              </>
            ) : (
              <p className="mt-3 text-sm font-semibold leading-6 text-naki-smoke">
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
    <div className="rounded-lg bg-naki-steel p-4">
      <p className="text-xs font-black uppercase text-naki-smoke">{label}</p>
      <p className="mt-1 text-sm font-black text-naki-primary">{value}</p>
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

function parseCurrencyAmount(value: string | null | undefined) {
  const text = String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "");
  const numericValue = Number(
    text
      .replace(/rp/g, "")
      .replace(/[^\d.,]/g, "")
      .replace(/\./g, "")
      .replace(",", "."),
  );

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 1000;
  }

  if (text.includes("jt") || text.includes("juta")) {
    return Math.round(numericValue * 1_000_000);
  }

  if (text.includes("k")) {
    return Math.round(numericValue * 1000);
  }

  return Math.round(numericValue);
}
