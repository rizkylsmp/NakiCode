import { ArrowLeft, BadgeCheck, KeyRound, MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiPost, getApiErrorMessage } from "../api-client";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";

type ForgotPasswordResponse = {
  message: string;
  resetEmail?: string;
  resetUrl?: string;
};

const defaultForm = {
  email: "",
  otp: "",
  password: "",
  confirmPassword: "",
};

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(defaultForm);
  const [status, setStatus] = useState(
    "Masukkan email akun untuk menerima OTP reset password.",
  );
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [hasRequestedOtp, setHasRequestedOtp] = useState(false);
  const nextTarget = getSafeNextTarget(searchParams.get("next"));
  const loginUrl =
    nextTarget === "/"
      ? "/login"
      : `/login?next=${encodeURIComponent(nextTarget)}`;

  useEffect(() => {
    const email = searchParams.get("email") ?? "";

    if (email) {
      setForm((current) => ({
        ...current,
        email,
      }));
      setHasRequestedOtp(true);
    }
  }, [searchParams]);

  async function requestOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.email.trim()) {
      setStatus("Email wajib diisi.");
      return;
    }

    setIsRequestingOtp(true);
    setStatus("Mengirim OTP reset password...");

    try {
      const data = await apiPost<ForgotPasswordResponse>(
        "/api/auth/user/forgot-password",
        {
          email: form.email.trim(),
        },
      );

      setHasRequestedOtp(true);
      setStatus(data.message || "Jika email terdaftar, OTP akan dikirim.");
    } catch (error) {
      setStatus(
        getApiErrorMessage(error, "Gagal mengirim OTP reset password."),
      );
    } finally {
      setIsRequestingOtp(false);
    }
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.email.trim() || !form.otp.trim()) {
      setStatus("Email dan OTP wajib diisi.");
      return;
    }

    if (form.password.length < 6) {
      setStatus("Password baru minimal 6 karakter.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setStatus("Konfirmasi password belum sama.");
      return;
    }

    setIsResettingPassword(true);
    setStatus("Mereset password...");

    try {
      const data = await apiPost<ForgotPasswordResponse>(
        "/api/auth/user/reset-password",
        {
          email: form.email.trim(),
          otp: form.otp.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        },
      );

      setStatus(data.message || "Password berhasil direset.");
      setForm(defaultForm);
      navigate(loginUrl, { replace: true });
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Gagal reset password."));
    } finally {
      setIsResettingPassword(false);
    }
  }

  return (
    <main className="naki-frosted-grid min-h-screen bg-naki-page-bg text-naki-primary">
      <Header />

      {/* Dark hero section */}
      <div className="bg-naki-primary">
        <section className="mx-auto max-w-5xl px-5 pb-20 pt-14 text-center md:px-8 xl:px-12">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/10 text-white">
            <KeyRound size={26} />
          </div>
          <h1 className="mt-5 text-3xl font-bold leading-tight text-white md:text-4xl">
            Lupa password
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-naki-frost/70 md:text-base">
            Kirim OTP ke email akun, lalu buat password baru dari kode tersebut.
          </p>
        </section>
      </div>

      {/* Form card — overlaps hero */}
      <section className="relative -mt-8 px-5 pb-16 md:px-8 xl:px-12">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm">
          {/* Request OTP form */}
          <form className="grid gap-4" onSubmit={requestOtp}>
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-naki-smoke">
                Email akun
              </span>
              <input
                className="h-11 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none focus:border-blue-400"
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
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-4 text-sm font-medium text-naki-primary transition hover:bg-naki-frost disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isRequestingOtp}
              type="submit"
            >
              <MailCheck size={16} />
              {isRequestingOtp ? "Mengirim..." : "Kirim OTP reset"}
            </button>
          </form>

          <div className="my-5 h-px bg-naki-steel" />

          {/* Reset password form */}
          <form className="grid gap-4" onSubmit={resetPassword}>
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-naki-smoke">
                OTP reset
              </span>
              <input
                className="h-11 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none focus:border-blue-400 disabled:bg-naki-frost disabled:text-naki-smoke"
                disabled={!hasRequestedOtp}
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
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-naki-smoke">
                Password baru
              </span>
              <input
                className="h-11 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none focus:border-blue-400 disabled:bg-naki-frost disabled:text-naki-smoke"
                disabled={!hasRequestedOtp}
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                minLength={6}
                required
                type="password"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-naki-smoke">
                Konfirmasi password baru
              </span>
              <input
                className="h-11 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none focus:border-blue-400 disabled:bg-naki-frost disabled:text-naki-smoke"
                disabled={!hasRequestedOtp}
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
                minLength={6}
                required
                type="password"
              />
            </label>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-medium text-white transition hover:bg-naki-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!hasRequestedOtp || isResettingPassword}
              type="submit"
            >
              <BadgeCheck size={16} />
              {isResettingPassword ? "Menyimpan..." : "Reset password"}
            </button>
          </form>

          {/* Status message */}
          <p
            className="mt-4 rounded-xl bg-naki-frost px-4 py-3 text-sm leading-relaxed text-naki-smoke"
            aria-live="polite"
            role="status"
          >
            {status}
          </p>

          {/* Back to login */}
          <Link
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-4 text-sm font-medium text-naki-primary transition hover:bg-naki-frost"
            to={loginUrl}
          >
            <ArrowLeft size={16} />
            Kembali ke login
          </Link>
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
