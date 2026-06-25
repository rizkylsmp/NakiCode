import { LockKeyhole, LogIn } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  apiPost,
  getApiErrorData,
  getApiErrorMessage,
  getApiErrorStatus,
} from "../api-client";
import {
  initializeCaptcha,
  validateCaptcha,
  type CaptchaState,
} from "../auth-captcha";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import {
  PasswordStrengthIndicator,
  isPasswordStrong,
} from "../components/PasswordStrengthIndicator";
import {
  userRoleKey,
  userSessionEvent,
  userTokenKey,
  userUsernameKey,
} from "../user-session";

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
  const [status, setStatus] = useState(
    "Login user dipakai untuk membuat order template.",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaState>(() =>
    initializeCaptcha(),
  );
  const [verificationUrl, setVerificationUrl] = useState("");
  const nextTarget = getSafeNextTarget(searchParams.get("next"));
  const forgotPasswordUrl =
    nextTarget === "/"
      ? "/forgot-password"
      : `/forgot-password?next=${encodeURIComponent(nextTarget)}`;

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

      if (data.token && data.user) {
        window.localStorage.setItem(userTokenKey, data.token);
        window.localStorage.setItem(userUsernameKey, data.user.username);
        window.localStorage.setItem(userRoleKey, data.user.role ?? "user");
        window.dispatchEvent(new Event(userSessionEvent));
        setVerificationUrl("");
        navigate(
          data.user.role === "admin" ? "/admin/dashboard" : "/template",
          { replace: true },
        );
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
      <Header />
      <section className="min-h-[76vh] px-5 py-12 md:px-8 xl:px-12 2xl:px-16">
        {/* Dark navy hero */}
        <div className="mb-8 rounded-2xl bg-naki-primary px-6 py-10 text-center md:px-12">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-xl bg-white/10">
            <LockKeyhole size={26} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl">
            Login User
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            Masuk atau buat akun untuk mulai order template
          </p>
        </div>

        {/* White card for form */}
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            {/* Login / Register toggle */}
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-naki-frost p-1">
              {(["login", "register"] as const).map((item) => (
                <button
                  key={item}
                  className={`h-10 rounded-lg text-sm font-bold transition ${
                    mode === item
                      ? "bg-white text-naki-primary shadow-sm"
                      : "text-naki-smoke hover:text-naki-primary"
                  }`}
                  onClick={() => setMode(item)}
                  type="button"
                >
                  {item === "login" ? "Login" : "Daftar"}
                </button>
              ))}
            </div>

            <form className="grid gap-4" onSubmit={submitAuth}>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-naki-smoke">
                  {mode === "login" ? "Username / email" : "Username"}
                </span>
                <input
                  className="h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none focus:border-blue-400"
                  value={form.username}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              {mode === "register" ? (
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-naki-smoke">
                    Email
                  </span>
                  <input
                    className="h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none focus:border-blue-400"
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
                </label>
              ) : null}
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-naki-smoke">
                  Password
                </span>
                <input
                  className="h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none focus:border-blue-400"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  minLength={8}
                  required
                  type="password"
                />
              </label>

              {/* Show password strength indicator in register mode */}
              {mode === "register" && (
                <PasswordStrengthIndicator password={form.password} />
              )}
              {mode === "login" ? (
                <Link
                  className="w-fit text-sm font-semibold text-naki-secondary underline decoration-dotted underline-offset-4"
                  to={forgotPasswordUrl}
                >
                  Lupa password?
                </Link>
              ) : null}
              {mode === "register" ? (
                <>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-naki-smoke">
                      Konfirmasi password
                    </span>
                    <input
                      className="h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none focus:border-blue-400"
                      value={form.confirmPassword}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      minLength={8}
                      required
                      type="password"
                    />
                  </label>

                  {/* Honeypot field - hidden from humans, catches bots */}
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

                  {/* Checkbox captcha */}
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={captcha.isChecked}
                      onChange={(e) =>
                        setCaptcha((prev) => ({
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
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-bold text-white transition hover:bg-naki-primary/90 disabled:cursor-not-allowed disabled:bg-naki-smoke"
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
            </form>
            <p
              className="mt-4 text-sm leading-relaxed text-naki-smoke"
              aria-live="polite"
              role="status"
            >
              {status}
            </p>
            {verificationUrl ? (
              <div className="mt-4 rounded-xl bg-naki-frost p-4">
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
          </div>
        </div>
      </section>
      <Footer />
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
