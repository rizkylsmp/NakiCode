import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  apiPost,
  getApiErrorData,
  getApiErrorMessage,
  getApiErrorStatus,
} from "../services/api-client";
import {
  initializeCaptcha,
  validateCaptcha,
  type CaptchaState,
} from "../utils/auth-captcha";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";
import {
  PasswordStrengthIndicator,
  isPasswordStrong,
} from "../components/ui/PasswordStrengthIndicator";
import {
  userRoleKey,
  userSessionEvent,
  userTokenKey,
  userUsernameKey,
} from "../utils/user-session";

type AuthMode = "login" | "register";

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

const defaultForm = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function UserLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState(defaultForm);
  const [status, setStatus] = useState("Masuk untuk melanjutkan ke akunmu.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaState>(() =>
    initializeCaptcha(),
  );
  const [verificationUrl, setVerificationUrl] = useState("");
  const nextTarget = getSafeNextTarget(searchParams.get("next"));
  const forgotPasswordUrl =
    nextTarget === "/"
      ? "/forgot-password"
      : `/forgot-password?next=${encodeURIComponent(nextTarget)}`;

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/");
  }

  const completeAuthentication = useCallback(
    (data: UserAuthResponse) => {
      if (!data.token || !data.user) {
        return false;
      }

      window.localStorage.setItem(userTokenKey, data.token);
      window.localStorage.setItem(userUsernameKey, data.user.username);
      window.localStorage.setItem(userRoleKey, data.user.role ?? "user");
      window.dispatchEvent(new Event(userSessionEvent));
      setVerificationUrl("");
      const redirectTarget =
        nextTarget !== "/"
          ? nextTarget
          : data.user.role === "admin"
            ? "/admin/dashboard"
            : "/design";

      navigate(redirectTarget, { replace: true });
      return true;
    },
    [navigate, nextTarget],
  );

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setIsSubmitting(true);
      setStatus("Menghubungkan akun Google...");

      try {
        const data = await apiPost<UserAuthResponse>("/api/auth/user/google", {
          credential,
        });
        completeAuthentication(data);
      } catch (error) {
        setStatus(
          getApiErrorMessage(error, "Login Google gagal. Silakan coba lagi."),
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [completeAuthentication],
  );

  const handleGoogleError = useCallback((message: string) => {
    setStatus(message);
  }, []);

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === "register") {
      if (form.password !== form.confirmPassword) {
        setStatus("Konfirmasi password belum sama.");
        return;
      }

      // Validate password strength
      if (!isPasswordStrong(form.password)) {
        setStatus(
          "Password terlalu lemah. Gunakan kombinasi huruf, angka, dan simbol untuk keamanan lebih baik.",
        );
        return;
      }

      // Validate captcha (checkbox + honeypot + timing)
      const captchaValidation = validateCaptcha(captcha);
      if (!captchaValidation.valid) {
        setStatus(captchaValidation.error || "Validasi keamanan gagal.");
        return;
      }
    }

    setIsSubmitting(true);
    setStatus(mode === "login" ? "Memeriksa akun..." : "Membuat akun...");

    try {
      const data = await apiPost<UserAuthResponse>(
        mode === "login" ? "/api/auth/user/login" : "/api/auth/user/register",
        mode === "login"
          ? { identifier: form.username, password: form.password }
          : {
              username: form.username,
              email: form.email,
              password: form.password,
            },
      );
      setForm(defaultForm);
      setCaptcha(initializeCaptcha());

      if (completeAuthentication(data)) {
        return;
      }

      if (data.verificationUrl || data.verificationEmail) {
        const nextVerificationUrl = appendNextParam(
          data.verificationUrl ||
            `/verify-email?email=${encodeURIComponent(
              data.verificationEmail ?? data.user?.email ?? form.email,
            )}`,
          nextTarget,
        );
        setVerificationUrl(nextVerificationUrl);
        setStatus(
          "Akun berhasil dibuat. OTP sudah dikirim ke email pendaftar.",
        );
        navigate(nextVerificationUrl, { replace: true });
        return;
      }

      setStatus(
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
        setStatus(
          "Email belum diverifikasi. Cek inbox atau buka verifikasi di bawah.",
        );
        navigate(nextVerificationUrl, { replace: true });
        return;
      }

      setStatus(
        getApiErrorMessage(
          error,
          mode === "login"
            ? "Login gagal. Cek username/email dan password."
            : "Daftar gagal. Username/email mungkin sudah dipakai.",
        ),
      );
      if (mode === "register") {
        setCaptcha(initializeCaptcha());
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="naki-frosted-grid min-h-screen bg-naki-page-bg text-naki-primary">
      <section className="flex min-h-screen items-center px-3 py-3 sm:px-5 sm:py-8 md:px-8 md:py-12 xl:px-12 2xl:px-16">
        <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl border border-naki-steel bg-naki-frost shadow-naki-soft sm:rounded-3xl lg:grid-cols-[0.95fr_1.05fr]">
          <Link
            aria-label="Naki Code home"
            className="absolute left-6 top-6 z-20 inline-flex items-center gap-3 rounded-xl text-white focus-visible:ring-2 focus-visible:ring-white sm:left-8 sm:top-8 lg:left-10 lg:top-10"
            to="/"
          >
            <span className="grid size-11 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
              <img
                alt=""
                className="naki-logo-image size-8 object-contain brightness-0 invert"
                src="/logo.png"
              />
            </span>
            <span className="hidden text-sm font-bold tracking-[0.16em] min-[380px]:inline">
              NAKI CODE
            </span>
          </Link>

          <button
            className="naki-auth-secondary-action absolute right-6 top-6 z-20 inline-flex h-10 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white sm:right-8 sm:top-8 lg:right-10 lg:top-10 lg:border-naki-steel lg:bg-naki-page-bg lg:text-naki-primary lg:hover:border-naki-secondary lg:hover:text-naki-secondary lg:focus-visible:ring-naki-secondary"
            onClick={handleBack}
            type="button"
          >
            <ArrowLeft size={16} />
            Kembali
          </button>
          <div className="relative isolate flex min-h-72 flex-col justify-between overflow-hidden bg-gradient-to-br from-naki-primary via-naki-primary to-naki-secondary p-7 text-white sm:p-10 lg:min-h-[650px] lg:p-12">
            <div className="absolute -left-16 -top-16 size-52 rounded-full border border-white/10" />
            <div className="absolute -bottom-24 -right-16 size-72 rounded-full border border-white/10" />
            <div
              className="absolute right-9 top-10 grid grid-cols-4 gap-2 opacity-50"
              aria-hidden="true"
            >
              {Array.from({ length: 16 }).map((_, index) => (
                <span className="size-1 rounded-full bg-white" key={index} />
              ))}
            </div>
            <svg
              aria-hidden="true"
              className="absolute -bottom-8 -right-8 w-72 text-white/15"
              fill="none"
              viewBox="0 0 300 220"
            >
              <path
                d="M18 202c20-70 49-39 70-91 18-44 50-66 104-47 47 17 31 54 88 65"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M42 216c13-66 49-42 66-91 14-41 51-53 91-37 38 15 36 48 86 57"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M74 220c9-52 42-37 54-76 11-35 44-41 77-28 31 12 35 37 76 45"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>

            <div className="relative z-10 h-12" aria-hidden="true" />

            <div className="relative z-10 max-w-md py-9 lg:py-0">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/15 backdrop-blur">
                <Sparkles size={14} /> Ruang kreatifmu dimulai di sini
              </span>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Selamat datang kembali.
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-7 text-white/70 sm:text-base">
                Masuk untuk menyimpan design favorit, memantau pesanan, dan
                melanjutkan konsultasi websitemu.
              </p>
            </div>

            <div className="relative z-10 hidden items-center gap-3 text-sm text-white/70 lg:flex">
              <ShieldCheck size={18} /> Akun dan transaksi dilindungi dengan
              aman.
            </div>
          </div>

          <div className="flex items-center px-6 pb-9 pt-24 sm:px-10 lg:px-16 lg:pb-12 lg:pt-28">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-7">
                <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-naki-primary text-white shadow-naki-card">
                  <LockKeyhole size={22} />
                </div>
                <h2 className="text-2xl font-bold sm:text-3xl">
                  {mode === "login" ? "Login user" : "Buat akun baru"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-naki-smoke">
                  {mode === "login"
                    ? "Masukkan akun NAKI Code untuk melanjutkan."
                    : "Daftar sekali untuk memulai project bersama NAKI Code."}
                </p>
              </div>

              <div
                className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-naki-page-bg p-1 ring-1 ring-naki-steel"
                role="tablist"
                aria-label="Pilih mode autentikasi"
              >
                {(["login", "register"] as const).map((item) => (
                  <button
                    key={item}
                    className={`h-10 rounded-full text-sm font-bold transition focus-visible:ring-2 focus-visible:ring-naki-secondary ${
                      mode === item
                        ? "naki-auth-primary-action bg-naki-primary text-white shadow-naki-card"
                        : "text-naki-smoke hover:text-naki-primary"
                    }`}
                    onClick={() => {
                      setMode(item);
                      setStatus(
                        item === "login"
                          ? "Masuk untuk melanjutkan ke akunmu."
                          : "Lengkapi data untuk membuat akun baru.",
                      );
                    }}
                    role="tab"
                    aria-selected={mode === item}
                    type="button"
                  >
                    {item === "login" ? "Login" : "Daftar"}
                  </button>
                ))}
              </div>

              <GoogleSignInButton
                disabled={isSubmitting}
                onCredential={handleGoogleCredential}
                onError={handleGoogleError}
              />

              <div className="my-5 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-naki-steel" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-naki-smoke">
                  atau dengan email
                </span>
                <span className="h-px flex-1 bg-naki-steel" />
              </div>

              <form className="grid gap-4" onSubmit={submitAuth}>
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold text-naki-primary">
                    {mode === "login" ? "Username / email" : "Username"}
                  </span>
                  <span className="relative">
                    <UserRound
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-naki-smoke"
                      size={17}
                    />
                    <input
                      autoComplete="username"
                      className="h-12 w-full rounded-xl border border-naki-steel bg-naki-page-bg px-4 pl-11 text-sm outline-none transition placeholder:text-naki-smoke/70 focus-visible:border-naki-secondary focus-visible:ring-2 focus-visible:ring-naki-secondary/20"
                      placeholder={
                        mode === "login" ? "nama atau email" : "nama akun"
                      }
                      value={form.username}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          username: event.target.value,
                        }))
                      }
                      required
                    />
                  </span>
                </label>
                {mode === "register" ? (
                  <label className="grid gap-1.5">
                    <span className="text-xs font-semibold text-naki-primary">
                      Email
                    </span>
                    <span className="relative">
                      <Mail
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-naki-smoke"
                        size={17}
                      />
                      <input
                        autoComplete="email"
                        className="h-12 w-full rounded-xl border border-naki-steel bg-naki-page-bg px-4 pl-11 text-sm outline-none transition placeholder:text-naki-smoke/70 focus-visible:border-naki-secondary focus-visible:ring-2 focus-visible:ring-naki-secondary/20"
                        placeholder="nama@email.com"
                        value={form.email}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                        required
                        type="email"
                      />
                    </span>
                  </label>
                ) : null}
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold text-naki-primary">
                    Password
                  </span>
                  <span className="relative">
                    <LockKeyhole
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-naki-smoke"
                      size={17}
                    />
                    <input
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      className="h-12 w-full rounded-xl border border-naki-steel bg-naki-page-bg px-11 text-sm outline-none transition placeholder:text-naki-smoke/70 focus-visible:border-naki-secondary focus-visible:ring-2 focus-visible:ring-naki-secondary/20"
                      placeholder="Minimal 8 karakter"
                      value={form.password}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      minLength={8}
                      required
                      type={showPassword ? "text" : "password"}
                    />
                    <button
                      aria-label={
                        showPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                      className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-steel/60 hover:text-naki-primary focus-visible:ring-2 focus-visible:ring-naki-secondary"
                      onClick={() => setShowPassword((current) => !current)}
                      type="button"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </span>
                </label>

                {mode === "register" && (
                  <PasswordStrengthIndicator password={form.password} />
                )}
                {mode === "login" ? (
                  <Link
                    className="ml-auto w-fit text-sm font-semibold text-naki-secondary hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-naki-secondary"
                    to={forgotPasswordUrl}
                  >
                    Lupa password?
                  </Link>
                ) : null}
                {mode === "register" ? (
                  <>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold text-naki-primary">
                        Konfirmasi password
                      </span>
                      <input
                        autoComplete="new-password"
                        className="h-12 w-full rounded-xl border border-naki-steel bg-naki-page-bg px-4 text-sm outline-none transition focus-visible:border-naki-secondary focus-visible:ring-2 focus-visible:ring-naki-secondary/20"
                        value={form.confirmPassword}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            confirmPassword: event.target.value,
                          }))
                        }
                        minLength={8}
                        required
                        type={showPassword ? "text" : "password"}
                      />
                    </label>

                    <input
                      type="text"
                      name="website"
                      value={captcha.honeypot}
                      onChange={(e) =>
                        setCaptcha((prev) => ({
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

                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={captcha.isChecked}
                        onChange={(e) =>
                          setCaptcha((prev) => ({
                            ...prev,
                            isChecked: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 cursor-pointer rounded border-naki-steel accent-naki-secondary"
                        required
                      />
                      Saya bukan robot
                    </label>
                  </>
                ) : null}
                <button
                  className="naki-auth-primary-action group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-naki-primary px-4 text-sm font-bold text-white shadow-naki-card transition hover:bg-naki-secondary focus-visible:ring-2 focus-visible:ring-naki-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-naki-smoke"
                  disabled={isSubmitting}
                  type="submit"
                >
                  <LogIn size={16} />
                  {isSubmitting
                    ? "Memproses..."
                    : mode === "login"
                      ? "Masuk ke akun"
                      : "Buat akun"}
                  {!isSubmitting ? (
                    <ArrowRight
                      className="transition group-hover:translate-x-0.5"
                      size={16}
                    />
                  ) : null}
                </button>
              </form>
              <p
                className="mt-4 rounded-xl bg-naki-page-bg px-4 py-3 text-xs leading-relaxed text-naki-smoke ring-1 ring-naki-steel"
                aria-live="polite"
                aria-atomic="true"
                role="status"
              >
                {status}
              </p>
              {verificationUrl ? (
                <div className="mt-4 rounded-xl bg-naki-page-bg p-4 ring-1 ring-naki-steel">
                  <p className="text-sm font-bold text-naki-primary">
                    Link verifikasi
                  </p>
                  <Link
                    className="mt-2 inline-flex text-sm font-semibold text-naki-secondary underline decoration-dotted underline-offset-4"
                    to={verificationUrl}
                  >
                    Buka verifikasi OTP
                  </Link>
                </div>
              ) : null}
              <p className="mt-6 text-center text-xs leading-5 text-naki-smoke">
                Dengan melanjutkan, kamu menyetujui ketentuan layanan dan
                kebijakan privasi NAKI Code.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function getSafeNextTarget(rawNext: string | null) {
  const next = rawNext?.trim() ?? "";

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }

  if (
    next === "/login" ||
    next.startsWith("/verify-email") ||
    next.startsWith("/forgot-password")
  ) {
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
