import { ArrowLeft, BadgeCheck, MailCheck, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiPost, getApiErrorMessage } from "../services/api-client";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import {
  userRoleKey,
  userSessionEvent,
  userTokenKey,
  userUsernameKey,
} from "../utils/user-session";

type VerifyEmailResponse = {
  message: string;
  token?: string;
  user?: {
    id: number;
    username: string;
    email?: string;
    role?: "user" | "admin";
  };
  verificationEmail?: string | null;
};

const defaultForm = {
  email: "",
  otp: "",
};

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(defaultForm);
  const [status, setStatus] = useState("Masukkan email dan OTP verifikasi.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const nextTarget = getSafeNextTarget(searchParams.get("next"));

  useEffect(() => {
    const nextEmail = searchParams.get("email") ?? "";

    if (nextEmail) {
      setForm((current) => ({
        ...current,
        email: nextEmail,
      }));
    }
  }, [searchParams]);

  async function submitVerification(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!form.email.trim() || !form.otp.trim()) {
      setStatus("Email dan OTP wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setStatus("Memverifikasi OTP...");

    try {
      const data = await apiPost<VerifyEmailResponse>(
        "/api/auth/user/verify-email",
        {
          email: form.email.trim(),
          otp: form.otp.trim(),
        },
      );

      if (data.token && data.user) {
        window.localStorage.setItem(userTokenKey, data.token);
        window.localStorage.setItem(userUsernameKey, data.user.username);
        window.localStorage.setItem(userRoleKey, data.user.role ?? "user");
        window.dispatchEvent(new Event(userSessionEvent));
        navigate(data.user.role === "admin" ? "/admin/dashboard" : nextTarget, {
          replace: true,
        });
        return;
      }

      setStatus(data.message || "Email berhasil diverifikasi.");
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Gagal verifikasi OTP."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendOtp() {
    if (!form.email.trim()) {
      setStatus("Email wajib diisi untuk kirim ulang OTP.");
      return;
    }

    setIsResending(true);
    setStatus("Mengirim ulang OTP...");

    try {
      const data = await apiPost<VerifyEmailResponse>(
        "/api/auth/user/resend-otp",
        {
          email: form.email.trim(),
        },
      );
      setStatus(data.message || "OTP berhasil dikirim ulang.");
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Gagal kirim ulang OTP."));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <main className="naki-frosted-grid min-h-screen bg-naki-page-bg text-naki-primary">
      <Header />

      <section className="grid min-h-[76vh] place-items-center px-5 py-12 md:px-8 xl:px-12 2xl:px-16">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
          <span className="grid size-12 place-items-center rounded-xl bg-naki-primary text-white">
            <MailCheck size={22} />
          </span>
          <h1 className="mt-5 text-3xl font-bold leading-tight text-naki-primary">
            Verifikasi email
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-naki-smoke">
            OTP dikirim ke email pendaftar. Masukkan email dan kode 6 digit
            untuk aktifkan akun.
          </p>

          <form className="mt-6 grid gap-4" onSubmit={submitVerification}>
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-naki-smoke">Email</span>
              <input
                className="h-11 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none focus:border-blue-400"
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
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-naki-smoke">OTP</span>
              <input
                className="h-11 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none focus:border-blue-400"
                value={form.otp}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    otp: event.target.value,
                  }))
                }
                inputMode="numeric"
                maxLength={6}
                required
                type="text"
              />
            </label>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-naki-smoke"
              disabled={isSubmitting}
              type="submit"
            >
              <BadgeCheck size={16} />
              {isSubmitting ? "Memverifikasi..." : "Verifikasi OTP"}
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-4 text-sm font-semibold text-naki-primary transition hover:border-naki-smoke disabled:cursor-not-allowed disabled:text-naki-smoke"
              disabled={isResending}
              onClick={() => void resendOtp()}
              type="button"
            >
              <RefreshCw size={16} />
              {isResending ? "Mengirim..." : "Kirim ulang OTP"}
            </button>
          </form>

          <p className="mt-4 text-sm leading-relaxed text-naki-smoke">
            {status}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-4 text-sm font-semibold text-naki-primary transition hover:border-naki-smoke"
              to={
                nextTarget === "/"
                  ? "/login"
                  : `/login?next=${encodeURIComponent(nextTarget)}`
              }
            >
              <ArrowLeft size={16} />
              Kembali ke login
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-semibold text-white transition hover:opacity-90"
              to="/profile"
            >
              Profil saya
            </Link>
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
