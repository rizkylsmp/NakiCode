import { LockKeyhole, LogIn } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getApiUrl } from "../api-client";
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
  const [captcha, setCaptcha] = useState<CaptchaState>(() => initializeCaptcha());
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
        setStatus("Password terlalu lemah. Gunakan kombinasi huruf, angka, dan simbol untuk keamanan lebih baik.");
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
      const response = await fetch(
        getApiUrl(mode === "login" ? "/api/auth/user/login" : "/api/auth/user/register"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            mode === "login"
              ? { identifier: form.username, password: form.password }
              : {
                  username: form.username,
                  email: form.email,
                  password: form.password,
                },
          ),
        },
      );

      if (!response.ok) {
        const errorData = (await response.json()) as UserAuthResponse;

        if (response.status === 403 && errorData.verificationUrl) {
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

        throw new Error("Auth gagal.");
      }

      const data = (await response.json()) as UserAuthResponse;
      setForm(defaultForm);
      setCaptcha(initializeCaptcha());

      if (data.token && data.user) {
        window.localStorage.setItem(userTokenKey, data.token);
        window.localStorage.setItem(userUsernameKey, data.user.username);
        window.localStorage.setItem(userRoleKey, data.user.role ?? "user");
        window.dispatchEvent(new Event(userSessionEvent));
        setVerificationUrl("");
        navigate(
          data.user.role === "admin" ? "/admin/templates" : "/template",
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
    } catch {
      setStatus(
        mode === "login"
          ? "Login gagal. Cek username/email dan password."
          : "Daftar gagal. Username/email mungkin sudah dipakai.",
      );
      if (mode === "register") {
        setCaptcha(initializeCaptcha());
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="naki-frosted-grid min-h-screen text-naki-primary">
      <Header />
      <section className="grid min-h-[76vh] place-items-center px-5 py-12 md:px-8 xl:px-12 2xl:px-16">
        <div className="w-full max-w-md rounded-xl border border-naki-steel bg-naki-frost p-6 shadow-naki-soft">
          <span className="grid size-12 place-items-center rounded-lg bg-naki-primary text-naki-frost">
            <LockKeyhole size={22} />
          </span>
          <h1 className="mt-5 text-4xl font-black leading-tight">Login user</h1>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-naki-steel p-1">
            {(["login", "register"] as const).map((item) => (
              <button
                key={item}
                className={`h-10 rounded-md text-sm font-black transition ${
                  mode === item
                    ? "bg-naki-frost text-naki-primary shadow-sm"
                    : "text-naki-smoke hover:text-naki-primary"
                }`}
                onClick={() => setMode(item)}
                type="button"
              >
                {item === "login" ? "Login" : "Daftar"}
              </button>
            ))}
          </div>

          <form className="mt-5 grid gap-4" onSubmit={submitAuth}>
            <label className="grid gap-1.5 text-sm font-black">
              {mode === "login" ? "Username / email" : "Username"}
              <input
                className="h-11 rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold outline-none focus:border-naki-secondary"
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
              <label className="grid gap-1.5 text-sm font-black">
                Email
                <input
                  className="h-11 rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold outline-none focus:border-naki-secondary"
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
            <label className="grid gap-1.5 text-sm font-black">
              Password
              <input
                className="h-11 rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold outline-none focus:border-naki-secondary"
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
                  onChange={(e) => setCaptcha(prev => ({ ...prev, honeypot: e.target.value }))}
                  style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
                
                {/* Checkbox captcha */}
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={captcha.isChecked}
                    onChange={(e) => setCaptcha(prev => ({ ...prev, isChecked: e.target.checked }))}
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
          </form>
          <p
            className="mt-4 text-sm font-semibold leading-6 text-naki-smoke"
            aria-live="polite"
            role="status"
          >
            {status}
          </p>
          {verificationUrl ? (
            <div className="mt-4 rounded-lg border border-naki-steel bg-naki-steel p-4">
              <p className="text-sm font-black text-naki-primary">
                Link verifikasi
              </p>
              <Link
                className="mt-2 inline-flex text-sm font-bold text-naki-secondary underline decoration-dotted underline-offset-4"
                to={verificationUrl}
              >
                Buka verifikasi OTP
              </Link>
            </div>
          ) : null}
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
