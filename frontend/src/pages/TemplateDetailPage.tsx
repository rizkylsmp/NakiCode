import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Code2,
  Copy,
  CreditCard,
  FileCode2,
  Heart,
  HeartHandshake,
  LockKeyhole,
  LogIn,
  MessageSquareText,
  ShieldCheck,
  Send,
  Share2,
  ShoppingBag,
  Star,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  apiPost,
  getApiErrorData,
  getApiErrorMessage,
  getApiErrorStatus,
} from "../api-client";
import { trackEvent } from "../analytics";
import {
  initializeCaptcha,
  validateCaptcha,
  type CaptchaState,
} from "../auth-captcha";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { ResponsiveImage } from "../components/ResponsiveImage";
import { getTemplateBySlug, type TemplateItem } from "../content";
import type { OrderItem } from "../order-types";
import { saveRecentlyViewedTemplate } from "../template-activity";
import { useFavoriteTemplates } from "../use-favorites";
import {
  userRoleKey,
  userSessionEvent,
  userTokenKey,
  userUsernameKey,
} from "../user-session";

type TemplateDetailPageProps = {
  templates: TemplateItem[];
};

type ConsultationFormState = {
  customerName: string;
  customerContact: string;
  projectType: string;
  budgetRange: string;
  message: string;
};

type UserAuthFormState = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type OrderMutationResponse = {
  order: OrderItem;
};

type UserAuthResponse = {
  token?: string;
  user?: {
    id?: number;
    username: string;
    email?: string;
    role?: "user" | "admin";
  };
  verificationEmail?: string | null;
  verificationUrl?: string | null;
  message?: string;
};

const defaultConsultationForm: ConsultationFormState = {
  customerName: "",
  customerContact: "",
  projectType: "Beli template",
  budgetRange: "Di bawah Rp500K",
  message: "",
};

