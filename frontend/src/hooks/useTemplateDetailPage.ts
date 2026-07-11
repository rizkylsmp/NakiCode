import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import type { OrderItem } from "../domain/order-types";
import { saveRecentlyViewedTemplate } from "../utils/template-activity";
import { useFavoriteTemplates } from "../hooks/useFavorites";
import {
  userRoleKey,
  userSessionEvent,
  userTokenKey,
  userUsernameKey,
} from "../utils/user-session";
import type { TemplateItem } from "../domain/content";

export type ConsultationFormState = {
  customerName: string;
  customerContact: string;
  projectType: string;
  budgetRange: string;
  message: string;
};

export type UserAuthFormState = {
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

export function useTemplateDetailPage(template: TemplateItem | null) {
  const navigate = useNavigate();

  // Session state
  const [userToken, setUserToken] = useState<string | null>(
    localStorage.getItem(userTokenKey),
  );
  const [userUsername, setUserUsername] = useState<string | null>(
    localStorage.getItem(userUsernameKey),
  );

  // Consultation form
  const [consultationForm, setConsultationForm] = useState<ConsultationFormState>(
    defaultConsultationForm,
  );
  const [isSubmittingConsultation, setIsSubmittingConsultation] = useState(false);
  const [consultationStatus, setConsultationStatus] = useState(
    "Isi form untuk membuat website dari design ini atau membeli source code.",
  );

  // User auth panel
  const [userAuthMode, setUserAuthMode] = useState<"login" | "register">("login");
  const [userAuthForm, setUserAuthForm] = useState<UserAuthFormState>(
    defaultUserAuthForm,
  );
  const [isSubmittingUserAuth, setIsSubmittingUserAuth] = useState(false);
  const [userAuthStatus, setUserAuthStatus] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");
  const [captcha] = useState<CaptchaState>(() => initializeCaptcha());

  // Checkout
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState(
    "Login untuk memulai pembelian.",
  );

  // Share
  const [shareStatus, setShareStatus] = useState("");

  // Preview modal
  const [expandedPreview, setExpandedPreview] = useState<{
    image: string;
    caption: string;
  } | null>(null);

  // Favorites
  const { toggleFavorite, favoriteIds } = useFavoriteTemplates();

  // Sync user session from localStorage
  useEffect(() => {
    function syncUserSession() {
      setUserToken(localStorage.getItem(userTokenKey));
      setUserUsername(localStorage.getItem(userUsernameKey));
    }

    window.addEventListener(userSessionEvent, syncUserSession);
    window.addEventListener("storage", syncUserSession);

    return () => {
      window.removeEventListener(userSessionEvent, syncUserSession);
      window.removeEventListener("storage", syncUserSession);
    };
  }, []);

  // Analytics & recently viewed tracking
  useEffect(() => {
    if (!template) return;

    saveRecentlyViewedTemplate(template);
    trackEvent("template_viewed", {
      templateId: template.id,
      templateSlug: template.slug,
      templateTitle: template.title,
    });
  }, [template]);

  // Escape key closes expanded preview
  useEffect(() => {
    if (!expandedPreview) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setExpandedPreview(null);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [expandedPreview]);

  // Form updaters
  const updateConsultationField = useCallback(
    <Key extends keyof ConsultationFormState>(key: Key, value: ConsultationFormState[Key]) => {
      setConsultationForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const updateUserAuthField = useCallback(
    <Key extends keyof UserAuthFormState>(key: Key, value: UserAuthFormState[Key]) => {
      setUserAuthForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // Submit user auth (login / register)
  const submitUserAuth = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isSubmittingUserAuth) return;

      setIsSubmittingUserAuth(true);

      if (userAuthMode === "register" && userAuthForm.password !== userAuthForm.confirmPassword) {
        setUserAuthStatus("Password dan konfirmasi tidak sama.");
        setIsSubmittingUserAuth(false);
        return;
      }

      if (
        userAuthMode === "register"
      ) {
        const captchaResult = validateCaptcha(captcha);
        if (!captchaResult.valid) {
          setUserAuthStatus(captchaResult.error ?? "Verifikasi keamanan belum lengkap.");
          setIsSubmittingUserAuth(false);
          return;
        }
      }

      try {
        const endpoint =
          userAuthMode === "login"
            ? "/api/auth/user/login"
            : "/api/auth/user/register";

        const body =
          userAuthMode === "login"
            ? {
                identifier: userAuthForm.username || userAuthForm.email,
                password: userAuthForm.password,
              }
            : {
                username: userAuthForm.username,
                email: userAuthForm.email,
                password: userAuthForm.password,
              };

        const response = await apiPost<UserAuthResponse>(endpoint, body);

        if (response.token) {
          localStorage.setItem(userTokenKey, response.token);
          localStorage.setItem(userUsernameKey, response.user?.username ?? "");

          if (response.user?.role === "admin") {
            localStorage.setItem(userRoleKey, response.user.role);
            navigate("/admin/dashboard", { replace: true });
            return;
          }
        }

        if (userAuthMode === "register" && response.verificationUrl) {
          setVerificationUrl(response.verificationUrl);
          setUserAuthStatus(
            response.message ?? "Akun berhasil dibuat. Silakan cek email untuk verifikasi.",
          );
          setUserAuthForm(defaultUserAuthForm);
          return;
        }

        setUserAuthStatus(response.message ?? "Login berhasil.");
        setUserAuthForm(defaultUserAuthForm);
        window.dispatchEvent(new Event(userSessionEvent));
      } catch (error: unknown) {
        const apiStatus = getApiErrorStatus(error);
        const apiMessage = getApiErrorMessage(error);

        if (apiStatus === 403) {
          const verificationData = getApiErrorData<UserAuthResponse>(error);
          if (verificationData?.verificationUrl) {
            setVerificationUrl(verificationData.verificationUrl);
          }
          setUserAuthStatus(apiMessage ?? "Email belum diverifikasi.");
        } else {
          setUserAuthStatus(apiMessage ?? "Gagal memproses login.");
        }
      } finally {
        setIsSubmittingUserAuth(false);
      }
    },
    [
      isSubmittingUserAuth,
      userAuthMode,
      userAuthForm,
      captcha,
      navigate,
    ],
  );

  // Submit consultation / order
  const submitConsultation = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!userToken || !template) {
        setConsultationStatus("Silakan login terlebih dahulu.");
        return;
      }

      setIsSubmittingConsultation(true);
      setConsultationStatus("Mengirim konsultasi...");

      try {
        const response = await apiPost<OrderMutationResponse>("/api/orders", {
          templateId: template.id,
          templateSlug: template.slug,
          templateTitle: template.title,
          ...consultationForm,
        });

        trackEvent("order_created", {
          templateId: template.id,
          templateSlug: template.slug,
          projectType: consultationForm.projectType,
        });

        setConsultationStatus("Konsultasi berhasil dikirim.");
        setConsultationForm(defaultConsultationForm);

        if (response.order?.id) {
          navigate(`/checkout/${response.order.id}`);
        }
      } catch {
        setConsultationStatus("Gagal mengirim konsultasi.");
      } finally {
        setIsSubmittingConsultation(false);
      }
    },
    [userToken, template, consultationForm, navigate],
  );

  // Direct checkout
  const startDirectCheckout = useCallback(
    async () => {
      if (!userToken || !template) {
        setCheckoutStatus("Silakan login terlebih dahulu.");
        return;
      }

      setIsStartingCheckout(true);
      setCheckoutStatus("Membuat order...");

      try {
        const response = await apiPost<OrderMutationResponse>("/api/orders", {
          templateId: template.id,
          templateSlug: template.slug,
          templateTitle: template.title,
          customerName: userUsername ?? "",
          customerContact: "",
          projectType: "Beli source code design",
          budgetRange: template.price,
          message: "",
        });

        trackEvent("order_created", {
          templateId: template.id,
          templateSlug: template.slug,
          checkout_flow: "direct",
        });

        if (response.order?.id) {
          navigate(`/checkout/${response.order.id}`);
        } else {
          setCheckoutStatus("Gagal memulai checkout.");
        }
      } catch {
        setCheckoutStatus("Gagal memulai checkout.");
      } finally {
        setIsStartingCheckout(false);
      }
    },
    [userToken, template, userUsername, navigate],
  );

  // Derived values
  const relatedTemplates = template
    ? template.category === "Semua"
      ? []
      : []
    : [];

  const shareUrl = template
    ? `${window.location.origin}/design/${template.slug}`
    : "";
  const shareText = template
    ? encodeURIComponent(`${template.title} dari Naki Code`)
    : "";
  const whatsappMessage = template
    ? encodeURIComponent(
        `Halo, saya tertarik membuat website dengan design "${template.title}" sebagai referensi. Bisa dibantu?`,
      )
    : "";

  function extractPrice(value: string) {
    return value.replace(/[^0-9]/g, "");
  }

  function onToggleFavorite(templateId: number) {
    toggleFavorite(templateId);
  }

  function isFavorite(templateId: number) {
    return favoriteIds.has(templateId);
  }

  return {
    consultationForm,
    isSubmittingConsultation,
    consultationStatus,
    userToken,
    userUsername,
    userAuthMode,
    setUserAuthMode,
    userAuthForm,
    isSubmittingUserAuth,
    userAuthStatus,
    verificationUrl,
    captcha,
    isStartingCheckout,
    checkoutStatus,
    shareStatus,
    expandedPreview,
    setExpandedPreview,
    relatedTemplates,
    shareUrl,
    shareText,
    whatsappMessage,
    extractPrice,
    updateConsultationField,
    updateUserAuthField,
    submitUserAuth,
    submitConsultation,
    startDirectCheckout,
    onToggleFavorite,
    isFavorite,
    setShareStatus,
    setConsultationStatus,
  };
}
