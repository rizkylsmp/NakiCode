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
  Star,
  UserRound,
  UsersRound,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Film,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  apiPost,
  getApiErrorData,
  getApiErrorMessage,
  getApiErrorStatus,
} from "../services/api-client";
import { trackEvent } from "../services/analytics";
import {
  initializeCaptcha,
  validateCaptcha,
  type CaptchaState,
} from "../utils/auth-captcha";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { getTemplateBySlug, type TemplateItem } from "../domain/content";
import type { OrderItem } from "../domain/order-types";
import { saveRecentlyViewedTemplate } from "../utils/design-activity";
import { getTemplateCategoryPath } from "../utils/design-url";
import { absoluteSiteUrl } from "../utils/seo";
import { useFavoriteTemplates } from "../hooks/useFavorites";
import { TechStackBadge } from "../components/ui/TechStackBadge";
import { WhatsAppBrandIcon } from "../components/ui/BrandIcons";
import {
  userRoleKey,
  userSessionEvent,
  userTokenKey,
  userUsernameKey,
} from "../utils/user-session";

type DesignDetailPageProps = {
  templates: TemplateItem[];
  isLoading?: boolean;
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

type PreviewMediaItem =
  | {
      type: "image";
      src: string;
      caption: string;
    }
  | {
      type: "video";
      src: string;
      caption: string;
      poster?: string;
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
  projectType: "Pembuatan website dari design",
  budgetRange: "Di bawah Rp500K",
  message: "",
};

const defaultUserAuthForm: UserAuthFormState = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function DesignDetailPage({
  templates,
  isLoading = false,
}: DesignDetailPageProps) {
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
    "Masuk atau daftar dulu untuk konsultasi atau membeli source code.",
  );
  const [, setVerificationUrl] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaState>(() =>
    initializeCaptcha(),
  );
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState(
    "Buat order lalu lanjut ke halaman checkout.",
  );
  const [, setShareStatus] = useState("");
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const previewMedia = useMemo<PreviewMediaItem[]>(() => {
    if (!template) return [];

    const images: PreviewMediaItem[] = template.preview
      .filter((item) => item.image)
      .map((item) => ({
        type: "image",
        src: item.image,
        caption: item.caption,
      }));

    if (template.videoUrl) {
      return [
        {
          type: "video",
          src: template.videoUrl,
          caption: `Video preview ${template.title}`,
          poster: template.preview.find((item) => item.image)?.image,
        },
        ...images,
      ];
    }

    return images;
  }, [template]);

  const showPreviousPreview = useCallback(() => {
    setActivePreviewIndex((current) =>
      previewMedia.length
        ? (current - 1 + previewMedia.length) % previewMedia.length
        : 0,
    );
  }, [previewMedia.length]);

  const showNextPreview = useCallback(() => {
    setActivePreviewIndex((current) =>
      previewMedia.length ? (current + 1) % previewMedia.length : 0,
    );
  }, [previewMedia.length]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [slug]);

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
      setActivePreviewIndex(0);
      setIsPreviewOpen(false);
      saveRecentlyViewedTemplate(template);
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
    if (!isPreviewOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsPreviewOpen(false);
      if (event.key === "ArrowLeft") showPreviousPreview();
      if (event.key === "ArrowRight") showNextPreview();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPreviewOpen, showNextPreview, showPreviousPreview]);

  if (!template) {
    return (
      <div className="naki-frosted-grid min-h-screen text-naki-primary">
        <Helmet>
          <title>
            {isLoading
              ? "Memuat Design - Naki Code"
              : "Design Tidak Ditemukan - Naki Code"}
          </title>
          {!isLoading ? <meta name="robots" content="noindex, follow" /> : null}
        </Helmet>
        <Header />
        <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-5 py-16 text-center md:px-8 xl:px-12 2xl:px-16">
          <h1 className="text-2xl font-bold text-naki-primary md:text-3xl">
            {isLoading ? "Memuat design..." : "Design tidak ditemukan."}
          </h1>
          <p className="mt-3 text-naki-smoke">
            {isLoading
              ? "Menyiapkan informasi design untukmu."
              : "Coba kembali ke katalog dan pilih design lain."}
          </p>
          {!isLoading ? (
            <Link
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-5 text-sm font-medium text-white"
              to="/design"
            >
              <ArrowLeft size={16} />
              Kembali ke katalog
            </Link>
          ) : null}
        </section>
        <Footer />
      </div>
    );
  }

  const selectedTemplate = template;
  const selectedTemplateCategoryPath = getTemplateCategoryPath(
    selectedTemplate.category,
  );
  const selectedTemplateStack = new Set(selectedTemplate.stack);
  const relatedTemplates = templates
    .filter((item) => item.id !== selectedTemplate.id)
    .map((item) => {
      const sharedStackCount = item.stack.filter((tech) =>
        selectedTemplateStack.has(tech),
      ).length;
      const categoryScore = item.category === selectedTemplate.category ? 8 : 0;
      return {
        item,
        score: categoryScore + sharedStackCount * 2 + item.rating,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const whatsappMessage = encodeURIComponent(
    `Halo Naki Code, saya tertarik membuat website menggunakan design ${selectedTemplate.title} sebagai referensi.`,
  );
  const shareUrl = absoluteSiteUrl(`/design/${selectedTemplate.slug}`);
  const shareText = encodeURIComponent(
    `${selectedTemplate.title} dari Naki Code`,
  );

  function updateConsultationField<Key extends keyof ConsultationFormState>(
    key: Key,
    value: ConsultationFormState[Key],
  ) {
    setConsultationForm((current) => ({ ...current, [key]: value }));
  }

  function updateUserAuthField<Key extends keyof UserAuthFormState>(
    key: Key,
    value: UserAuthFormState[Key],
  ) {
    setUserAuthForm((current) => ({ ...current, [key]: value }));
  }

  async function submitUserAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (userAuthMode === "register") {
      if (userAuthForm.password !== userAuthForm.confirmPassword) {
        setUserAuthStatus("Konfirmasi password belum sama.");
        return;
      }
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
      if (userAuthMode === "register") setCaptcha(initializeCaptcha());
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
        orderType: "custom_project",
        templateId: selectedTemplate.id,
        templateSlug: selectedTemplate.slug,
        templateTitle: selectedTemplate.title,
        ...consultationForm,
      });
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
        "Permintaan custom terkirim. Tim NAKI Code akan menyiapkan penawaran dan nominal DP.",
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
        orderType: "source_purchase",
        templateId: selectedTemplate.id,
        templateSlug: selectedTemplate.slug,
        templateTitle: selectedTemplate.title,
        customerName:
          consultationForm.customerName.trim() || userUsername || "Buyer",
        customerContact,
        projectType: "Beli source code design",
        budgetRange: selectedTemplate.price,
        message: `Pembelian source code untuk design ${selectedTemplate.title}. Kirim source code dan panduan setelah pembayaran berhasil.`,
      });
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

  const extractPrice = (priceString: string): string => {
    const match = priceString.match(/[\d.]+/g);
    return match ? match.join("").replace(/\./g, "") : "0";
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Pembuatan website berbasis design referensi",
    name: selectedTemplate.title,
    description: selectedTemplate.description,
    image: selectedTemplate.preview[0]?.image
      ? absoluteSiteUrl(selectedTemplate.preview[0].image)
      : absoluteSiteUrl("/logo.png"),
    brand: { "@type": "Organization", name: "Naki Code" },
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
            reviewCount: Math.max(
              selectedTemplate.reviews.length,
              selectedTemplate.buyerCount,
            ),
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
    ...(selectedTemplate.reviews.length
      ? {
          review: selectedTemplate.reviews.slice(0, 5).map((review) => ({
            "@type": "Review",
            author: {
              "@type": "Person",
              name: review.customerName,
            },
            datePublished: review.createdAt,
            reviewBody: review.message,
            reviewRating: {
              "@type": "Rating",
              ratingValue: review.rating.toFixed(1),
              bestRating: "5",
              worstRating: "1",
            },
          })),
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
        item: absoluteSiteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: selectedTemplate.category,
        item: absoluteSiteUrl(selectedTemplateCategoryPath),
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
    <div className="naki-frosted-grid min-h-screen text-naki-primary">
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
            content={absoluteSiteUrl(selectedTemplate.preview[0].image)}
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
            content={absoluteSiteUrl(selectedTemplate.preview[0].image)}
          />
        ) : null}
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>
      <Header />

      {/* Breadcrumb */}
      <div className="border-b border-naki-steel/60 bg-naki-page-bg">
        <div className="mx-auto max-w-7xl px-5 py-3 md:px-8 xl:px-12 2xl:px-16">
          <nav
            className="flex min-w-0 items-center gap-2 overflow-hidden text-sm text-naki-smoke"
            aria-label="Breadcrumb"
          >
            <Link className="shrink-0 hover:text-naki-primary" to="/">
              Home
            </Link>
            <span className="shrink-0">/</span>
            <Link
              className="shrink-0 hover:text-naki-primary"
              to={selectedTemplateCategoryPath}
            >
              {selectedTemplate.category}
            </Link>
            <span className="shrink-0">/</span>
            <span className="min-w-0 truncate font-medium text-naki-primary">
              {selectedTemplate.title}
            </span>
          </nav>
        </div>
      </div>

      <div className="bg-naki-page-bg px-4 py-8 sm:px-5 sm:py-10 md:px-8 xl:px-12 2xl:px-16">
        <div className="mx-auto max-w-7xl">
          {/* Back link */}
          <Link
            className="inline-flex items-center gap-1.5 text-sm font-medium text-naki-smoke transition hover:text-naki-primary"
            to="/design"
          >
            <ArrowLeft size={16} />
            Kembali ke katalog
          </Link>

          {/* Main content grid */}
          <div className="mt-6 grid min-w-0 gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
            {/* Left: Preview + Details */}
            <div className="contents min-w-0 lg:block">
              {/* Preview media */}
              <div className="order-1 min-w-0 overflow-hidden rounded-2xl border border-naki-steel bg-white shadow-sm lg:order-none">
                {previewMedia[activePreviewIndex] ? (
                  <div className="group relative aspect-[4/3] min-w-0 overflow-hidden bg-naki-frost sm:aspect-[16/10]">
                    {previewMedia[activePreviewIndex].type === "video" ? (
                      <video
                        aria-label={previewMedia[activePreviewIndex].caption}
                        autoPlay
                        className="h-full w-full bg-naki-primary object-contain"
                        controls
                        muted
                        playsInline
                        poster={previewMedia[activePreviewIndex].poster}
                        preload="metadata"
                        src={previewMedia[activePreviewIndex].src}
                      />
                    ) : (
                      <button
                        className="block h-full w-full cursor-zoom-in"
                        onClick={() => setIsPreviewOpen(true)}
                        type="button"
                        aria-label="Buka preview layar penuh"
                      >
                        <img
                          className="h-full w-full object-contain"
                          src={previewMedia[activePreviewIndex].src}
                          alt={
                            previewMedia[activePreviewIndex].caption ||
                            selectedTemplate.title
                          }
                        />
                      </button>
                    )}
                    {previewMedia[activePreviewIndex].type === "image" ? (
                      <span className="pointer-events-none absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/90 text-naki-primary opacity-0 shadow-sm transition group-hover:opacity-100">
                        <Maximize2 size={17} />
                      </span>
                    ) : null}
                    {previewMedia.length > 1 ? (
                      <>
                        <PreviewArrow
                          direction="previous"
                          onClick={showPreviousPreview}
                        />
                        <PreviewArrow
                          direction="next"
                          onClick={showNextPreview}
                        />
                        <span className="absolute bottom-3 right-3 rounded-full bg-naki-primary/85 px-3 py-1 text-xs font-semibold text-white">
                          {activePreviewIndex + 1} / {previewMedia.length}
                        </span>
                      </>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center bg-gradient-to-br from-naki-frost to-naki-steel/50 md:h-80 lg:h-96">
                    <Code2 className="text-naki-steel" size={64} />
                  </div>
                )}
                {/* Thumbnail row */}
                {previewMedia.length > 1 && (
                  <div className="flex min-w-0 gap-2 overflow-x-auto border-t border-naki-steel/60 p-2.5 sm:p-3">
                    {previewMedia.map((item, index) => (
                      <button
                        key={`${item.type}-${item.src}`}
                        className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-naki-frost transition sm:h-16 sm:w-24 ${activePreviewIndex === index ? "border-blue-500" : "border-transparent opacity-65 hover:opacity-100"}`}
                        onClick={() => setActivePreviewIndex(index)}
                        type="button"
                        aria-label={`Tampilkan ${item.type === "video" ? "video" : "gambar"} preview ${index + 1}`}
                        aria-current={activePreviewIndex === index}
                      >
                        {item.type === "video" ? (
                          <>
                            <video
                              aria-hidden="true"
                              className="h-full w-full object-cover"
                              muted
                              playsInline
                              poster={item.poster}
                              preload="metadata"
                              src={item.src}
                            />
                            <span className="absolute inset-0 grid place-items-center bg-naki-primary/35 text-white">
                              <Film aria-hidden="true" size={20} />
                            </span>
                          </>
                        ) : (
                          <img
                            className="h-full w-full object-cover"
                            src={item.src}
                            alt={item.caption || ""}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title + Description */}
              <div className="order-2 min-w-0 lg:order-none lg:mt-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-500">
                    {selectedTemplate.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-naki-smoke">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    {selectedTemplate.rating > 0
                      ? selectedTemplate.rating.toFixed(1)
                      : "Baru"}
                  </span>
                  <span className="text-xs text-naki-smoke">
                    {selectedTemplate.buyerCount} pelanggan
                  </span>
                </div>

                <h1 className="mt-3 text-2xl font-bold leading-tight text-naki-primary sm:text-3xl md:text-4xl">
                  {selectedTemplate.title}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-naki-smoke">
                  {selectedTemplate.description}
                </p>

                {/* Tech tags */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {selectedTemplate.stack.map((tech) => (
                    <TechStackBadge key={tech} tech={tech} variant="pill" />
                  ))}
                </div>

                {/* Stats */}
                <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="min-w-0 rounded-xl bg-naki-frost p-3 sm:p-4">
                    <Star size={18} className="text-blue-500" />
                    <p className="mt-2 text-xs text-naki-smoke">Rating</p>
                    <p className="truncate text-base font-semibold text-naki-primary sm:text-lg">
                      {selectedTemplate.rating > 0
                        ? selectedTemplate.rating.toFixed(1)
                        : "Baru"}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-xl bg-naki-frost p-3 sm:p-4">
                    <UsersRound size={18} className="text-blue-500" />
                    <p className="mt-2 text-xs text-naki-smoke">Pelanggan</p>
                    <p className="truncate text-base font-semibold text-naki-primary sm:text-lg">
                      {selectedTemplate.buyerCount}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-xl bg-naki-frost p-3 sm:p-4">
                    <FileCode2 size={18} className="text-blue-500" />
                    <p className="mt-2 text-xs text-naki-smoke">Level</p>
                    <p className="truncate text-base font-semibold text-naki-primary sm:text-lg">
                      {selectedTemplate.level}
                    </p>
                  </div>
                </div>

                {/* Wishlist + Share */}
                <div className="mt-6 grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                  {userToken && (
                    <button
                      className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition sm:px-4 ${
                        favoriteIds.has(selectedTemplate.id)
                          ? "bg-blue-500 text-white"
                          : "border border-naki-steel text-naki-smoke hover:text-naki-primary"
                      }`}
                      disabled={isFavoriteLoading}
                      onClick={() => toggleFavorite(selectedTemplate.id)}
                      type="button"
                    >
                      <Heart
                        size={16}
                        fill={
                          favoriteIds.has(selectedTemplate.id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                      {favoriteIds.has(selectedTemplate.id)
                        ? "Tersimpan"
                        : "Wishlist"}
                    </button>
                  )}
                  <button
                    className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-naki-steel px-3 py-2.5 text-sm text-naki-smoke transition hover:text-naki-primary"
                    onClick={() =>
                      void shareTemplate(
                        selectedTemplate.title,
                        shareUrl,
                        setShareStatus,
                      )
                    }
                    type="button"
                  >
                    <Share2 size={14} /> Share
                  </button>
                  <a
                    className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-naki-steel px-3 py-2.5 text-sm text-naki-smoke transition hover:text-naki-primary"
                    href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <WhatsAppBrandIcon className="size-4" />
                    WhatsApp
                  </a>
                  <button
                    className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-naki-steel px-3 py-2.5 text-sm text-naki-smoke transition hover:text-naki-primary"
                    onClick={() => void copyShareLink(shareUrl, setShareStatus)}
                    type="button"
                  >
                    <Copy size={14} /> Copy
                  </button>
                </div>
              </div>

              {/* Features + Included Files */}
              <div className="order-4 grid min-w-0 gap-4 sm:gap-6 md:grid-cols-2 lg:order-none lg:mt-10">
                <DetailBlock
                  title="Fitur utama"
                  items={selectedTemplate.features}
                />
                <DetailBlock
                  title="Isi source code"
                  items={selectedTemplate.includedFiles}
                />
                <DetailBlock
                  title="Cocok untuk"
                  items={selectedTemplate.suitableFor}
                />
                <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
                  <ShieldCheck size={24} className="text-blue-500" />
                  <h2 className="mt-3 text-base font-semibold text-naki-primary">
                    Lisensi dan support
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-naki-smoke">
                    {selectedTemplate.license}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-naki-smoke">
                    {selectedTemplate.support}
                  </p>
                </div>
              </div>

              {/* Reviews */}
              <section className="order-5 min-w-0 lg:order-none lg:mt-10">
                <h2 className="flex items-center gap-2 text-base font-semibold text-naki-primary">
                  <MessageSquareText size={18} className="text-blue-500" />
                  Review pelanggan
                </h2>
                <p className="mt-1 text-xs text-naki-smoke">
                  Ulasan tampil setelah pelanggan menyelesaikan transaksi dan
                  memberi rating.
                </p>
                {selectedTemplate.reviews?.length ? (
                  <div className="mt-4 grid gap-3">
                    {selectedTemplate.reviews.map((review) => (
                      <article
                        key={review.id}
                        className="rounded-xl bg-white p-4 shadow-sm sm:p-5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-naki-primary">
                            {review.customerName}
                          </p>
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-500">
                            <Star
                              size={14}
                              className="fill-amber-400 text-amber-400"
                            />
                            {review.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-naki-smoke">
                          {review.message}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl bg-white p-4 text-sm text-naki-smoke">
                    Belum ada review tertulis untuk design ini.
                  </p>
                )}
              </section>

              {/* Related designs */}
              {relatedTemplates.length > 0 && (
                <section className="order-6 min-w-0 lg:order-none lg:mt-14">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-blue-500">
                        Design Terkait
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-naki-primary">
                        Kategori {selectedTemplate.category}
                      </h2>
                    </div>
                    <Link
                      className="hidden text-sm font-medium text-blue-500 sm:inline-flex"
                      to={selectedTemplateCategoryPath}
                    >
                      Lihat kategori <ArrowRight size={14} className="ml-1" />
                    </Link>
                  </div>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
                    {relatedTemplates.map(({ item }) => (
                      <Link
                        key={item.id}
                        className="group overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:shadow-md"
                        to={`/design/${item.slug}`}
                      >
                        {item.preview[0]?.image ? (
                          <img
                            className="h-36 w-full object-cover"
                            src={item.preview[0].image}
                            alt={item.title}
                          />
                        ) : (
                          <div className="flex h-36 items-center justify-center bg-gradient-to-br from-naki-frost to-naki-steel/50">
                            <Code2 className="text-naki-steel" size={28} />
                          </div>
                        )}
                        <div className="p-4">
                          <p className="text-xs font-medium text-blue-500">
                            {item.category}
                          </p>
                          <h3 className="mt-1 text-sm font-semibold text-naki-primary group-hover:text-blue-500">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-xs text-naki-smoke">
                            {item.price} · {item.level}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right: Sidebar */}
            <aside className="order-3 min-w-0 space-y-4 sm:space-y-5 lg:order-none lg:sticky lg:top-24 lg:h-fit">
              {/* Primary service */}
              <div className="rounded-2xl bg-naki-primary p-5 text-white shadow-sm sm:p-6">
                <HeartHandshake size={24} className="text-blue-300" />
                <p className="mt-3 text-xs font-medium uppercase text-blue-200">
                  Layanan utama
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  Buat website dari design ini
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Kami sesuaikan warna, konten, halaman, alur, dan fitur
                  berdasarkan kebutuhan brand-mu.
                </p>
                <a
                  className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-naki-primary transition hover:bg-naki-frost"
                  href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}?text=${whatsappMessage}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <WhatsAppBrandIcon className="size-[18px]" />
                  Konsultasi pembuatan website
                </a>
              </div>

              {/* Source code purchase */}
              {selectedTemplate.sourceAvailable !== false ? (
                <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
                  <p className="text-xs font-medium uppercase text-naki-smoke">
                    Opsi mandiri
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-naki-primary">
                    Beli source code design
                  </h2>
                  <p className="mt-1 text-4xl font-bold text-naki-primary">
                    {selectedTemplate.price}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-naki-smoke">
                    Opsi ini khusus untuk membeli source code design dan panduan
                    setup.
                  </p>
                  <div className="mt-4 grid gap-2 rounded-xl bg-naki-frost p-3">
                    {[
                      "Source code lengkap siap dikembangkan",
                      "Panduan setup dan struktur folder",
                      "Support dasar setelah pembelian",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-2 text-xs text-naki-smoke"
                      >
                        <BadgeCheck
                          className="mt-0.5 shrink-0 text-blue-500"
                          size={14}
                        />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5">
                    {userToken ? (
                      <button
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isStartingCheckout}
                        onClick={() => void startDirectCheckout()}
                        type="button"
                      >
                        <CreditCard size={17} />
                        {isStartingCheckout ? "Memproses..." : "Checkout"}
                      </button>
                    ) : (
                      <Link
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
                        to={appendNextParam("/login", nextTarget)}
                      >
                        <LogIn size={17} />
                        Checkout
                      </Link>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs text-naki-smoke">
                    <ShieldCheck className="text-green-500" size={16} />
                    <span>Pembayaran aman melalui checkout Naki Code</span>
                  </div>
                  <p
                    className="mt-2 text-xs text-naki-smoke"
                    aria-live="polite"
                  >
                    {checkoutStatus}
                  </p>
                </div>
              ) : null}

              {/* Auth / Consultation */}
              {!userToken ? (
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
              ) : (
                <>
                  <div className="flex items-center gap-3 rounded-xl bg-naki-frost p-4">
                    <span className="grid size-9 place-items-center rounded-lg bg-blue-500/10 text-blue-500">
                      <UserRound size={16} />
                    </span>
                    <div>
                      <p className="text-xs text-naki-smoke">Login sebagai</p>
                      <p className="text-sm font-medium text-naki-primary">
                        {userUsername}
                      </p>
                    </div>
                  </div>

                  <form
                    className="rounded-2xl bg-white p-5 shadow-sm sm:p-6"
                    onSubmit={submitConsultation}
                  >
                    <h2 className="text-base font-semibold text-naki-primary">
                      Form konsultasi
                    </h2>
                    <p className="mt-1 text-xs text-naki-smoke">
                      Kirim brief singkat agar kebutuhanmu tercatat.
                    </p>

                    <div className="mt-4 grid gap-3">
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
                      <label className="grid gap-1 text-xs font-medium text-naki-smoke">
                        Kebutuhan
                        <select
                          className="h-10 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none focus:border-blue-400"
                          value={consultationForm.projectType}
                          onChange={(event) =>
                            updateConsultationField(
                              "projectType",
                              event.target.value,
                            )
                          }
                        >
                          <option>Pembuatan website dari design</option>
                          <option>Design dan website custom</option>
                          <option>Integrasi backend</option>
                          <option>Konsultasi project</option>
                        </select>
                      </label>
                      <label className="grid gap-1 text-xs font-medium text-naki-smoke">
                        Budget
                        <select
                          className="h-10 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none focus:border-blue-400"
                          value={consultationForm.budgetRange}
                          onChange={(event) =>
                            updateConsultationField(
                              "budgetRange",
                              event.target.value,
                            )
                          }
                        >
                          <option>Di bawah Rp500K</option>
                          <option>Rp500K - Rp1Jt</option>
                          <option>Rp1Jt - Rp3Jt</option>
                          <option>Di atas Rp3Jt</option>
                        </select>
                      </label>
                      <label className="grid gap-1 text-xs font-medium text-naki-smoke">
                        Brief singkat
                        <textarea
                          className="min-h-24 resize-y rounded-lg border border-naki-steel bg-naki-page-bg px-3 py-2 text-sm leading-relaxed outline-none focus:border-blue-400"
                          value={consultationForm.message}
                          onChange={(event) =>
                            updateConsultationField(
                              "message",
                              event.target.value,
                            )
                          }
                          placeholder="Contoh: Saya suka design ini dan ingin disesuaikan untuk bisnis kuliner dengan checkout WhatsApp."
                          required
                        />
                      </label>
                      <button
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-medium text-white transition hover:bg-naki-primary/90 disabled:opacity-60"
                        disabled={isSubmittingConsultation}
                        type="submit"
                      >
                        <Send size={16} />
                        {isSubmittingConsultation
                          ? "Mengirim..."
                          : "Kirim request"}
                      </button>
                      <p className="text-xs text-naki-smoke" aria-live="polite">
                        {consultationStatus}
                      </p>
                    </div>
                  </form>
                </>
              )}
            </aside>
          </div>
        </div>
      </div>

      {/* Expanded Preview Modal */}
      {isPreviewOpen && previewMedia[activePreviewIndex] && (
        <div
          className="fixed inset-0 z-[500] grid place-items-center bg-black/85 p-3 backdrop-blur-sm md:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Galeri preview design"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="relative flex h-full max-h-[94vh] w-full max-w-7xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute right-2 top-2 z-20 grid size-11 place-items-center rounded-full bg-white/90 text-naki-primary shadow-sm transition hover:bg-white"
              onClick={() => setIsPreviewOpen(false)}
              type="button"
              aria-label="Tutup preview"
            >
              <X size={18} />
            </button>
            <div className="relative min-h-0 flex-1">
              {previewMedia[activePreviewIndex].type === "video" ? (
                <video
                  aria-label={previewMedia[activePreviewIndex].caption}
                  autoPlay
                  className="h-full w-full object-contain"
                  controls
                  muted
                  playsInline
                  poster={previewMedia[activePreviewIndex].poster}
                  preload="metadata"
                  src={previewMedia[activePreviewIndex].src}
                />
              ) : (
                <img
                  className="h-full w-full object-contain"
                  src={previewMedia[activePreviewIndex].src}
                  alt={
                    previewMedia[activePreviewIndex].caption ||
                    selectedTemplate.title
                  }
                  loading="eager"
                  decoding="async"
                />
              )}
              {previewMedia.length > 1 ? (
                <>
                  <PreviewArrow
                    direction="previous"
                    onClick={showPreviousPreview}
                    overlay
                  />
                  <PreviewArrow
                    direction="next"
                    onClick={showNextPreview}
                    overlay
                  />
                </>
              ) : null}
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 rounded-lg bg-white/95 px-4 py-3 text-sm text-naki-primary">
              <p className="min-w-0 truncate font-medium">
                {previewMedia[activePreviewIndex].caption ||
                  `${selectedTemplate.title} - preview ${activePreviewIndex + 1}`}
              </p>
              <span className="shrink-0 text-xs font-semibold text-naki-smoke">
                {activePreviewIndex + 1} / {previewMedia.length}
              </span>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

/* ─── Sub-components ─── */

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
    <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-blue-500/10 text-blue-500">
          <LockKeyhole size={18} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-naki-primary">
            Akun pelanggan
          </h2>
          <p className="mt-0.5 text-xs text-naki-smoke">
            Login atau daftar untuk membuat order.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-naki-frost p-1">
        {(["login", "register"] as const).map((item) => (
          <button
            key={item}
            className={`h-10 rounded-lg text-sm font-medium transition ${
              mode === item
                ? "bg-white text-naki-primary shadow-sm"
                : "text-naki-smoke hover:text-naki-primary"
            }`}
            onClick={() => onModeChange(item)}
            type="button"
          >
            {item === "login" ? "Login" : "Daftar"}
          </button>
        ))}
      </div>

      <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
        <label className="grid gap-1 text-xs font-medium text-naki-smoke">
          {mode === "login" ? "Username / email" : "Username"}
          <input
            className="h-11 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none focus:border-blue-400"
            value={form.username}
            onChange={(event) => onUpdateField("username", event.target.value)}
            required
            type="text"
          />
        </label>
        {mode === "register" && (
          <label className="grid gap-1 text-xs font-medium text-naki-smoke">
            Email
            <input
              className="h-11 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none focus:border-blue-400"
              value={form.email}
              onChange={(event) => onUpdateField("email", event.target.value)}
              required
              type="email"
            />
          </label>
        )}
        <label className="grid gap-1 text-xs font-medium text-naki-smoke">
          Password
          <input
            className="h-11 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none focus:border-blue-400"
            value={form.password}
            onChange={(event) => onUpdateField("password", event.target.value)}
            required
            minLength={6}
            type="password"
          />
        </label>
        {mode === "login" && (
          <Link
            className="w-fit text-xs text-blue-500 underline decoration-dotted"
            to={forgotPasswordUrl}
          >
            Lupa password?
          </Link>
        )}
        {mode === "register" && (
          <>
            <label className="grid gap-1 text-xs font-medium text-naki-smoke">
              Konfirmasi password
              <input
                className="h-11 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none focus:border-blue-400"
                value={form.confirmPassword}
                onChange={(event) =>
                  onUpdateField("confirmPassword", event.target.value)
                }
                required
                minLength={6}
                type="password"
              />
            </label>
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
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-naki-smoke">
              <input
                type="checkbox"
                checked={captcha.isChecked}
                onChange={(e) =>
                  onUpdateCaptcha((prev) => ({
                    ...prev,
                    isChecked: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-naki-steel"
                required
              />
              Saya bukan robot
            </label>
          </>
        )}
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-medium text-white transition hover:bg-naki-primary/90 disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          <LogIn size={16} />
          {isSubmitting
            ? "Memproses..."
            : mode === "login"
              ? "Login"
              : "Daftar"}
        </button>
        <p className="text-xs text-naki-smoke" aria-live="polite">
          {status}
        </p>
      </form>
    </div>
  );
}

function ConsultationField({
  label,
  value,
  onChange,
  required = false,
}: ConsultationFieldProps) {
  return (
    <label className="grid gap-1 text-xs font-medium text-naki-smoke">
      {label}
      <input
        className="h-11 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none focus:border-blue-400"
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
  if (!next || next === "/login" || next.startsWith("/verify-email"))
    return "/";
  return next;
}

function appendNextParam(target: string, next: string) {
  if (!next || next === "/") return target;
  const separator = target.includes("?") ? "&" : "?";
  return `${target}${separator}next=${encodeURIComponent(next)}`;
}

async function shareTemplate(
  title: string,
  url: string,
  setStatus: (value: string) => void,
) {
  if (navigator.share) {
    await navigator.share({ title, text: `${title} dari Naki Code`, url });
    setStatus("Design dibagikan.");
    return;
  }
  await copyShareLink(url, setStatus);
}

async function copyShareLink(url: string, setStatus: (value: string) => void) {
  await navigator.clipboard.writeText(url);
  setStatus("Link design disalin.");
}

type DetailBlockProps = { title: string; items: string[] };

function PreviewArrow({
  direction,
  onClick,
  overlay = false,
}: {
  direction: "previous" | "next";
  onClick: () => void;
  overlay?: boolean;
}) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <button
      className={`absolute top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full shadow-sm transition sm:size-11 ${direction === "previous" ? "left-2 sm:left-3" : "right-2 sm:right-3"} ${overlay ? "bg-white/90 text-naki-primary hover:bg-white" : "bg-naki-primary/85 text-white hover:bg-naki-primary"}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      type="button"
      aria-label={
        direction === "previous" ? "Preview sebelumnya" : "Preview berikutnya"
      }
    >
      <Icon size={22} />
    </button>
  );
}

function DetailBlock({ title, items }: DetailBlockProps) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-naki-primary">{title}</h2>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2 text-sm">
            <BadgeCheck className="mt-0.5 shrink-0 text-blue-500" size={16} />
            <span className="leading-relaxed text-naki-smoke">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