const defaultUserAuthForm: UserAuthFormState = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function TemplateDetailPage({ templates }: TemplateDetailPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const template = getTemplateBySlug(templates, slug);
  const { favoriteIds, isFavoriteLoading, toggleFavorite } =
    useFavoriteTemplates();
  const nextTarget = getNextTargetFromLocation(location);
  const [consultationForm, setConsultationForm] = useState(
    defaultConsultationForm,
  );
  const [isSubmittingConsultation, setIsSubmittingConsultation] =
    useState(false);
  const [consultationStatus, setConsultationStatus] = useState(
    "Isi form singkat, nanti request masuk ke admin.",
  );
  const [userToken, setUserToken] = useState(() =>
    window.localStorage.getItem(userTokenKey),
  );
  const [userUsername, setUserUsername] = useState(
    () => window.localStorage.getItem(userUsernameKey) ?? "",
  );
  const [userAuthMode, setUserAuthMode] = useState<"login" | "register">(
    "login",
  );
  const [userAuthForm, setUserAuthForm] = useState(defaultUserAuthForm);
  const [isSubmittingUserAuth, setIsSubmittingUserAuth] = useState(false);
  const [userAuthStatus, setUserAuthStatus] = useState(
    "Masuk atau daftar dulu sebelum order template.",
  );
  const [verificationUrl, setVerificationUrl] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaState>(() =>
    initializeCaptcha(),
  );
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState(
    "Buat order lalu lanjut ke halaman checkout.",
  );
  const [shareStatus, setShareStatus] = useState("");
  const [expandedPreview, setExpandedPreview] = useState<{
    image: string;
    caption: string;
  } | null>(null);

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
    if (template) {
      saveRecentlyViewedTemplate(template);
      // Track template view for analytics
      trackEvent("template_viewed", {
        template_id: template.id,
        template_slug: template.slug,
        template_title: template.title,
        template_category: template.category,
        template_price: template.price,
      });
    }
  }, [template]);

  useEffect(() => {
    if (!expandedPreview) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setExpandedPreview(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [expandedPreview]);

  if (!template) {
    return (
      <main className="naki-frosted-grid min-h-screen text-naki-primary">
        <Header />
        <section className="grid min-h-[70vh] place-items-center px-5 py-16 text-center">
          <div>
            <h1 className="text-4xl font-black">Template tidak ditemukan.</h1>
            <p className="mt-3 text-naki-smoke">
              Coba kembali ke katalog dan pilih template lain.
            </p>
            <Link
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-naki-secondary px-5 text-sm font-black text-naki-frost"
              to="/#template"
            >
              <ArrowLeft size={16} />
              Kembali ke katalog
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  const selectedTemplate = template;
  const relatedTemplates = templates
    .filter(
      (item) =>
        item.id !== selectedTemplate.id &&
        item.category === selectedTemplate.category,
    )
    .slice(0, 3);
  const whatsappMessage = encodeURIComponent(
    `Halo Naki Code, saya mau konsultasi/beli template ${selectedTemplate.title}.`,
  );
  const shareUrl = `${window.location.origin}/templates/${selectedTemplate.slug}`;
  const shareText = encodeURIComponent(
    `${selectedTemplate.title} dari Naki Code`,
  );
  function updateConsultationField<Key extends keyof ConsultationFormState>(
    key: Key,
    value: ConsultationFormState[Key],
  ) {
    setConsultationForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateUserAuthField<Key extends keyof UserAuthFormState>(
    key: Key,
    value: UserAuthFormState[Key],
  ) {
    setUserAuthForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function submitUserAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (userAuthMode === "register") {
      if (userAuthForm.password !== userAuthForm.confirmPassword) {
        setUserAuthStatus("Konfirmasi password belum sama.");
        return;
      }

      // Validate captcha (checkbox + honeypot + timing)
      const captchaValidation = validateCaptcha(captcha);
      if (!captchaValidation.valid) {
        setUserAuthStatus(
          captchaValidation.error || "Validasi keamanan gagal.",
        );
        return;
      }
    }

    setIsSubmittingUserAuth(true);
    setUserAuthStatus(
      userAuthMode === "login" ? "Memeriksa akun..." : "Membuat akun...",
    );

    try {
      const data = await apiPost<UserAuthResponse>(
        userAuthMode === "login"
          ? "/api/auth/user/login"
          : "/api/auth/user/register",
        userAuthMode === "login"
          ? {
              identifier: userAuthForm.username,
              password: userAuthForm.password,
            }
          : {
              username: userAuthForm.username,
              email: userAuthForm.email,
              password: userAuthForm.password,
            },
      );
      setUserAuthForm(defaultUserAuthForm);
      setCaptcha(initializeCaptcha());
      if (data.token && data.user) {
        const authenticatedUser = data.user;

        window.localStorage.setItem(userTokenKey, data.token);
        window.localStorage.setItem(
          userUsernameKey,
          authenticatedUser.username,
        );
        window.localStorage.setItem(
          userRoleKey,
          authenticatedUser.role ?? "user",
        );
        window.dispatchEvent(new Event(userSessionEvent));
        setUserToken(data.token);
        setUserUsername(authenticatedUser.username);
        setVerificationUrl("");
        if (authenticatedUser.role === "admin") {
          navigate("/admin/dashboard", { replace: true });
          return;
        }
        setUserAuthStatus(`Masuk sebagai ${authenticatedUser.username}.`);
        setConsultationForm((current) => ({
          ...current,
          customerName: current.customerName || authenticatedUser.username,
        }));
        return;
      }

      if (data.verificationUrl || data.verificationEmail) {
        const nextVerificationUrl = appendNextParam(
          data.verificationUrl ||
            `/verify-email?email=${encodeURIComponent(
              data.verificationEmail ?? data.user?.email ?? userAuthForm.email,
            )}`,
          nextTarget,
        );
        setVerificationUrl(nextVerificationUrl);
        const username = data.user?.username ?? "";

        if (username) {
          setConsultationForm((current) => ({
            ...current,
            customerName: current.customerName || username,
          }));
        }
        setUserAuthStatus(
          "Akun berhasil dibuat. OTP sudah dikirim ke email pendaftar.",
        );
        navigate(nextVerificationUrl, { replace: true });
        return;
      }

      setUserAuthStatus(
        "Akun berhasil diproses. OTP verifikasi sudah dikirim ke email.",
      );
    } catch (error) {
      const errorData = getApiErrorData<UserAuthResponse>(error);

      if (getApiErrorStatus(error) === 403 && errorData?.verificationUrl) {
        const nextVerificationUrl = appendNextParam(
          errorData.verificationUrl,
          nextTarget,
        );
        setVerificationUrl(nextVerificationUrl);
        setUserAuthStatus(
          "Email belum diverifikasi. Cek inbox atau buka verifikasi di bawah.",
        );
        navigate(nextVerificationUrl, { replace: true });
        return;
      }

      setUserAuthStatus(
        getApiErrorMessage(
          error,
          userAuthMode === "login"
            ? "Login gagal. Cek username/email dan password."
            : "Daftar gagal. Username/email mungkin sudah dipakai.",
        ),
      );
      if (userAuthMode === "register") {
        setCaptcha(initializeCaptcha());
      }
      setUserAuthForm(defaultUserAuthForm);
    } finally {
      setIsSubmittingUserAuth(false);
    }
  }

  async function submitConsultation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userToken) {
      setConsultationStatus("Login user diperlukan sebelum membuat order.");
      return;
    }

    setIsSubmittingConsultation(true);
    setConsultationStatus("Mengirim request konsultasi...");

    try {
      await apiPost<OrderMutationResponse>("/api/orders", {
        templateId: selectedTemplate.id,
        templateSlug: selectedTemplate.slug,
        templateTitle: selectedTemplate.title,
        ...consultationForm,
      });

      // Track order creation for analytics
      trackEvent("order_created", {
        template_id: selectedTemplate.id,
        template_slug: selectedTemplate.slug,
        template_title: selectedTemplate.title,
        project_type: consultationForm.projectType,
        budget_range: consultationForm.budgetRange,
      });

      setConsultationForm({
        ...defaultConsultationForm,
        projectType: consultationForm.projectType,
        budgetRange: consultationForm.budgetRange,
      });
      setConsultationStatus(
        "Order terkirim. Lanjutkan pembayaran lewat menu Pesanan Saya.",
      );
    } catch {
      setConsultationStatus(
        "Gagal mengirim request. Kamu masih bisa lanjut via WhatsApp.",
      );
    } finally {
      setIsSubmittingConsultation(false);
    }
  }

  async function startDirectCheckout() {
    if (!userToken) {
      setCheckoutStatus("Login user diperlukan sebelum checkout.");
      return;
    }

    const customerContact =
      consultationForm.customerContact.trim() || userUsername || "Akun pembeli";

    setIsStartingCheckout(true);
    setCheckoutStatus("Membuat order dan sesi pembayaran...");

    try {
      const orderData = await apiPost<OrderMutationResponse>("/api/orders", {
        templateId: selectedTemplate.id,
        templateSlug: selectedTemplate.slug,
        templateTitle: selectedTemplate.title,
        customerName:
          consultationForm.customerName.trim() || userUsername || "Buyer",
        customerContact,
        projectType: "Checkout template",
        budgetRange: selectedTemplate.price,
        message: `Pembelian langsung template ${selectedTemplate.title}. Kirim source code dan panduan setelah pembayaran berhasil.`,
      });

      // Track order creation for analytics
      trackEvent("order_created", {
        template_id: selectedTemplate.id,
        template_slug: selectedTemplate.slug,
        template_title: selectedTemplate.title,
        order_id: orderData.order.id,
        checkout_flow: "direct",
      });

      setCheckoutStatus("Order dibuat. Mengarahkan ke checkout...");
      navigate(`/checkout/${orderData.order.id}`);
    } catch {
      setCheckoutStatus(
        "Gagal memulai checkout. Coba lagi atau gunakan konsultasi WhatsApp.",
      );
    } finally {
      setIsStartingCheckout(false);
    }
  }

  // Generate structured data for SEO
  const extractPrice = (priceString: string): string => {
    const match = priceString.match(/[\d.]+/g);
    return match ? match.join("").replace(/\./g, "") : "0";
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: selectedTemplate.title,
    description: selectedTemplate.description,
    image:
      selectedTemplate.preview[0]?.image ||
      `${window.location.origin}/og-image.png`,
    brand: {
      "@type": "Organization",
      name: "Naki Code",
    },
    offers: {
      "@type": "Offer",
      price: extractPrice(selectedTemplate.price),
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
      url: shareUrl,
    },
    ...(selectedTemplate.rating > 0 && selectedTemplate.buyerCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: selectedTemplate.rating.toFixed(1),
            reviewCount: selectedTemplate.buyerCount,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${window.location.origin}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: selectedTemplate.category,
        item: `${window.location.origin}/#template`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: selectedTemplate.title,
        item: shareUrl,
      },
    ],
  };

  return (
    <main className="naki-frosted-grid min-h-screen text-naki-primary">
      <Helmet>
        <title>{selectedTemplate.title} - Naki Code</title>
        <meta name="description" content={selectedTemplate.description} />
        <link rel="canonical" href={shareUrl} />
        <meta
          property="og:title"
          content={`${selectedTemplate.title} - Naki Code`}
        />
        <meta
          property="og:description"
          content={selectedTemplate.description}
        />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={shareUrl} />
        {selectedTemplate.preview[0]?.image ? (
          <meta
            property="og:image"
            content={selectedTemplate.preview[0].image}
          />
        ) : null}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`${selectedTemplate.title} - Naki Code`}
        />
        <meta
          name="twitter:description"
          content={selectedTemplate.description}
        />
        {selectedTemplate.preview[0]?.image ? (
          <meta
            name="twitter:image"
            content={selectedTemplate.preview[0].image}
          />
        ) : null}

        {/* JSON-LD Structured Data for SEO */}
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>
      <Header />

      <section className="grid w-full gap-8 px-5 py-10 md:px-8 lg:grid-cols-[1fr_320px] xl:px-12 2xl:px-16">
        <div className="min-w-0">
          <Link
            className="inline-flex items-center gap-2 text-sm font-black text-naki-secondary"
            to="/#template"
          >
            <ArrowLeft size={16} />
            Kembali ke katalog
          </Link>
          <nav
            className="mt-4 flex flex-wrap items-center gap-2 text-sm font-black text-naki-smoke"
            aria-label="Breadcrumb"
          >
            <Link className="hover:text-naki-primary" to="/">
              Home
            </Link>
            <span>/</span>
            <Link className="hover:text-naki-primary" to="/#template">
              {selectedTemplate.category}
            </Link>
            <span>/</span>
            <span className="text-naki-primary">{selectedTemplate.title}</span>
          </nav>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-stretch">
            <div className="rounded-xl border border-naki-steel bg-naki-primary p-5 text-naki-frost shadow-naki-soft">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-naki-frost" />
                  <span className="size-3 rounded-full bg-naki-steel" />
                  <span className="size-3 rounded-full bg-naki-secondary" />
                </div>
                <span className="rounded-md bg-naki-frost/10 px-2.5 py-1 text-xs font-bold">
                  Live Preview
                </span>
              </div>

              <div className="mt-8 rounded-lg bg-naki-frost p-4 text-naki-primary">
                <div className="flex items-start gap-3">
                  <span
                    className={`grid size-12 shrink-0 place-items-center rounded-lg ${template.accentClass}`}
                  >
                    <Code2 className="text-naki-frost" size={22} />
                  </span>
                  <div>
                    <p className="text-sm font-black text-naki-secondary">
                      {template.category}
                    </p>
                    <h2 className="mt-1 text-2xl font-black leading-tight">
                      {template.title}
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {template.preview.map((item, index) =>
                    item.image ? (
                      <figure
                        key={`${item.image}-${index}`}
                        className="grid gap-2 rounded-xl bg-naki-steel p-2"
                      >
                        <button
                          className="group relative overflow-hidden rounded-lg text-left"
                          onClick={() =>
                            setExpandedPreview({
                              image: item.image,
                              caption:
                                item.caption ||
                                `${template.title} preview ${index + 1}`,
                            })
                          }
                          type="button"
                          aria-label={`Perbesar preview ${index + 1}`}
                        >
                          <ResponsiveImage
                            className="h-48 w-full rounded-lg object-cover transition group-hover:scale-[1.02]"
                            src={item.image}
                            sizes="(min-width: 1024px) 36vw, 100vw"
                            alt={item.caption || `${template.title} preview`}
                          />
                          <span className="absolute bottom-3 right-3 rounded-md bg-naki-primary px-2.5 py-1 text-xs font-black text-naki-frost opacity-0 shadow-sm transition group-hover:opacity-100">
                            Klik untuk perbesar
                          </span>
                        </button>
                        <figcaption className="rounded-lg bg-naki-frost p-3 text-sm font-black">
                          {item.caption || `Preview ${index + 1}`}
                        </figcaption>
                      </figure>
                    ) : (
                      <div
                        key={`${item.caption}-${index}`}
                        className="rounded-lg bg-naki-steel p-4 text-sm font-black"
                      >
                        {item.caption}
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-naki-secondary p-4 font-mono text-xs leading-6">
                <p>$ npm install</p>
                <p>$ npm run dev</p>
                <p>template: {template.slug}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-black uppercase text-naki-secondary">
                {template.category}
              </p>
              <h1 className="mt-3 text-5xl font-black leading-[1.02] tracking-normal md:text-6xl">
                {template.title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-naki-smoke">
                {template.description}
              </p>

              <div className="mt-6 rounded-md bg-naki-steel px-3 py-2 text-xs font-black leading-6">
                {template.stack.join(", ")}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                <Metric
                  icon={Star}
                  label="Rating"
                  value={
                    template.rating > 0 ? template.rating.toFixed(1) : "Baru"
                  }
                />
                <Metric
                  icon={UsersRound}
                  label="Pembeli"
                  value={String(template.buyerCount)}
                />
                <Metric icon={FileCode2} label="Level" value={template.level} />
              </div>

              {userToken ? (
                <button
                  className={`mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-black transition ${
                    favoriteIds.has(template.id)
                      ? "border-naki-secondary bg-naki-secondary text-naki-frost"
                      : "border-naki-steel bg-naki-frost text-naki-secondary hover:border-naki-smoke"
                  }`}
                  disabled={isFavoriteLoading}
                  onClick={() => toggleFavorite(template.id)}
                  type="button"
                >
                  <Heart
                    size={17}
                    fill={
                      favoriteIds.has(template.id) ? "currentColor" : "none"
                    }
                  />
                  {favoriteIds.has(template.id)
                    ? "Tersimpan di wishlist"
                    : "Simpan ke wishlist"}
                </button>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-naki-steel px-3 text-sm font-black text-naki-secondary transition hover:border-naki-smoke"
                  onClick={() =>
                    void shareTemplate(
                      selectedTemplate.title,
                      shareUrl,
                      setShareStatus,
                    )
                  }
                  type="button"
                >
                  <Share2 size={15} />
                  Share
                </button>
                <a
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-naki-steel px-3 text-sm font-black text-naki-secondary transition hover:border-naki-smoke"
                  href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  WhatsApp
                </a>
                <a
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-naki-steel px-3 text-sm font-black text-naki-secondary transition hover:border-naki-smoke"
                  href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  X/Twitter
                </a>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-naki-steel px-3 text-sm font-black text-naki-secondary transition hover:border-naki-smoke"
                  onClick={() => void copyShareLink(shareUrl, setShareStatus)}
                  type="button"
                >
                  <Copy size={15} />
                  Copy link
                </button>
              </div>
              <p className="sr-only" aria-live="polite">
                {shareStatus}
              </p>

              <section className="mt-6 grid gap-5 lg:grid-cols-2">
                <DetailBlock title="Fitur utama" items={template.features} />
                <DetailBlock
                  title="Isi source code"
                  items={template.includedFiles}
                />
                <DetailBlock title="Cocok untuk" items={template.suitableFor} />
                <div className="rounded-lg border border-naki-steel bg-naki-frost p-5 shadow-naki-card">
                  <ShieldCheck className="text-naki-secondary" size={24} />
                  <h2 className="mt-4 text-xl font-black">
                    Lisensi dan support
                  </h2>
                  <p className="mt-3 leading-7 text-naki-smoke">
                    {template.license}
                  </p>
                  <p className="mt-3 leading-7 text-naki-smoke">
                    {template.support}
                  </p>
                </div>
              </section>

              <section className="mt-6 rounded-lg border border-naki-steel bg-naki-frost p-5 shadow-naki-card">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-naki-steel text-naki-secondary">
                    <MessageSquareText size={18} />
                  </span>
                  <div>
                    <h2 className="text-xl font-black">Review buyer</h2>
                    <p className="text-sm font-semibold text-naki-smoke">
                      Ulasan tampil setelah pembeli memberi rating.
                    </p>
                  </div>
                </div>
                {template.reviews?.length ? (
                  <div className="mt-4 grid gap-3">
                    {template.reviews.map((review) => (
                      <article
                        key={review.id}
                        className="rounded-lg bg-naki-steel p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-black text-naki-primary">
                            {review.customerName}
                          </p>
                          <span className="inline-flex items-center gap-1 text-sm font-black text-naki-secondary">
                            <Star size={14} fill="currentColor" />
                            {review.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="mt-2 leading-7 text-naki-smoke">
                          {review.message}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-lg bg-naki-steel p-4 text-sm font-semibold leading-6 text-naki-smoke">
                    Belum ada review tertulis untuk template ini.
                  </p>
                )}
              </section>
            </div>
          </div>

          {relatedTemplates.length > 0 ? (
            <section className="mt-10">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase text-naki-secondary">
                    Template terkait
                  </p>
                  <h2 className="mt-2 text-2xl font-black">
                    Kategori {selectedTemplate.category}
                  </h2>
                </div>
                <Link
                  className="hidden text-sm font-black text-naki-secondary sm:inline-flex"
                  to="/#template"
                >
                  Lihat katalog
                </Link>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {relatedTemplates.map((item) => (
                  <Link
                    key={item.id}
                    className="group overflow-hidden rounded-xl border border-naki-steel bg-naki-frost shadow-naki-card transition hover:-translate-y-0.5 hover:shadow-naki-soft"
                    to={`/templates/${item.slug}`}
                  >
                    {item.preview[0]?.image ? (
                      <ResponsiveImage
                        className="h-40 w-full object-cover"
                        src={item.preview[0].image}
                        sizes="(min-width: 768px) 30vw, 100vw"
                        alt={item.preview[0].caption || item.title}
                      />
                    ) : null}
                    <div className="p-4">
                      <p className="text-xs font-black uppercase text-naki-secondary">
                        {item.category}
                      </p>
                      <h3 className="mt-2 text-lg font-black group-hover:text-naki-secondary">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm font-semibold text-naki-smoke">
                        {item.price} - {item.level}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="h-fit rounded-xl border border-naki-steel bg-naki-frost p-5 shadow-naki-card lg:sticky lg:top-24">
          <p className="text-sm font-black text-naki-smoke">Harga template</p>
          <p className="mt-2 text-5xl font-black">{template.price}</p>
          <p className="mt-3 leading-7 text-naki-smoke">
            Pembelian berisi source code dan panduan setup. Custom fitur bisa
            dibahas terpisah lewat konsultasi.
          </p>

          {userToken ? (
            <div className="mt-5 grid gap-3 rounded-lg border border-naki-steel bg-naki-steel p-4">
              <div className="flex items-center gap-2 text-sm font-black">
                <ShoppingBag className="text-naki-secondary" size={17} />
                Checkout
              </div>
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-naki-secondary px-5 text-sm font-black text-naki-frost transition hover:bg-naki-primary disabled:cursor-not-allowed disabled:bg-naki-smoke"
                disabled={isStartingCheckout}
                onClick={() => void startDirectCheckout()}
                type="button"
              >
                <CreditCard size={17} />
                {isStartingCheckout ? "Memproses..." : "Checkout"}
              </button>
              <p
                className="text-sm font-semibold leading-6 text-naki-smoke"
                aria-live="polite"
                role="status"
              >
                {checkoutStatus}
              </p>
            </div>
          ) : null}

          {!userToken ? (
            <div className="mt-5 grid gap-3">
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-naki-primary px-5 text-sm font-black text-naki-frost transition hover:bg-naki-secondary"
                to={appendNextParam("/login", nextTarget)}
              >
                <CreditCard size={17} />
                Login untuk beli langsung
              </Link>
            </div>
          ) : null}

          <div className="mt-6 rounded-lg bg-naki-steel p-4">
            <div className="flex items-center gap-2 text-sm font-black">
              <HeartHandshake className="text-naki-secondary" size={22} />
              <p className="text-sm font-black">Bisa request custom</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-naki-smoke">
              Tambah halaman, ubah alur checkout, sambungkan backend, atau
              sesuaikan desain dengan brand.
            </p>
            <a
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-naki-secondary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-primary"
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}?text=${whatsappMessage}`}
              rel="noreferrer"
              target="_blank"
            >
              Konsultasi via WhatsApp
              <ArrowRight size={16} />
            </a>
          </div>

          {!userToken ? (
            <>
              <UserAuthPanel
                captcha={captcha}
                form={userAuthForm}
                forgotPasswordUrl={appendNextParam(
                  "/forgot-password",
                  nextTarget,
                )}
                isSubmitting={isSubmittingUserAuth}
                mode={userAuthMode}
                status={userAuthStatus}
                onModeChange={setUserAuthMode}
                onUpdateCaptcha={setCaptcha}
                onSubmit={submitUserAuth}
                onUpdateField={updateUserAuthField}
              />
              {verificationUrl ? (
                <div className="mt-4 rounded-lg border border-naki-steel bg-naki-steel p-4">
                  <p className="text-sm font-black text-naki-primary">
                    Link verifikasi
                  </p>
                  <Link
                    className="mt-2 inline-flex text-sm font-bold text-naki-secondary underline decoration-dotted underline-offset-4"
                    to={verificationUrl}
                  >
                    Buka verifikasi email
                  </Link>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="mt-6 flex items-center gap-3 rounded-lg border border-naki-steel bg-naki-frost p-4">
                <span className="grid size-10 place-items-center rounded-lg bg-naki-steel text-naki-secondary">
                  <UserRound size={18} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase text-naki-smoke">
                    Login user
                  </p>
                  <p className="text-sm font-black">{userUsername}</p>
                </div>
              </div>
              <form
                className="mt-6 grid gap-3 border-t border-naki-steel pt-5"
                onSubmit={submitConsultation}
              >
                <div>
                  <h2 className="text-xl font-black">Form konsultasi</h2>
                  <p className="mt-2 text-sm leading-6 text-naki-smoke">
                    Kirim brief singkat supaya kebutuhanmu tercatat.
                  </p>
                </div>

                <ConsultationField
                  label="Nama"
                  value={consultationForm.customerName}
                  onChange={(value) =>
                    updateConsultationField("customerName", value)
                  }
                  required
                />
                <ConsultationField
                  label="WhatsApp / email"
                  value={consultationForm.customerContact}
                  onChange={(value) =>
                    updateConsultationField("customerContact", value)
                  }
                  required
                />
                <label className="grid gap-1.5 text-sm font-black">
                  Kebutuhan
                  <select
                    className="h-11 rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold outline-none focus:border-naki-secondary"
                    value={consultationForm.projectType}
                    onChange={(event) =>
                      updateConsultationField("projectType", event.target.value)
                    }
                  >
                    <option>Beli template</option>
                    <option>Custom template</option>
                    <option>Integrasi backend</option>
                    <option>Konsultasi project</option>
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-black">
                  Budget
                  <select
                    className="h-11 rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold outline-none focus:border-naki-secondary"
                    value={consultationForm.budgetRange}
                    onChange={(event) =>
                      updateConsultationField("budgetRange", event.target.value)
                    }
                  >
                    <option>Di bawah Rp500K</option>
                    <option>Rp500K - Rp1Jt</option>
                    <option>Rp1Jt - Rp3Jt</option>
                    <option>Di atas Rp3Jt</option>
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-black">
                  Brief singkat
                  <textarea
                    className="min-h-28 resize-y rounded-lg border border-naki-steel bg-naki-frost px-3 py-2 text-sm font-semibold leading-6 outline-none focus:border-naki-secondary"
                    value={consultationForm.message}
                    onChange={(event) =>
                      updateConsultationField("message", event.target.value)
                    }
                    placeholder="Contoh: Saya butuh template ini ditambah checkout WhatsApp dan admin order."
                    required
                  />
                </label>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-naki-primary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-secondary disabled:cursor-not-allowed disabled:bg-naki-smoke"
                  disabled={isSubmittingConsultation}
                  type="submit"
                >
                  <Send size={16} />
                  {isSubmittingConsultation ? "Mengirim..." : "Kirim request"}
                </button>
                <p
                  className="text-sm font-semibold leading-6 text-naki-smoke"
                  aria-live="polite"
                  role="status"
                >
                  {consultationStatus}
                </p>
              </form>
            </>
          )}
        </aside>
      </section>

      {expandedPreview ? (
        <div
          className="fixed inset-0 z-[500] grid place-items-center bg-naki-primary/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Preview template diperbesar"
          onClick={() => setExpandedPreview(null)}
        >
          <div
            className="relative grid max-h-[92vh] w-full max-w-6xl gap-3 rounded-xl border border-naki-steel bg-naki-frost p-3 shadow-naki-soft"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-lg bg-naki-primary text-naki-frost shadow-sm transition hover:bg-naki-secondary"
              onClick={() => setExpandedPreview(null)}
              type="button"
              aria-label="Tutup preview"
            >
              <X size={18} />
            </button>
            <img
              className="max-h-[76vh] w-full rounded-lg object-contain"
              src={expandedPreview.image}
              alt={expandedPreview.caption}
              loading="eager"
              decoding="async"
            />
            <p className="rounded-lg bg-naki-steel px-4 py-3 text-sm font-black text-naki-primary">
              {expandedPreview.caption}
            </p>
          </div>
        </div>
      ) : null}

      <Footer />
    </main>
  );
}

type ConsultationFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

type UserAuthPanelProps = {
  captcha: CaptchaState;
  form: UserAuthFormState;
  forgotPasswordUrl: string;
  isSubmitting: boolean;
  mode: "login" | "register";
  status: string;
  onModeChange: (mode: "login" | "register") => void;
  onUpdateCaptcha: (updater: (prev: CaptchaState) => CaptchaState) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdateField: <Key extends keyof UserAuthFormState>(
    key: Key,
    value: UserAuthFormState[Key],
  ) => void;
};

function UserAuthPanel({
  captcha,
  form,
  forgotPasswordUrl,
  isSubmitting,
  mode,
  status,
  onModeChange,
  onUpdateCaptcha,
  onSubmit,
  onUpdateField,
}: UserAuthPanelProps) {
  return (
    <section className="mt-6 grid gap-4 rounded-xl border border-naki-steel bg-naki-frost p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-naki-primary text-naki-frost">
          <LockKeyhole size={18} />
        </span>
        <div>
          <h2 className="text-xl font-black">Akun pembeli</h2>
          <p className="mt-1 text-sm leading-6 text-naki-smoke">
            Login atau daftar dulu untuk membuat order template.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg bg-naki-steel p-1">
        {(["login", "register"] as const).map((item) => (
          <button
            key={item}
            className={`h-10 rounded-md text-sm font-black transition ${
              mode === item
                ? "bg-naki-frost text-naki-primary shadow-sm"
                : "text-naki-smoke hover:text-naki-primary"
            }`}
            onClick={() => onModeChange(item)}
            type="button"
          >
            {item === "login" ? "Login" : "Daftar"}
          </button>
        ))}
      </div>

      <form className="grid gap-3" onSubmit={onSubmit}>
        <label className="grid gap-1.5 text-sm font-black">
          {mode === "login" ? "Username / email" : "Username"}
          <input
            className="h-11 rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold outline-none focus:border-naki-secondary"
            value={form.username}
            onChange={(event) => onUpdateField("username", event.target.value)}
            required
            type="text"
          />
        </label>
        {mode === "register" ? (
          <label className="grid gap-1.5 text-sm font-black">
            Email
            <input
              className="h-11 rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold outline-none focus:border-naki-secondary"
              value={form.email}
              onChange={(event) => onUpdateField("email", event.target.value)}
              required
              type="email"
            />
          </label>
        ) : null}
        <label className="grid gap-1.5 text-sm font-black">
          Password
          <input
            className="h-11 rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold outline-none focus:border-naki-secondary"
            value={form.password}
            onChange={(event) => onUpdateField("password", event.target.value)}
            required
            minLength={6}
            type="password"
          />
        </label>
        {mode === "login" ? (
          <Link
            className="w-fit text-sm font-black text-naki-secondary underline decoration-dotted underline-offset-4"
            to={forgotPasswordUrl}
          >
            Lupa password?
          </Link>
        ) : null}
        {mode === "register" ? (
          <>
            <label className="grid gap-1.5 text-sm font-black">
              Konfirmasi password
              <input
                className="h-11 rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold outline-none focus:border-naki-secondary"
                value={form.confirmPassword}
                onChange={(event) =>
                  onUpdateField("confirmPassword", event.target.value)
                }
                required
                minLength={6}
                type="password"
              />
            </label>

            {/* Honeypot field - hidden from humans, catches bots */}
            <input
              type="text"
              name="website"
              value={captcha.honeypot}
              onChange={(e) =>
                onUpdateCaptcha((prev) => ({
                  ...prev,
                  honeypot: e.target.value,
                }))
              }
              style={{
                position: "absolute",
                left: "-9999px",
                opacity: 0,
                height: 0,
              }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            {/* Checkbox captcha */}
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={captcha.isChecked}
                onChange={(e) =>
                  onUpdateCaptcha((prev) => ({
                    ...prev,
                    isChecked: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-naki-steel cursor-pointer"
                required
              />
              Saya bukan robot
            </label>
          </>
        ) : null}
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-naki-secondary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-primary disabled:cursor-not-allowed disabled:bg-naki-smoke"
          disabled={isSubmitting}
          type="submit"
        >
          <LogIn size={16} />
          {isSubmitting
            ? "Memproses..."
            : mode === "login"
              ? "Login user"
              : "Daftar user"}
        </button>
        <p
          className="text-sm font-semibold leading-6 text-naki-smoke"
          aria-live="polite"
          role="status"
        >
          {status}
        </p>
      </form>
    </section>
  );
}

function ConsultationField({
  label,
  value,
  onChange,
  required = false,
}: ConsultationFieldProps) {
  return (
    <label className="grid gap-1.5 text-sm font-black">
      {label}
      <input
        className="h-11 rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold outline-none focus:border-naki-secondary"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type="text"
      />
    </label>
  );
}

function getNextTargetFromLocation(location: {
  pathname: string;
  search: string;
  hash: string;
}) {
  const next = `${location.pathname}${location.search}${location.hash}`;

  if (!next || next === "/login" || next.startsWith("/verify-email")) {
    return "/";
  }

  return next;
}

function appendNextParam(target: string, next: string) {
  if (!next || next === "/") {
    return target;
  }

  const separator = target.includes("?") ? "&" : "?";
  return `${target}${separator}next=${encodeURIComponent(next)}`;
}

async function shareTemplate(
  title: string,
  url: string,
  setStatus: (value: string) => void,
) {
  if (navigator.share) {
    await navigator.share({
      title,
      text: `${title} dari Naki Code`,
      url,
    });
    setStatus("Template dibagikan.");
    return;
  }

  await copyShareLink(url, setStatus);
}

async function copyShareLink(url: string, setStatus: (value: string) => void) {
  await navigator.clipboard.writeText(url);
  setStatus("Link template disalin.");
}

type MetricProps = {
  icon: typeof Star;
  label: string;
  value: string;
};

function Metric({ icon: Icon, label, value }: MetricProps) {
  return (
    <div className="rounded-lg border border-naki-steel bg-naki-frost p-4 shadow-naki-card">
      <Icon className="text-naki-secondary" size={20} />
      <p className="mt-4 text-sm font-bold text-naki-smoke">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

type DetailBlockProps = {
  title: string;
  items: string[];
};

function DetailBlock({ title, items }: DetailBlockProps) {
  return (
    <div className="rounded-lg border border-naki-steel bg-naki-frost p-5 shadow-naki-card">
      <h2 className="text-xl font-black">{title}</h2>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-2 text-sm font-semibold"
          >
            <BadgeCheck
              className="mt-0.5 shrink-0 text-naki-secondary"
              size={16}
            />
            <span className="leading-6 text-naki-smoke">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
