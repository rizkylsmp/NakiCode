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
    <main className="naki-frosted-grid min-h-screen text-naki-primary">
      <Header />
      <section className="grid min-h-[76vh] place-items-center px-5 py-12 md:px-8 xl:px-12 2xl:px-16">
        <div className="w-full max-w-md rounded-xl border border-naki-steel bg-naki-frost p-6 shadow-naki-soft">
          <span className="grid size-12 place-items-center rounded-lg bg-naki-primary text-naki-frost">
            <KeyRound size={22} />
          </span>
          <h1 className="mt-5 text-4xl font-black leading-tight">
            Lupa password
          </h1>
          <p className="mt-3 leading-7 text-naki-smoke">
            Kirim OTP ke email akun, lalu buat password baru dari kode tersebut.
          </p>

          <form className="mt-6 grid gap-4" onSubmit={requestOtp}>
            <label className="grid gap-1.5 text-sm font-black">
              Email akun
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
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-naki-steel px-4 text-sm font-black text-naki-secondary transition hover:border-naki-smoke disabled:cursor-not-allowed disabled:text-naki-smoke"
              disabled={isRequestingOtp}
              type="submit"
            >
              <MailCheck size={16} />
              {isRequestingOtp ? "Mengirim..." : "Kirim OTP reset"}
            </button>
          </form>

          <form className="mt-5 grid gap-4" onSubmit={resetPassword}>
            <label className="grid gap-1.5 text-sm font-black">
              OTP reset
              <input
                className="h-11 rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold outline-none focus:border-naki-secondary"
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
            <label className="grid gap-1.5 text-sm font-black">
              Password baru
              <input
                className="h-11 rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold outline-none focus:border-naki-secondary"
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
            <label className="grid gap-1.5 text-sm font-black">
              Konfirmasi password baru
              <input
                className="h-11 rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-semibold outline-none focus:border-naki-secondary"
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-naki-secondary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-primary disabled:cursor-not-allowed disabled:bg-naki-smoke"
              disabled={!hasRequestedOtp || isResettingPassword}
              type="submit"
            >
              <BadgeCheck size={16} />
              {isResettingPassword ? "Menyimpan..." : "Reset password"}
            </button>
          </form>

          <p
            className="mt-4 text-sm font-semibold leading-6 text-naki-smoke"
            aria-live="polite"
            role="status"
          >
            {status}
          </p>

          <Link
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-naki-steel px-4 text-sm font-black text-naki-secondary transition hover:border-naki-smoke"
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
